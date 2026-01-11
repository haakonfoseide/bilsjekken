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
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { ChevronDown, ChevronUp, ArrowLeft, AlertCircle, ExternalLink, Pencil } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useCarData } from "@/contexts/car-context";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import type { VehicleSection, CarInfo } from "@/types/car";

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
  const router = useRouter();
  const { carInfo, refreshCarInfo, isRefreshing, updateCarInfo } = useCarData();

  const [isEditing, setIsEditing] = useState(false);
  const [tempSections, setTempSections] = useState<CarInfo["vehicleSections"]>({});

  useEffect(() => {
    if (carInfo?.vehicleSections && !isEditing) {
      setTempSections(JSON.parse(JSON.stringify(carInfo.vehicleSections)));
    }
  }, [carInfo?.vehicleSections, isEditing]);

  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
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

  const hasAny = sections.length > 0;

  const handleToggle = (key: SectionKey) => {
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
    updateCarInfo({
      ...carInfo,
      vehicleSections: tempSections,
    });
    setIsEditing(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (carInfo?.vehicleSections) {
      setTempSections(JSON.parse(JSON.stringify(carInfo.vehicleSections)));
    }
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
          title: "Kjøretøydata",
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
                    <Text style={styles.headerBtnSecondaryText}>Avbryt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={styles.headerBtnPrimary}>
                    <Text style={styles.headerBtnPrimaryText}>Lagre</Text>
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
                    <Text style={styles.headerPillText}>{isRefreshing ? "…" : "Oppdater"}</Text>
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
              <Text style={styles.heroTitle}>{carInfo ? `${carInfo.make} ${carInfo.model}` : "Kjøretøy"}</Text>
              <Text style={styles.heroSubtitle} numberOfLines={1}>
                {carInfo?.licensePlate ? carInfo.licensePlate : ""}
                {carInfo?.vin ? `  •  VIN ${carInfo.vin}` : ""}
              </Text>
            </View>
          </View>

          {!hasAny && (
            <View style={styles.emptyCard} testID="vehicle-info-empty">
              <AlertCircle size={18} color={Colors.text.secondary} />
              <Text style={styles.emptyText}>
                Ingen detaljer ble returnert fra Vegvesenet for denne bilen. Trykk “Oppdater” eller legg inn manuelt der
                det er relevant.
              </Text>
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
                            placeholder="Verdi"
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
            <Text style={styles.externalLinkTitle}>Åpne Min side</Text>
            <Text style={styles.externalLinkSubtitle}>Logg inn hos Vegvesenet for å se flere detaljer</Text>
          </View>
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
});
