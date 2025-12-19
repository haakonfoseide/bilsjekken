import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Switch,
  Image,
  Keyboard,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CircleSlash2,
  Save,
  Camera,
  X,
  Plus,
  Snowflake,
  Sun,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useCarData } from "@/contexts/car-context";
import { useLocalSearchParams } from "expo-router";
import Colors from "@/constants/colors";

export default function TiresScreen() {
  const { tireSets, addTireSet, deleteTireSet, setActiveTireSet } =
    useCarData();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [showAddForm, setShowAddForm] = useState(false);

  const [tireType, setTireType] = useState<"summer" | "winter">("summer");
  const [brand, setBrand] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isAtTireHotel, setIsAtTireHotel] = useState(false);
  const [hotelLocation, setHotelLocation] = useState("");
  const [size, setSize] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  const [hasBalancing, setHasBalancing] = useState(false);
  const [hasRemounting, setHasRemounting] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const resetForm = () => {
    setTireType("summer");
    setBrand("");
    setPurchaseDate(new Date().toISOString().split("T")[0]);
    setIsAtTireHotel(false);
    setHotelLocation("");
    setSize("");
    setNotes("");
    setReceiptImages([]);
    setHasBalancing(false);
    setHasRemounting(false);
    setShowAddForm(false);
  };

  useEffect(() => {
    if (params.prefillData) {
      try {
        const data = JSON.parse(params.prefillData as string);
        console.log("[Tires] Prefilling with data:", data);
        
        if (!isMounted.current) return;

        if (data.merchant) setBrand(data.merchant);
        if (data.date) setPurchaseDate(data.date);
        if (data.description) setNotes(data.description);
        if (data.receiptImages && Array.isArray(data.receiptImages)) {
          console.log("[Tires] Setting receipt images:", data.receiptImages);
          setReceiptImages(data.receiptImages);
        }
        if (data.items && data.items.length > 0) {
          const itemsText = data.items.join(", ");
          setNotes((prev) => prev ? `${prev}\n\nPoster: ${itemsText}` : `Poster: ${itemsText}`);
        }
        
        setShowAddForm(true);
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (error) {
        console.error("[Tires] Error parsing prefill data:", error);
        console.error("[Tires] Prefill data was:", params.prefillData);
      }
    }
  }, [params.prefillData]);

  const handleAddNew = () => {
    setShowAddForm(!showAddForm);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = () => {
    if (!brand || !purchaseDate || !size) {
      Alert.alert("Feil", "Vennligst fyll ut alle obligatoriske felt");
      return;
    }

    addTireSet({
      type: tireType,
      brand,
      purchaseDate: new Date(purchaseDate).toISOString(),
      isAtTireHotel,
      hotelLocation: isAtTireHotel ? hotelLocation : undefined,
      size,
      notes: notes || undefined,
      receiptImages: receiptImages.length > 0 ? receiptImages : undefined,
      isActive: tireSets.length === 0,
      hasBalancing,
      hasRemounting,
    });

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    resetForm();
    Alert.alert("Lagret", "Dekksettet er lagt til");
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Slett dekksett",
      "Er du sikker på at du vil slette dette dekksettet?",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Slett",
          style: "destructive",
          onPress: () => {
            deleteTireSet(id);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
          },
        },
      ]
    );
  };

  const handleSetActive = (id: string) => {
    setActiveTireSet(id);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const getTireAge = (purchaseDate: string) => {
    const purchase = new Date(purchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchase.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    const diffMonths = Math.floor(
      (diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)
    );
    return { years: diffYears, months: diffMonths };
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

  const summerTires = tireSets.filter((t) => t.type === "summer");
  const winterTires = tireSets.filter((t) => t.type === "winter");

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
          onPress={handleAddNew}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#fff" strokeWidth={2} />
          <Text style={styles.addButtonText}>
            {showAddForm ? "Avbryt" : "Legg til dekksett"}
          </Text>
        </TouchableOpacity>

        {showAddForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nytt dekksett</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Type <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    tireType === "summer" && styles.typeButtonActive,
                  ]}
                  onPress={() => {
                    setTireType("summer");
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Sun
                    size={20}
                    color={
                      tireType === "summer" ? "#fff" : Colors.text.secondary
                    }
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      tireType === "summer" && styles.typeButtonTextActive,
                    ]}
                  >
                    Sommer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    tireType === "winter" && styles.typeButtonActive,
                  ]}
                  onPress={() => {
                    setTireType("winter");
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Snowflake
                    size={20}
                    color={
                      tireType === "winter" ? "#fff" : Colors.text.secondary
                    }
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      tireType === "winter" && styles.typeButtonTextActive,
                    ]}
                  >
                    Vinter
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Merke <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={brand}
                onChangeText={setBrand}
                placeholder="F.eks. Nokian"
                placeholderTextColor={Colors.text.light}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Dekkdimensjon <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={size}
                onChangeText={setSize}
                placeholder="F.eks. 205/55 R16"
                placeholderTextColor={Colors.text.light}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Kjøpsdato <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={purchaseDate}
                onChangeText={setPurchaseDate}
                placeholder="YYYY-MM-DD"
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dekkhotell</Text>

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text style={styles.label}>Lagret på dekkhotell</Text>
                  <Text style={styles.switchDescription}>
                    {isAtTireHotel ? "Ja" : "Nei"}
                  </Text>
                </View>
                <Switch
                  value={isAtTireHotel}
                  onValueChange={(value) => {
                    setIsAtTireHotel(value);
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {isAtTireHotel && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Hvor er dekket lagret?</Text>
                  <TextInput
                    style={styles.input}
                    value={hotelLocation}
                    onChangeText={setHotelLocation}
                    placeholder="F.eks. Biltema Oslo"
                    placeholderTextColor={Colors.text.light}
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ekstra tjenester</Text>

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text style={styles.label}>Avbalansering</Text>
                  <Text style={styles.switchDescription}>
                    {hasBalancing ? "Ja" : "Nei"}
                  </Text>
                </View>
                <Switch
                  value={hasBalancing}
                  onValueChange={(value) => {
                    setHasBalancing(value);
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text style={styles.label}>Omlegging</Text>
                  <Text style={styles.switchDescription}>
                    {hasRemounting ? "Ja" : "Nei"}
                  </Text>
                </View>
                <Switch
                  value={hasRemounting}
                  onValueChange={(value) => {
                    setHasRemounting(value);
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                  trackColor={{ false: Colors.border, true: Colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Save size={20} color="#fff" strokeWidth={2} />
              <Text style={styles.submitButtonText}>Lagre dekksett</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Dekksett</Text>
          {tireSets.length === 0 ? (
            <View style={styles.emptyState}>
              <CircleSlash2
                size={48}
                color={Colors.text.light}
                strokeWidth={1.5}
              />
              <Text style={styles.emptyText}>Ingen dekksett registrert</Text>
            </View>
          ) : (
          <>
            {summerTires.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Sun size={20} color={Colors.warning} strokeWidth={2} />
                  <Text style={styles.sectionTitle}>Sommerdekk</Text>
                </View>

                {summerTires.map((tire) => {
                  const age = getTireAge(tire.purchaseDate);
                  return (
                    <TouchableOpacity
                      key={tire.id}
                      style={[
                        styles.tireCard,
                        tire.isActive && styles.tireCardActive,
                      ]}
                      onPress={() => handleSetActive(tire.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.tireCardHeader}>
                        <View style={styles.tireCardTitle}>
                          {tire.isActive ? (
                            <CheckCircle2
                              size={24}
                              color={Colors.primary}
                              strokeWidth={2}
                            />
                          ) : (
                            <Circle
                              size={24}
                              color={Colors.text.light}
                              strokeWidth={2}
                            />
                          )}
                          <View>
                            <Text style={styles.tireBrand}>{tire.brand}</Text>
                            <Text style={styles.tireSize}>{tire.size}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDelete(tire.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Trash2
                            size={20}
                            color={Colors.danger}
                            strokeWidth={2}
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.tireCardDetails}>
                        <Text style={styles.tireDetail}>
                          Alder: {age.years} år {age.months} mnd
                        </Text>
                        {age.years >= 6 && (
                          <Text style={styles.tireWarning}>
                            ⚠️ Bør byttes
                          </Text>
                        )}
                        {tire.isAtTireHotel && (
                          <Text style={styles.tireDetail}>
                            📍 {tire.hotelLocation || "Dekkhotell"}
                          </Text>
                        )}
                        {(tire.hasBalancing || tire.hasRemounting) && (
                          <Text style={styles.tireDetail}>
                            {tire.hasBalancing && "✓ Avbalansering"}
                            {tire.hasBalancing && tire.hasRemounting && ", "}
                            {tire.hasRemounting && "✓ Omlegging"}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {winterTires.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Snowflake size={20} color="#60A5FA" strokeWidth={2} />
                  <Text style={styles.sectionTitle}>Vinterdekk</Text>
                </View>

                {winterTires.map((tire) => {
                  const age = getTireAge(tire.purchaseDate);
                  return (
                    <TouchableOpacity
                      key={tire.id}
                      style={[
                        styles.tireCard,
                        tire.isActive && styles.tireCardActive,
                      ]}
                      onPress={() => handleSetActive(tire.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.tireCardHeader}>
                        <View style={styles.tireCardTitle}>
                          {tire.isActive ? (
                            <CheckCircle2
                              size={24}
                              color={Colors.primary}
                              strokeWidth={2}
                            />
                          ) : (
                            <Circle
                              size={24}
                              color={Colors.text.light}
                              strokeWidth={2}
                            />
                          )}
                          <View>
                            <Text style={styles.tireBrand}>{tire.brand}</Text>
                            <Text style={styles.tireSize}>{tire.size}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDelete(tire.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Trash2
                            size={20}
                            color={Colors.danger}
                            strokeWidth={2}
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.tireCardDetails}>
                        <Text style={styles.tireDetail}>
                          Alder: {age.years} år {age.months} mnd
                        </Text>
                        {age.years >= 6 && (
                          <Text style={styles.tireWarning}>
                            ⚠️ Bør byttes
                          </Text>
                        )}
                        {tire.isAtTireHotel && (
                          <Text style={styles.tireDetail}>
                            📍 {tire.hotelLocation || "Dekkhotell"}
                          </Text>
                        )}
                        {(tire.hasBalancing || tire.hasRemounting) && (
                          <Text style={styles.tireDetail}>
                            {tire.hasBalancing && "✓ Avbalansering"}
                            {tire.hasBalancing && tire.hasRemounting && ", "}
                            {tire.hasRemounting && "✓ Omlegging"}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
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
    paddingBottom: 90,
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
  listSection: {
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  tireCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  tireCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.cardBackground,
  },
  tireCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  tireCardTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  tireBrand: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  tireSize: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  tireCardDetails: {
    gap: 6,
  },
  tireDetail: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  tireWarning: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: "600" as const,
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
  typeSelector: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  switchLabel: {
    flex: 1,
  },
  switchDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: Colors.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
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
});
