import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const vehicleCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const vehicleSearchSchema = z.object({
  licensePlate: z.string().min(1),
});

export const vehicleSearchProcedure = publicProcedure
  .input(vehicleSearchSchema)
  .mutation(async ({ input }) => {
    try {
      const cleanedPlate = input.licensePlate.replace(/\s+/g, "").toUpperCase();
      console.log("[Vehicle Search] Starting search for:", cleanedPlate);
      
      const cached = vehicleCache.get(cleanedPlate);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log("[Vehicle Search] Returning cached data for:", cleanedPlate);
        return cached.data;
      }
      
      console.log("[Vehicle Search] Environment check:", {
        hasVEGVESEN_API_KEY: !!process.env.VEGVESEN_API_KEY,
        hasVegvesen_api_key: !!process.env.Vegvesen_api_key,
        keyLength: (process.env.VEGVESEN_API_KEY || process.env.Vegvesen_api_key)?.length || 0,
        allEnvKeys: Object.keys(process.env).filter(k => k.toUpperCase().includes('VEG') || k.toUpperCase().includes('API'))
      });
      
      const apiKey = process.env.VEGVESEN_API_KEY || process.env.Vegvesen_api_key || "3743201f-02d6-4a28-b044-b84aac7e602b";
      
      if (!apiKey || apiKey.trim() === "") {
        console.error("[Vehicle Search] API key not configured");
        console.error("[Vehicle Search] Available env vars:", Object.keys(process.env).join(', '));
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "API-nøkkel er ikke konfigurert. Kontakt support.",
        });
      }

      const url = `https://akfell-datautlevering.atlas.vegvesen.no/enkeltoppslag/kjoretoydata?kjennemerke=${encodeURIComponent(cleanedPlate)}`;
      console.log("[Vehicle Search] Calling API:", url);
      console.log("[Vehicle Search] License plate:", cleanedPlate);
      console.log("[Vehicle Search] API key starts with:", apiKey.substring(0, 10) + "...");
      
      let response;
      try {
        response = await fetch(url, {
          method: "GET",
          headers: {
            "SVV-Authorization": apiKey,
            "Accept": "application/json",
          },
        });
      } catch (fetchError) {
        console.error("[Vehicle Search] Fetch failed:", fetchError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Kunne ikke koble til Vegvesenet. Sjekk internettforbindelsen.",
        });
      }

      console.log("[Vehicle Search] Response status:", response.status);
      console.log("[Vehicle Search] Response headers:", Object.fromEntries(response.headers.entries()));
      
      let responseText: string;
      let contentType = response.headers.get("content-type") || "";
      console.log("[Vehicle Search] Content-Type:", contentType);

      try {
        responseText = await response.text();
        console.log("[Vehicle Search] Response length:", responseText.length);
        console.log("[Vehicle Search] Response preview:", responseText.substring(0, 500));
        if (responseText.length > 0) {
          console.log("[Vehicle Search] First char code:", responseText.charCodeAt(0));
          console.log("[Vehicle Search] First char:", responseText.charAt(0));
        }
      } catch (textError) {
        console.error("[Vehicle Search] Could not read response text:", textError);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Kunne ikke lese respons fra Vegvesenet. Prøv igjen senere.",
        });
      }

      if (!responseText || responseText.trim() === "") {
        console.error("[Vehicle Search] Empty response received");
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Fant ikke kjøretøy med dette skiltet. Sjekk at skiltnummeret er riktig.",
        });
      }

      if (!response.ok) {
        console.error("[Vehicle Search] API error:", response.status);
        console.error("[Vehicle Search] Response text:", responseText);
        console.error("[Vehicle Search] Response headers:", Object.fromEntries(response.headers.entries()));
        
        const lowerResponse = responseText.toLowerCase();
        
        if (response.status === 404 || lowerResponse.includes("not found") || lowerResponse.includes("ingen treff")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fant ikke kjøretøy med dette skiltet. Sjekk at skiltnummeret er riktig.",
          });
        }
        if (response.status === 401 || response.status === 403 || lowerResponse.includes("unauthorized") || lowerResponse.includes("forbidden")) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "API-nøkkel er ugyldig eller mangler tilgang. Kontakt support.",
          });
        }
        if (response.status === 400) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Ugyldig forespørsel. Sjekk at skiltnummeret er korrekt formatert.",
          });
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Kunne ikke hente data fra Vegvesenet. Prøv igjen senere.",
        });
      }
      
      const lowerResponseText = responseText.toLowerCase();
      if (lowerResponseText.includes("no data") || 
          lowerResponseText.includes("not found") ||
          lowerResponseText.includes("ingen data") ||
          lowerResponseText.includes("ingen treff")) {
        console.error("[Vehicle Search] API returned 'no data' message:", responseText);
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Fant ikke kjøretøy med dette skiltet i Vegvesenets register.",
        });
      }

      if (!contentType.includes("application/json") && !contentType.includes("json")) {
        console.error("[Vehicle Search] Non-JSON response:", contentType);
        console.error("[Vehicle Search] Response text:", responseText.substring(0, 1000));
        
        if (responseText.toLowerCase().includes("not found") || responseText.toLowerCase().includes("no result") || responseText.toLowerCase().includes("ingen data")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fant ikke kjøretøy med dette skiltet. Sjekk at skiltnummeret er riktig.",
          });
        }
        
        if (responseText.toLowerCase().includes("unauthorized") || responseText.toLowerCase().includes("forbidden") || responseText.toLowerCase().includes("access denied")) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "API-nøkkel er ugyldig eller mangler tilgang. Kontakt support.",
          });
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Vegvesen API returnerte ugyldig format. Prøv igjen senere.",
        });
      }

      let data;
      try {
        const trimmedResponse = responseText.trim();
        
        if (!trimmedResponse || trimmedResponse === "null" || trimmedResponse === "undefined" || trimmedResponse === "") {
          console.error("[Vehicle Search] Empty or null response");
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fant ikke kjøretøy med dette skiltet. Sjekk at skiltnummeret er riktig.",
          });
        }
        
        const firstChar = trimmedResponse.charAt(0);
        if (firstChar !== '{' && firstChar !== '[') {
          console.error("[Vehicle Search] Response does not start with JSON:", trimmedResponse.substring(0, 100));
          
          const lowerResponse = trimmedResponse.toLowerCase();
          if (lowerResponse.includes("not found") || lowerResponse.includes("no result") || 
              lowerResponse.includes("ingen data") || lowerResponse.includes("ingen treff")) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Fant ikke kjøretøy med dette skiltet. Sjekk at skiltnummeret er riktig.",
            });
          }
          
          if (lowerResponse.includes("unauthorized") || lowerResponse.includes("forbidden") || 
              lowerResponse.includes("access denied")) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "API-nøkkel er ugyldig eller mangler tilgang. Kontakt support.",
            });
          }
          
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Vegvesen API returnerte ugyldig format. Prøv igjen senere.",
          });
        }
        
        data = JSON.parse(trimmedResponse);
        console.log("[Vehicle Search] JSON parsed successfully");
        console.log("[Vehicle Search] Data keys:", Object.keys(data || {}));
      } catch (parseError) {
        console.error("[Vehicle Search] JSON parse error:", parseError);
        console.error("[Vehicle Search] Failed to parse:", responseText.substring(0, 1000));
        
        if (parseError instanceof TRPCError) {
          throw parseError;
        }
        
        const lowerResponse = responseText.toLowerCase();
        if (lowerResponse.includes("not found") || lowerResponse.includes("no result") || 
            lowerResponse.includes("ingen data") || lowerResponse.includes("ingen treff")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fant ikke kjøretøy med dette skiltet. Sjekk at skiltnummeret er riktig.",
          });
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Kunne ikke tolke data fra Vegvesenet. Prøv igjen senere.",
        });
      }
      
      const vehicle = data?.kjoretoydataListe?.[0];
      if (!vehicle) {
        console.error("[Vehicle Search] No vehicle data in response");
        console.error("[Vehicle Search] Full data:", JSON.stringify(data, null, 2));
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Fant ingen kjøretøydata for dette skiltet",
        });
      }

      const godkjenning = vehicle.godkjenning;
      const tekniskGodkjenning = godkjenning?.tekniskGodkjenning;

      const result = {
        licensePlate: cleanedPlate,
        make: tekniskGodkjenning?.tekniskeData?.generelt?.merke?.[0]?.merke || "Ukjent",
        model: tekniskGodkjenning?.tekniskeData?.generelt?.handelsbetegnelse?.[0] || "Ukjent",
        year: godkjenning?.forstegangsGodkjenning?.forstegangRegistrertDato?.split("-")[0] || "Ukjent",
        vin: vehicle.kjoretoyId?.understellsnummer || "",
        color: tekniskGodkjenning?.tekniskeData?.karosseriOgLasteplan?.farge?.[0]?.kodeNavn || "Ukjent",
        registrationDate: godkjenning?.forstegangsGodkjenning?.forstegangRegistrertDato || null,
        vehicleType: tekniskGodkjenning?.kjoretoyklassifisering?.beskrivelse || "Ukjent",
        weight: tekniskGodkjenning?.tekniskeData?.vekter?.egenvekt || null,
      };

      console.log("[Vehicle Search] Success! Returning:", result);
      
      vehicleCache.set(cleanedPlate, {
        data: result,
        timestamp: Date.now(),
      });
      console.log("[Vehicle Search] Cached result for:", cleanedPlate);
      
      return result;
    } catch (error) {
      console.error("[Vehicle Search] Error caught:", error);
      
      if (error instanceof TRPCError) {
        console.log("[Vehicle Search] Re-throwing TRPCError:", error.code, error.message);
        throw error;
      }
      
      if (error instanceof Error) {
        console.error("[Vehicle Search] Error name:", error.name);
        console.error("[Vehicle Search] Error message:", error.message);
        console.error("[Vehicle Search] Error stack:", error.stack);
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Feil: ${error.message}`,
        });
      }
      
      console.error("[Vehicle Search] Unknown error type:", typeof error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Kunne ikke hente kjøretøyinformasjon",
      });
    }
  });

export { vehicleSearchProcedure as default };
