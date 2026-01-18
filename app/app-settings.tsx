import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Switch,
  Modal,
} from "react-native";
import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronRight,
  Check,
  Smartphone,
  Download,
  HelpCircle,
  Mail,
  Shield,
  Droplets,
  Wrench,
  ShieldCheck,
  Gauge,
  CircleDot,
  Fuel,
  Clock,
  X,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";

const LANGUAGE_STORAGE_KEY = "@app_language";
const NOTIFICATIONS_STORAGE_KEY = "@notification_settings";

type FrequencyType = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "custom_days" | "custom_km";

interface NotificationFrequency {
  type: FrequencyType;
  customValue?: number;
}

interface NotificationSetting {
  enabled: boolean;
  frequency: NotificationFrequency;
}

interface NotificationSettings {
  washReminder: NotificationSetting;
  euControlReminder: NotificationSetting;
  serviceReminder: NotificationSetting;
  mileageReminder: NotificationSetting;
  tireChangeReminder: NotificationSetting;
  fuelReminder: NotificationSetting;
}

const defaultNotifications: NotificationSettings = {
  washReminder: {
    enabled: true,
    frequency: { type: "biweekly" },
  },
  euControlReminder: {
    enabled: true,
    frequency: { type: "monthly" },
  },
  serviceReminder: {
    enabled: true,
    frequency: { type: "custom_km", customValue: 15000 },
  },
  mileageReminder: {
    enabled: true,
    frequency: { type: "monthly" },
  },
  tireChangeReminder: {
    enabled: true,
    frequency: { type: "quarterly" },
  },
  fuelReminder: {
    enabled: false,
    frequency: { type: "weekly" },
  },
};

interface FrequencyOption {
  type: FrequencyType;
  labelKey: string;
  requiresCustomValue?: boolean;
  customUnit?: "days" | "km";
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { type: "daily", labelKey: "freq_daily" },
  { type: "weekly", labelKey: "freq_weekly" },
  { type: "biweekly", labelKey: "freq_biweekly" },
  { type: "monthly", labelKey: "freq_monthly" },
  { type: "quarterly", labelKey: "freq_quarterly" },
  { type: "custom_days", labelKey: "freq_custom_days", requiresCustomValue: true, customUnit: "days" },
  { type: "custom_km", labelKey: "freq_custom_km", requiresCustomValue: true, customUnit: "km" },
];

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: "nb", name: "Norwegian", nativeName: "Norsk" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
];

