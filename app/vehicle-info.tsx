import React, { useMemo, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { ChevronDown, ChevronUp, ArrowLeft, ExternalLink, Pencil, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useCarData } from "@/contexts/car-context";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import { useTranslation } from "react-i18next";
import DatePicker from "@/components/DatePicker";
import type { VehicleSection, CarInfo } from "@/types/car";

const getColorHex = (colorName: string): string => {
  const colorMap: Record<string, string> = {
    'svart': '#1a1a1a',
    'hvit': '#f5f5f5',
    'grå': '#6b7280',
    'sølv': '#c0c0c0',
    'blå': '#3b82f6',
    'rød': '#ef4444',
    'grønn': '#22c55e',
    'gul': '#eab308',
    'oransje': '#f97316',
    'brun': '#92400e',
    'beige': '#d4c5a9',
    'sort': '#1a1a1a',
    'white': '#f5f5f5',
    'black': '#1a1a1a',
    'gray': '#6b7280',
    'grey': '#6b7280',
    'silver': '#c0c0c0',
    'blue': '#3b82f6',
    'red': '#ef4444',
    'green': '#22c55e',
    'yellow': '#eab308',
    'orange': '#f97316',
    'brown': '#92400e',
  };
  const lower = colorName.toLowerCase();
  return colorMap[lower] || '#9ca3af';
};

type SectionKey =
  | "euKontroll"
  | "registreringsdata"
  | "utslipp"
  | "malOgVekt"
  | "motorKraftoverforing"
  | "dekkOgFelg";

const ORDER: { key: SectionKey; title: string }[] = [
  { key: "euKontroll", title: "EU-kontroll" },
  { key: "registreringsdata", title: "Registreringsdata" },
  { key: "utslipp", title: "Miljødata" },
  { key: "malOgVekt", title: "Mål og vekt" },
  { key: "motorKraftoverforing", title: "Motor / kraftoverføring" },
  { key: "dekkOgFelg", title: "Dekk og felg" },
];

function formatValue(value: string, unit?: string) {
  const trimmed = value.trim();
  if (!unit) return trimmed;
  return `${trimmed} ${unit}`;
}

export default function VehicleInfoScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { carInfo, refreshCarInfo, isRefreshing, updateCarInfo, deleteCar, addMileageRecord } = useCarData();

  const [isEditing, setIsEditing] = useState(false);
  const [tempSections, setTempSections] = useState<CarInfo["vehicleSections"]>({});

  // Core fields state
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [insurance, setInsurance] = useState("");
  const [currentMileage, setCurrentMileage] = useState("");
  const [color, setColor] = useState("");
  const [vin, setVin] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [euControlDate, setEuControlDate] = useState("");
  const [nextEuControlDate, setNextEuControlDate] = useState("");

  useEffect(() => {
    if (carInfo && !isEditing) {
      setTempSections(JSON.parse(JSON.stringify(carInfo.vehicleSections || {})));
      
      // Initialize core fields
      setMake(carInfo.make);
      setModel(carInfo.model);
      setYear(carInfo.year);
      setLicensePlate(carInfo.licensePlate);
      setInsurance(carInfo.insurance || "");
      setCurrentMileage(carInfo.currentMileage?.toString() || "");
      setColor(carInfo.color || "");
      setVin(carInfo.vin || "");
      setFuelType(carInfo.fuelType || "");
      setEuControlDate(carInfo.euControlDate || "");
      setNextEuControlDate(carInfo.nextEuControlDate || "");
    }
  }, [carInfo, isEditing]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    generelt: true,
    euKontroll: true,
    registreringsdata: true,
    utslipp: true,
    malOgVekt: true,
    motorKraftoverforing: false,
    dekkOgFelg: false,
  });

  const sections = useMemo(() => {
    const raw = isEditing ? tempSections : carInfo?.vehicleSections;
    const result: { key: SectionKey; section: VehicleSection }[] = [];

    for (const o of ORDER) {
      const sec = raw?.[o.key];
      if (sec && Array.isArray(sec.fields) && sec.fields.length > 0) {
        result.push({ key: o.key, section: sec });
      }
    }
    return result;
  }, [carInfo?.vehicleSections, tempSections, isEditing]);

  const handleToggle = (key: string) => {
    setExpanded((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      return next;
    });
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  const handleChangeText = (sectionKey: SectionKey, fieldIndex: number, text: string) => {
    setTempSections((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      if (next[sectionKey]?.fields?.[fieldIndex]) {
        next[sectionKey].fields[fieldIndex].value = text;
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!carInfo) return;

    const mileageNum = parseInt(currentMileage.replace(/\D/g, "")) || 0;

    updateCarInfo({
      ...carInfo,
      make,
      model,
      year,
      licensePlate,
      insurance,
      currentMileage: mileageNum,
      color,
      vin,
      fuelType,
      euControlDate,
      nextEuControlDate,
      vehicleSections: tempSections,
    });

    if (mileageNum > 0 && mileageNum !== carInfo.currentMileage) {
      addMileageRecord({
        date: new Date().toISOString(),
        mileage: mileageNum,
      });
    }

    setIsEditing(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset handled by useEffect
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
            router.replace("/" as any);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const handleRefresh = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    refreshCarInfo();
  };

  const handleOpenVegvesenet = () => {
    Linking.openURL("https://www.vegvesen.no/minside/");
  };

  return (
    <View style={styles.container} testID="vehicle-info-screen">
      <Stack.Screen
        options={{
          title: t('vehicle_info'),
          headerStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerBtn}
              testID="vehicle-info-back"
            >
              <ArrowLeft size={22} color={Colors.text.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRight}>
              {isEditing ? (
                <>
                  <TouchableOpacity onPress={handleCancel} style={styles.headerBtnSecondary}>
                    <Text style={styles.headerBtnSecondaryText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={styles.headerBtnPrimary}>
                    <Text style={styles.headerBtnPrimaryText}>{t('save')}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={handleRefresh}
                    style={[styles.headerPill, isRefreshing && styles.headerPillDisabled]}
                    disabled={isRefreshing}
                    testID="vehicle-info-refresh"
                  >
                    <Text style={styles.headerPillText}>{isRefreshing ? "…" : t('refresh')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={styles.headerIconBtn}
                    testID="vehicle-info-edit"
                  >
                    <Pencil size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          testID="vehicle-info-scroll"
        >
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>{make} {model}</Text>
                <Text style={styles.heroSubtitle} numberOfLines={1}>
                  {licensePlate ? licensePlate : ""}
                  {carInfo?.vin ? `  •  VIN ${carInfo.vin}` : ""}
                </Text>
              </View>
            </View>
            {(color || fuelType) && (
              <View style={styles.heroBadges}>
                {color ? (
                  <View style={styles.heroBadge}>
                    <View style={[styles.colorDot, { backgroundColor: getColorHex(color) }]} />
                    <Text style={styles.heroBadgeText}>{color}</Text>
                  </View>
                ) : null}
                {fuelType ? (
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>{fuelType}</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {/* Core Fields Section */}
          <View style={styles.sectionCard} testID="vehicle-section-generelt">
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => handleToggle("generelt")}
              activeOpacity={0.8}
            >
              <Text style={styles.sectionTitle}>{t('general_info')}</Text>
              {expanded["generelt"] ? (
                <ChevronUp size={18} color={Colors.text.secondary} />
              ) : (
                <ChevronDown size={18} color={Colors.text.secondary} />
              )}
            </TouchableOpacity>

            {expanded["generelt"] && (
              <View style={styles.fields}>
                {[
                  { label: t('make'), value: make, onChange: setMake },
                  { label: t('model'), value: model, onChange: setModel },
                  { label: t('year'), value: year, onChange: setYear, keyboardType: "numeric" },
                  { label: t('license_plate'), value: licensePlate, onChange: setLicensePlate, autoCapitalize: "characters" },
                  { label: t('vin'), value: vin, onChange: setVin, autoCapitalize: "characters" },
                  { label: t('mileage'), value: currentMileage, onChange: setCurrentMileage, keyboardType: "numeric", unit: "km" },
                  { label: t('insurance_company'), value: insurance, onChange: setInsurance },
                  { label: t('color'), value: color, onChange: setColor },
                  { label: t('fuel'), value: fuelType, onChange: setFuelType },
                ].map((field, idx) => (
                  <View key={field.label} style={[styles.row, idx === 8 && styles.rowLast]}>
                    <Text style={styles.label}>{field.label}</Text>
                    {isEditing ? (
                      <View style={styles.inputContainer}>
                        <TextInput
                          style={styles.input}
                          value={field.value}
                          onChangeText={field.onChange}
                          placeholder={(field as any).placeholder || t('unknown')}
                          placeholderTextColor={Colors.text.light}
                          keyboardType={field.keyboardType as any}
                          autoCapitalize={field.autoCapitalize as any}
                        />
                        {field.unit && <Text style={styles.unitText}>{field.unit}</Text>}
                      </View>
                    ) : (
                      <Text style={styles.value} numberOfLines={2}>
                        {formatValue(field.value, field.unit)}
                      </Text>
                    )}
                  </View>
                ))}

                <View style={[styles.row]}>
                  <Text style={styles.label}>{t('next_eu_control')}</Text>
                  {isEditing ? (
                    <View style={styles.datePickerContainer}>
                      <DatePicker
                        value={nextEuControlDate}
                        onChange={setNextEuControlDate}
                        placeholder={t('unknown')}
                      />
                    </View>
                  ) : (
                    <Text style={styles.value} numberOfLines={2}>
                      {nextEuControlDate || t('unknown')}
                    </Text>
                  )}
                </View>

                <View style={[styles.row, styles.rowLast]}>
                  <Text style={styles.label}>{t('last_eu_control')}</Text>
                  {isEditing ? (
                    <View style={styles.datePickerContainer}>
                      <DatePicker
                        value={euControlDate}
                        onChange={setEuControlDate}
                        placeholder={t('unknown')}
                      />
                    </View>
                  ) : (
                    <Text style={styles.value} numberOfLines={2}>
                      {euControlDate || t('unknown')}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>

          {sections.map(({ key, section }) => {
          const isOpen = Boolean(expanded[key]);
          return (
            <View key={key} style={styles.sectionCard} testID={`vehicle-section-${key}`}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => handleToggle(key)}
                activeOpacity={0.8}
                testID={`vehicle-section-toggle-${key}`}
              >
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {isOpen ? (
                  <ChevronUp size={18} color={Colors.text.secondary} />
                ) : (
                  <ChevronDown size={18} color={Colors.text.secondary} />
                )}
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.fields} testID={`vehicle-section-fields-${key}`}>
                  {section.fields.map((f, idx) => (
                    <View
                      key={`${f.label}_${idx}`}
                      style={[styles.row, idx === section.fields.length - 1 && styles.rowLast]}
                    >
                      <Text style={styles.label} numberOfLines={1}>
                        {f.label}
                      </Text>
                      {isEditing ? (
                        <View style={styles.inputContainer}>
                          <TextInput
                            style={styles.input}
                            value={f.value}
                            onChangeText={(text) => handleChangeText(key, idx, text)}
                            placeholder={t('value')}
                            placeholderTextColor={Colors.text.light}
                          />
                          {f.unit && <Text style={styles.unitText}>{f.unit}</Text>}
                        </View>
                      ) : (
                        <Text style={styles.value} numberOfLines={2}>
                          {formatValue(f.value, f.unit)}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.externalLinkBtn}
          onPress={handleOpenVegvesenet}
          activeOpacity={0.8}
        >
          <View style={styles.externalLinkIcon}>
            <ExternalLink size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.externalLinkTitle}>{t('open_my_page')}</Text>
            <Text style={styles.externalLinkSubtitle}>{t('open_vegvesen_desc')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color={Colors.danger} />
          <Text style={styles.deleteButtonText}>{t('delete_car')}</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
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
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerPillDisabled: {
    opacity: 0.6,
  },
  headerPillText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnPrimary: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  headerBtnPrimaryText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#fff",
  },
  headerBtnSecondary: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerBtnSecondaryText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.primary,
    fontWeight: "600" as const,
    textAlign: "right",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
    minHeight: 32,
  },
  unitText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: "500" as const,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: "500" as const,
  },
  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  emptyCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    gap: 10,
  },
  emptyText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    fontWeight: "500" as const,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },
  sectionHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800" as const,
    color: Colors.text.primary,
    letterSpacing: -0.1,
  },
  fields: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  row: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  rowLast: {
    paddingBottom: 12,
  },
  label: {
    flex: 1,
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: "600" as const,
  },
  value: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    color: Colors.text.primary,
    fontWeight: "700" as const,
  },
  externalLinkBtn: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  externalLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  externalLinkTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  externalLinkSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  datePickerContainer: {
    flex: 1,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
  },
  deleteButtonText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
