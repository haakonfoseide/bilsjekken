export interface VehicleField {
  label: string;
  value: string;
  unit?: string;
}

export interface VehicleSection {
  title: string;
  fields: VehicleField[];
}

export interface VehicleSearchResult {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  vin: string;
  color: string;
  registrationDate: string | null;
  vehicleType: string;
  weight: number | null;
  power: number | null;
  fuelType: string;

  totalWeight?: number | null;
  co2Emission?: number | null;
  engineDisplacement?: number | null;
  transmission?: string | null;
  driveType?: string | null;
  numberOfSeats?: number | null;
  numberOfDoors?: number | null;
  maxTowWeight?: number | null;

  registeredMileage?: number | null;
  registeredMileageDate?: string | null;
  mileageHistory?: { mileage: number; date: string; source?: "vegvesen" | "user" }[];

  euControlDate?: string | null;
  nextEuControlDate?: string | null;

  vehicleSections?: {
    euKontroll?: VehicleSection;
    registreringsdata?: VehicleSection;
    utslipp?: VehicleSection;
    malOgVekt?: VehicleSection;
    motorKraftoverforing?: VehicleSection;
    dekkOgFelg?: VehicleSection;
  };
}

export interface AppRouter {
  vehicle: {
    search: {
      query: (input: { licensePlate: string }) => Promise<VehicleSearchResult>;
    };
  };
}
