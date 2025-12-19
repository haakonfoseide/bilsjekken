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
import { useState, useRef, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Wrench, Plus, Trash2, Camera, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useCarData } from "@/contexts/car-context";
import Colors from "@/constants/colors";

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

  const handleAdd = () => {
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
  };

  const handleDelete = (id: string) => {
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
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("no-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

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
      {
        text: "Ta bilde",
        onPress: takePhoto,
      },
      {
        text: "Velg fra galleri",
        onPress: pickImage,
      },
      {
        text: "Avbryt",
        style: "cancel",
      },
    ]);
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
        keyboardShouldPersistTaps="handled"
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
            {showAddForm ? "Avbryt" : "Legg til service"}
          </Text>
        </TouchableOpacity>

        {showAddForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Ny service</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Dato <Text style={styles.required}>*</Text>
              </Text>
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
              <Text style={styles.label}>
                Kilometerstand <Text style={styles.required}>*</Text>
              </Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Type service <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={type}
                onChangeText={setType}
                placeholder="F.eks. Oljeskift, EU-kontroll"
                placeholderTextColor={Colors.text.light}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Beskrivelse <Text style={styles.required}>*</Text>
              </Text>
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

            <View style={styles.inputGroup}>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verksted/sted</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="F.eks. Biltema"
                placeholderTextColor={Colors.text.light}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kvitteringer</Text>
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={showImageOptions}
                activeOpacity={0.8}
              >
                <Camera size={20} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.addImageText}>Legg til kvittering</Text>
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
                        <X size={16} color="#fff" strokeWidth={2} />
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
              <Text style={styles.submitButtonText}>Lagre</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Servicehistorikk</Text>

          {serviceRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <Wrench size={48} color={Colors.text.light} strokeWidth={1.5} />
              <Text style={styles.emptyText}>Ingen service registrert</Text>
            </View>
          ) : (
            serviceRecords.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.iconCircle}>
                    <Wrench size={20} color={Colors.success} strokeWidth={2} />
                  </View>
                  <View style={styles.recordContent}>
                    <Text style={styles.recordType}>{record.type}</Text>
                    <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                    <Text style={styles.recordMileage}>
                      {record.mileage.toLocaleString("no-NO")} km
                    </Text>
                    <Text style={styles.recordDescription}>
                      {record.description}
                    </Text>
                    {record.cost && (
                      <Text style={styles.recordCost}>
                        Kostnad: {record.cost.toLocaleString("no-NO")} kr
                      </Text>
                    )}
                    {record.location && (
                      <Text style={styles.recordLocation}>{record.location}</Text>
                    )}
                    {record.receiptImages && record.receiptImages.length > 0 && (
                      <View style={styles.receiptsContainer}>
                        <Text style={styles.receiptsLabel}>Kvitteringer:</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          style={styles.receiptImagesScroll}
                        >
                          {record.receiptImages.map((uri, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => {
                                Alert.alert(
                                  "Kvittering",
                                  "Vis større bilde (kommer snart)",
                                  [{ text: "OK" }]
                                );
                              }}
                            >
                              <Image
                                source={{ uri }}
                                style={styles.receiptThumbnail}
                              />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
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
  required: {
    color: Colors.danger,
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
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  recordContent: {
    flex: 1,
  },
  recordType: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  recordMileage: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  recordDescription: {
    fontSize: 14,
    color: Colors.text.primary,
    marginTop: 4,
  },
  recordCost: {
    fontSize: 14,
    color: Colors.success,
    marginTop: 4,
    fontWeight: "600" as const,
  },
  recordLocation: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  addImageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    borderStyle: "dashed",
  },
  addImageText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  imagePreviewContainer: {
    marginTop: 12,
  },
  imagePreviewWrapper: {
    position: "relative",
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.danger,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  receiptsContainer: {
    marginTop: 8,
  },
  receiptsLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 6,
    fontWeight: "600" as const,
  },
  receiptImagesScroll: {
    marginTop: 4,
  },
  receiptThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
