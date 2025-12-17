export interface AppRouter {
  vehicle: {
    search: {
      query: (input: { licensePlate: string }) => Promise<{
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
      }>;
    };
  };
  vehicleSearch: {
    query: (input: { licensePlate: string }) => Promise<{
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
    }>;
  };
}
