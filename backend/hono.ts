import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

console.log("[Backend] Hono server initializing...");
console.log("[Backend] tRPC routes available:", Object.keys(appRouter._def.procedures));
console.log("[Backend] Checking router structure:");
try {
  const procedures = appRouter._def.procedures as any;
  console.log("[Backend] - example routes:", procedures.example ? Object.keys(procedures.example._def.procedures || {}) : "not found");
  console.log("[Backend] - vehicle routes:", procedures.vehicle ? Object.keys(procedures.vehicle._def.procedures || {}) : "not found");
} catch (e) {
  console.log("[Backend] Error checking routes:", e);
}

app.use("*", cors());

app.use("*", async (c, next) => {
  console.log("[Backend] Incoming request:", c.req.method, c.req.path);
  console.log("[Backend] Headers:", Object.fromEntries(c.req.raw.headers.entries()));
  await next();
});

console.log("[Backend] Setting up tRPC server at /api/trpc");
console.log("[Backend] App router procedures:", Object.keys(appRouter._def.procedures));

app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
    responseMeta() {
      return {
        headers: {
          "Content-Type": "application/json",
        },
      };
    },
    onError: ({ error, path }) => {
      console.error("[tRPC Error]", {
        path,
        code: error.code,
        message: error.message,
        cause: error.cause,
        stack: error.stack,
      });
    },
  })
);

app.get("/", (c) => {
  console.log("[Backend] Root endpoint accessed");
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/api", (c) => {
  console.log("[Backend] /api endpoint accessed");
  const procedures = appRouter._def.procedures as any;
  const exampleRoutes = procedures.example ? Object.keys(procedures.example._def.procedures || {}) : [];
  const vehicleRoutes = procedures.vehicle ? Object.keys(procedures.vehicle._def.procedures || {}) : [];
  
  return c.json({ 
    status: "ok", 
    message: "Backend API is running",
    routes: ["/ (health check)", "/api/trpc (tRPC endpoint)"],
    availableRoutes: {
      example: exampleRoutes,
      vehicle: vehicleRoutes
    }
  });
});

app.get("/api/health", (c) => {
  console.log("[Backend] /api/health endpoint accessed");
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Backend is healthy" 
  });
});

app.notFound((c) => {
  console.log("[Backend] Unhandled request (404):", c.req.method, c.req.path);
  return c.json({ error: "Route not found", path: c.req.path }, 404);
});

app.onError((err, c) => {
  console.error("[Hono Error]", err);
  return c.json(
    {
      error: {
        message: err.message || "Internal server error",
      },
    },
    500
  );
});

export default app;