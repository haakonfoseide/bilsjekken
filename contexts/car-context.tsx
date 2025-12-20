import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { trpcClient } from "@/lib/trpc";
import type {
  CarInfo,
  WashRecord,
  ServiceRecord,
  TireInfo,
  TireSet,
  MileageRecord,
} from "@/types/car";

const STORAGE_KEY = "@car_data";
const STORAGE_BACKUP_KEY = "@car_data_backup";
const STORAGE_VERSION = "2.0"; // Bump version for migration

interface CarData {
  // New structure
  cars: CarInfo[];
  activeCarId: string | null;
  
  // Records now include carId
  washRecords: WashRecord[];
  serviceRecords: ServiceRecord[];
  tireSets: TireSet[];
  mileageRecords: MileageRecord[];
  
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
  tireInfos: {},
};

export const [CarProvider, useCarData] = createContextHook(() => {
  const [data, setData] = useState<CarData>(defaultData);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const dataRef = useRef<CarData>(defaultData);

  const { data: loadedData, isLoading } = useQuery({
    queryKey: ["carData"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          console.log("[CarContext] No stored data found, using defaults");
          return defaultData;
        }

        try {
          const parsed = JSON.parse(stored);
          console.log("[CarContext] Successfully loaded data from storage");
          
          // MIGRATION LOGIC
          if (!parsed.cars && parsed.carInfo) {
             console.log("[CarContext] Migrating from v1 to v2");
             const oldCar = parsed.carInfo;
             const carId = "default-car";
             const migratedCar: CarInfo = { ...oldCar, id: carId };
             
             // Migrate records
             const migrateRecord = (r: any) => ({ ...r, carId });
             
             return {
               cars: [migratedCar],
               activeCarId: carId,
               washRecords: (parsed.washRecords || []).map(migrateRecord),
               serviceRecords: (parsed.serviceRecords || []).map(migrateRecord),
               tireSets: (parsed.tireSets || []).map(migrateRecord),
               mileageRecords: (parsed.mileageRecords || []).map(migrateRecord),
               tireInfos: parsed.tireInfo ? { [carId]: parsed.tireInfo } : {},
             };
          }

          return parsed;
        } catch (e) {
          console.error("[CarContext] Failed to parse stored data. Resetting storage.", e);
          // If the data is corrupted (e.g. "object Object"), we must clear it to allow the app to start.
          await AsyncStorage.removeItem(STORAGE_KEY);
          return defaultData;
        }
      } catch (error) {
        console.error("[CarContext] Error loading data:", error);
        // Try backup...
        try {
           const backup = await AsyncStorage.getItem(STORAGE_BACKUP_KEY);
           if (backup) return JSON.parse(backup); // Note: might need migration too if backup is old
        } catch {}
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
      const newData = {
        ...loadedData,
        cars: loadedData.cars || [],
        washRecords: loadedData.washRecords || [],
        serviceRecords: loadedData.serviceRecords || [],
        tireSets: loadedData.tireSets || [],
        mileageRecords: loadedData.mileageRecords || [],
        tireInfos: loadedData.tireInfos || {},
      };
      dataRef.current = newData;
      setData(newData);
      
      if (isInitialLoad) setIsInitialLoad(false);
    }
  }, [loadedData, isInitialLoad]);

  const { mutate } = saveMutation;

  // -- CAR ACTIONS --

  const addCar = useCallback((car: Omit<CarInfo, "id">) => {
    const id = Date.now().toString();
    const newCar = { ...car, id };
    
    setData((prev) => {
       const newCars = [...prev.cars, newCar];
       const newData = {
         ...prev,
         cars: newCars,
         activeCarId: prev.activeCarId || id,
       };
       dataRef.current = newData;
       mutate(newData);
       return newData;
    });
  }, [mutate]);

  const updateCarInfo = useCallback((carInfo: CarInfo) => {
      setData((prev) => {
         const newCars = prev.cars.map(c => c.id === carInfo.id ? carInfo : c);
         const newData = { ...prev, cars: newCars };
         dataRef.current = newData;
         mutate(newData);
         return newData;
      });
  }, [mutate]);

  const deleteCar = useCallback((carId: string) => {
      setData((prev) => {
         const newCars = prev.cars.filter(c => c.id !== carId);
         const newWash = prev.washRecords.filter(r => r.carId !== carId);
         const newService = prev.serviceRecords.filter(r => r.carId !== carId);
         const newTires = prev.tireSets.filter(r => r.carId !== carId);
         const newMileage = prev.mileageRecords.filter(r => r.carId !== carId);
         const newTireInfos = { ...prev.tireInfos };
         delete newTireInfos[carId];

         let newActiveId = prev.activeCarId;
         if (newActiveId === carId) {
            newActiveId = newCars.length > 0 ? newCars[0].id : null;
         }

         const newData = {
            ...prev,
            cars: newCars,
            activeCarId: newActiveId,
            washRecords: newWash,
            serviceRecords: newService,
            tireSets: newTires,
            mileageRecords: newMileage,
            tireInfos: newTireInfos,
         };
         dataRef.current = newData;
         mutate(newData);
         return newData;
      });
  }, [mutate]);

  const setActiveCar = useCallback((carId: string) => {
      setData((prev) => {
         const newData = { ...prev, activeCarId: carId };
         dataRef.current = newData;
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
        const newData = {
            ...prev,
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
        const newData = {
            ...prev,
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

  const updateTireInfo = useCallback(
    (info: TireInfo) => {
       if (!activeCarId) return;
       setData((prev) => {
          const newData = {
              ...prev,
              tireInfos: { ...prev.tireInfos, [activeCarId]: info },
          };
          mutate(newData);
          return newData;
       });
    },
    [activeCarId, mutate]
  );
  
  const addMileageRecord = useCallback(
    (record: Omit<MileageRecord, "id" | "carId">) => {
      if (!activeCarId) return;
      const newRecord = { ...record, id: Date.now().toString(), carId: activeCarId };
      
      setData((prev) => {
         const newMileageRecords = [newRecord, ...prev.mileageRecords];
         
         // Update car info current mileage
         const newCars = prev.cars.map(c => 
            c.id === activeCarId ? { ...c, currentMileage: record.mileage } : c
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

  const currentTireInfo = useMemo(() => 
    activeCarId ? data.tireInfos[activeCarId] || null : null,
    [data.tireInfos, activeCarId]
  );

  const getLastWash = useCallback(() => {
    if (filteredWashRecords.length === 0) return null;
    // Assuming sorted by new->old
    return filteredWashRecords[0];
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
    if (!currentTireInfo) {
        // Fallback to active tire set?
        const activeSet = filteredTireSets.find(t => t.isActive);
        if (activeSet) {
             const purchaseDate = new Date(activeSet.purchaseDate);
             const now = new Date();
             const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
             const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
             const diffMonths = Math.floor(
               (diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)
             );
             return { years: diffYears, months: diffMonths };
        }
        return null;
    }
    const purchaseDate = new Date(currentTireInfo.purchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    const diffMonths = Math.floor(
      (diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)
    );
    return { years: diffYears, months: diffMonths };
  }, [currentTireInfo, filteredTireSets]);

  const refreshCarInfoMutation = useMutation({
    mutationFn: async (carId: string) => {
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
            ? (vehicleData.registeredMileage as number)
            : null;

          const vvHistory = Array.isArray(vehicleData.mileageHistory)
            ? (vehicleData.mileageHistory as { mileage: number; date: string; source?: "vegvesen" }[])
            : undefined;

          const computedCurrentMileage = vvRegistered !== null ? Math.max(localCurrent, vvRegistered) : localCurrent;

          return {
            ...c,
            make: vehicleData.make,
            model: vehicleData.model,
            year: vehicleData.year,
            vin: vehicleData.vin || c.vin,
            color: vehicleData.color,
            weight: vehicleData.weight,
            totalWeight: (vehicleData as any).totalWeight ?? c.totalWeight,
            power: vehicleData.power,
            fuelType: vehicleData.fuelType,
            co2Emission: (vehicleData as any).co2Emission ?? c.co2Emission,
            engineDisplacement: (vehicleData as any).engineDisplacement ?? c.engineDisplacement,
            transmission: (vehicleData as any).transmission ?? c.transmission,
            driveType: (vehicleData as any).driveType ?? c.driveType,
            numberOfSeats: (vehicleData as any).numberOfSeats ?? c.numberOfSeats,
            numberOfDoors: (vehicleData as any).numberOfDoors ?? c.numberOfDoors,
            maxTowWeight: (vehicleData as any).maxTowWeight ?? c.maxTowWeight,
            registrationDate: vehicleData.registrationDate,
            vehicleType: vehicleData.vehicleType,
            currentMileage: computedCurrentMileage,
            registeredMileage: vvRegistered ?? c.registeredMileage,
            registeredMileageDate: vehicleData.registeredMileageDate ?? c.registeredMileageDate,
            mileageHistory: vvHistory ?? c.mileageHistory,
            euControlDate: vehicleData.euControlDate ?? c.euControlDate,
            nextEuControlDate: vehicleData.nextEuControlDate ?? c.nextEuControlDate,
            vehicleSections: (vehicleData as any).vehicleSections ?? c.vehicleSections,
          };
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
