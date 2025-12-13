import { createTRPCRouter } from "./create-context";
import hiProcedure from "./routes/example/hi/route";
import vehicleSearchProcedure from "./routes/vehicle/search/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiProcedure,
  }),
  // Flattened to avoid dot in URL which causes 404 in some environments
  searchVehicle: vehicleSearchProcedure,
});