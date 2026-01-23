import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";
import { trpcClient } from "@/lib/trpc";
import type {
  CarInfo,
  WashRecord,
  ServiceRecord,
  TireInfo,
  TireSet,
  MileageRecord,
  InsuranceDocument,
  FuelRecord,
  MileageSourceType,
} from "@/types/car";
import type { VehicleSearchResult } from "@/lib/api-types";

const STORAGE_KEY = "@car_data";
const STORAGE_BACKUP_KEY = "@car_data_backup";
const STORAGE_VERSION = "2.0";

interface CarData {
  // New structure
  cars: CarInfo[];
  activeCarId: string | null;
  
  // Records now include carId
  washRecords: WashRecord[];
  serviceRecords: ServiceRecord[];
  tireSets: TireSet[];
  mileageRecords: MileageRecord[];
  fuelRecords: FuelRecord[];
  insuranceDocuments: InsuranceDocument[];
  
  // Legacy/Singular support (mapped by carId in memory, or just kept for compatibility?)
  // We'll try to support tireInfo per car.
  // Storing as a map in the state for easier access?
  // Or just array? Let's use array or map. 
  // For simplicity in JSON, maybe just an array of objects that have carId?
  // But TireInfo doesn't have ID.
  // Let's create a wrapper or just rely on TireSets which seems to be the "modern" way in this app.
  // The Dashboard uses tireInfo. Let's provide a way to get tire info for active car.
  // Maybe we can derive tireInfo from tireSets?
  // Or we just persist a map: carId -> TireInfo
  tireInfos: Record<string, TireInfo>;
}

const defaultData: CarData = {
  cars: [],
  activeCarId: null,
  washRecords: [],
  serviceRecords: [],
  tireSets: [],
  mileageRecords: [],
  fuelRecords: [],
  insuranceDocuments: [],
  tireInfos: {},
};

