import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useCallback, useMemo } from "react";
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
const STORAGE_VERSION = "1.0";

interface CarData {
  carInfo: CarInfo | null;
  washRecords: WashRecord[];
  serviceRecords: ServiceRecord[];
  tireInfo: TireInfo | null;
  tireSets: TireSet[];
  mileageRecords: MileageRecord[];
}

const defaultData: CarData = {
  carInfo: null,
  washRecords: [],
  serviceRecords: [],
  tireInfo: null,
  tireSets: [],
  mileageRecords: [],
};

export const [CarProvider, useCarData] = createContextHook(() => {
  const [data, setData] = useState<CarData>(defaultData);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { data: loadedData, error: loadError, isLoading } = useQuery({
    queryKey: ["carData"],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!stored) {
          console.log("[CarContext] No stored data found, using defaults");
          return defaultData;
        }

        const parsed = JSON.parse(stored);
        console.log("[CarContext] Successfully loaded data from storage");
        return parsed;
      } catch (error) {
        console.error("[CarContext] Error loading data:", error);
        
        try {
          const backup = await AsyncStorage.getItem(STORAGE_BACKUP_KEY);
          if (backup) {
            console.log("[CarContext] Restoring from backup");
            const parsed = JSON.parse(backup);
            await AsyncStorage.setItem(STORAGE_KEY, backup);
            return parsed;
          }
        } catch (backupError) {
          console.error("[CarContext] Backup restore failed:", backupError);
        }
        
        return defaultData;
      }
    },
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
          console.log("[CarContext] Backup created");
        }
        
        await AsyncStorage.setItem(STORAGE_KEY, serialized);
        console.log("[CarContext] Data saved successfully");
        return newData;
      } catch (error) {
        console.error("[CarContext] Save error:", error);
        throw new Error("Kunne ikke lagre data. Sjekk lagringsplass.");
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    if (loadError) {
      console.error("[CarContext] Load error:", loadError);
    }
  }, [loadError]);

  useEffect(() => {
    if (loadedData) {
      setData({
        ...defaultData,
        ...loadedData,
        tireSets: loadedData.tireSets || [],
        washRecords: loadedData.washRecords || [],
        serviceRecords: loadedData.serviceRecords || [],
        mileageRecords: loadedData.mileageRecords || [],
      });
      
      if (isInitialLoad) {
        setIsInitialLoad(false);
        console.log("[CarContext] Initial load complete");
      }
    }
  }, [loadedData, isInitialLoad]);

  const { mutate } = saveMutation;

  const saveData = useCallback(
    (newData: CarData) => {
      setData(newData);
      mutate(newData, {
        onError: (error) => {
          console.error("[CarContext] Failed to persist data:", error);
        },
      });
    },
    [mutate]
  );

  const updateCarInfo = useCallback(
    (carInfo: CarInfo) => {
      const newData = { ...data, carInfo };
      saveData(newData);
    },
    [data, saveData]
  );

  const addWashRecord = useCallback(
    (record: Omit<WashRecord, "id">) => {
      const newRecord = { ...record, id: Date.now().toString() };
      const newData = {
        ...data,
        washRecords: [newRecord, ...data.washRecords],
      };
      saveData(newData);
    },
    [data, saveData]
  );

  const deleteWashRecord = useCallback(
    (id: string) => {
      const newData = {
        ...data,
        washRecords: data.washRecords.filter((r) => r.id !== id),
      };
      saveData(newData);
    },
    [data, saveData]
  );

  const addServiceRecord = useCallback(
    (record: Omit<ServiceRecord, "id">) => {
      const newRecord = { ...record, id: Date.now().toString() };
      const newData = {
        ...data,
        serviceRecords: [newRecord, ...data.serviceRecords],
      };
      saveData(newData);
    },
    [data, saveData]
  );

  const deleteServiceRecord = useCallback(
    (id: string) => {
      const newData = {
        ...data,
        serviceRecords: data.serviceRecords.filter((r) => r.id !== id),
      };
      saveData(newData);
    },
    [data, saveData]
  );

  const updateTireInfo = useCallback(
    (tireInfo: TireInfo) => {
      const newData = { ...data, tireInfo };
      saveData(newData);
    },
    [data, saveData]
  );

  const addTireSet = useCallback(
    (tireSet: Omit<TireSet, "id">) => {
      const newTireSet = { ...tireSet, id: Date.now().toString() };
      const newData = {
        ...data,
        tireSets: [newTireSet, ...data.tireSets],
      };
      saveData(newData);
    },
    [data, saveData]
  );

  const deleteTireSet = useCallback(
    (id: string) => {
      const newData = {
        ...data,
        tireSets: data.tireSets.filter((t) => t.id !== id),
      };
      saveData(newData);
    },
    [data, saveData]
  );

  const updateTireSet = useCallback(
    (id: string, updates: Partial<TireSet>) => {
      const newData = {
        ...data,
        tireSets: data.tireSets.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      };
      saveData(newData);
    },
    [data, saveData]
  );

  const setActiveTireSet = useCallback(
    (id: string) => {
      const newData = {
        ...data,
        tireSets: data.tireSets.map((t) => ({
          ...t,
          isActive: t.id === id,
        })),
      };
      saveData(newData);
    },
    [data, saveData]
  );

  const addMileageRecord = useCallback(
    (record: Omit<MileageRecord, "id">) => {
      const newRecord = { ...record, id: Date.now().toString() };
      const newData = {
        ...data,
        mileageRecords: [newRecord, ...data.mileageRecords],
      };
      if (data.carInfo) {
        newData.carInfo = { ...data.carInfo, currentMileage: record.mileage };
      }
      saveData(newData);
    },
    [data, saveData]
  );

  const getLastWash = useCallback(() => {
    if (data.washRecords.length === 0) return null;
    return data.washRecords[0];
  }, [data.washRecords]);

  const getNextService = useCallback(() => {
    if (data.serviceRecords.length === 0) return null;
    const lastService = data.serviceRecords[0];
    const currentMileage = data.carInfo?.currentMileage || 0;
    const serviceInterval = 15000;
    const mileageUntilService = lastService.mileage + serviceInterval - currentMileage;
    return {
      mileage: mileageUntilService,
      estimated: mileageUntilService > 0,
    };
  }, [data.serviceRecords, data.carInfo]);

  const getTireAge = useCallback(() => {
    if (!data.tireInfo) return null;
    const purchaseDate = new Date(data.tireInfo.purchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchaseDate.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    const diffMonths = Math.floor(
      (diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)
    );
    return { years: diffYears, months: diffMonths };
  }, [data.tireInfo]);

  return useMemo(
    () => ({
      carInfo: data.carInfo,
      washRecords: data.washRecords,
      serviceRecords: data.serviceRecords,
      tireInfo: data.tireInfo,
      tireSets: data.tireSets,
      mileageRecords: data.mileageRecords,
      updateCarInfo,
      addWashRecord,
      deleteWashRecord,
      addServiceRecord,
      deleteServiceRecord,
      updateTireInfo,
      addTireSet,
      deleteTireSet,
      updateTireSet,
      setActiveTireSet,
      addMileageRecord,
      getLastWash,
      getNextService,
      getTireAge,
      isLoading: saveMutation.isPending || isLoading,
      isSaving: saveMutation.isPending,
      isInitializing: isInitialLoad,
      saveError: saveMutation.error,
    }),
    [
      data,
      updateCarInfo,
      addWashRecord,
      deleteWashRecord,
      addServiceRecord,
      deleteServiceRecord,
      updateTireInfo,
      addTireSet,
      deleteTireSet,
      updateTireSet,
      setActiveTireSet,
      addMileageRecord,
      getLastWash,
      getNextService,
      getTireAge,
      saveMutation.isPending,
      isLoading,
      isInitialLoad,
      saveMutation.error,
    ]
  );
});
