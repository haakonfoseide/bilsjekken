import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { vehicleSearchProcedure } from "./routes/vehicle/search/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  vehicle: createTRPCRouter({
    search: vehicleSearchProcedure,
  }),
});

export type AppRouter = typeof appRouter;