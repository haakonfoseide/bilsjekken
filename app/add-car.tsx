import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  Search, 
  CarFront, 
  Calendar, 
  Hash, 
  Info, 
  Gauge, 
  ShieldCheck, 
  ChevronRight,
  WifiOff,
  CheckCircle2,
  AlertCircle,
  FileKey,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as Network from "expo-network";
import { useCarData } from "@/contexts/car-context";
import Colors from "@/constants/colors";
import { trpcClient } from "@/lib/trpc";

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function AddCarScreen() {
  const router = useRouter();
  const { addCar } = useCarData();
  const insets = useSafeAreaInsets();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [insurance, setInsurance] = useState("");
  const [currentMileage, setCurrentMileage] = useState("");
  const [vin, setVin] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setIsOnline(state.isConnected ?? true);
      } catch {
        setIsOnline(true);
      }
    };
    
    checkNetwork();
    const interval = setInterval(checkNetwork, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async () => {
    const attemptId = `search_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const plateRaw = searchQuery;
    const plate = searchQuery.trim().replace(/\s+/g, "").toUpperCase();

    console.log("[AddCar][VehicleLookup] ------------------------------");
    console.log("[AddCar][VehicleLookup] attemptId:", attemptId);
    console.log("[AddCar][VehicleLookup] platform:", Platform.OS);
    console.log("[AddCar][VehicleLookup] isOnline:", isOnline);
    console.log("[AddCar][VehicleLookup] input.raw:", plateRaw);
    console.log("[AddCar][VehicleLookup] input.cleaned:", plate);

    if (!plate) {
      setSearchError("Skriv inn registreringsnummer");
      console.log("[AddCar][VehicleLookup] aborted: empty plate");
      return;
    }

    if (plate.length < 2) {
      setSearchError("For kort registreringsnummer");
      console.log("[AddCar][VehicleLookup] aborted: plate too short");
      return;
    }

    if (!isOnline) {
      console.log("[AddCar][VehicleLookup] aborted: offline");
      Alert.alert("Ingen nettverk", "Du må være på nett for å søke opp kjøretøy.");
      return;
    }

    setSearchError(null);
    setSearchSuccess(false);
    setIsSearching(true);
    Keyboard.dismiss();

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const startedAt = Date.now();

    try {
      console.log("[AddCar][VehicleLookup] calling trpc procedure: vehicleSearch.query");
      const data = await trpcClient.vehicleSearch.query({ licensePlate: plate });
      
      if (!isMounted.current) return;

      const durationMs = Date.now() - startedAt;
      console.log("[AddCar][VehicleLookup] success durationMs:", durationMs);
      console.log("[AddCar][VehicleLookup] result:", data);

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      if (data) {
        setMake(data.make || "");
        setModel(data.model || "");
        setYear(data.year || "");
        setLicensePlate(data.licensePlate || plate);
        setVin(data.vin || "");

        setSearchSuccess(true);

        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      const durationMs = Date.now() - startedAt;
      console.error("[AddCar][VehicleLookup] FAILED durationMs:", durationMs);
      console.error("[AddCar][VehicleLookup] raw error:", err);

      const trpcData = err?.data;
      const trpcShape = err?.shape;
      const httpStatus = trpcShape?.data?.httpStatus ?? trpcData?.httpStatus;
      const trpcCode = trpcShape?.data?.code ?? trpcData?.code;

      console.error("[AddCar][VehicleLookup] parsed:", {
        attemptId,
        message: err?.message,
        name: err?.name,
        httpStatus,
        trpcCode,
        shape: trpcShape,
        data: trpcData,
        cause: err?.cause,
        stack: err?.stack,
      });

      let msg = "Kunne ikke finne kjøretøyet.";

      if (trpcCode === "NOT_FOUND" || err?.message?.includes("NOT_FOUND")) {
        msg = "Fant ingen kjøretøy med dette nummeret.";
      } else if (trpcCode === "UNAUTHORIZED" || err?.message?.includes("UNAUTHORIZED")) {
        msg = "Tjenesten er midlertidig utilgjengelig (Auth).";
      } else if (httpStatus === 404 || err?.message?.includes("route not found")) {
        msg = "Backend-ruten ble ikke funnet (404). Se console logg for URL + RequestId.";
      } else if (httpStatus === 401 || httpStatus === 403) {
        msg = "Vegvesenet API-nøkkel mangler/er ugyldig. Se backend logg.";
      } else if (httpStatus === 429) {
        msg = "For mange forespørsler. Vent litt og prøv igjen.";
      }

      setSearchError(msg);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      if (isMounted.current) {
        setIsSearching(false);
      }
    }
  };

  const handleSave = () => {
    if (!make || !model || !licensePlate) {
      Alert.alert("Mangler info", "Bilmerke, modell og registreringsnummer er påkrevd.");
      return;
    }

    const mileageNum = parseInt(currentMileage.replace(/\D/g, "")) || 0;

    const carData = {
      make,
      model,
      year,
      licensePlate,
      insurance: insurance || "",
      currentMileage: mileageNum,
      vin,
    };

    addCar(carData);
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    Alert.alert("Bil lagt til", `${make} ${model} er nå lagt til i garasjen.`, [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: "Legg til bil",
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Avbryt</Text>
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, styles.headerButtonPrimary]}>Lagre</Text>
          </TouchableOpacity>
        ),
      }} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 20 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Search size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Søk opp kjøretøy</Text>
                <Text style={styles.cardSubtitle}>
                  Hent info automatisk fra Vegvesenet
                </Text>
              </View>
            </View>
            
            <View style={styles.searchRow}>
              <View style={styles.inputWrapper}>
                <View style={styles.plateContainer}>
                  <View style={styles.plateFlag}>
                    <Text style={styles.plateFlagText}>N</Text>
                  </View>
                  <TextInput
                    style={styles.plateInput}
                    placeholder="AB12345"
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      setSearchError(null);
                      setSearchSuccess(false);
                    }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={7}
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                  />
                </View>
              </View>
              
              <TouchableOpacity 
                style={[styles.searchButton, (!isOnline || isSearching) && styles.disabledButton]}
                onPress={handleSearch}
                disabled={!isOnline || isSearching}
              >
                {isSearching ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <ChevronRight color="#fff" size={24} />
                )}
              </TouchableOpacity>
            </View>

            {searchError && (
              <View style={styles.messageContainer}>
                <AlertCircle size={16} color={Colors.danger} />
                <Text style={styles.errorText}>{searchError}</Text>
              </View>
            )}
            
            {searchSuccess && (
              <View style={styles.messageContainer}>
                <CheckCircle2 size={16} color={Colors.primary} />
                <Text style={styles.successText}>Bil funnet! Fyll ut resten.</Text>
              </View>
            )}

            {!isOnline && (
              <View style={styles.messageContainer}>
                <WifiOff size={16} color={Colors.text.secondary} />
                <Text style={styles.offlineText}>Du er offline. Søk er deaktivert.</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionHeader}>Kjøretøyinformasjon</Text>

          <View style={styles.formCard}>
            <View style={styles.inputRow}>
              <CarFront size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Merke</Text>
                <TextInput
                  style={styles.textInput}
                  value={make}
                  onChangeText={setMake}
                  placeholder="Toyota"
                  placeholderTextColor={Colors.text.light}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <Hash size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Modell</Text>
                <TextInput
                  style={styles.textInput}
                  value={model}
                  onChangeText={setModel}
                  placeholder="Corolla"
                  placeholderTextColor={Colors.text.light}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <Calendar size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Årsmodell</Text>
                <TextInput
                  style={styles.textInput}
                  value={year}
                  onChangeText={setYear}
                  placeholder="2020"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.text.light}
                />
              </View>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <Info size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Registreringsnummer</Text>
                <TextInput
                  style={styles.textInput}
                  value={licensePlate}
                  onChangeText={setLicensePlate}
                  placeholder="AB12345"
                  autoCapitalize="characters"
                  placeholderTextColor={Colors.text.light}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <FileKey size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>VIN / Understellsnummer</Text>
                <TextInput
                  style={styles.textInput}
                  value={vin}
                  onChangeText={setVin}
                  placeholder="1HGBH41JXMN109186"
                  autoCapitalize="characters"
                  placeholderTextColor={Colors.text.light}
                />
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>Tilleggsinformasjon</Text>

          <View style={styles.formCard}>
            <View style={styles.inputRow}>
              <Gauge size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Nåværende kilometerstand</Text>
                <TextInput
                  style={styles.textInput}
                  value={currentMileage}
                  onChangeText={setCurrentMileage}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.text.light}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <ShieldCheck size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Forsikringsselskap</Text>
                <TextInput
                  style={styles.textInput}
                  value={insurance}
                  onChangeText={setInsurance}
                  placeholder="F.eks. Gjensidige"
                  placeholderTextColor={Colors.text.light}
                />
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 17,
    color: Colors.primary,
  },
  headerButtonPrimary: {
    fontWeight: "600" as const,
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
    textTransform: "uppercase" as const,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  plateContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E1E1E1",
    borderRadius: 8,
    overflow: "hidden",
    height: 50,
  },
  plateFlag: {
    backgroundColor: "#00529C",
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#E1E1E1",
  },
  plateFlagText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold" as const,
  },
  plateInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#333",
    letterSpacing: 2,
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  successText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "500" as const,
  },
  offlineText: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  formCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  inputIcon: {
    width: 20,
  },
  inputContent: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  textInput: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: "500" as const,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 52,
  },
});
