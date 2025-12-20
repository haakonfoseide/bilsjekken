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
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CircleSlash2,
  Camera,
  X,
  Plus,
  Snowflake,
  Sun,
  Trash2,
  CheckCircle2,
  Circle,
  Check,
  MapPin,
  Clock,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useCarData } from "@/contexts/car-context";
import { useLocalSearchParams } from "expo-router";
import Colors from "@/constants/colors";

export default function TiresScreen() {
  const { tireSets, addTireSet, deleteTireSet, setActiveTireSet } = useCarData();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [showAddForm, setShowAddForm] = useState(false);
  const [tireType, setTireType] = useState<"summer" | "winter">("summer");
  const [brand, setBrand] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
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

  const resetForm = useCallback(() => {
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
  }, []);

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
      }
    }
  }, [params.prefillData]);

  const handleSave = useCallback(() => {
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
  }, [brand, purchaseDate, size, tireType, isAtTireHotel, hotelLocation, notes, receiptImages, tireSets.length, hasBalancing, hasRemounting, addTireSet, resetForm]);

  const handleDelete = useCallback((id: string) => {
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
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  }, [deleteTireSet]);

  const handleSetActive = useCallback((id: string) => {
    setActiveTireSet(id);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [setActiveTireSet]);

  const getTireAge = useCallback((purchaseDate: string) => {
    const purchase = new Date(purchaseDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - purchase.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    const diffMonths = Math.floor(
      (diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)
    );
    return { years: diffYears, months: diffMonths };
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Tillatelse påkrevd", "Vi trenger tilgang til bildegalleriet.");
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
      Alert.alert("Tillatelse påkrevd", "Vi trenger tilgang til kameraet.");
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

  const summerTires = useMemo(() => tireSets.filter((t) => t.type === "summer"), [tireSets]);
  const winterTires = useMemo(() => tireSets.filter((t) => t.type === "winter"), [tireSets]);

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
            <Text style={styles.addButtonText}>Legg til dekksett</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Nytt dekksett</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  resetForm();
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <X size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type <Text style={styles.required}>*</Text></Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, tireType === "summer" && styles.typeButtonSummer]}
                  onPress={() => {
                    setTireType("summer");
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                  }}
                  activeOpacity={0.8}
                >
                  <Sun size={20} color={tireType === "summer" ? "#fff" : "#F59E0B"} />
                  <Text style={[styles.typeButtonText, tireType === "summer" && styles.typeButtonTextActive]}>
                    Sommer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeButton, tireType === "winter" && styles.typeButtonWinter]}
                  onPress={() => {
                    setTireType("winter");
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                  }}
                  activeOpacity={0.8}
                >
                  <Snowflake size={20} color={tireType === "winter" ? "#fff" : "#3B82F6"} />
                  <Text style={[styles.typeButtonText, tireType === "winter" && styles.typeButtonTextActive]}>
                    Vinter
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Merke <Text style={styles.required}>*</Text></Text>
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
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Dimensjon <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.input}
                  value={size}
                  onChangeText={setSize}
                  placeholder="205/55 R16"
                  placeholderTextColor={Colors.text.light}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kjøpsdato <Text style={styles.required}>*</Text></Text>
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

            <View style={styles.switchCard}>
              <View style={styles.switchRow}>
                <View style={styles.switchContent}>
                  <MapPin size={18} color={Colors.primary} />
                  <View style={styles.switchText}>
                    <Text style={styles.switchLabel}>Dekkhotell</Text>
                    <Text style={styles.switchDesc}>Lagret hos verksted</Text>
                  </View>
                </View>
                <Switch
                  value={isAtTireHotel}
                  onValueChange={(value) => {
                    setIsAtTireHotel(value);
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                  }}
                  trackColor={{ false: "#E2E8F0", true: Colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {isAtTireHotel && (
                <TextInput
                  style={[styles.input, { marginTop: 12 }]}
                  value={hotelLocation}
                  onChangeText={setHotelLocation}
                  placeholder="Hvor er dekkene lagret?"
                  placeholderTextColor={Colors.text.light}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              )}
            </View>

            <View style={styles.switchCard}>
              <View style={styles.switchRow}>
                <View style={styles.switchContent}>
                  <Text style={styles.switchLabel}>Avbalansering inkludert</Text>
                </View>
                <Switch
                  value={hasBalancing}
                  onValueChange={(value) => {
                    setHasBalancing(value);
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                  }}
                  trackColor={{ false: "#E2E8F0", true: Colors.success }}
                  thumbColor="#fff"
                />
              </View>
              <View style={[styles.switchRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F1F5F9" }]}>
                <View style={styles.switchContent}>
                  <Text style={styles.switchLabel}>Omlegging inkludert</Text>
                </View>
                <Switch
                  value={hasRemounting}
                  onValueChange={(value) => {
                    setHasRemounting(value);
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                  }}
                  trackColor={{ false: "#E2E8F0", true: Colors.success }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notater</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Valgfrie notater..."
                placeholderTextColor={Colors.text.light}
                multiline
                numberOfLines={2}
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
                <Text style={styles.addImageText}>Legg til bilde</Text>
              </TouchableOpacity>

              {receiptImages.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewContainer}>
                  {receiptImages.map((uri, index) => (
                    <View key={index} style={styles.imagePreviewWrapper}>
                      <Image source={{ uri }} style={styles.imagePreview} />
                      <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
                        <X size={14} color="#fff" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSave} activeOpacity={0.8}>
              <Check size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.submitButtonText}>Lagre dekksett</Text>
            </TouchableOpacity>
          </View>
        )}

        {tireSets.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <CircleSlash2 size={32} color={Colors.text.light} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Ingen dekksett</Text>
            <Text style={styles.emptyText}>Legg til dekk for å holde oversikt</Text>
          </View>
        ) : (
          <>
            {summerTires.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Sun size={18} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>Sommerdekk</Text>
                  <Text style={styles.sectionCount}>{summerTires.length}</Text>
                </View>

                {summerTires.map((tire) => {
                  const age = getTireAge(tire.purchaseDate);
                  const isOld = age.years >= 6;
                  return (
                    <TouchableOpacity
                      key={tire.id}
                      style={[styles.tireCard, tire.isActive && styles.tireCardActive]}
                      onPress={() => handleSetActive(tire.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.tireHeader}>
                        {tire.isActive ? (
                          <CheckCircle2 size={22} color={Colors.primary} strokeWidth={2.5} />
                        ) : (
                          <Circle size={22} color="#CBD5E1" strokeWidth={2} />
                        )}
                        <View style={styles.tireInfo}>
                          <Text style={styles.tireBrand}>{tire.brand}</Text>
                          <Text style={styles.tireSize}>{tire.size}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDelete(tire.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={styles.deleteBtn}
                        >
                          <Trash2 size={18} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.tireDetails}>
                        <View style={styles.tireDetailItem}>
                          <Clock size={14} color={Colors.text.light} />
                          <Text style={[styles.tireDetailText, isOld && styles.tireDetailWarning]}>
                            {age.years} år {age.months} mnd
                          </Text>
                        </View>
                        {tire.isAtTireHotel && (
                          <View style={styles.tireDetailItem}>
                            <MapPin size={14} color={Colors.primary} />
                            <Text style={styles.tireDetailText}>{tire.hotelLocation || "Dekkhotell"}</Text>
                          </View>
                        )}
                      </View>

                      {isOld && (
                        <View style={styles.warningBanner}>
                          <Text style={styles.warningBannerText}>Anbefales å bytte</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {winterTires.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Snowflake size={18} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Vinterdekk</Text>
                  <Text style={styles.sectionCount}>{winterTires.length}</Text>
                </View>

                {winterTires.map((tire) => {
                  const age = getTireAge(tire.purchaseDate);
                  const isOld = age.years >= 6;
                  return (
                    <TouchableOpacity
                      key={tire.id}
                      style={[styles.tireCard, tire.isActive && styles.tireCardActive]}
                      onPress={() => handleSetActive(tire.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.tireHeader}>
                        {tire.isActive ? (
                          <CheckCircle2 size={22} color={Colors.primary} strokeWidth={2.5} />
                        ) : (
                          <Circle size={22} color="#CBD5E1" strokeWidth={2} />
                        )}
                        <View style={styles.tireInfo}>
                          <Text style={styles.tireBrand}>{tire.brand}</Text>
                          <Text style={styles.tireSize}>{tire.size}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDelete(tire.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={styles.deleteBtn}
                        >
                          <Trash2 size={18} color={Colors.danger} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.tireDetails}>
                        <View style={styles.tireDetailItem}>
                          <Clock size={14} color={Colors.text.light} />
                          <Text style={[styles.tireDetailText, isOld && styles.tireDetailWarning]}>
                            {age.years} år {age.months} mnd
                          </Text>
                        </View>
                        {tire.isAtTireHotel && (
                          <View style={styles.tireDetailItem}>
                            <MapPin size={14} color={Colors.primary} />
                            <Text style={styles.tireDetailText}>{tire.hotelLocation || "Dekkhotell"}</Text>
                          </View>
                        )}
                      </View>

                      {isOld && (
                        <View style={styles.warningBanner}>
                          <Text style={styles.warningBannerText}>Anbefales å bytte</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
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
    minHeight: 60,
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
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 12,
  },
  typeButtonSummer: {
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
  },
  typeButtonWinter: {
    backgroundColor: "#DBEAFE",
    borderColor: "#3B82F6",
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  switchCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  switchText: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  switchDesc: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
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
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    flex: 1,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text.light,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tireCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tireCardActive: {
    borderColor: Colors.primary,
    backgroundColor: "#FAFCFF",
  },
  tireHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tireInfo: {
    flex: 1,
  },
  tireBrand: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  tireSize: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  tireDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  tireDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tireDetailText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  tireDetailWarning: {
    color: Colors.warning,
    fontWeight: "600" as const,
  },
  warningBanner: {
    backgroundColor: "#FEF3C7",
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  warningBannerText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#D97706",
  },
});
