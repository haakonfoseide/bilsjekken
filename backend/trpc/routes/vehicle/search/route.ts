import { publicProcedure } from "../../../create-context";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { VehicleSearchResult } from "@/lib/api-types";

// Simple in-memory cache
const vehicleCache = new Map<string, { data: VehicleSearchResult; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const vehicleSearchSchema = z.object({
  licensePlate: z.string().min(1),
});

export default publicProcedure
  .input(vehicleSearchSchema)
  .query(async ({ input, ctx }) => {
    const startTime = Date.now();
    const requestId = ctx.requestId ?? "(no-request-id)";

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
      // In hosted environments, private env vars might not be present.
      // We therefore also accept a key forwarded from the client (EXPO_PUBLIC_VEGVESEN_API_KEY)
      // via header to avoid breaking lookups in production builds.
      const headerKeyRaw = ctx.req?.headers?.get?.("x-vegvesen-api-key") ?? null;
      const envApiKey = process.env.VEGVESEN_API_KEY || process.env.EXPO_PUBLIC_VEGVESEN_API_KEY;
      const resolvedKeyRaw = headerKeyRaw || envApiKey;

      console.log("[Vehicle Search] Has API key:", Boolean(resolvedKeyRaw), {
        from: headerKeyRaw ? "header" : envApiKey ? "env" : "missing",
      });

      if (!resolvedKeyRaw) {
        console.error("[Vehicle Search] CRITICAL: Missing Vegvesenet API Key");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Systemfeil: Mangler konfigurasjon for kjøretøyoppslag.",
        });
      }

      const apiKey = resolvedKeyRaw.startsWith("Apikey ") ? resolvedKeyRaw : `Apikey ${resolvedKeyRaw}`;

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

      let data: unknown = null;
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
      // Type guard for Vegvesenet API response structure
      const isValidResponse = (d: unknown): d is { kjoretoydataListe?: unknown[] } => {
        return typeof d === "object" && d !== null;
      };

      if (!isValidResponse(data) || !data.kjoretoydataListe || data.kjoretoydataListe.length === 0) {
        console.log("[Vehicle Search] Valid JSON but no vehicle list found");
        console.log("[Vehicle Search] Response structure:", {
          hasData: !!data,
          hasListe: !!(data && isValidResponse(data) && data.kjoretoydataListe),
          keys: data && isValidResponse(data) ? Object.keys(data) : [],
        });
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ingen kjøretøydata funnet.",
        });
      }

      const vehicle = data.kjoretoydataListe[0];
      
      // Type guard for vehicle object
      if (!vehicle || typeof vehicle !== "object") {
        console.error("[Vehicle Search] Invalid vehicle object structure");
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Ugyldig kjøretøydata-struktur fra Vegvesenet.",
        });
      }
      
      // 7. Map Data
      console.log("[Vehicle Search] Mapping data...");
      console.log("[Vehicle Search] Vehicle keys:", Object.keys(vehicle));

      const vehicleObj = vehicle as Record<string, unknown>;
      const teknisk = (vehicleObj?.godkjenning as { tekniskGodkjenning?: { tekniskeData?: unknown } } | undefined)?.tekniskGodkjenning?.tekniskeData as {
        generelt?: unknown;
        karosseriOgLasteplan?: unknown;
        vekter?: unknown;
        motorOgDrivverk?: unknown;
        miljodata?: unknown;
        personOgLast?: unknown;
        tilhengerkopling?: unknown;
        hjulOgDekk?: unknown;
        dekkOgFelg?: unknown;
      } | undefined;
      const generelt = teknisk?.generelt as { merke?: { merke?: string }[]; handelsbetegnelse?: string[] } | undefined;
      const karosseri = teknisk?.karosseriOgLasteplan as {
        farge?: { kodeNavn?: string; kodeBeskrivelse?: string; kodeVerdi?: string; navn?: string }[];
        dorerAntall?: unknown;
        antallDorer?: unknown;
        lengde?: unknown;
        bredde?: unknown;
        hoyde?: unknown;
      } | undefined;

      // Extract color with multiple fallback paths
      const extractColor = (): string | null => {
        const fargeArray = karosseri?.farge;
        if (!fargeArray || !Array.isArray(fargeArray) || fargeArray.length === 0) {
          console.log("[Vehicle Search] No farge array found", { karosseriKeys: Object.keys(karosseri || {}) });
          return null;
        }
        const fargeObj = fargeArray[0];
        if (typeof fargeObj === 'string') return fargeObj;
        if (typeof fargeObj === 'object' && fargeObj) {
          const colorValue = fargeObj.kodeNavn || fargeObj.kodeBeskrivelse || fargeObj.navn || fargeObj.kodeVerdi || null;
          console.log("[Vehicle Search] Farge object:", JSON.stringify(fargeObj), "-> extracted:", colorValue);
          return colorValue;
        }
        return null;
      };
      const extractedColor = extractColor();
      const godkjenning = (vehicleObj?.godkjenning as { forstegangsGodkjenning?: { forstegangRegistrertDato?: string } } | undefined)?.forstegangsGodkjenning;
      const vekter = teknisk?.vekter as {
        egenvekt?: unknown;
        tillattTotalvekt?: unknown;
        totalvekt?: unknown;
        nyttelast?: unknown;
        tillattLastevekt?: unknown;
      } | undefined;
      const periodiskKjoretoyKontroll = vehicleObj?.periodiskKjoretoyKontroll as { kontrollfrist?: string; sistGodkjent?: string } | undefined;

      const registreringTyped = (vehicleObj as { registrering?: unknown } | undefined)?.registrering as
        | {
            status?: { navn?: string } | string;
            registreringsstatus?: { navn?: string } | string;
          }
        | undefined;
      const registrationStatusRaw =
        (typeof registreringTyped?.status === "object" ? registreringTyped?.status?.navn : registreringTyped?.status) ??
        (typeof registreringTyped?.registreringsstatus === "object"
          ? registreringTyped?.registreringsstatus?.navn
          : registreringTyped?.registreringsstatus) ??
        null;
      const nextEuControl = periodiskKjoretoyKontroll?.kontrollfrist;
      const lastEuControl = periodiskKjoretoyKontroll?.sistGodkjent;

      const motorOgDrivverkTyped = teknisk?.motorOgDrivverk as {
        motor?: {
          slagvolum?: unknown;
          slagvolumCm3?: unknown;
          slagvolumcc?: unknown;
          drivstoff?: {
            drivstoffKode?: { kodeNavn?: string; kodeBeskrivelse?: string; kodeVerdi?: string; navn?: string };
            maksNettoEffekt?: unknown;
          }[];
        }[];
        girKasse?: {
          girKasseType?: { navn?: string };
          girkasseType?: { navn?: string };
          type?: { navn?: string } | string;
        };
        drivlinje?: {
          driftstype?: { navn?: string } | string;
        };
        hjuldrift?: { navn?: string } | string;
      } | undefined;
      const motor = motorOgDrivverkTyped?.motor?.[0];
      const drivstoff = motor?.drivstoff?.[0];

      // Extract fuel type with multiple fallback paths
      const extractFuelType = (): string | null => {
        const drivstoffKode = drivstoff?.drivstoffKode;
        if (!drivstoffKode) {
          console.log("[Vehicle Search] No drivstoffKode found", { 
            motorKeys: Object.keys(motor || {}),
            drivstoffKeys: Object.keys(drivstoff || {})
          });
          return null;
        }
        if (typeof drivstoffKode === 'string') return drivstoffKode;
        if (typeof drivstoffKode === 'object') {
          const fuelValue = drivstoffKode.kodeNavn || drivstoffKode.kodeBeskrivelse || drivstoffKode.navn || drivstoffKode.kodeVerdi || null;
          console.log("[Vehicle Search] DrivstoffKode object:", JSON.stringify(drivstoffKode), "-> extracted:", fuelValue);
          return fuelValue;
        }
        return null;
      };
      const extractedFuelType = extractFuelType();
      const miljoTyped = teknisk?.miljodata as {
        miljodataWLTP?: {
          co2UtslippBlandetKjoring?: unknown;
          co2Utslipp?: unknown;
          co2?: unknown;
          nox?: unknown;
          noxUtslipp?: unknown;
          noxUtslippBlandetKjoring?: unknown;
        };
        miljodataNEDC?: {
          co2UtslippBlandetKjoring?: unknown;
          co2Utslipp?: unknown;
          co2?: unknown;
          nox?: unknown;
          noxUtslipp?: unknown;
          noxUtslippBlandetKjoring?: unknown;
        };
        co2UtslippBlandetKjoring?: unknown;
        co2Utslipp?: unknown;
        co2?: unknown;
        nox?: unknown;
        noxUtslipp?: unknown;
        euroKlasse?: { navn?: string } | string;
      } | undefined;
      const miljoKilde = miljoTyped?.miljodataWLTP ?? miljoTyped?.miljodataNEDC ?? miljoTyped;
      const personOgLastTyped = teknisk?.personOgLast as {
        sitteplasserAntall?: unknown;
        sitteplasser?: unknown;
        antallSitteplasser?: unknown;
      } | undefined;
      const seter = personOgLastTyped?.sitteplasserAntall ?? personOgLastTyped?.sitteplasser ?? personOgLastTyped?.antallSitteplasser;
      const dorAntall = karosseri?.dorerAntall ?? karosseri?.antallDorer;
      const tilhengerTyped = teknisk?.tilhengerkopling as {
        tillattTilhengervektBrems?: unknown;
        maksTilhengervektBrems?: unknown;
        tillattTilhengervekt?: unknown;
      } | undefined;
      const gir = motorOgDrivverkTyped?.girKasse;
      const drivlinje = motorOgDrivverkTyped?.drivlinje;

      console.log("[Vehicle Search] Technical keys:", {
        tekniskKeys: Object.keys(teknisk || {}),
        motorKeys: Object.keys(motor || {}),
        miljoKeys: Object.keys(miljoTyped || {}),
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

      const getMileageDateRaw = (item: Record<string, unknown>): unknown =>
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

      const getMileageValueRaw = (item: Record<string, unknown>): unknown =>
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

      const normalizeToArray = (maybeArray: unknown): unknown[] => {
        if (!maybeArray) return [];
        if (Array.isArray(maybeArray)) return maybeArray;
        return [maybeArray];
      };

      const extractMileageMeasurements = (vvVehicle: Record<string, unknown>): Record<string, unknown>[] => {
        const vehicleTyped = vvVehicle as {
          kjorelengdeMaalinger?: { kjorelengdeMaaling?: unknown } | unknown;
          kjorelengdeMalinger?: { kjorelengdeMaling?: unknown } | unknown;
          kjorelengdeMaaling?: { kjorelengdeMaaling?: unknown } | unknown;
        };
        
        const candidates: unknown[] = [
          (vehicleTyped?.kjorelengdeMaalinger as { kjorelengdeMaaling?: unknown } | undefined)?.kjorelengdeMaaling,
          vehicleTyped?.kjorelengdeMaalinger,
          (vehicleTyped?.kjorelengdeMalinger as { kjorelengdeMaling?: unknown } | undefined)?.kjorelengdeMaling,
          vehicleTyped?.kjorelengdeMalinger,
          (vehicleTyped?.kjorelengdeMaaling as { kjorelengdeMaaling?: unknown } | undefined)?.kjorelengdeMaaling,
          vehicleTyped?.kjorelengdeMaaling,
        ];

        for (const c of candidates) {
          const arr = normalizeToArray(c);
          const filtered = arr.filter((it): it is Record<string, unknown> => typeof it === "object" && it !== null);
          if (filtered.length > 0) return filtered;
        }

        const found: Record<string, unknown>[] = [];
        const seen = new Set<unknown>();

        const walk = (node: unknown, depth: number) => {
          if (!node || depth > 6) return;
          if (seen.has(node)) return;
          if (typeof node !== "object") return;
          seen.add(node);

          if (Array.isArray(node)) {
            for (const item of node) walk(item, depth + 1);
            return;
          }

          const hasMileage = toIntOrNull(getMileageValueRaw(node as Record<string, unknown>)) !== null;
          const hasDate = toIsoOrNull(getMileageDateRaw(node as Record<string, unknown>)) !== null;
          const maybeLooksLikeMileage = hasMileage && hasDate;
          if (maybeLooksLikeMileage) {
            found.push(node as Record<string, unknown>);
          }

          const nodeObj = node as Record<string, unknown>;
          for (const key of Object.keys(nodeObj)) {
            walk(nodeObj[key], depth + 1);
          }
        };

        walk(vvVehicle, 0);
        return found;
      };

      const kjorelengder = extractMileageMeasurements(vehicleObj);

      const firstMileageKeys = kjorelengder[0] ? Object.keys(kjorelengder[0]) : [];
      console.log(`[Vehicle Search] Found ${kjorelengder.length} mileage entries. First keys:`, firstMileageKeys);
      if (kjorelengder.length === 0) {
        console.log("[Vehicle Search] Mileage debug keys on vehicle:", Object.keys(vehicle || {}));
      }

      const normalizedMileageHistory = kjorelengder
        .map((item: Record<string, unknown>) => {
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

      const deepCollectStrings = (node: unknown, maxDepth = 6): string[] => {
        const out: string[] = [];
        const seen = new Set<unknown>();

        const walk = (n: unknown, depth: number) => {
          if (!n || depth > maxDepth) return;
          if (seen.has(n)) return;
          if (typeof n === "string") {
            const s = n.trim();
            if (s) out.push(s);
            return;
          }
          if (typeof n !== "object") return;
          seen.add(n);

          if (Array.isArray(n)) {
            for (const item of n) walk(item, depth + 1);
            return;
          }

          const obj = n as Record<string, unknown>;
          for (const k of Object.keys(obj)) {
            walk(obj[k], depth + 1);
          }
        };

        walk(node, 0);
        return out;
      };

      const miljoKildeTyped = miljoKilde as {
        co2UtslippBlandetKjoring?: unknown;
        co2Utslipp?: unknown;
        co2?: unknown;
        nox?: unknown;
        noxUtslipp?: unknown;
        noxUtslippBlandetKjoring?: unknown;
      } | undefined;
      const co2Emission =
        toNumberOrNull(miljoKildeTyped?.co2UtslippBlandetKjoring) ??
        toNumberOrNull(miljoKildeTyped?.co2Utslipp) ??
        toNumberOrNull(miljoKildeTyped?.co2) ??
        null;

      const noxEmission =
        toNumberOrNull(miljoKildeTyped?.noxUtslippBlandetKjoring) ??
        toNumberOrNull(miljoKildeTyped?.noxUtslipp) ??
        toNumberOrNull(miljoKildeTyped?.nox) ??
        null;

      const euroClassRaw =
        (typeof miljoTyped?.euroKlasse === "object" ? miljoTyped?.euroKlasse?.navn : miljoTyped?.euroKlasse) ?? null;
      const euroClass = typeof euroClassRaw === "string" ? euroClassRaw : null;

      const engineDisplacement =
        toNumberOrNull(motor?.slagvolum) ??
        toNumberOrNull(motor?.slagvolumCm3) ??
        toNumberOrNull(motor?.slagvolumcc) ??
        null;

      const girTyped = gir as { girKasseType?: { navn?: string }; girkasseType?: { navn?: string }; type?: { navn?: string } | string } | undefined;
      const transmission =
        girTyped?.girKasseType?.navn ??
        girTyped?.girkasseType?.navn ??
        (typeof girTyped?.type === "object" ? girTyped.type?.navn : girTyped?.type) ??
        null;

      const drivlinjeTyped = drivlinje as { driftstype?: { navn?: string } | string } | undefined;
      const driveTypeRaw =
        (typeof drivlinjeTyped?.driftstype === "object" ? drivlinjeTyped.driftstype?.navn : drivlinjeTyped?.driftstype) ??
        (motorOgDrivverkTyped?.hjuldrift && typeof motorOgDrivverkTyped.hjuldrift === "object" ? motorOgDrivverkTyped.hjuldrift.navn : motorOgDrivverkTyped?.hjuldrift) ??
        null;
      const driveType = typeof driveTypeRaw === "string" ? driveTypeRaw : (driveTypeRaw && typeof driveTypeRaw === "object" ? driveTypeRaw.navn : null);

      const totalWeight =
        toIntOrNull(vekter?.tillattTotalvekt) ??
        toIntOrNull(vekter?.totalvekt) ??
        null;

      const maxTowWeight =
        toIntOrNull(tilhengerTyped?.tillattTilhengervektBrems) ??
        toIntOrNull(tilhengerTyped?.maksTilhengervektBrems) ??
        toIntOrNull(tilhengerTyped?.tillattTilhengervekt) ??
        null;

      const lengthMm = toIntOrNull(karosseri?.lengde);
      const widthMm = toIntOrNull(karosseri?.bredde);

      const payload =
        toIntOrNull(vekter?.nyttelast) ??
        toIntOrNull(vekter?.tillattLastevekt) ??
        (totalWeight !== null && toIntOrNull(vekter?.egenvekt) !== null
          ? totalWeight - (toIntOrNull(vekter?.egenvekt) as number)
          : null);

      const powerKw = typeof drivstoff?.maksNettoEffekt === "number" ? drivstoff.maksNettoEffekt : toNumberOrNull(drivstoff?.maksNettoEffekt);
      const powerHp = powerKw !== null ? Math.round(powerKw * 1.35962) : null;

      const tireDimensionRegex = /\b\d{3}\/\d{2}R\d{2}\b/i;
      const tireCandidates = deepCollectStrings(teknisk?.hjulOgDekk ?? teknisk?.dekkOgFelg ?? teknisk).filter((s) => tireDimensionRegex.test(s));
      const frontTire = tireCandidates[0] ?? null;
      const rearTire = tireCandidates[1] ?? null;

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

      const kjoretoyId = vehicleObj?.kjoretoyId as { kjennemerke?: string; understellsnummer?: string } | undefined;
      const godkjenningFull = vehicleObj?.godkjenning as {
        tekniskGodkjenning?: {
          kjoretoyklassifisering?: { beskrivelse?: string };
        };
      } | undefined;

      const registreringsdataSection = buildSection("Registreringsdata", [
        buildField("Kjennemerke", kjoretoyId?.kjennemerke || cleanedPlate),
        buildField("Merke", generelt?.merke?.[0]?.merke || null),
        buildField("Modell", generelt?.handelsbetegnelse?.[0] || null),
        buildField("Årsmodell", godkjenning?.forstegangRegistrertDato?.split("-")[0] || null),
        buildField("Førstegangsregistrert", registrationDateRaw),
        buildField("Status", registrationStatusRaw),
        buildField("VIN", kjoretoyId?.understellsnummer || null),
        buildField("Farge", extractedColor),
        buildField(
          "Kjøretøytype",
          godkjenningFull?.tekniskGodkjenning?.kjoretoyklassifisering?.beskrivelse || null
        ),
      ]);

      const utslippSection = buildSection("Miljødata", [
        buildField("Drivstoff", extractedFuelType),
        buildField("CO₂", co2Emission, "g/km"),
        buildField("NOx", noxEmission, "mg/km"),
        buildField("Euro-klasse", euroClass),
      ]);

      const malOgVektSection = buildSection("Mål og vekt", [
        buildField("Lengde", lengthMm, "mm"),
        buildField("Bredde", widthMm, "mm"),
        buildField("Egenvekt", vekter?.egenvekt ?? null, "kg"),
        buildField("Tillatt totalvekt", totalWeight, "kg"),
        buildField("Nyttelast", payload, "kg"),
        buildField("Tilhengervekt (brems)", maxTowWeight, "kg"),
        buildField("Seter", numberOfSeats),
        buildField("Dører", numberOfDoors),
      ]);

      const motorKraftSection = buildSection("Motor / kraftoverføring", [
        buildField("Effekt", powerKw, "kW"),
        buildField("Effekt", powerHp, "hk"),
        buildField("Slagvolum", engineDisplacement, "cm³"),
        buildField("Drivlinje", driveType),
        buildField("Gir", transmission),
      ]);

      const dekkFelgSection = buildSection("Dekk og felg", [
        buildField("Foran", frontTire),
        buildField("Bak", rearTire),
        buildField("Merk", frontTire || rearTire ? "" : "(ikke tilgjengelig i enkeltoppslag)"),
      ]);

      const result = {
        licensePlate: kjoretoyId?.kjennemerke || cleanedPlate,
        make: generelt?.merke?.[0]?.merke || "Ukjent",
        model: generelt?.handelsbetegnelse?.[0] || "Ukjent",
        year: godkjenning?.forstegangRegistrertDato?.split("-")[0] || "Ukjent",
        vin: kjoretoyId?.understellsnummer || "",
        color: extractedColor || "Ukjent",
        registrationDate: registrationDateRaw ?? null,
        vehicleType: godkjenningFull?.tekniskGodkjenning?.kjoretoyklassifisering?.beskrivelse || "Ukjent",
        weight: typeof vekter?.egenvekt === "number" ? vekter.egenvekt : null,
        totalWeight,
        power: powerKw,
        fuelType: extractedFuelType || "Ukjent",
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
        registrationStatus: registrationStatusRaw,
        lengthMm,
        widthMm,
        payload,
        noxEmission,
        euroClass,
        tireDimensions: {
          front: frontTire,
          rear: rearTire,
        },
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
