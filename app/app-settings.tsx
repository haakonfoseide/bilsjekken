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
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";

const LANGUAGE_STORAGE_KEY = "@app_language";
const NOTIFICATIONS_STORAGE_KEY = "@notification_settings";

interface NotificationSettings {
  washReminder: boolean;
  euControlReminder: boolean;
  serviceReminder: boolean;
  mileageReminder: boolean;
  tireChangeReminder: boolean;
  fuelReminder: boolean;
}

const defaultNotifications: NotificationSettings = {
  washReminder: true,
  euControlReminder: true,
  serviceReminder: true,
  mileageReminder: true,
  tireChangeReminder: true,
  fuelReminder: false,
};

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

  const currentLanguage = i18n.language;

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (error) {
      console.error("[AppSettings] Failed to load notification settings:", error);
    }
  };

  const toggleNotification = async (key: keyof NotificationSettings) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newSettings = { ...notifications, [key]: !notifications[key] };
    setNotifications(newSettings);
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(newSettings));
      console.log("[AppSettings] Notification settings saved:", newSettings);
    } catch (error) {
      console.error("[AppSettings] Failed to save notification settings:", error);
    }
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
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{t("wash_reminder")}</Text>
              <Text style={styles.notificationDesc}>{t("wash_reminder_desc")}</Text>
            </View>
            <Switch
              value={notifications.washReminder}
              onValueChange={() => toggleNotification("washReminder")}
              trackColor={{ false: "#E2E8F0", true: Colors.primary + "50" }}
              thumbColor={notifications.washReminder ? Colors.primary : "#f4f3f4"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.notificationRow}>
            <View style={styles.notificationIcon}>
              <ShieldCheck size={18} color={Colors.warning} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{t("eu_control_reminder")}</Text>
              <Text style={styles.notificationDesc}>{t("eu_control_reminder_desc")}</Text>
            </View>
            <Switch
              value={notifications.euControlReminder}
              onValueChange={() => toggleNotification("euControlReminder")}
              trackColor={{ false: "#E2E8F0", true: Colors.warning + "50" }}
              thumbColor={notifications.euControlReminder ? Colors.warning : "#f4f3f4"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.notificationRow}>
            <View style={styles.notificationIcon}>
              <Wrench size={18} color={Colors.success} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{t("service_reminder")}</Text>
              <Text style={styles.notificationDesc}>{t("service_reminder_desc")}</Text>
            </View>
            <Switch
              value={notifications.serviceReminder}
              onValueChange={() => toggleNotification("serviceReminder")}
              trackColor={{ false: "#E2E8F0", true: Colors.success + "50" }}
              thumbColor={notifications.serviceReminder ? Colors.success : "#f4f3f4"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.notificationRow}>
            <View style={styles.notificationIcon}>
              <Gauge size={18} color={Colors.text.secondary} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{t("mileage_reminder")}</Text>
              <Text style={styles.notificationDesc}>{t("mileage_reminder_desc")}</Text>
            </View>
            <Switch
              value={notifications.mileageReminder}
              onValueChange={() => toggleNotification("mileageReminder")}
              trackColor={{ false: "#E2E8F0", true: Colors.primary + "50" }}
              thumbColor={notifications.mileageReminder ? Colors.primary : "#f4f3f4"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.notificationRow}>
            <View style={styles.notificationIcon}>
              <CircleDot size={18} color={"#6366F1"} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{t("tire_change_reminder")}</Text>
              <Text style={styles.notificationDesc}>{t("tire_change_reminder_desc")}</Text>
            </View>
            <Switch
              value={notifications.tireChangeReminder}
              onValueChange={() => toggleNotification("tireChangeReminder")}
              trackColor={{ false: "#E2E8F0", true: "#6366F1" + "50" }}
              thumbColor={notifications.tireChangeReminder ? "#6366F1" : "#f4f3f4"}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.notificationRow}>
            <View style={styles.notificationIcon}>
              <Fuel size={18} color={Colors.danger} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{t("fuel_reminder")}</Text>
              <Text style={styles.notificationDesc}>{t("fuel_reminder_desc")}</Text>
            </View>
            <Switch
              value={notifications.fuelReminder}
              onValueChange={() => toggleNotification("fuelReminder")}
              trackColor={{ false: "#E2E8F0", true: Colors.danger + "50" }}
              thumbColor={notifications.fuelReminder ? Colors.danger : "#f4f3f4"}
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
});
