import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Simple in-memory cache
const vehicleCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const vehicleSearchSchema = z.object({
  licensePlate: z.string().min(1),
});

export default publicProcedure
  .input(vehicleSearchSchema)
  .query(async ({ input }) => {
    const startTime = Date.now();
    try {
      // 1. Validate and clean input
      const cleanedPlate = input.licensePlate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      console.log(`[Vehicle Search] Starting search for plate: ${cleanedPlate}`);

      if (cleanedPlate.length < 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ugyldig registreringsnummer.",
        });
      }

      // 2. Check Cache
      const cached = vehicleCache.get(cleanedPlate);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Vehicle Search] Cache hit for ${cleanedPlate}`);
        return cached.data;
      }

      // 3. Get API Key
      const apiKey = process.env.VEGVESEN_API_KEY || process.env.EXPO_PUBLIC_VEGVESEN_API_KEY;
      if (!apiKey) {
        console.error("[Vehicle Search] CRITICAL: Missing Vegvesenet API Key");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Systemfeil: Mangler konfigurasjon for kjøretøyoppslag.",
        });
      }

      // 4. Call External API
      // Using the Enkeltoppslag API
      const apiUrl = "https://akfell-datautlevering.atlas.vegvesen.no/enkeltoppslag/kjoretoydata";
      const params = new URLSearchParams({ kjennemerke: cleanedPlate });
      const fullUrl = `${apiUrl}?${params.toString()}`;

      console.log(`[Vehicle Search] Fetching from Vegvesenet: ${apiUrl}`);

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "X-API-KEY": apiKey,
          "Accept": "application/json",
        },
      });

      console.log(`[Vehicle Search] Response status: ${response.status}`);

      // 5. Handle Response
      if (!response.ok) {
        let errorText = await response.text().catch(() => "No error text");
        console.error(`[Vehicle Search] API Error: ${response.status} - ${errorText}`);

        if (response.status === 404 || response.status === 204) {
           throw new TRPCError({
            code: "NOT_FOUND",
            message: "Fant ingen kjøretøy med dette registreringsnummeret.",
          });
        }

        if (response.status === 401 || response.status === 403) {
           throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Kunne ikke autentisere mot Vegvesenet. Vennligst kontakt support.",
          });
        }

        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `Feil mot Vegvesenet (Status: ${response.status})`,
        });
      }

      const data = await response.json();

      // 6. Validate Response Data
      if (!data || !data.kjoretoydataListe || data.kjoretoydataListe.length === 0) {
        console.log("[Vehicle Search] Valid JSON but no vehicle list found");
         throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ingen kjøretøydata funnet.",
        });
      }

      const vehicle = data.kjoretoydataListe[0];
      
      // 7. Map Data
      // Safely access nested properties
      const teknisk = vehicle.godkjenning?.tekniskGodkjenning?.tekniskeData;
      const generelt = teknisk?.generelt;
      const karosseri = teknisk?.karosseriOgLasteplan;
      const godkjenning = vehicle.godkjenning?.forstegangsGodkjenning;
      const vekter = teknisk?.vekter;

      const result = {
        licensePlate: vehicle.kjoretoyId?.kjennemerke || cleanedPlate,
        make: generelt?.merke?.[0]?.merke || "Ukjent",
        model: generelt?.handelsbetegnelse?.[0] || "Ukjent",
        year: godkjenning?.forstegangRegistrertDato?.split("-")[0] || "Ukjent",
        vin: vehicle.kjoretoyId?.understellsnummer || "",
        color: karosseri?.farge?.[0]?.kodeNavn || "Ukjent",
        registrationDate: godkjenning?.forstegangRegistrertDato || null,
        vehicleType: vehicle.godkjenning?.tekniskGodkjenning?.kjoretoyklassifisering?.beskrivelse || "Ukjent",
        weight: vekter?.egenvekt || null,
        power: teknisk?.motorOgDrivverk?.motor?.[0]?.drivstoff?.[0]?.maksNettoEffekt || null,
        fuelType: teknisk?.motorOgDrivverk?.motor?.[0]?.drivstoff?.[0]?.drivstoffKode?.navn || "Ukjent",
      };

      console.log(`[Vehicle Search] Success! Found: ${result.make} ${result.model}`);

      // 8. Cache Success
      vehicleCache.set(cleanedPlate, {
        data: result,
        timestamp: Date.now(),
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Vehicle Search] Failed after ${duration}ms`, error);
      
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Det oppstod en uventet feil under søket.",
        cause: error,
      });
    }
  });
