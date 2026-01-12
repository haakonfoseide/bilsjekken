import { useTranslation } from "react-i18next";
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
  Trash2,
  Palette,
  Fuel,
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
  const { t } = useTranslation();
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
  const [color, setColor] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [euControlDate, setEuControlDate] = useState("");
  const [nextEuControlDate, setNextEuControlDate] = useState("");

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
      if (carInfo.color) setColor(carInfo.color);
      if (carInfo.fuelType) setFuelType(carInfo.fuelType);
      if (carInfo.euControlDate) setEuControlDate(carInfo.euControlDate);
      if (carInfo.nextEuControlDate) setNextEuControlDate(carInfo.nextEuControlDate);
    }
  }, [carInfo]);



  const handleSave = () => {
    if (!carInfo) return;
    
    if (!make || !model || !licensePlate) {
      Alert.alert(t('missing_info'), t('missing_info_desc'));
      return;
    }

    const mileageNum = parseInt(currentMileage.replace(/\D/g, "")) || 0;

    updateCarInfo({
      ...carInfo, // Preserve all existing fields (weight, power, history, etc.)
      make,
      model,
      year,
      licensePlate,
      insurance: insurance || "",
      currentMileage: mileageNum,
      vin,
      color,
      fuelType,
      euControlDate: euControlDate || undefined,
      nextEuControlDate: nextEuControlDate || undefined,
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
      t('delete_car'),
      t('delete_car_confirm', { car: `${carInfo.make} ${carInfo.model}` }),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('delete_car'),
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
        title: t('edit_car'),
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
        headerLeft: () => (
           <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
             <Text style={styles.headerButtonText}>{t('cancel')}</Text>
           </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, styles.headerButtonPrimary]}>{t('save')}</Text>
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
          <Text style={styles.sectionHeader}>{t('vehicle_information')}</Text>

          {/* Car Details Form */}
          <View style={styles.formCard}>
            
            <View style={styles.inputRow}>
              <CarFront size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>{t('make')}</Text>
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
                <Text style={styles.inputLabel}>{t('model')}</Text>
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
                <Text style={styles.inputLabel}>{t('year')}</Text>
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
                <Text style={styles.inputLabel}>{t('license_plate')}</Text>
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
                <Text style={styles.inputLabel}>{t('vin')}</Text>
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

            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <Palette size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>{t('color')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={color}
                  onChangeText={setColor}
                  placeholder="Svart"
                  placeholderTextColor={Colors.text.light}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <Fuel size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>{t('fuel')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={fuelType}
                  onChangeText={setFuelType}
                  placeholder="Bensin"
                  placeholderTextColor={Colors.text.light}
                />
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>{t('maintenance_ops')}</Text>

          <View style={styles.formCard}>
             <View style={styles.inputRow}>
              <Gauge size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>{t('mileage')}</Text>
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
                <Text style={styles.inputLabel}>{t('insurance_company')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={insurance}
                  onChangeText={setInsurance}
                  placeholder="F.eks. Gjensidige"
                  placeholderTextColor={Colors.text.light}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <Calendar size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>{t('next_eu_control')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={nextEuControlDate}
                  onChangeText={setNextEuControlDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.text.light}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <Calendar size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>{t('last_eu_control')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={euControlDate}
                  onChangeText={setEuControlDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.text.light}
                />
              </View>
            </View>
          </View>

          <Text style={styles.sectionHeader}>{t('actions')}</Text>
          
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Trash2 size={20} color={Colors.danger} />
            <Text style={styles.deleteButtonText}>{t('delete_car')}</Text>
          </TouchableOpacity>

          <Text style={styles.sectionHeader}>{t('app_data')}</Text>

          <View style={styles.formCard}>
            <TouchableOpacity style={styles.inputRow}>
              <Smartphone size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.settingTitle}>{t('app_version')}</Text>
                <Text style={styles.settingValue}>1.0.0</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.inputRow}
              onPress={() => {
                Alert.alert(
                  t('export_data'),
                  t('export_desc'),
                  [{ text: "OK" }]
                );
              }}
            >
              <Download size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.settingTitle}>{t('export_data')}</Text>
                <Text style={styles.settingValue}>{t('download_copy')}</Text>
              </View>
              <ChevronRight size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionHeader}>{t('support')}</Text>

          <View style={styles.formCard}>
            <TouchableOpacity 
              style={styles.inputRow}
              onPress={() => {
                Alert.alert(
                  t('help_support'),
                  t('help_desc'),
                  [{ text: "OK" }]
                );
              }}
            >
              <HelpCircle size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.settingTitle}>{t('help_support')}</Text>
              </View>
              <ChevronRight size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.inputRow}
              onPress={() => {
                Alert.alert(
                  t('contact_us'),
                  t('contact_desc'),
                  [{ text: "OK" }]
                );
              }}
            >
              <Mail size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.settingTitle}>{t('contact_us')}</Text>
              </View>
              <ChevronRight size={20} color={Colors.text.tertiary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity 
              style={styles.inputRow}
              onPress={() => {
                Alert.alert(
                  t('privacy_terms'),
                  t('privacy_desc'),
                  [{ text: "OK" }]
                );
              }}
            >
              <Shield size={20} color={Colors.text.secondary} style={styles.inputIcon} />
              <View style={styles.inputContent}>
                <Text style={styles.settingTitle}>{t('privacy_terms')}</Text>
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
