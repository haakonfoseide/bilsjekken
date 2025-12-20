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
  .query(async ({ input, ctx }) => {
    const startTime = Date.now();
    const requestId = (ctx as any)?.requestId ?? "(no-request-id)";

    console.log("[Vehicle Search] --------------------------------------------------");
    console.log("[Vehicle Search] requestId:", requestId);
    try {
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
      const envApiKey = process.env.VEGVESEN_API_KEY || process.env.EXPO_PUBLIC_VEGVESEN_API_KEY;
      console.log("[Vehicle Search] Has API key:", Boolean(envApiKey));
      if (!envApiKey) {
        console.error("[Vehicle Search] CRITICAL: Missing Vegvesenet API Key");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Systemfeil: Mangler konfigurasjon for kjøretøyoppslag.",
        });
      }

      const apiKey = envApiKey.startsWith("Apikey ") ? envApiKey : `Apikey ${envApiKey}`;

      // 4. Call External API
      // Using the Enkeltoppslag API (Production URL)
      const apiUrl = "https://www.vegvesen.no/ws/no/vegvesen/kjoretoy/felles/datautlevering/enkeltoppslag/kjoretoydata";
      const params = new URLSearchParams({ kjennemerke: cleanedPlate });
      const fullUrl = `${apiUrl}?${params.toString()}`;

      console.log(`[Vehicle Search] Fetching from Vegvesenet: ${apiUrl}`);
      console.log("[Vehicle Search] Full URL:", fullUrl);

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          "SVV-Authorization": apiKey,
          Accept: "application/json",
          "x-rork-request-id": requestId,
        },
      });

      console.log(`[Vehicle Search] Response status: ${response.status}`);
      console.log("[Vehicle Search] Response content-type:", response.headers.get("content-type"));

      // Handle 204 No Content (Found but empty/no data)
      if (response.status === 204) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Fant ingen kjøretøy med dette registreringsnummeret.",
        });
      }

      // 5. Handle Response
      if (!response.ok) {
        let errorText = await response.text().catch(() => "No error text");
        console.error(`[Vehicle Search] API Error: ${response.status} - ${errorText.substring(0, 1200)}`);

        if (response.status === 404) {
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

      let data: any = null;
      try {
        data = await response.json();
      } catch (e) {
        const raw = await response.text().catch(() => "");
        console.error("[Vehicle Search] Failed to parse JSON from Vegvesenet", {
          status: response.status,
          contentType: response.headers.get("content-type"),
          bodyPreview: raw.substring(0, 1200),
        });
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Ugyldig svar fra Vegvesenet (ikke JSON).",
          cause: e,
        });
      }

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
      console.log("[Vehicle Search] Mapping data...");

      const teknisk = vehicle.godkjenning?.tekniskGodkjenning?.tekniskeData;
      const generelt = teknisk?.generelt;
      const karosseri = teknisk?.karosseriOgLasteplan;
      const godkjenning = vehicle.godkjenning?.forstegangsGodkjenning;
      const vekter = teknisk?.vekter;
      const periodiskKjoretoyKontroll = vehicle.periodiskKjoretoyKontroll;
      const nextEuControl = periodiskKjoretoyKontroll?.kontrollfrist;
      const lastEuControl = periodiskKjoretoyKontroll?.sistGodkjent;

      const motorOgDrivverk = teknisk?.motorOgDrivverk;
      const motor = motorOgDrivverk?.motor?.[0];
      const drivstoff = motor?.drivstoff?.[0];
      const miljo = teknisk?.miljodata;
      const miljoKilde = miljo?.miljodataWLTP ?? miljo?.miljodataNEDC ?? miljo;
      const seter = teknisk?.personOgLast?.sitteplasserAntall ?? teknisk?.personOgLast?.sitteplasser ?? teknisk?.personOgLast?.antallSitteplasser;
      const dorAntall = teknisk?.karosseriOgLasteplan?.dorerAntall ?? teknisk?.karosseriOgLasteplan?.antallDorer;
      const tilhenger = teknisk?.tilhengerkopling;
      const gir = motorOgDrivverk?.girKasse;
      const drivlinje = motorOgDrivverk?.drivlinje;

      console.log("[Vehicle Search] Technical keys:", {
        tekniskKeys: Object.keys(teknisk || {}),
        motorKeys: Object.keys(motor || {}),
        miljoKeys: Object.keys(miljo || {}),
      });

      console.log("[Vehicle Search] PKK data:", JSON.stringify(periodiskKjoretoyKontroll, null, 2));

      const toIntOrNull = (value: unknown): number | null => {
        if (value === null || value === undefined) return null;
        if (typeof value === "number") return Number.isFinite(value) ? Math.trunc(value) : null;
        const cleaned = String(value).replace(/[^0-9]/g, "");
        if (!cleaned) return null;
        const parsed = parseInt(cleaned, 10);
        return Number.isFinite(parsed) ? parsed : null;
      };

      const toIsoOrNull = (value: unknown): string | null => {
        if (!value) return null;
        const d = new Date(String(value));
        const ms = d.getTime();
        if (!Number.isFinite(ms)) return null;
        return d.toISOString();
      };

      const getMileageDateRaw = (item: any): unknown =>
        item?.maalingDato ??
        item?.maalingdato ??
        item?.maalingsDato ??
        item?.maalingsdato ??
        item?.avlestDato ??
        item?.dato ??
        item?.registrertDato ??
        item?.registreringsdato ??
        item?.tidspunkt ??
        item?.kontrollTidspunkt;

      const getMileageValueRaw = (item: any): unknown =>
        item?.kilometerstand ??
        item?.kmStand ??
        item?.maalestand ??
        item?.kjorelengde ??
        item?.kjoreLengde ??
        item?.avlestKjorelengde ??
        item?.avlestKjorelengdeKm ??
        item?.avlestKjorelengdeKilometer ??
        item?.kilometer ??
        item?.km;

      const normalizeToArray = (maybeArray: unknown): any[] => {
        if (!maybeArray) return [];
        if (Array.isArray(maybeArray)) return maybeArray as any[];
        return [maybeArray];
      };

      const extractMileageMeasurements = (vvVehicle: any): any[] => {
        const candidates: unknown[] = [
          vvVehicle?.kjorelengdeMaalinger?.kjorelengdeMaaling,
          vvVehicle?.kjorelengdeMaalinger,
          vvVehicle?.kjorelengdeMalinger?.kjorelengdeMaling,
          vvVehicle?.kjorelengdeMalinger,
          vvVehicle?.kjorelengdeMaaling?.kjorelengdeMaaling,
          vvVehicle?.kjorelengdeMaaling,
        ];

        for (const c of candidates) {
          const arr = normalizeToArray(c);
          const filtered = arr.filter((it) => typeof it === "object" && it !== null);
          if (filtered.length > 0) return filtered;
        }

        const found: any[] = [];
        const seen = new Set<any>();

        const walk = (node: any, depth: number) => {
          if (!node || depth > 6) return;
          if (seen.has(node)) return;
          if (typeof node !== "object") return;
          seen.add(node);

          if (Array.isArray(node)) {
            for (const item of node) walk(item, depth + 1);
            return;
          }

          const hasMileage = toIntOrNull(getMileageValueRaw(node)) !== null;
          const hasDate = toIsoOrNull(getMileageDateRaw(node)) !== null;
          const maybeLooksLikeMileage = hasMileage && hasDate;
          if (maybeLooksLikeMileage) {
            found.push(node);
          }

          for (const key of Object.keys(node)) {
            walk(node[key], depth + 1);
          }
        };

        walk(vvVehicle, 0);
        return found;
      };

      const kjorelengder = extractMileageMeasurements(vehicle);

      const firstMileageKeys = kjorelengder[0] ? Object.keys(kjorelengder[0]) : [];
      console.log(`[Vehicle Search] Found ${kjorelengder.length} mileage entries. First keys:`, firstMileageKeys);
      if (kjorelengder.length === 0) {
        console.log("[Vehicle Search] Mileage debug keys on vehicle:", Object.keys(vehicle || {}));
      }

      const normalizedMileageHistory = kjorelengder
        .map((item: any) => {
          const mileage = toIntOrNull(getMileageValueRaw(item));
          const dateIso = toIsoOrNull(getMileageDateRaw(item));
          if (mileage === null || dateIso === null) return null;
          return { mileage, date: dateIso, source: "vegvesen" as const };
        })
        .filter(Boolean) as { mileage: number; date: string; source: "vegvesen" }[];

      normalizedMileageHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const sisteKjorelengde = normalizedMileageHistory.length > 0 ? normalizedMileageHistory[0] : null;
      const mileageHistory = normalizedMileageHistory;

      const registeredMileage = sisteKjorelengde?.mileage ?? null;
      const registeredMileageDate = sisteKjorelengde?.date ?? null;

      const toNumberOrNull = (value: unknown): number | null => {
        if (value === null || value === undefined) return null;
        if (typeof value === "number") return Number.isFinite(value) ? value : null;
        const cleaned = String(value).replace(/[^0-9.,-]/g, "");
        if (!cleaned) return null;
        const normalized = cleaned.replace(/,/g, ".");
        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : null;
      };

      const co2Emission =
        toNumberOrNull(miljoKilde?.co2UtslippBlandetKjoring) ??
        toNumberOrNull(miljoKilde?.co2Utslipp) ??
        toNumberOrNull(miljoKilde?.co2) ??
        null;

      const engineDisplacement =
        toNumberOrNull(motor?.slagvolum) ??
        toNumberOrNull(motor?.slagvolumCm3) ??
        toNumberOrNull(motor?.slagvolumcc) ??
        null;

      const transmission =
        gir?.girKasseType?.navn ??
        gir?.girkasseType?.navn ??
        gir?.type?.navn ??
        gir?.type ??
        null;

      const driveType =
        drivlinje?.driftstype?.navn ??
        drivlinje?.driftstype ??
        motorOgDrivverk?.hjuldrift?.navn ??
        motorOgDrivverk?.hjuldrift ??
        null;

      const totalWeight =
        toIntOrNull(vekter?.tillattTotalvekt) ??
        toIntOrNull(vekter?.totalvekt) ??
        null;

      const maxTowWeight =
        toIntOrNull(tilhenger?.tillattTilhengervektBrems) ??
        toIntOrNull(tilhenger?.maksTilhengervektBrems) ??
        toIntOrNull(tilhenger?.tillattTilhengervekt) ??
        null;

      const numberOfSeats = toIntOrNull(seter);
      const numberOfDoors = toIntOrNull(dorAntall);

      const buildField = (label: string, value: unknown, unit?: string) => {
        if (value === null || value === undefined) return null;
        const str = String(value).trim();
        if (!str) return null;
        return { label, value: str, unit };
      };

      const buildSection = (title: string, fields: ReturnType<typeof buildField>[]) => {
        const filtered = fields.filter(Boolean) as { label: string; value: string; unit?: string }[];
        if (filtered.length === 0) return null;
        return { title, fields: filtered };
      };

      const registrationDateRaw = godkjenning?.forstegangRegistrertDato || null;

      const euKontrollSection = buildSection("EU-kontroll", [
        buildField("Sist godkjent", lastEuControl || null),
        buildField("Kontrollfrist", nextEuControl || null),
      ]);

      const registreringsdataSection = buildSection("Registreringsdata", [
        buildField("Kjennemerke", vehicle.kjoretoyId?.kjennemerke || cleanedPlate),
        buildField("Merke", generelt?.merke?.[0]?.merke || null),
        buildField("Modell", generelt?.handelsbetegnelse?.[0] || null),
        buildField("Årsmodell", godkjenning?.forstegangRegistrertDato?.split("-")[0] || null),
        buildField("Førstegangsregistrert", registrationDateRaw),
        buildField("VIN", vehicle.kjoretoyId?.understellsnummer || null),
        buildField("Farge", karosseri?.farge?.[0]?.kodeNavn || null),
        buildField(
          "Kjøretøytype",
          vehicle.godkjenning?.tekniskGodkjenning?.kjoretoyklassifisering?.beskrivelse || null
        ),
      ]);

      const utslippSection = buildSection("Utslipp", [
        buildField("Drivstoff", drivstoff?.drivstoffKode?.navn || null),
        buildField("CO₂", co2Emission, "g/km"),
      ]);

      const malOgVektSection = buildSection("Mål og vekt", [
        buildField("Egenvekt", vekter?.egenvekt ?? null, "kg"),
        buildField("Tillatt totalvekt", totalWeight, "kg"),
        buildField("Tilhengervekt (brems)", maxTowWeight, "kg"),
        buildField("Seter", numberOfSeats),
        buildField("Dører", numberOfDoors),
      ]);

      const motorKraftSection = buildSection("Motor / kraftoverføring", [
        buildField("Effekt", drivstoff?.maksNettoEffekt ?? null, "kW"),
        buildField("Slagvolum", engineDisplacement, "cm³"),
        buildField("Drivlinje", driveType),
        buildField("Gir", transmission),
      ]);

      const dekkFelgSection = buildSection("Dekk og felg", [
        buildField("(ikke tilgjengelig i enkeltoppslag)", "Legges inn manuelt"),
      ]);

      const result = {
        licensePlate: vehicle.kjoretoyId?.kjennemerke || cleanedPlate,
        make: generelt?.merke?.[0]?.merke || "Ukjent",
        model: generelt?.handelsbetegnelse?.[0] || "Ukjent",
        year: godkjenning?.forstegangRegistrertDato?.split("-")[0] || "Ukjent",
        vin: vehicle.kjoretoyId?.understellsnummer || "",
        color: karosseri?.farge?.[0]?.kodeNavn || "Ukjent",
        registrationDate: registrationDateRaw,
        vehicleType: vehicle.godkjenning?.tekniskGodkjenning?.kjoretoyklassifisering?.beskrivelse || "Ukjent",
        weight: vekter?.egenvekt || null,
        totalWeight,
        power: drivstoff?.maksNettoEffekt ?? null,
        fuelType: drivstoff?.drivstoffKode?.navn || "Ukjent",
        co2Emission,
        engineDisplacement,
        transmission,
        driveType,
        numberOfSeats,
        numberOfDoors,
        maxTowWeight,
        registeredMileage: registeredMileage,
        registeredMileageDate: registeredMileageDate,
        mileageHistory,
        euControlDate: lastEuControl || null,
        nextEuControlDate: nextEuControl || null,
        vehicleSections: {
          euKontroll: euKontrollSection || undefined,
          registreringsdata: registreringsdataSection || undefined,
          utslipp: utslippSection || undefined,
          malOgVekt: malOgVektSection || undefined,
          motorKraftoverforing: motorKraftSection || undefined,
          dekkOgFelg: dekkFelgSection || undefined,
        },
      };

      console.log(`[Vehicle Search] Success! Found: ${result.make} ${result.model}`);
      console.log("[Vehicle Search] durationMs:", Date.now() - startTime);
      console.log("[Vehicle Search] requestId:", requestId);

      // 8. Cache Success
      vehicleCache.set(cleanedPlate, {
        data: result,
        timestamp: Date.now(),
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Vehicle Search] Failed after ${duration}ms. requestId=${requestId}`, error);
      
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Det oppstod en uventet feil under søket.",
        cause: error,
      });
    }
  });
