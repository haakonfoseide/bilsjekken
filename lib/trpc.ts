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
        console.log("[tRPC Client] Method:", options?.method || "GET");
        console.log("[tRPC Client] Headers:", options?.headers || {});
        
        const response = await fetch(url, options);
        
        console.log("[tRPC Client] Response status:", response.status);
        console.log("[tRPC Client] Response OK:", response.ok);
        
        if (!response.ok) {
          let responseText = "";
          try {
            responseText = await response.clone().text();
          } catch (e) {
            console.error("[tRPC Client] Failed to read error response text:", e);
          }
          
          console.error("[tRPC Client] Error response:", responseText.substring(0, 500));

          // Try to parse as JSON to see if it's a valid tRPC error
          try {
            const json = JSON.parse(responseText);
            if (json && json.error) {
              // It is a tRPC error (or similar JSON error), so we let it pass through
              // The tRPC client will handle parsing it.
              return response;
            }
          } catch (e) {
            // Not JSON
          }
          
          if (response.status === 404) {
            console.error("[tRPC Client] 404 Not Found - Backend route not found");
            console.error("[tRPC Client] URL:", url);
            console.error("[tRPC Client] Full URL breakdown:", {
              baseUrl: getBaseUrl(),
              tRPCPath,
              fullUrl: url
            });
            
            try {
              const healthCheck = await fetch(`${getBaseUrl()}/api/health`);
              console.error("[tRPC Client] Health check status:", healthCheck.status);
              const healthData = await healthCheck.text();
              console.error("[tRPC Client] Health check response:", healthData);
            } catch (e) {
              console.error("[tRPC Client] Health check failed:", e);
            }
            
            throw new Error("Backend API route not found. The backend server might be starting up or unavailable.");
          }
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
