export interface VehicleField {
  label: string;
  value: string;
  unit?: string;
}

export interface VehicleSection {
  title: string;
  fields: VehicleField[];
}

export type MileageSourceType = 'manual' | 'fuel' | 'service' | 'vegvesen' | 'wash';

export interface CarInfo {
  id: string;
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  insurance: string;
  currentMileage: number;
  mileageSource?: MileageSourceType;
  mileageSourceDate?: string;

  vin?: string;
  color?: string;
  fuelType?: string;
  registrationDate?: string;
  vehicleType?: string;

  weight?: number;
  power?: number;

  co2Emission?: number;
  noxEmission?: number;
  euroClass?: string;
  engineDisplacement?: number;
  transmission?: string;
  driveType?: string;
  numberOfSeats?: number;
  numberOfDoors?: number;
  maxTowWeight?: number;
  totalWeight?: number;

  registrationStatus?: string;
  lengthMm?: number;
  widthMm?: number;
  payload?: number;

  tireDimensions?: {
    front?: string | null;
    rear?: string | null;
  };

  registeredMileage?: number;
  registeredMileageDate?: string;
  mileageHistory?: {
    mileage: number;
    date: string;
    source?: "vegvesen" | "user";
  }[];

  euControlDate?: string;
  nextEuControlDate?: string;

  vehicleSections?: {
    euKontroll?: VehicleSection;
    registreringsdata?: VehicleSection;
    utslipp?: VehicleSection;
    malOgVekt?: VehicleSection;
    motorKraftoverforing?: VehicleSection;
    dekkOgFelg?: VehicleSection;
  };
}

export interface WashRecord {
  id: string;
  carId: string;
  date: string;
  mileage?: number;
  type?: string;
  notes?: string;
}

export interface ServiceRecord {
  id: string;
  carId: string;
  date: string;
  mileage: number;
  type: string;
  description: string;
  cost?: number;
  location?: string;
  receiptImages?: string[];
}

export interface TireSet {
  id: string;
  carId: string;
  type: 'summer' | 'winter';
  brand: string;
  purchaseDate: string;
  isAtTireHotel: boolean;
  hotelLocation?: string;
  size: string;
  notes?: string;
  receiptImages?: string[];
  isActive: boolean;
  hasBalancing?: boolean;
  hasRemounting?: boolean;
}

export interface TireInfo {
  brand: string;
  purchaseDate: string;
  isAtTireHotel: boolean;
  hotelLocation?: string;
  size: string;
  notes?: string;
  receiptImages?: string[];
}

export interface MileageRecord {
  id?: string;
  carId: string;
  date: string;
  mileage: number;
}

export interface FuelRecord {
  id: string;
  carId: string;
  date: string;
  liters: number;
  pricePerLiter?: number;
  totalCost?: number;
  mileage?: number;
  fullTank?: boolean;
  notes?: string;
  location?: string;
}

export interface InsuranceDocument {
  id: string;
  carId: string;
  uri: string;
  type: 'image' | 'pdf' | 'note';
  name?: string;
  addedDate: string;
  notes?: string;
}
