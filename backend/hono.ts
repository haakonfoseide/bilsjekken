import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

const createHealthResponse = () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  message: "Backend is healthy",
});

// Common error handler
const onTRPCError = ({ error, path }: { error: Error; path?: string }) => {
  console.error(`[tRPC Error] Path: ${path || 'unknown'}, Message: ${error.message}`);
};

// Add CORS middleware
app.use("/*", cors());

// Logging middleware
app.use("*", async (c, next) => {
  console.log(`[Backend] ${c.req.method} ${c.req.path}`);
  await next();
});

// Health check - supports both /health and /api/health
app.get("/health", (c) => c.json(createHealthResponse()));
app.get("/api/health", (c) => c.json(createHealthResponse()));

// tRPC handlers
// We use specific endpoints to ensure the path is correctly stripped
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    endpoint: "/trpc",
    onError: onTRPCError,
  })
);

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    endpoint: "/api/trpc",
    onError: onTRPCError,
  })
);

// 404 Handler
app.notFound((c) => {
  console.log(`[Backend] 404 Not Found: ${c.req.path}`);
  return c.json({ error: "Route not found", path: c.req.path }, 404);
});

// Error Handler
app.onError((err, c) => {
  console.error("[Backend] Error:", err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

console.log("[Backend] Server initialized");

export default app;
