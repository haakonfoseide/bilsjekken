import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  KeyboardAvoidingView,
  UIManager,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  Trash2, 
  CarFront, 
  Calendar, 
  Hash, 
  Info, 
  Gauge, 
  ShieldCheck, 
  ChevronRight,
  FileKey,
  HelpCircle,
  Download,
  Smartphone,
  Mail,
  Shield
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useCarData } from "@/contexts/car-context";
import Colors from "@/constants/colors";


// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function SettingsScreen() {
  const router = useRouter();
  const { carInfo, updateCarInfo, addMileageRecord, cars, addCar, setActiveCar, activeCarId, deleteCar } = useCarData();
  const insets = useSafeAreaInsets();

  const [isCreating, setIsCreating] = useState(false);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [insurance, setInsurance] = useState("");
  const [currentMileage, setCurrentMileage] = useState("");
  const [vin, setVin] = useState("");

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Initialize form with existing data
  useEffect(() => {
    if (isCreating) return;
    
    if (carInfo) {
      setMake(carInfo.make);
      setModel(carInfo.model);
      setYear(carInfo.year);
      setLicensePlate(carInfo.licensePlate);
      setInsurance(carInfo.insurance);
      setCurrentMileage(carInfo.currentMileage.toString());
      if (carInfo.vin) setVin(carInfo.vin);
    } else {
        // No car info, maybe reset?
    }
  }, [carInfo, isCreating]);



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

    if (isCreating) {
      addCar(carData);
      setIsCreating(false);
      Alert.alert("Bil lagt til", `${make} ${model} er nå lagt til i garasjen.`);
    } else if (carInfo) {
      updateCarInfo({
        ...carData,
        id: carInfo.id,
      });
      // Add mileage record if changed significantly or first time
      if (mileageNum > 0 && (!carInfo || mileageNum !== carInfo.currentMileage)) {
        addMileageRecord({
          date: new Date().toISOString(),
          mileage: mileageNum,
        });
      }
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Only go back if we are not in settings screen context which might be root of tab
    // But here SettingsScreen IS a screen in stack? 
    // Actually SettingsScreen is app/settings.tsx, it's a modal or stack screen.
    // If we just added a car, maybe we want to stay?
    // Let's go back for now as per original behavior.
    if (!isCreating) {
        router.back();
    }
  };

  const handleDelete = () => {
    if (!carInfo) return;
    
    Alert.alert(
      "Slett bil",
      `Er du sikker på at du vil slette ${carInfo.make} ${carInfo.model}?`,
      [
        { text: "Avbryt", style: "cancel" },
        { 
          text: "Slett", 
          style: "destructive", 
          onPress: () => {
            deleteCar(carInfo.id);
            if (Platform.OS !== "web") {
               Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            router.back();
          } 
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: isCreating ? "Ny bil" : "Min Bil",
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerLeft: () => (
           <TouchableOpacity onPress={() => {
               if (isCreating && cars.length > 0) {
                   setIsCreating(false);
               } else {
                   router.back();
               }
           }} style={styles.headerButton}>
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
          <View style={styles.carSelectorContainer}>
            <Text style={styles.sectionHeader}>Mine biler</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carList} contentContainerStyle={{ paddingHorizontal: 4 }}>
                {cars.map(car => (
                    <TouchableOpacity 
                        key={car.id} 
                        style={[styles.carChip, activeCarId === car.id && !isCreating && styles.carChipActive]}
                        onPress={() => {
                            setActiveCar(car.id);
                            setIsCreating(false);
                            Haptics.selectionAsync();
                        }}
                    >
                        <CarFront size={16} color={activeCarId === car.id && !isCreating ? "#fff" : Colors.text.primary} />
                        <Text style={[styles.carChipText, activeCarId === car.id && !isCreating && styles.carChipTextActive]}>
                            {car.make} {car.model}
                        </Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity 
                    style={[styles.carChip, isCreating && styles.carChipActive]}
                    onPress={() => {
                        router.push("/add-car" as never);
                        Haptics.selectionAsync();
                    }}
                >
                    <Text style={[styles.carChipText, isCreating && styles.carChipTextActive]}>+ Legg til</Text>
                </TouchableOpacity>
            </ScrollView>
          </View>

          <Text style={styles.sectionHeader}>Kjøretøyinformasjon</Text>

          {/* Car Details Form */}
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

          <Text style={styles.sectionHeader}>Drift og Vedlikehold</Text>

          <View style={styles.formCard}>
             <View style={styles.inputRow}>
              <Gauge size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>Kilometerstand</Text>
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

          {!isCreating && (
          <View>
          <Text style={styles.sectionHeader}>App & Data</Text>

          <View style={styles.formCard}>
            <TouchableOpacity style={styles.inputRow}>
              <Smartphone size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.settingTitle}>App versjon</Text>
                <Text style={styles.settingValue}>1.0.0</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.inputRow}
              onPress={() => {
                Alert.alert(
                  "Eksporter data",
                  "Denne funksjonen lar deg eksportere all bildata til en fil.",
                  [{ text: "OK" }]
                );
              }}
            >
              <Download size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.settingTitle}>Eksporter data</Text>
                <Text style={styles.settingValue}>Last ned en kopi</Text>
              </View>
              <ChevronRight size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeader}>Support</Text>

          <View style={styles.formCard}>
            <TouchableOpacity 
              style={styles.inputRow}
              onPress={() => {
                Alert.alert(
                  "Hjelp",
                  "Trenger du hjelp? Ta kontakt på support@bilapp.no",
                  [{ text: "OK" }]
                );
              }}
            >
              <HelpCircle size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.settingTitle}>Hjelp & Support</Text>
              </View>
              <ChevronRight size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.inputRow}
              onPress={() => {
                Alert.alert(
                  "Kontakt oss",
                  "E-post: support@bilapp.no\nTelefon: +47 123 45 678",
                  [{ text: "OK" }]
                );
              }}
            >
              <Mail size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.settingTitle}>Kontakt oss</Text>
              </View>
              <ChevronRight size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.inputRow}
              onPress={() => {
                Alert.alert(
                  "Personvern",
                  "Vi tar ditt personvern på alvor. All data lagres lokalt på enheten din.",
                  [{ text: "OK" }]
                );
              }}
            >
              <Shield size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.settingTitle}>Personvern & Vilkår</Text>
              </View>
              <ChevronRight size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>
          </View>
          )}

          {carInfo && carInfo.make && !isCreating && (
             <TouchableOpacity 
               style={styles.deleteButton} 
               onPress={handleDelete}
             >
               <Trash2 size={20} color={Colors.danger} />
               <Text style={styles.deleteButtonText}>Slett kjøretøy</Text>
             </TouchableOpacity>
          )}

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
    fontWeight: "600",
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.secondary,
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
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
    fontWeight: "500",
    padding: 0, // remove default padding on Android
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 52, // Align with text start
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: "600",
  },
  settingTitle: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: "500",
  },
  settingValue: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  carSelectorContainer: {
    marginBottom: 8,
  },
  carList: {
    marginTop: 8,
    marginBottom: 8,
  },
  carChip: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  carChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  carChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  carChipTextActive: {
    color: "#fff",
  },
});
