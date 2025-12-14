import { createTRPCRouter } from "./create-context";
import hiProcedure from "./routes/example/hi/route";
import vehicleSearchProcedure from "./routes/vehicle/search/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiProcedure,
  }),
  vehicle: createTRPCRouter({
    search: vehicleSearchProcedure,
  }),
  vehicleSearch: vehicleSearchProcedure,
});

export type AppRouter = typeof appRouter;