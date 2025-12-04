import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const vehicleCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const vehicleSearchSchema = z.object({
  licensePlate: z.string().min(1),
});

const vehicleSearchProcedure = publicProcedure
  .input(vehicleSearchSchema)
  .mutation(async ({ input }) => {
    try {
      const cleanedPlate = input.licensePlate.replace(/\s+/g, "").toUpperCase();
      console.log("[Vehicle Search] Searching for:", cleanedPlate);
      
      // Check cache
      const cached = vehicleCache.get(cleanedPlate);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log("[Vehicle Search] Returning cached data");
        return cached.data;
      }
      
      const apiKey = process.env.VEGVESEN_API_KEY || process.env.EXPO_PUBLIC_VEGVESEN_API_KEY;
      
      if (!apiKey) {
        console.error("[Vehicle Search] API key missing. Checked VEGVESEN_API_KEY and EXPO_PUBLIC_VEGVESEN_API_KEY.");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Systemfeil: API-nøkkel mangler.",
        });
      }

      // Using the URL structure for Vegvesen API
      // Based on: https://akfell-datautlevering.atlas.vegvesen.no/swagger-ui/index.html
      const url = `https://akfell-datautlevering.atlas.vegvesen.no/enkeltoppslag/kjoretoydata?kjennemerke=${encodeURIComponent(cleanedPlate)}`;
      
      console.log("[Vehicle Search] Fetching from:", url);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-API-KEY": apiKey,
          "Accept": "application/json"
        },
      });

      console.log("[Vehicle Search] Status:", response.status);

      if (!response.ok) {
        let text = "";
        try {
             text = await response.text();
        } catch (e) {
             console.error("[Vehicle Search] Failed to read error text:", e);
        }
        console.error("[Vehicle Search] API Error Body:", text);

        if (response.status === 404 || response.status === 204) {
             throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fant ikke kjøretøy med dette skiltet.",
          });
        }
        
        if (response.status === 401 || response.status === 403) {
           throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Tilgang til Vegvesenet feilet (API-nøkkel).",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Feil fra Vegvesenet: ${response.status}`,
        });
      }

      const data = await response.json();
      
      // Validate structure
      if (!data || !data.kjoretoydataListe || data.kjoretoydataListe.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ingen data funnet for dette skiltet.",
        });
      }

      const vehicle = data.kjoretoydataListe[0];
      const godkjenning = vehicle.godkjenning;
      const tekniskGodkjenning = godkjenning?.tekniskGodkjenning;
      const tekniskeData = tekniskGodkjenning?.tekniskeData;

      const result = {
        licensePlate: cleanedPlate,
        make: tekniskeData?.generelt?.merke?.[0]?.merke || "Ukjent",
        model: tekniskeData?.generelt?.handelsbetegnelse?.[0] || "Ukjent",
        year: godkjenning?.forstegangsGodkjenning?.forstegangRegistrertDato?.split("-")[0] || "Ukjent",
        vin: vehicle.kjoretoyId?.understellsnummer || "",
        color: tekniskeData?.karosseriOgLasteplan?.farge?.[0]?.kodeNavn || "Ukjent",
        registrationDate: godkjenning?.forstegangsGodkjenning?.forstegangRegistrertDato || null,
        vehicleType: tekniskGodkjenning?.kjoretoyklassifisering?.beskrivelse || "Ukjent",
        weight: tekniskeData?.vekter?.egenvekt || null,
      };

      // Cache result
      vehicleCache.set(cleanedPlate, {
        data: result,
        timestamp: Date.now(),
      });
      
      return result;

    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      console.error("[Vehicle Search] Unexpected error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "En uventet feil oppstod under søket.",
      });
    }
  });

export default vehicleSearchProcedure;
