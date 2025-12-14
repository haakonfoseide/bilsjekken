export interface CarInfo {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  insurance: string;
  currentMileage: number;
  vin?: string;
}

export interface WashRecord {
  id: string;
  date: string;
  mileage?: number;
  type?: string;
  notes?: string;
}

export interface ServiceRecord {
  id: string;
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
  date: string;
  mileage: number;
}
