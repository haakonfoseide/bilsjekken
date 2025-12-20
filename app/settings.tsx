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
  Shield,
  Trash2
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
  const { carInfo, updateCarInfo, addMileageRecord, deleteCar } = useCarData();
  const insets = useSafeAreaInsets();

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

  useEffect(() => {
    if (carInfo) {
      setMake(carInfo.make);
      setModel(carInfo.model);
      setYear(carInfo.year);
      setLicensePlate(carInfo.licensePlate);
      setInsurance(carInfo.insurance);
      setCurrentMileage(carInfo.currentMileage.toString());
      if (carInfo.vin) setVin(carInfo.vin);
    }
  }, [carInfo]);



  const handleSave = () => {
    if (!carInfo) return;
    
    if (!make || !model || !licensePlate) {
      Alert.alert("Mangler info", "Bilmerke, modell og registreringsnummer er påkrevd.");
      return;
    }

    const mileageNum = parseInt(currentMileage.replace(/\D/g, "")) || 0;

    updateCarInfo({
      id: carInfo.id,
      make,
      model,
      year,
      licensePlate,
      insurance: insurance || "",
      currentMileage: mileageNum,
      vin,
    });
    
    if (mileageNum > 0 && mileageNum !== carInfo.currentMileage) {
      addMileageRecord({
        date: new Date().toISOString(),
        mileage: mileageNum,
      });
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    router.back();
  };

  const handleDelete = () => {
    if (!carInfo) return;

    Alert.alert(
      "Slett bil",
      `Er du sikker på at du vil slette ${carInfo.make} ${carInfo.model}? Dette kan ikke angres.`,
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Slett",
          style: "destructive",
          onPress: () => {
            deleteCar(carInfo.id);
            router.back();
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: "Rediger bil",
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

          <Text style={styles.sectionHeader}>Drift og vedlikehold</Text>

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

          <Text style={styles.sectionHeader}>Handling</Text>
          
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Trash2 size={20} color={Colors.danger} />
            <Text style={styles.deleteButtonText}>Slett bil</Text>
          </TouchableOpacity>

          <Text style={styles.sectionHeader}>App & data</Text>

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

});
