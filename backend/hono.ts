import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors());

app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
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
  return c.json({ status: "ok", message: "API is running" });
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