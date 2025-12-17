import app from "@/backend/hono";

const handler = (req: Request) => {
  console.log("[API Route Handler] Incoming request:", req.url);
  return app.fetch(req);
};

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
export const HEAD = handler;
