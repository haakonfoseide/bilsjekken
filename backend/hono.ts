import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

// Global middleware
app.use("/*", cors());
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`[Backend] ${c.req.method} ${c.req.path} - ${c.res.status} (${ms}ms)`);
});

// Health check
const healthHandler = (c: any) => c.json({
  status: "ok",
  timestamp: new Date().toISOString(),
  message: "Backend is healthy"
});

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

// tRPC Handler
// We mount it at /api/trpc and let Hono handle the routing
// The endpoint option tells tRPC where it is mounted so it can strip the prefix correctly
app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    endpoint: "/api/trpc",
    onError: ({ error, path }) => {
      console.error(`[tRPC Error] Path: ${path}, Message: ${error.message}`);
      if (error.cause) console.error(error.cause);
    },
  })
);

// Fallback for 404
app.notFound((c) => {
  return c.json({ 
    error: "Not Found", 
    path: c.req.path,
    message: "The requested route was not found on this server."
  }, 404);
});

// Global Error Handler
app.onError((err, c) => {
  console.error("[Backend] Unhandled Error:", err);
  return c.json({ 
    error: "Internal Server Error",
    message: err.message 
  }, 500);
});

export default app;
