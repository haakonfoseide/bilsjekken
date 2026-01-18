import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronRight,
  Check,
  Smartphone,
  Download,
  HelpCircle,
  Mail,
  Shield,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";

const LANGUAGE_STORAGE_KEY = "@app_language";

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

  const currentLanguage = i18n.language;

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
});
