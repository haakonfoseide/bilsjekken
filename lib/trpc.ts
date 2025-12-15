import { createTRPCReact } from "@trpc/react-query";
import { createTRPCProxyClient, httpLink } from "@trpc/client";
import superjson from "superjson";
import Constants from "expo-constants";
import type { AppRouter } from "@/backend/trpc/router-types";

// 1. Create the React Query hooks
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

const getFullUrl = () => `${getBaseUrl()}/api/trpc`;

// 2. Define the links configuration
const createLinks = () => [
  httpLink({
    url: getFullUrl(),
    transformer: superjson, // Correct placement: Inside the link options
    // Custom fetch to log requests/responses
    fetch: async (url, options) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      
      const mergedHeaders = {
        "Content-Type": "application/json",
        "x-rork-request-id": requestId,
        "x-rork-trpc-client": "expo",
        ...((options?.headers as Record<string, string>) || {}),
      };

      console.log(`[tRPC] ${requestId} -> ${options?.method || 'GET'} ${url}`);

      try {
        if (typeof fetch === 'undefined') {
          console.error(`[tRPC] ${requestId} Global fetch is undefined!`);
          throw new Error("Global fetch is undefined");
        }

        const response = await fetch(url, {
          ...options,
          headers: mergedHeaders,
        });

        console.log(`[tRPC] ${requestId} <- ${response.status}`);
        return response;
      } catch (error) {
        console.error(`[tRPC] ${requestId} Error:`, error);
        throw error;
      }
    },
  }),
];

// 3. Create the client for the Provider (React Query integration)
export const trpcProviderClient = trpc.createClient({
  links: createLinks(),
  // transformer removed from here
});

// 4. Create the Vanilla Proxy Client (for usage outside of React components/hooks)
export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: createLinks(),
  // transformer removed from here
});