export const [CarProvider, useCarData] = createContextHook(() => {
  const [data, setData] = useState<CarData>(defaultData);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { data: loadedData, isLoading } = useQuery({
    queryKey: ["carData"],
    queryFn: async (): Promise<CarData> => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          console.log("[CarContext] No stored data found, using defaults");
          return defaultData;
        }

        const parsed = JSON.parse(stored);
        console.log("[CarContext] Successfully loaded data from storage");
        
        if (!parsed.cars && parsed.carInfo) {
          console.log("[CarContext] Migrating from v1 to v2");
          const oldCar = parsed.carInfo;
          const carId = "default-car";
          const migratedCar: CarInfo = { ...oldCar, id: carId };
          const migrateRecord = <T extends { id?: string }>(r: T): T & { carId: string } => ({ ...r, carId });
          
          return {
            cars: [migratedCar],
            activeCarId: carId,
            washRecords: (parsed.washRecords || []).map(migrateRecord),
            serviceRecords: (parsed.serviceRecords || []).map(migrateRecord),
            tireSets: (parsed.tireSets || []).map(migrateRecord),
            mileageRecords: (parsed.mileageRecords || []).map(migrateRecord),
            fuelRecords: (parsed.fuelRecords || []).map(migrateRecord),
            insuranceDocuments: [],
            tireInfos: parsed.tireInfo ? { [carId]: parsed.tireInfo } : {},
          };
        }

        if (parsed.insuranceDocuments) {
          parsed.insuranceDocuments = parsed.insuranceDocuments.map((doc: { imageUri?: string; uri?: string; type?: string }) => {
            if (doc.imageUri) {
              return { ...doc, uri: doc.imageUri, type: doc.type || "image", imageUri: undefined };
            }
            return doc;
          });
        }

        return parsed;
      } catch (error) {
        console.error("[CarContext] Error loading data:", error);
        try {
          const backup = await AsyncStorage.getItem(STORAGE_BACKUP_KEY);
          if (backup) return JSON.parse(backup);
        } catch {}
        await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
        return defaultData;
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: async (newData: CarData) => {
      try {
        const dataToSave = {
          ...newData,
          _version: STORAGE_VERSION,
          _lastSaved: new Date().toISOString(),
        };
        const serialized = JSON.stringify(dataToSave);
        
        const existing = await AsyncStorage.getItem(STORAGE_KEY);
        if (existing) {
          await AsyncStorage.setItem(STORAGE_BACKUP_KEY, existing);
        }
        
        await AsyncStorage.setItem(STORAGE_KEY, serialized);
        console.log("[CarContext] Data saved successfully");
        return newData;
      } catch (error) {
        console.error("[CarContext] Save error:", error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (loadedData) {
      setData({
        cars: loadedData.cars || [],
        activeCarId: loadedData.activeCarId,
        washRecords: loadedData.washRecords || [],
        serviceRecords: loadedData.serviceRecords || [],
        tireSets: loadedData.tireSets || [],
        mileageRecords: loadedData.mileageRecords || [],
        fuelRecords: loadedData.fuelRecords || [],
        insuranceDocuments: loadedData.insuranceDocuments || [],
        tireInfos: loadedData.tireInfos || {},
      });
      if (isInitialLoad) setIsInitialLoad(false);
    }
  }, [loadedData, isInitialLoad]);

  const { mutate } = saveMutation;

  // -- CAR ACTIONS --

  const addCar = useCallback((car: Omit<CarInfo, "id">) => {
    const id = Date.now().toString();
    const newCar = { ...car, id };
    
    setData((prev) => {
      const newData = {
        ...prev,
        cars: [...prev.cars, newCar],
        activeCarId: prev.activeCarId || id,
      };
      mutate(newData);
      return newData;
    });
  }, [mutate]);

  const updateCarInfo = useCallback((carInfo: CarInfo) => {
    setData((prev) => {
      const newData = { ...prev, cars: prev.cars.map(c => c.id === carInfo.id ? carInfo : c) };
      mutate(newData);
      return newData;
    });
  }, [mutate]);

  const deleteCar = useCallback((carId: string) => {
    setData((prev) => {
      const newCars = prev.cars.filter(c => c.id !== carId);
      const { [carId]: _, ...newTireInfos } = prev.tireInfos;
      const newActiveId = prev.activeCarId === carId 
        ? (newCars.length > 0 ? newCars[0].id : null) 
        : prev.activeCarId;

      const newData = {
        ...prev,
        cars: newCars,
        activeCarId: newActiveId,
        washRecords: prev.washRecords.filter(r => r.carId !== carId),
        serviceRecords: prev.serviceRecords.filter(r => r.carId !== carId),
        tireSets: prev.tireSets.filter(r => r.carId !== carId),
        mileageRecords: prev.mileageRecords.filter(r => r.carId !== carId),
        fuelRecords: prev.fuelRecords.filter(r => r.carId !== carId),
        tireInfos: newTireInfos,
      };
      mutate(newData);
      return newData;
    });
  }, [mutate]);

  const setActiveCar = useCallback((carId: string) => {
    setData((prev) => {
      const newData = { ...prev, activeCarId: carId };
      mutate(newData);
      return newData;
    });
  }, [mutate]);

  // -- RECORD ACTIONS --
  // All actions now depend on activeCarId

  const activeCarId = data.activeCarId;

  const addWashRecord = useCallback(
    (record: Omit<WashRecord, "id" | "carId">) => {
      if (!activeCarId) return;
      const newRecord = { ...record, id: Date.now().toString(), carId: activeCarId };
      setData((prev) => {
        const currentCar = prev.cars.find(c => c.id === activeCarId);
        const currentMileage = currentCar?.currentMileage || 0;
        
        // Update car mileage if wash record has mileage and it's higher
        const shouldUpdateMileage = record.mileage && record.mileage > currentMileage;
        const newCars = shouldUpdateMileage 
          ? prev.cars.map(c => c.id === activeCarId 
              ? { ...c, currentMileage: record.mileage!, mileageSource: 'wash' as MileageSourceType, mileageSourceDate: record.date } 
              : c)
          : prev.cars;
        
        const newData = {
            ...prev,
            cars: newCars,
            washRecords: [newRecord, ...prev.washRecords],
        };
        mutate(newData);
        return newData;
      });
    },
    [activeCarId, mutate]
  );

  const deleteWashRecord = useCallback(
    (id: string) => {
      setData((prev) => {
        const newData = {
            ...prev,
            washRecords: prev.washRecords.filter(r => r.id !== id),
        };
        mutate(newData);
        return newData;
      });
    },
    [mutate]
  );

  const addServiceRecord = useCallback(
    (record: Omit<ServiceRecord, "id" | "carId">) => {
       if (!activeCarId) return;
       const newRecord = { ...record, id: Date.now().toString(), carId: activeCarId };
       setData((prev) => {
        const currentCar = prev.cars.find(c => c.id === activeCarId);
        const currentMileage = currentCar?.currentMileage || 0;
        
        // Update car mileage if service mileage is higher
        const shouldUpdateMileage = record.mileage > currentMileage;
        const newCars = shouldUpdateMileage 
          ? prev.cars.map(c => c.id === activeCarId 
              ? { ...c, currentMileage: record.mileage, mileageSource: 'service' as MileageSourceType, mileageSourceDate: record.date } 
              : c)
          : prev.cars;
        
        const newData = {
            ...prev,
            cars: newCars,
            serviceRecords: [newRecord, ...prev.serviceRecords],
        };
        mutate(newData);
        return newData;
      });
    },
    [activeCarId, mutate]
  );

  const deleteServiceRecord = useCallback(
    (id: string) => {
      setData((prev) => {
        const newData = {
            ...prev,
            serviceRecords: prev.serviceRecords.filter(r => r.id !== id),
        };
        mutate(newData);
        return newData;
      });
    },
    [mutate]
  );

  const addTireSet = useCallback(
    (record: Omit<TireSet, "id" | "carId">) => {
       if (!activeCarId) return;
       const newRecord = { ...record, id: Date.now().toString(), carId: activeCarId };
       setData((prev) => {
        const newData = {
            ...prev,
            tireSets: [newRecord, ...prev.tireSets],
        };
        mutate(newData);
        return newData;
      });
    },
    [activeCarId, mutate]
  );

  const deleteTireSet = useCallback(
    (id: string) => {
      setData((prev) => {
        const newData = {
            ...prev,
            tireSets: prev.tireSets.filter(r => r.id !== id),
        };
        mutate(newData);
        return newData;
      });
    },
    [mutate]
  );

  const setActiveTireSet = useCallback(
    (id: string) => {
      // Logic: set this tire set as active for its car?
      // Or just globally? TireSet has carId.
      setData((prev) => {
        // Find the tire set to know its carId
        const target = prev.tireSets.find(t => t.id === id);
        if (!target) return prev;

        const newData = {
            ...prev,
            tireSets: prev.tireSets.map(t => {
                if (t.carId === target.carId) {
                    return { ...t, isActive: t.id === id };
                }
                return t;
            }),
        };
        mutate(newData);
        return newData;
      });
    },
    [mutate]
  );

  const updateTireInfo = useCallback((info: TireInfo) => {
    if (!activeCarId) return;
    setData((prev) => {
      const newData = { ...prev, tireInfos: { ...prev.tireInfos, [activeCarId]: info } };
      mutate(newData);
      return newData;
    });
  }, [activeCarId, mutate]);
  
  const addMileageRecord = useCallback(
    (record: Omit<MileageRecord, "id" | "carId">) => {
      if (!activeCarId) return;
      const newRecord = { ...record, id: Date.now().toString(), carId: activeCarId };
      
      setData((prev) => {
         const newMileageRecords = [newRecord, ...prev.mileageRecords];
         
         // Update car info current mileage with source
         const newCars = prev.cars.map(c => 
            c.id === activeCarId 
              ? { ...c, currentMileage: record.mileage, mileageSource: 'manual' as MileageSourceType, mileageSourceDate: record.date } 
              : c
         );
         
         const newData = {
             ...prev,
             cars: newCars,
             mileageRecords: newMileageRecords,
         };
         mutate(newData);
         return newData;
      });
    },
    [activeCarId, mutate]
  );

  const updateMileageRecord = useCallback(
    (id: string, record: Omit<MileageRecord, "id" | "carId">) => {
      setData((prev) => {
        const newMileageRecords = prev.mileageRecords.map(r => 
          r.id === id ? { ...r, ...record } : r
        );
        
        // Update car info current mileage if this is the latest record
        const sortedRecords = [...newMileageRecords].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const latestRecord = sortedRecords[0];
        
        const newCars = prev.cars.map(c => 
           c.id === activeCarId ? { ...c, currentMileage: latestRecord?.mileage || c.currentMileage } : c
        );
        
        const newData = {
            ...prev,
            cars: newCars,
            mileageRecords: newMileageRecords,
        };
        mutate(newData);
        return newData;
      });
    },
    [activeCarId, mutate]
  );

  const deleteMileageRecord = useCallback(
    (id: string) => {
      setData((prev) => {
        const newMileageRecords = prev.mileageRecords.filter(r => r.id !== id);
        
        // Update car info current mileage to the latest remaining record
        const sortedRecords = [...newMileageRecords]
          .filter(r => r.carId === activeCarId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const latestRecord = sortedRecords[0];
        
        const newCars = prev.cars.map(c => 
           c.id === activeCarId ? { ...c, currentMileage: latestRecord?.mileage || c.currentMileage } : c
        );
        
        const newData = {
            ...prev,
            cars: newCars,
            mileageRecords: newMileageRecords,
        };
        mutate(newData);
        return newData;
      });
    },
    [activeCarId, mutate]
  );

  const addFuelRecord = useCallback(
    (record: Omit<FuelRecord, "id" | "carId">) => {
      if (!activeCarId) return;
      const newRecord = { ...record, id: Date.now().toString(), carId: activeCarId };
      setData((prev) => {
        const currentCar = prev.cars.find(c => c.id === activeCarId);
        const currentMileage = currentCar?.currentMileage || 0;
        
        // Update car mileage if fuel record has mileage and it's higher
        const shouldUpdateMileage = record.mileage && record.mileage > currentMileage;
        const newCars = shouldUpdateMileage 
          ? prev.cars.map(c => c.id === activeCarId 
              ? { ...c, currentMileage: record.mileage!, mileageSource: 'fuel' as MileageSourceType, mileageSourceDate: record.date } 
              : c)
          : prev.cars;
        
        const newData = {
            ...prev,
            cars: newCars,
            fuelRecords: [newRecord, ...prev.fuelRecords],
        };
        mutate(newData);
        return newData;
      });
    },
    [activeCarId, mutate]
  );

  const deleteFuelRecord = useCallback(
    (id: string) => {
      setData((prev) => {
        const newData = {
            ...prev,
            fuelRecords: prev.fuelRecords.filter(r => r.id !== id),
        };
        mutate(newData);
        return newData;
      });
    },
    [mutate]
  );

  const addInsuranceDocument = useCallback(
    (document: Omit<InsuranceDocument, "id" | "carId">) => {
      if (!activeCarId) return;
      const newDoc = { ...document, id: Date.now().toString(), carId: activeCarId };
      setData((prev) => {
        const newData = {
          ...prev,
          insuranceDocuments: [newDoc, ...prev.insuranceDocuments],
        };
        mutate(newData);
        return newData;
      });
    },
    [activeCarId, mutate]
  );

  const deleteInsuranceDocument = useCallback(
    (id: string) => {
      setData((prev) => {
        const newData = {
          ...prev,
          insuranceDocuments: prev.insuranceDocuments.filter(d => d.id !== id),
        };
        mutate(newData);
        return newData;
      });
    },
    [mutate]
  );

  // -- GETTERS --
  // Filter by activeCarId

  const activeCar = useMemo(() => 
    data.cars.find(c => c.id === data.activeCarId) || null, 
    [data.cars, data.activeCarId]
  );

  const filteredWashRecords = useMemo(() => 
    data.washRecords.filter(r => r.carId === activeCarId),
    [data.washRecords, activeCarId]
  );

  const filteredServiceRecords = useMemo(() =>
    data.serviceRecords.filter(r => r.carId === activeCarId),
    [data.serviceRecords, activeCarId]
  );

  const filteredTireSets = useMemo(() =>
    data.tireSets.filter(r => r.carId === activeCarId),
    [data.tireSets, activeCarId]
  );
  
  const filteredMileageRecords = useMemo(() =>
    data.mileageRecords.filter(r => r.carId === activeCarId),
    [data.mileageRecords, activeCarId]
  );

  const filteredFuelRecords = useMemo(() =>
    data.fuelRecords.filter(r => r.carId === activeCarId),
    [data.fuelRecords, activeCarId]
  );

  const filteredInsuranceDocuments = useMemo(() =>
    data.insuranceDocuments.filter(d => d.carId === activeCarId),
    [data.insuranceDocuments, activeCarId]
  );

  const currentTireInfo = useMemo(() => 
    activeCarId ? data.tireInfos[activeCarId] || null : null,
    [data.tireInfos, activeCarId]
  );

  const getLastWash = useCallback(() => {
    return filteredWashRecords.length > 0 ? filteredWashRecords[0] : null;
  }, [filteredWashRecords]);

  const getNextService = useCallback(() => {
    if (filteredServiceRecords.length === 0) return null;
    const lastService = filteredServiceRecords[0];
    const currentMileage = activeCar?.currentMileage || 0;
    const serviceInterval = 15000;
    const mileageUntilService = lastService.mileage + serviceInterval - currentMileage;
    return {
      mileage: mileageUntilService,
      estimated: mileageUntilService > 0,
    };
  }, [filteredServiceRecords, activeCar]);

  const getTireAge = useCallback(() => {
    const calcAge = (dateStr: string) => {
      const purchaseDate = new Date(dateStr);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
      return {
        years: Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365)),
        months: Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)),
      };
    };

    if (currentTireInfo) return calcAge(currentTireInfo.purchaseDate);
    const activeSet = filteredTireSets.find(t => t.isActive);
    if (activeSet) return calcAge(activeSet.purchaseDate);
    return null;
  }, [currentTireInfo, filteredTireSets]);

  const refreshCarInfoMutation = useMutation({
    mutationFn: async (carId: string): Promise<{ carId: string; vehicleData: VehicleSearchResult }> => {
      const car = data.cars.find((c) => c.id === carId);
      if (!car) throw new Error("Bil ikke funnet");

      console.log("[CarContext] Refreshing vehicle data for:", car.licensePlate);
      const vehicleData = await trpcClient.vehicle.search.query({ licensePlate: car.licensePlate });
      return { carId, vehicleData };
    },
    onSuccess: ({ carId, vehicleData }) => {
      console.log("[CarContext] Received updated vehicle data", vehicleData);
      setData((prev) => {
        const newCars = prev.cars.map((c) => {
          if (c.id !== carId) return c;

          const localCurrent = Number.isFinite(c.currentMileage) ? c.currentMileage : 0;
          const vvRegistered = Number.isFinite(vehicleData.registeredMileage)
            ? vehicleData.registeredMileage
            : null;

          const vvHistory = vehicleData.mileageHistory;

          const computedCurrentMileage = vvRegistered !== null && Number.isFinite(vvRegistered) && typeof vvRegistered === "number" ? Math.max(localCurrent, vvRegistered) : localCurrent;

          return {
            ...c,
            make: vehicleData.make,
            model: vehicleData.model,
            year: vehicleData.year,
            vin: vehicleData.vin || c.vin,
            color: vehicleData.color,
            weight: vehicleData.weight ?? undefined,
            totalWeight: vehicleData.totalWeight ?? c.totalWeight,
            power: vehicleData.power ?? undefined,
            fuelType: vehicleData.fuelType,
            co2Emission: vehicleData.co2Emission ?? c.co2Emission,
            noxEmission: vehicleData.noxEmission ?? c.noxEmission,
            euroClass: vehicleData.euroClass ?? c.euroClass,
            engineDisplacement: vehicleData.engineDisplacement ?? c.engineDisplacement,
            transmission: vehicleData.transmission ?? c.transmission,
            driveType: vehicleData.driveType ?? c.driveType,
            numberOfSeats: vehicleData.numberOfSeats ?? c.numberOfSeats,
            numberOfDoors: vehicleData.numberOfDoors ?? c.numberOfDoors,
            maxTowWeight: vehicleData.maxTowWeight ?? c.maxTowWeight,
            registrationDate: vehicleData.registrationDate ? vehicleData.registrationDate : undefined,
            vehicleType: vehicleData.vehicleType,
            currentMileage: computedCurrentMileage,
            registeredMileage: vvRegistered ?? c.registeredMileage,
            registeredMileageDate: vehicleData.registeredMileageDate ?? c.registeredMileageDate,
            mileageHistory: vvHistory ?? c.mileageHistory,
            euControlDate: vehicleData.euControlDate ?? c.euControlDate,
            nextEuControlDate: vehicleData.nextEuControlDate ?? c.nextEuControlDate,
            registrationStatus: vehicleData.registrationStatus ?? c.registrationStatus,
            lengthMm: vehicleData.lengthMm ?? c.lengthMm,
            widthMm: vehicleData.widthMm ?? c.widthMm,
            payload: vehicleData.payload ?? c.payload,
            tireDimensions: vehicleData.tireDimensions ?? c.tireDimensions,
            vehicleSections: vehicleData.vehicleSections ?? c.vehicleSections,
          } as CarInfo;
        });

        const newData = { ...prev, cars: newCars };
        mutate(newData);
        return newData;
      });
    },
  });

  const { mutate: mutateRefresh } = refreshCarInfoMutation;

  const refreshCarInfo = useCallback((carId?: string) => {
    const targetId = carId || activeCarId;
    if (!targetId) return;
    mutateRefresh(targetId);
  }, [activeCarId, mutateRefresh]);

  return {
      // State
      cars: data.cars,
      activeCarId: data.activeCarId,
      carInfo: activeCar, // Alias for backward compatibility (mostly)
      washRecords: filteredWashRecords,
      serviceRecords: filteredServiceRecords,
      tireSets: filteredTireSets,
      mileageRecords: filteredMileageRecords,
      fuelRecords: filteredFuelRecords,
      tireInfo: currentTireInfo, // Alias

      // Actions
      addCar,
      updateCarInfo,
      deleteCar,
      setActiveCar,
      refreshCarInfo,
      
      addWashRecord,
      deleteWashRecord,
      addServiceRecord,
      deleteServiceRecord,
      updateTireInfo,
      addTireSet,
      deleteTireSet,
      setActiveTireSet,
      addMileageRecord,
      updateMileageRecord,
      deleteMileageRecord,
      addFuelRecord,
      deleteFuelRecord,
      addInsuranceDocument,
      deleteInsuranceDocument,
      insuranceDocuments: filteredInsuranceDocuments,
      
      // Helpers
      getLastWash,
      getNextService,
      getTireAge,
      
      // Meta
      isLoading: saveMutation.isPending || isLoading,
      isSaving: saveMutation.isPending,
      isRefreshing: refreshCarInfoMutation.isPending,
      isInitializing: isInitialLoad,
      saveError: saveMutation.error,
      refreshError: refreshCarInfoMutation.error,
  };
});
