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
  const requestId = c.req.header("x-rork-request-id") ?? `req_${start}_${Math.random().toString(16).slice(2)}`;

  console.log("[Backend] --------------------------------------------------");
  console.log(`[Backend] RequestId: ${requestId}`);
  console.log(`[Backend] Incoming Request: ${c.req.method} ${c.req.path}`);
  console.log("[Backend] Query:", c.req.query());
  console.log("[Backend] Headers:", {
    "x-rork-request-id": c.req.header("x-rork-request-id"),
    "x-rork-trpc-client": c.req.header("x-rork-trpc-client"),
    "content-type": c.req.header("content-type"),
    accept: c.req.header("accept"),
    origin: c.req.header("origin"),
    referer: c.req.header("referer"),
    host: c.req.header("host"),
  });

  c.header("x-rork-request-id", requestId);

  try {
    await next();
  } finally {
    const ms = Date.now() - start;
    console.log(`[Backend] Finished ${c.req.method} ${c.req.path} - ${c.res.status} (${ms}ms) RequestId=${requestId}`);
  }
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
// The Hono app is mounted at /api by default, so we mount tRPC at /trpc
// This makes it available at /api/trpc/*
app.use(
  "/trpc/*",
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
