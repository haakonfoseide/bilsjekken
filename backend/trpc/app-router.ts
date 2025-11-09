import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import vehicleSearchRoute from "./routes/vehicle/search/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  vehicle: createTRPCRouter({
    search: vehicleSearchRoute,
  }),
});

export type AppRouter = typeof appRouter;