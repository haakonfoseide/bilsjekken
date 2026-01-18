import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Keyboard,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Droplet, Plus, Trash2, X, Check, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useCarData } from "@/contexts/car-context";
import Colors, { typography } from "@/constants/colors";
import DatePicker from "@/components/DatePicker";

const WASH_TYPES = ["Håndvask", "Automatvask", "Selvvask", "Polering"];

export default function WashScreen() {
  const { t, i18n } = useTranslation();
  const { washRecords, addWashRecord, deleteWashRecord } = useCarData();
  const insets = useSafeAreaInsets();

  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState("");
  const [notes, setNotes] = useState("");

  const handleAdd = () => {
    if (!date) {
      Alert.alert("Feil", "Vennligst velg dato");
      return;
    }

    addWashRecord({
      date: new Date(date).toISOString(),
      type: type || undefined,
      notes: notes || undefined,
    });

    setDate(new Date().toISOString().split("T")[0]);
    setType("");
    setNotes("");
    setShowAddForm(false);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Slett vask", "Er du sikker på at du vil slette denne vasken?", [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Slett",
        style: "destructive",
        onPress: () => {
          deleteWashRecord(id);
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('yesterday');
    return t('days_ago', { count: diffDays });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 100 : 40 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!showAddForm ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setShowAddForm(true);
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>{t('register_wash')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{t('new_wash')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowAddForm(false);
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <X size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dato</Text>
              <DatePicker
                value={date}
                onChange={setDate}
                placeholder="Velg dato"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type vask</Text>
              <View style={styles.typeChips}>
                {WASH_TYPES.map((washType) => (
                  <TouchableOpacity
                    key={washType}
                    style={[styles.typeChip, type === washType && styles.typeChipActive]}
                    onPress={() => {
                      setType(type === washType ? "" : washType);
                      if (Platform.OS !== "web") {
                        Haptics.selectionAsync();
                      }
                    }}
                  >
                    <Text style={[styles.typeChipText, type === washType && styles.typeChipTextActive]}>
                      {washType}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notater (valgfritt)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="F.eks. brukte nytt vaskemiddel..."
                placeholderTextColor={Colors.text.light}
                multiline
                numberOfLines={3}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
                blurOnSubmit
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAdd}
              activeOpacity={0.8}
            >
              <Check size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.submitButtonText}>Lagre</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('history')}</Text>

        {washRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Sparkles size={32} color={Colors.text.light} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>{t('no_washes_yet')}</Text>
            <Text style={styles.emptyText}>
              {t('track_wash_desc')}
            </Text>
          </View>
        ) : (
          <View style={styles.recordsList}>
            {washRecords.map((record, index) => (
              <View 
                key={record.id} 
                style={[
                  styles.recordCard,
                  index === 0 && styles.recordCardFirst
                ]}
              >
                <View style={[styles.recordIcon, index === 0 && styles.recordIconFirst]}>
                  <Droplet size={18} color={index === 0 ? "#fff" : Colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.recordContent}>
                  <View style={styles.recordHeader}>
                    <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                    <Text style={styles.recordDaysAgo}>{getDaysAgo(record.date)}</Text>
                  </View>
                  {record.type && (
                    <View style={styles.recordTypeBadge}>
                      <Text style={styles.recordTypeText}>{record.type}</Text>
                    </View>
                  )}
                  {record.notes && (
                    <Text style={styles.recordNotes} numberOfLines={2}>{record.notes}</Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(record.id)}
                  style={styles.deleteButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={18} color={Colors.danger} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 14,
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: "#fff",
    ...typography.button,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  formTitle: {
    ...typography.formTitle,
    color: Colors.text.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    ...typography.label,
    color: Colors.text.secondary,
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  typeChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  typeChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.text.secondary,
  },
  typeChipTextActive: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  submitButton: {
    backgroundColor: Colors.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 4,
  },
  submitButtonText: {
    color: "#fff",
    ...typography.button,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: Colors.text.primary,
    marginBottom: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    ...typography.emptyTitle,
    color: Colors.text.primary,
    marginBottom: 6,
  },
  emptyText: {
    ...typography.emptyText,
    color: Colors.text.secondary,
    textAlign: "center" as const,
  },
  recordsList: {
    gap: 10,
  },
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  recordCardFirst: {
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#FAFCFF",
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  recordIconFirst: {
    backgroundColor: Colors.primary,
  },
  recordContent: {
    flex: 1,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  recordDaysAgo: {
    fontSize: 12,
    color: Colors.text.light,
  },
  recordTypeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  recordTypeText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: Colors.text.secondary,
  },
  recordNotes: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 6,
    lineHeight: 18,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
});
