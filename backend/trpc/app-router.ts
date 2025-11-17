import { createTRPCRouter } from "./create-context";
import hiProcedure from "./routes/example/hi/route";
import searchProcedure from "./routes/vehicle/search/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiProcedure,
  }),
  vehicle: createTRPCRouter({
    search: searchProcedure,
  }),
});

export type AppRouter = typeof appRouter;