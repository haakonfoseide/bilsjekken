import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC } from "@trpc/server";

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const requestId = opts.req.headers.get("x-rork-request-id") ?? `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const url = (() => {
    try {
      return new URL(opts.req.url);
    } catch {
      return null;
    }
  })();

  console.log("[tRPC Context] init", {
    requestId,
    method: opts.req.method,
    path: url?.pathname ?? "(unknown)",
    search: url?.search ?? "",
    hasBody: opts.req.method !== "GET" && opts.req.method !== "HEAD",
  });

  return {
    req: opts.req,
    requestId,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  // transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;