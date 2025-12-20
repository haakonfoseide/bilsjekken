import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Image,
  Keyboard,
} from "react-native";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Wrench, Plus, Trash2, Camera, X, Check, FileText } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useCarData } from "@/contexts/car-context";
import Colors from "@/constants/colors";

const SERVICE_TYPES = ["Oljeskift", "EU-kontroll", "Dekkskift", "Bremser", "Filter", "Annet"];

export default function ServiceScreen() {
  const { serviceRecords, addServiceRecord, deleteServiceRecord } = useCarData();
  const insets = useSafeAreaInsets();

  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [mileage, setMileage] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [location, setLocation] = useState("");
  const [receiptImages, setReceiptImages] = useState<string[]>([]);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAdd = useCallback(() => {
    if (!date || !mileage || !type || !description) {
      Alert.alert("Feil", "Vennligst fyll ut alle påkrevde felt");
      return;
    }

    addServiceRecord({
      date: new Date(date).toISOString(),
      mileage: parseInt(mileage),
      type,
      description,
      cost: cost ? parseFloat(cost) : undefined,
      location: location || undefined,
      receiptImages: receiptImages.length > 0 ? receiptImages : undefined,
    });

    setDate(new Date().toISOString().split("T")[0]);
    setMileage("");
    setType("");
    setDescription("");
    setCost("");
    setLocation("");
    setReceiptImages([]);
    setShowAddForm(false);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [date, mileage, type, description, cost, location, receiptImages, addServiceRecord]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      "Slett service",
      "Er du sikker på at du vil slette denne servicen?",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Slett",
          style: "destructive",
          onPress: () => {
            deleteServiceRecord(id);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  }, [deleteServiceRecord]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("no-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Tillatelse påkrevd",
        "Vi trenger tilgang til bildegalleriet ditt for å legge til kvitteringer."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!isMounted.current) return;

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => asset.uri);
      setReceiptImages([...receiptImages, ...newImages]);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Tillatelse påkrevd",
        "Vi trenger tilgang til kameraet ditt for å ta bilde av kvitteringer."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!isMounted.current) return;

    if (!result.canceled && result.assets && result.assets[0]) {
      setReceiptImages([...receiptImages, result.assets[0].uri]);
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const removeImage = (index: number) => {
    setReceiptImages(receiptImages.filter((_, i) => i !== index));
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const showImageOptions = () => {
    Alert.alert("Legg til kvittering", "Velg et alternativ", [
      { text: "Ta bilde", onPress: takePhoto },
      { text: "Velg fra galleri", onPress: pickImage },
      { text: "Avbryt", style: "cancel" },
    ]);
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
            <Text style={styles.addButtonText}>Registrer service</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Ny service</Text>
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

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Dato <Text style={styles.required}>*</Text></Text>
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
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Km-stand <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={mileage}
                  onChangeText={setMileage}
                  placeholder="0"
                  placeholderTextColor={Colors.text.light}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type service <Text style={styles.required}>*</Text></Text>
              <View style={styles.typeChips}>
                {SERVICE_TYPES.map((serviceType) => (
                  <TouchableOpacity
                    key={serviceType}
                    style={[styles.typeChip, type === serviceType && styles.typeChipActive]}
                    onPress={() => {
                      setType(type === serviceType ? "" : serviceType);
                      if (Platform.OS !== "web") {
                        Haptics.selectionAsync();
                      }
                    }}
                  >
                    <Text style={[styles.typeChipText, type === serviceType && styles.typeChipTextActive]}>
                      {serviceType}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Beskrivelse <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Hva ble gjort?"
                placeholderTextColor={Colors.text.light}
                multiline
                numberOfLines={3}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
                blurOnSubmit
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Kostnad (kr)</Text>
                <TextInput
                  style={styles.input}
                  value={cost}
                  onChangeText={setCost}
                  placeholder="0"
                  placeholderTextColor={Colors.text.light}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Verksted</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Sted"
                  placeholderTextColor={Colors.text.light}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kvitteringer</Text>
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={showImageOptions}
                activeOpacity={0.8}
              >
                <Camera size={20} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.addImageText}>Legg til bilde</Text>
              </TouchableOpacity>

              {receiptImages.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imagePreviewContainer}
                >
                  {receiptImages.map((uri, index) => (
                    <View key={index} style={styles.imagePreviewWrapper}>
                      <Image source={{ uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <X size={14} color="#fff" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAdd}
              activeOpacity={0.8}
            >
              <Check size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.submitButtonText}>Lagre service</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Servicehistorikk</Text>

        {serviceRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <FileText size={32} color={Colors.text.light} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Ingen service registrert</Text>
            <Text style={styles.emptyText}>
              Logg service for å holde oversikt over vedlikehold
            </Text>
          </View>
        ) : (
          <View style={styles.recordsList}>
            {serviceRecords.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordIcon}>
                    <Wrench size={18} color={Colors.success} strokeWidth={2} />
                  </View>
                  <View style={styles.recordMeta}>
                    <Text style={styles.recordType}>{record.type}</Text>
                    <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(record.id)}
                    style={styles.deleteButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={18} color={Colors.danger} strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.recordDescription}>{record.description}</Text>

                <View style={styles.recordDetails}>
                  <View style={styles.recordDetailItem}>
                    <Text style={styles.recordDetailLabel}>Km-stand</Text>
                    <Text style={styles.recordDetailValue}>
                      {record.mileage.toLocaleString("no-NO")} km
                    </Text>
                  </View>
                  {record.cost && (
                    <View style={styles.recordDetailItem}>
                      <Text style={styles.recordDetailLabel}>Kostnad</Text>
                      <Text style={[styles.recordDetailValue, { color: Colors.success }]}>
                        {record.cost.toLocaleString("no-NO")} kr
                      </Text>
                    </View>
                  )}
                  {record.location && (
                    <View style={styles.recordDetailItem}>
                      <Text style={styles.recordDetailLabel}>Verksted</Text>
                      <Text style={styles.recordDetailValue}>{record.location}</Text>
                    </View>
                  )}
                </View>

                {record.receiptImages && record.receiptImages.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.receiptScroll}
                  >
                    {record.receiptImages.map((uri, index) => (
                      <Image
                        key={index}
                        source={{ uri }}
                        style={styles.receiptThumbnail}
                      />
                    ))}
                  </ScrollView>
                )}
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
    fontSize: 16,
    fontWeight: "700" as const,
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
    fontSize: 20,
    fontWeight: "700" as const,
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
  row: {
    flexDirection: "row",
    gap: 12,
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
  required: {
    color: Colors.danger,
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
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  typeChipActive: {
    backgroundColor: "#ECFDF5",
    borderColor: Colors.success,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: Colors.text.secondary,
  },
  typeChipTextActive: {
    color: Colors.success,
    fontWeight: "600" as const,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    borderStyle: "dashed",
  },
  addImageText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  imagePreviewContainer: {
    marginTop: 12,
  },
  imagePreviewWrapper: {
    position: "relative",
    marginRight: 10,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  removeImageButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: Colors.danger,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 16,
    fontWeight: "700" as const,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
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
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  recordsList: {
    gap: 12,
  },
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  recordMeta: {
    flex: 1,
  },
  recordType: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  recordDate: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  recordDescription: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  recordDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  recordDetailItem: {},
  recordDetailLabel: {
    fontSize: 11,
    color: Colors.text.light,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  recordDetailValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  receiptScroll: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  receiptThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
});
