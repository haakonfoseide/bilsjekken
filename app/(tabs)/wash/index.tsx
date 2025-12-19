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
import { Droplet, Plus, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useCarData } from "@/contexts/car-context";
import Colors from "@/constants/colors";

export default function WashScreen() {
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
    return date.toLocaleDateString("no-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 80 : 32 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setShowAddForm(!showAddForm);
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#fff" strokeWidth={2} />
          <Text style={styles.addButtonText}>
            {showAddForm ? "Avbryt" : "Legg til vask"}
          </Text>
        </TouchableOpacity>

        {showAddForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Ny vask</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dato</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.text.light}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type vask</Text>
              <TextInput
                style={styles.input}
                value={type}
                onChangeText={setType}
                placeholder="F.eks. Håndvask, automatvask"
                placeholderTextColor={Colors.text.light}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notater</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Valgfrie notater"
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
              <Text style={styles.submitButtonText}>Lagre</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Historikk</Text>

          {washRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <Droplet size={48} color={Colors.text.light} strokeWidth={1.5} />
              <Text style={styles.emptyText}>Ingen vasker registrert</Text>
            </View>
          ) : (
            washRecords.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.iconCircle}>
                    <Droplet size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                    {record.type && (
                      <Text style={styles.recordType}>{record.type}</Text>
                    )}
                    {record.notes && (
                      <Text style={styles.recordNotes}>{record.notes}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(record.id)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={20} color={Colors.danger} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
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
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  formCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
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
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: Colors.success,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  listSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 16,
  },
  recordCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  recordContent: {
    flex: 1,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  recordType: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  recordNotes: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
  },
});
