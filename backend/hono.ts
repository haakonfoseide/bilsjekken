import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

// Add CORS middleware
app.use("/*", cors());

// Logging middleware
app.use("*", async (c, next) => {
  console.log(`[Backend] ${c.req.method} ${c.req.path}`);
  await next();
});

// Health check - IMPORTANT: Keep this simple and first
app.get("/api/health", (c) => {
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Backend is healthy" 
  });
});

// tRPC handler
app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    endpoint: "/api/trpc",
    createContext,
    onError: ({ error, path }) => {
      console.error(`[tRPC Error] Path: ${path}, Message: ${error.message}`);
    },
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