export default function AppSettingsScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotifications);
  const [frequencyModalVisible, setFrequencyModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<keyof NotificationSettings | null>(null);
  const [tempCustomValue, setTempCustomValue] = useState<string>("");

  const currentLanguage = i18n.language;

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.washReminder !== undefined && typeof parsed.washReminder === "boolean") {
          const migrated: NotificationSettings = {
            washReminder: { enabled: parsed.washReminder, frequency: defaultNotifications.washReminder.frequency },
            euControlReminder: { enabled: parsed.euControlReminder, frequency: defaultNotifications.euControlReminder.frequency },
            serviceReminder: { enabled: parsed.serviceReminder, frequency: defaultNotifications.serviceReminder.frequency },
            mileageReminder: { enabled: parsed.mileageReminder, frequency: defaultNotifications.mileageReminder.frequency },
            tireChangeReminder: { enabled: parsed.tireChangeReminder, frequency: defaultNotifications.tireChangeReminder.frequency },
            fuelReminder: { enabled: parsed.fuelReminder, frequency: defaultNotifications.fuelReminder.frequency },
          };
          setNotifications(migrated);
          await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(migrated));
        } else {
          setNotifications(parsed);
        }
      }
    } catch (error) {
      console.error("[AppSettings] Failed to load notification settings:", error);
    }
  };

  const toggleNotification = async (key: keyof NotificationSettings) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newSettings = {
      ...notifications,
      [key]: {
        ...notifications[key],
        enabled: !notifications[key].enabled,
      },
    };
    setNotifications(newSettings);
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(newSettings));
      console.log("[AppSettings] Notification settings saved:", newSettings);
    } catch (error) {
      console.error("[AppSettings] Failed to save notification settings:", error);
    }
  };

  const openFrequencyModal = (key: keyof NotificationSettings) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedNotification(key);
    const currentFreq = notifications[key].frequency;
    if (currentFreq.customValue) {
      setTempCustomValue(currentFreq.customValue.toString());
    } else {
      setTempCustomValue("");
    }
    setFrequencyModalVisible(true);
  };

  const selectFrequency = async (option: FrequencyOption) => {
    if (!selectedNotification) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (option.requiresCustomValue) {
      const customVal = parseInt(tempCustomValue, 10);
      if (!customVal || customVal <= 0) {
        Alert.alert(t("invalid_value"), t("enter_valid_number"));
        return;
      }
      const newSettings = {
        ...notifications,
        [selectedNotification]: {
          ...notifications[selectedNotification],
          frequency: { type: option.type, customValue: customVal },
        },
      };
      setNotifications(newSettings);
      try {
        await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.error("[AppSettings] Failed to save frequency:", error);
      }
      setFrequencyModalVisible(false);
      return;
    }

    const newSettings = {
      ...notifications,
      [selectedNotification]: {
        ...notifications[selectedNotification],
        frequency: { type: option.type },
      },
    };
    setNotifications(newSettings);
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("[AppSettings] Failed to save frequency:", error);
    }
    setFrequencyModalVisible(false);
  };

  const getFrequencyLabel = (freq: NotificationFrequency): string => {
    const option = FREQUENCY_OPTIONS.find(o => o.type === freq.type);
    if (!option) return "";
    if (freq.customValue) {
      if (freq.type === "custom_km") {
        return t("every_x_km", { value: freq.customValue.toLocaleString() });
      }
      return t("every_x_days", { count: freq.customValue });
    }
    return t(option.labelKey);
  };

  const handleLanguageChange = async (langCode: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
      await i18n.changeLanguage(langCode);
      console.log("[AppSettings] Language changed to:", langCode);
    } catch (error) {
      console.error("[AppSettings] Failed to save language:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t("settings"),
          headerStyle: { backgroundColor: Colors.background },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionHeader}>{t("language")}</Text>

        <View style={styles.card}>
          {LANGUAGES.map((lang, index) => {
            const isSelected = currentLanguage === lang.code || 
              (currentLanguage.startsWith(lang.code));
            const isLast = index === LANGUAGES.length - 1;

            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.languageRow, !isLast && styles.languageRowBorder]}
                onPress={() => handleLanguageChange(lang.code)}
                activeOpacity={0.7}
              >
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{lang.nativeName}</Text>
                  <Text style={styles.languageNameSecondary}>{lang.name}</Text>
                </View>
                {isSelected && (
                  <Check size={20} color={Colors.primary} strokeWidth={2.5} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionHeader}>{t("notifications")}</Text>

        <View style={styles.card}>
          <View style={styles.notificationRow}>
            <View style={styles.notificationIcon}>
              <Droplets size={18} color={Colors.primary} />
            </View>
            <TouchableOpacity 
              style={styles.notificationContent}
              onPress={() => openFrequencyModal("washReminder")}
              activeOpacity={0.7}
            >
              <Text style={styles.notificationTitle}>{t("wash_reminder")}</Text>
              <View style={styles.frequencyRow}>
                <Clock size={12} color={Colors.text.tertiary} />
                <Text style={styles.frequencyText}>{getFrequencyLabel(notifications.washReminder.frequency)}</Text>
                <ChevronRight size={14} color={Colors.text.tertiary} />
              </View>
            </TouchableOpacity>
            <Switch
              value={notifications.washReminder.enabled}
              onValueChange={() => toggleNotification("washReminder")}
              trackColor={{ false: "#E2E8F0", true: Colors.primary + "50" }}
              thumbColor={notifications.washReminder.enabled ? Colors.primary : "#f4f3f4"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.notificationRow}>
            <View style={styles.notificationIcon}>
              <ShieldCheck size={18} color={Colors.warning} />
            </View>
            <TouchableOpacity 
              style={styles.notificationContent}
              onPress={() => openFrequencyModal("euControlReminder")}
              activeOpacity={0.7}
            >
              <Text style={styles.notificationTitle}>{t("eu_control_reminder")}</Text>
              <View style={styles.frequencyRow}>
                <Clock size={12} color={Colors.text.tertiary} />
                <Text style={styles.frequencyText}>{getFrequencyLabel(notifications.euControlReminder.frequency)}</Text>
                <ChevronRight size={14} color={Colors.text.tertiary} />
              </View>
            </TouchableOpacity>
            <Switch
              value={notifications.euControlReminder.enabled}
              onValueChange={() => toggleNotification("euControlReminder")}
              trackColor={{ false: "#E2E8F0", true: Colors.warning + "50" }}
              thumbColor={notifications.euControlReminder.enabled ? Colors.warning : "#f4f3f4"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.notificationRow}>
            <View style={styles.notificationIcon}>
              <Wrench size={18} color={Colors.success} />
            </View>
            <TouchableOpacity 
              style={styles.notificationContent}
              onPress={() => openFrequencyModal("serviceReminder")}
              activeOpacity={0.7}
            >
              <Text style={styles.notificationTitle}>{t("service_reminder")}</Text>
              <View style={styles.frequencyRow}>
                <Clock size={12} color={Colors.text.tertiary} />
                <Text style={styles.frequencyText}>{getFrequencyLabel(notifications.serviceReminder.frequency)}</Text>
                <ChevronRight size={14} color={Colors.text.tertiary} />
              </View>
            </TouchableOpacity>
            <Switch
              value={notifications.serviceReminder.enabled}
              onValueChange={() => toggleNotification("serviceReminder")}
              trackColor={{ false: "#E2E8F0", true: Colors.success + "50" }}
              thumbColor={notifications.serviceReminder.enabled ? Colors.success : "#f4f3f4"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.notificationRow}>
            <View style={styles.notificationIcon}>
              <Gauge size={18} color={Colors.text.secondary} />
            </View>
            <TouchableOpacity 
              style={styles.notificationContent}
              onPress={() => openFrequencyModal("mileageReminder")}
              activeOpacity={0.7}
            >
              <Text style={styles.notificationTitle}>{t("mileage_reminder")}</Text>
              <View style={styles.frequencyRow}>
                <Clock size={12} color={Colors.text.tertiary} />
                <Text style={styles.frequencyText}>{getFrequencyLabel(notifications.mileageReminder.frequency)}</Text>
                <ChevronRight size={14} color={Colors.text.tertiary} />
              </View>
            </TouchableOpacity>
            <Switch
              value={notifications.mileageReminder.enabled}
              onValueChange={() => toggleNotification("mileageReminder")}
              trackColor={{ false: "#E2E8F0", true: Colors.primary + "50" }}
              thumbColor={notifications.mileageReminder.enabled ? Colors.primary : "#f4f3f4"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.notificationRow}>
            <View style={styles.notificationIcon}>
              <CircleDot size={18} color={"#6366F1"} />
            </View>
            <TouchableOpacity 
              style={styles.notificationContent}
              onPress={() => openFrequencyModal("tireChangeReminder")}
              activeOpacity={0.7}
            >
              <Text style={styles.notificationTitle}>{t("tire_change_reminder")}</Text>
              <View style={styles.frequencyRow}>
                <Clock size={12} color={Colors.text.tertiary} />
                <Text style={styles.frequencyText}>{getFrequencyLabel(notifications.tireChangeReminder.frequency)}</Text>
                <ChevronRight size={14} color={Colors.text.tertiary} />
              </View>
            </TouchableOpacity>
            <Switch
              value={notifications.tireChangeReminder.enabled}
              onValueChange={() => toggleNotification("tireChangeReminder")}
              trackColor={{ false: "#E2E8F0", true: "#6366F1" + "50" }}
              thumbColor={notifications.tireChangeReminder.enabled ? "#6366F1" : "#f4f3f4"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.notificationRow}>
            <View style={styles.notificationIcon}>
              <Fuel size={18} color={Colors.danger} />
            </View>
            <TouchableOpacity 
              style={styles.notificationContent}
              onPress={() => openFrequencyModal("fuelReminder")}
              activeOpacity={0.7}
            >
              <Text style={styles.notificationTitle}>{t("fuel_reminder")}</Text>
              <View style={styles.frequencyRow}>
                <Clock size={12} color={Colors.text.tertiary} />
                <Text style={styles.frequencyText}>{getFrequencyLabel(notifications.fuelReminder.frequency)}</Text>
                <ChevronRight size={14} color={Colors.text.tertiary} />
              </View>
            </TouchableOpacity>
            <Switch
              value={notifications.fuelReminder.enabled}
              onValueChange={() => toggleNotification("fuelReminder")}
              trackColor={{ false: "#E2E8F0", true: Colors.danger + "50" }}
              thumbColor={notifications.fuelReminder.enabled ? Colors.danger : "#f4f3f4"}
            />
          </View>
        </View>

        <Text style={styles.sectionHeader}>{t("app_data")}</Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <Smartphone size={20} color={Colors.text.secondary} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t("app_version")}</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Alert.alert(t("export_data"), t("export_desc"), [{ text: "OK" }]);
            }}
            activeOpacity={0.7}
          >
            <Download size={20} color={Colors.text.secondary} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t("export_data")}</Text>
              <Text style={styles.settingValue}>{t("download_copy")}</Text>
            </View>
            <ChevronRight size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeader}>{t("support")}</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Alert.alert(t("help_support"), t("help_desc"), [{ text: "OK" }]);
            }}
            activeOpacity={0.7}
          >
            <HelpCircle size={20} color={Colors.text.secondary} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t("help_support")}</Text>
            </View>
            <ChevronRight size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Alert.alert(t("contact_us"), t("contact_desc"), [{ text: "OK" }]);
            }}
            activeOpacity={0.7}
          >
            <Mail size={20} color={Colors.text.secondary} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t("contact_us")}</Text>
            </View>
            <ChevronRight size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Alert.alert(t("privacy_terms"), t("privacy_desc"), [
                { text: "OK" },
              ]);
            }}
            activeOpacity={0.7}
          >
            <Shield size={20} color={Colors.text.secondary} />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t("privacy_terms")}</Text>
            </View>
            <ChevronRight size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={frequencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFrequencyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFrequencyModalVisible(false)}
        >
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("select_frequency")}</Text>
              <TouchableOpacity
                onPress={() => setFrequencyModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.frequencyOptions}>
              {FREQUENCY_OPTIONS.filter(o => !o.requiresCustomValue).map((option, index) => {
                const isSelected = selectedNotification && 
                  notifications[selectedNotification].frequency.type === option.type;
                return (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.frequencyOption,
                      isSelected && styles.frequencyOptionSelected,
                      index === 0 && styles.frequencyOptionFirst,
                    ]}
                    onPress={() => selectFrequency(option)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.frequencyOptionText,
                      isSelected && styles.frequencyOptionTextSelected,
                    ]}>
                      {t(option.labelKey)}
                    </Text>
                    {isSelected && <Check size={20} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.customSectionHeader}>{t("custom_interval")}</Text>

            <View style={styles.customInputRow}>
              <View style={styles.customInputWrapper}>
                <Text style={styles.customInputLabel}>{t("value")}</Text>
                <View style={styles.customInput}>
                  <Text 
                    style={styles.customInputText}
                    onPress={() => {
                      Alert.prompt(
                        t("enter_value"),
                        t("enter_number_prompt"),
                        [
                          { text: t("cancel"), style: "cancel" },
                          { 
                            text: "OK", 
                            onPress: (value?: string) => {
                              if (value) setTempCustomValue(value);
                            }
                          },
                        ],
                        "plain-text",
                        tempCustomValue,
                        "numeric"
                      );
                    }}
                  >
                    {tempCustomValue || "—"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.customButton}
                onPress={() => {
                  const daysOption = FREQUENCY_OPTIONS.find(o => o.type === "custom_days")!;
                  selectFrequency(daysOption);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.customButtonText}>{t("days")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.customButton}
                onPress={() => {
                  const kmOption = FREQUENCY_OPTIONS.find(o => o.type === "custom_km")!;
                  selectFrequency(kmOption);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.customButtonText}>{t("km")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  languageRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  languageNameSecondary: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: "500" as const,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 52,
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  notificationIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  notificationDesc: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  frequencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  frequencyText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  frequencyOptions: {
    gap: 2,
  },
  frequencyOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginBottom: 8,
  },
  frequencyOptionFirst: {
    marginTop: 0,
  },
  frequencyOptionSelected: {
    backgroundColor: Colors.primary + "15",
    borderWidth: 1,
    borderColor: Colors.primary + "30",
  },
  frequencyOptionText: {
    fontSize: 15,
    color: Colors.text.primary,
    fontWeight: "500" as const,
  },
  frequencyOptionTextSelected: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  customSectionHeader: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 12,
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  customInputWrapper: {
    flex: 1,
  },
  customInputLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  customInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customInputText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: "500" as const,
  },
  customButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  customButtonText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600" as const,
  },
});
