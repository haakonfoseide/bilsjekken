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
} from "react-native";
import { useState, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { Save, Gauge, Search, Trash2, WifiOff } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as Network from "expo-network";
import { useCarData } from "@/contexts/car-context";
import Colors from "@/constants/colors";
import { trpcClient } from "@/lib/trpc";

export default function SettingsScreen() {
  const router = useRouter();
  const { carInfo, updateCarInfo, addMileageRecord } = useCarData();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [insurance, setInsurance] = useState("");
  const [currentMileage, setCurrentMileage] = useState("");
  const [searchPlate, setSearchPlate] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (carInfo) {
      setMake(carInfo.make);
      setModel(carInfo.model);
      setYear(carInfo.year);
      setLicensePlate(carInfo.licensePlate);
      setInsurance(carInfo.insurance);
      setCurrentMileage(carInfo.currentMileage.toString());
    }
  }, [carInfo]);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        setIsOnline(networkState.isConnected ?? true);
      } catch (error) {
        console.error("[Settings] Network check error:", error);
        setIsOnline(true);
      }
    };

    checkNetwork();
    const interval = setInterval(checkNetwork, 5000);

    return () => clearInterval(interval);
  }, []);

  const [isSearching, setIsSearching] = useState(false);

  const handleLookupSuccess = (data: any) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      console.log("[Settings] Vehicle data received:", data);

      if (data && data.make && data.model) {
        setMake(data.make);
        setModel(data.model);
        setYear(data.year || "");
        setLicensePlate(data.licensePlate || "");

        Alert.alert(
          "Suksess!", 
          `Hentet data for ${data.make} ${data.model}.\nFyll ut resten og lagre.`,
          [{ text: "OK" }]
        );
      } else {
        console.warn("[Settings] Incomplete data received:", data);
        Alert.alert(
          "Advarsel",
          "Data hentet, men noe informasjon mangler. Vennligst fyll ut manuelt."
        );
      }
  };

  const handleLookupError = (error: any) => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      console.error("[Settings] Lookup error:", error);
      
      let errorMessage = "Kunne ikke hente kjøretøydata. Prøv igjen eller kontakt support.";
      let errorTitle = "Feil ved søk";
      
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          const msg = error.message;
          
          if (msg.includes('Backend API route not found') || msg.includes('404')) {
            errorTitle = "Backend ikke tilgjengelig";
            errorMessage = "Kunne ikke koble til server. Kontakt support eller prøv igjen senere.";
          } else if (msg.includes('Network') || msg.includes('fetch')) {
            errorTitle = "Nettverksfeil";
            errorMessage = "Sjekk internettforbindelsen din og prøv igjen.";
          } else {
            errorMessage = msg;
          }
        }
        
        if ('data' in error && error.data && typeof error.data === 'object') {
          const data = error.data as { code?: string; httpStatus?: number };
          if (data.code === 'NOT_FOUND') {
            errorTitle = "Ikke funnet";
          } else if (data.code === 'UNAUTHORIZED') {
            errorTitle = "Ingen tilgang";
            errorMessage = "API-nøkkel mangler eller er ugyldig. Kontakt support.";
          } else if (data.code === 'INTERNAL_SERVER_ERROR') {
            errorTitle = "Serverfeil";
          }
        }
      }
      
      Alert.alert(errorTitle, errorMessage, [{ text: "OK" }]);
  };

  const handleLookup = async () => {
    const trimmedPlate = searchPlate.trim();
    
    if (!trimmedPlate || trimmedPlate.length === 0) {
      Alert.alert("Mangler input", "Vennligst skriv inn et registreringsnummer");
      return;
    }

    if (trimmedPlate.length < 3) {
      Alert.alert("Ugyldig format", "Registreringsnummer må være minst 3 tegn");
      return;
    }

    try {
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        Alert.alert(
          "Ingen internettforbindelse",
          "Du må være koblet til internett for å søke opp kjøretøy."
        );
        return;
      }
    } catch (error) {
      console.error("[Settings] Network check failed:", error);
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    console.log("[Settings] Starting lookup for:", trimmedPlate);
    Keyboard.dismiss();
    
    setIsSearching(true);
    
    try {
      const data = await trpcClient.searchVehicle.query({ licensePlate: trimmedPlate });
      handleLookupSuccess(data);
    } catch (error) {
      handleLookupError(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = () => {
    if (!make || !model || !year || !licensePlate) {
      Alert.alert("Feil", "Vennligst fyll ut alle obligatoriske felt");
      return;
    }

    const mileage = parseInt(currentMileage) || 0;

    updateCarInfo({
      make,
      model,
      year,
      licensePlate,
      insurance: insurance || "Ikke oppgitt",
      currentMileage: mileage,
    });

    if (mileage > 0 && mileage !== carInfo?.currentMileage) {
      addMileageRecord({
        date: new Date().toISOString(),
        mileage,
      });
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert("Lagret", "Bilinfo er oppdatert", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  const handleRemoveCar = () => {
    Alert.alert(
      "Fjern bil",
      "Er du sikker på at du vil fjerne denne bilen? All data vil bli slettet.",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Fjern",
          style: "destructive",
          onPress: () => {
            updateCarInfo({
              make: "",
              model: "",
              year: "",
              licensePlate: "",
              insurance: "",
              currentMileage: 0,
            });
            setMake("");
            setModel("");
            setYear("");
            setLicensePlate("");
            setInsurance("");
            setCurrentMileage("");
            
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            
            Alert.alert("Fjernet", "Bilen er fjernet", [
              { text: "OK", onPress: () => router.back() }
            ]);
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Innstillinger",
          headerStyle: {
            backgroundColor: Colors.cardBackground,
          },
          headerTintColor: Colors.text.primary,
        }} 
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Søk opp bil</Text>
              {!isOnline && (
                <View style={styles.offlineBadge}>
                  <WifiOff size={14} color={Colors.danger} strokeWidth={2} />
                  <Text style={styles.offlineText}>Offline</Text>
                </View>
              )}
            </View>
            <Text style={styles.sectionDescription}>
              Søk med registreringsnummer for å hente bilinformasjon automatisk
            </Text>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchPlate}
                onChangeText={setSearchPlate}
                placeholder="Skriv inn reg.nr. (f.eks. AB12345)"
                placeholderTextColor={Colors.text.light}
                autoCapitalize="characters"
                editable={!isSearching}
                returnKeyType="search"
                onSubmitEditing={handleLookup}
              />
              <TouchableOpacity
                style={[
                  styles.searchButton,
                  (isSearching || !isOnline) && styles.searchButtonDisabled,
                ]}
                onPress={handleLookup}
                activeOpacity={0.7}
                disabled={isSearching || !isOnline}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Search size={20} color="#fff" strokeWidth={2} />
                    <Text style={styles.searchButtonText}>Søk</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Grunnleggende info</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Bilmerke <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={make}
                onChangeText={setMake}
                placeholder="F.eks. Toyota"
                placeholderTextColor={Colors.text.light}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Modell <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={model}
                onChangeText={setModel}
                placeholder="F.eks. Corolla"
                placeholderTextColor={Colors.text.light}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Årsmodell <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={year}
                onChangeText={setYear}
                placeholder="F.eks. 2020"
                placeholderTextColor={Colors.text.light}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Reg.nr. <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={licensePlate}
                onChangeText={setLicensePlate}
                placeholder="F.eks. AB12345"
                placeholderTextColor={Colors.text.light}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kilometerstand</Text>

            <View style={styles.mileageCard}>
              <View style={styles.mileageHeader}>
                <Gauge size={24} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.mileageLabel}>Nåværende kilometerstand</Text>
              </View>
              <TextInput
                style={styles.mileageInput}
                value={currentMileage}
                onChangeText={setCurrentMileage}
                placeholder="0"
                placeholderTextColor={Colors.text.light}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Forsikring</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Forsikringsselskap</Text>
              <TextInput
                style={styles.input}
                value={insurance}
                onChangeText={setInsurance}
                placeholder="F.eks. Gjensidige"
                placeholderTextColor={Colors.text.light}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Save size={20} color="#fff" strokeWidth={2} />
            <Text style={styles.saveButtonText}>Lagre bilinfo</Text>
          </TouchableOpacity>

          {carInfo && carInfo.make && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemoveCar}
              activeOpacity={0.8}
            >
              <Trash2 size={20} color={Colors.danger} strokeWidth={2} />
              <Text style={styles.removeButtonText}>Fjern bil</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  required: {
    color: Colors.danger,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
  },
  mileageCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mileageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  mileageLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  mileageInput: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  removeButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: Colors.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  removeButtonText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: "row",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 24,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#fee2e2",
    borderRadius: 12,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.danger,
  },
});
