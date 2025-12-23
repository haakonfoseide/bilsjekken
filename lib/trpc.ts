import { createTRPCReact } from "@trpc/react-query";
import { createTRPCProxyClient, httpLink } from "@trpc/client";
import Constants from "expo-constants";

// 1. Create the React Query hooks
// We cast to any to avoid "collision" errors and because we can't easily
// import the full Router type on the client without runtime issues.
export const trpc = createTRPCReact<any>() as any;

const normalizeNoTrailingSlash = (value: string) => (value.endsWith("/") ? value.slice(0, -1) : value);

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (envUrl && envUrl.length > 0) {
    const url = normalizeNoTrailingSlash(envUrl);
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

export const getTrpcHttpUrl = () => {
  const base = normalizeNoTrailingSlash(getBaseUrl());

  // Accept several common shapes to avoid double-prefixing that causes 404s:
  // - https://example.com/api/trpc
  // - https://example.com/api
  // - https://example.com
  if (base.endsWith("/api/trpc")) {
    const url = base;
    console.log("[tRPC] Resolved tRPC URL (already full):", url);
    return url;
  }

  if (base.endsWith("/api")) {
    const url = `${base}/trpc`;
    console.log("[tRPC] Resolved tRPC URL (base ends with /api):", url);
    return url;
  }

  const url = `${base}/api/trpc`;
  console.log("[tRPC] Resolved tRPC URL:", url);
  return url;
};

// 2. Define the links configuration
const createLinks = () => [
  httpLink({
    url: getTrpcHttpUrl(),
    // transformer: superjson,
    // Custom fetch to log requests/responses
    fetch: async (url, options) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      
      const vegvesenKey = process.env.EXPO_PUBLIC_VEGVESEN_API_KEY;

      const mergedHeaders = {
        "Content-Type": "application/json",
        "x-rork-request-id": requestId,
        "x-rork-trpc-client": "expo",
        ...(vegvesenKey ? { "x-vegvesen-api-key": vegvesenKey } : {}),
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

        console.log(`[tRPC] ${requestId} <- Status: ${response.status}`);
        console.log(`[tRPC] ${requestId} <- Content-Type: ${response.headers.get('content-type')}`);
        
        // Clone response to peek at body for debugging
        const clonedResponse = response.clone();
        try {
          const textBody = await clonedResponse.text();
          const isJson = response.headers.get('content-type')?.includes('application/json');
          
          if (!response.ok || !isJson) {
            console.error(`[tRPC] ${requestId} <- BODY (first 800 chars):`, textBody.substring(0, 800));
          } else {
            console.log(`[tRPC] ${requestId} <- Body preview:`, textBody.substring(0, 200));
          }
        } catch (peekError) {
          console.error(`[tRPC] ${requestId} <- Could not peek at body:`, peekError);
        }
        
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
});

// 4. Create the Vanilla Proxy Client (for usage outside of React components/hooks)
export const trpcVanillaClient = createTRPCProxyClient<any>({
  links: createLinks(),
});

// 5. Type-safe wrapper for vanilla client calls
export const trpcClient = {
  vehicleSearch: {
    query: async (input: { licensePlate: string }) => {
      return (trpcVanillaClient as any).vehicleSearch.query(input);
    },
  },
  vehicle: {
    search: {
      query: async (input: { licensePlate: string }) => {
        return (trpcVanillaClient as any).vehicle.search.query(input);
      },
    },
  },
};
