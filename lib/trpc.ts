import { createTRPCReact, httpLink } from "@trpc/react-query";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && envUrl.length > 0) {
    const url = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    console.log("[tRPC] Using env URL:", url);
    return url;
  }

  const toolkitUrl = process.env.EXPO_PUBLIC_TOOLKIT_URL;
  if (toolkitUrl && toolkitUrl.length > 0) {
    const baseUrl = new URL(toolkitUrl).origin;
    console.log("[tRPC] Using toolkit-derived URL:", baseUrl);
    return baseUrl;
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    console.log("[tRPC] Using window.location.origin:", window.location.origin);
    return window.location.origin;
  }

  const hostUri = (Constants?.expoConfig as { hostUri?: string } | undefined)?.hostUri;
  if (hostUri) {
    const [host, port] = hostUri.split(":");
    const protocol = host && host.match(/^\d+\.\d+\.\d+\.\d+$/) ? "http" : "https";
    const url = port ? `${protocol}://${host}:${port}` : `${protocol}://${host}`;
    console.log("[tRPC] Using hostUri:", url);
    return url;
  }

  console.log("[tRPC] Using fallback URL: http://127.0.0.1:3000");
  return "http://127.0.0.1:3000";
};

const tRPCPath = "/api/trpc";
const baseUrl = `${getBaseUrl()}${tRPCPath}`;
console.log("[tRPC] Final base URL:", baseUrl);

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: baseUrl,
      transformer: superjson,
      fetch: async (url, options) => {
        console.log("[tRPC Client] Fetching:", url);
        console.log("[tRPC Client] Request options:", JSON.stringify(options, null, 2));
        
        const response = await fetch(url, options);
        
        console.log("[tRPC Client] Response status:", response.status);
        console.log("[tRPC Client] Response headers:", Object.fromEntries(response.headers.entries()));
        
        if (!response.ok && response.status === 404) {
          console.error("[tRPC Client] 404 Not Found - Backend route not found");
          console.error("[tRPC Client] URL:", url);
          throw new Error("Backend API route not found. Make sure the backend server is running.");
        }
        
        return response;
      },
      headers() {
        return {
          "Content-Type": "application/json",
        };
      },
    }),
  ],
});
