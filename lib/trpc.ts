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

const baseUrl = `${getBaseUrl()}/api/trpc`;
console.log("[tRPC] Final base URL:", baseUrl);

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: baseUrl,
      transformer: superjson,
      headers() {
        return {
          "Content-Type": "application/json",
        };
      },
      async fetch(url, options) {
        console.log("[tRPC Client] Fetching:", url);
        console.log("[tRPC Client] Request options:", JSON.stringify(options, null, 2));
        try {
          const response = await fetch(url, options);
          console.log("[tRPC Client] Response status:", response.status);
          console.log("[tRPC Client] Response statusText:", response.statusText);
          console.log("[tRPC Client] Response headers:", Object.fromEntries(response.headers.entries()));
          
          const cloned = response.clone();
          let text = "";
          try {
            text = await cloned.text();
            console.log("[tRPC Client] Response length:", text.length);
            console.log("[tRPC Client] Response preview:", text.substring(0, 500));
            if (text.length > 0) {
              console.log("[tRPC Client] First char:", text.charAt(0), "code:", text.charCodeAt(0));
            }
          } catch (textError) {
            console.error("[tRPC Client] Could not read response text:", textError);
          }
          
          if (!text || text.trim().length === 0) {
            console.error("[tRPC Client] Empty response");
            return new Response(
              JSON.stringify([{
                error: {
                  json: {
                    message: "Tom respons fra server",
                    code: -32700,
                    data: {
                      code: "INTERNAL_SERVER_ERROR",
                      httpStatus: response.status,
                      path: url
                    }
                  }
                }
              }]),
              {
                status: 200,
                headers: { "Content-Type": "application/json" }
              }
            );
          }
          
          const trimmedText = text.trim();
          const firstChar = trimmedText.charAt(0);
          
          if (firstChar !== '{' && firstChar !== '[') {
            console.error("[tRPC Client] Response is not valid JSON:", text);
            console.error("[tRPC Client] First character:", firstChar, "(code:", trimmedText.charCodeAt(0), ")");
            
            const lowerText = text.toLowerCase();
            let errorMessage = "Server returnerte ugyldig format";
            let errorCode: string = "INTERNAL_SERVER_ERROR";
            
            if (lowerText.includes("not found") || lowerText.includes("ingen treff")) {
              errorMessage = "Fant ikke kjøretøy med dette skiltet";
              errorCode = "NOT_FOUND";
            } else if (lowerText.includes("unauthorized") || lowerText.includes("forbidden")) {
              errorMessage = "Ikke autorisert";
              errorCode = "UNAUTHORIZED";
            } else if (lowerText.includes("bad request")) {
              errorMessage = "Ugyldig forespørsel";
              errorCode = "BAD_REQUEST";
            }
            
            return new Response(
              JSON.stringify([{
                error: {
                  json: {
                    message: errorMessage,
                    code: -32700,
                    data: {
                      code: errorCode,
                      httpStatus: response.status,
                      path: url
                    }
                  }
                }
              }]),
              {
                status: 200,
                headers: { "Content-Type": "application/json" }
              }
            );
          }
          
          const contentType = response.headers.get("content-type") || "";
          if (!contentType.includes("application/json") && !contentType.includes("json")) {
            console.warn("[tRPC Client] Non-JSON content-type:", contentType, "but response looks like JSON");
          }
          
          return response;
        } catch (error) {
          console.error("[tRPC Client] Fetch error:", error);
          console.error("[tRPC Client] Error details:", JSON.stringify(error, null, 2));
          throw error;
        }
      },
    }),
  ],
});
