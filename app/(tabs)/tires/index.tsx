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
  Disc,
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
import { useTranslation } from "react-i18next";
import { useCarData } from "@/contexts/car-context";
import { useLocalSearchParams } from "expo-router";
import Colors, { typography } from "@/constants/colors";
import {
  hapticFeedback,
  confirmDelete,
  calculateAge,
  pickImagesFromGallery,
  takePhotoWithCamera,
  showImagePickerOptions,
} from "@/lib/utils";

export default function TiresScreen() {
  const { t } = useTranslation();
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

        if (data.tireBrand) {
          setBrand(data.tireBrand);
        } else if (data.merchant) {
          setBrand(data.merchant);
        }
        if (data.date) setPurchaseDate(data.date);
        if (data.description) setNotes(data.description);
        if (data.receiptImages && Array.isArray(data.receiptImages)) {
          setReceiptImages(data.receiptImages);
        }
        
        // Fill in tire dimensions
        if (data.tireDimensions) {
          setSize(data.tireDimensions);
        } else if (data.tireWidth && data.tireProfile && data.tireRimSize) {
          setSize(`${data.tireWidth}/${data.tireProfile} R${data.tireRimSize}`);
        }
        
        // Set tire type based on analysis
        if (data.tireType === "winter") {
          setTireType("winter");
        } else if (data.tireType === "summer") {
          setTireType("summer");
        }
        
        // Build notes with additional info
        let notesText = data.description || "";
        if (data.tireModel) {
          notesText = notesText ? `${notesText}\nModell: ${data.tireModel}` : `Modell: ${data.tireModel}`;
        }
        if (data.tireQuantity) {
          notesText = notesText ? `${notesText}\nAntall: ${data.tireQuantity} stk` : `Antall: ${data.tireQuantity} stk`;
        }
        if (data.items && data.items.length > 0) {
          const itemsText = data.items.join(", ");
          notesText = notesText ? `${notesText}\n\nPoster: ${itemsText}` : `Poster: ${itemsText}`;
        }
        if (notesText) setNotes(notesText);
        
        setShowAddForm(true);
        
        hapticFeedback.success();
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

    hapticFeedback.success();
    resetForm();
  }, [brand, purchaseDate, size, tireType, isAtTireHotel, hotelLocation, notes, receiptImages, tireSets.length, hasBalancing, hasRemounting, addTireSet, resetForm]);

  const handleDelete = useCallback((id: string) => {
    confirmDelete("Slett dekksett", "Er du sikker på at du vil slette dette dekksettet?", () => {
      deleteTireSet(id);
      hapticFeedback.success();
    });
  }, [deleteTireSet]);

  const handleSetActive = useCallback((id: string) => {
    setActiveTireSet(id);
    hapticFeedback.medium();
  }, [setActiveTireSet]);

  const getTireAge = useCallback((purchaseDate: string) => {
    return calculateAge(purchaseDate);
  }, []);

  const pickImage = useCallback(async () => {
    const result = await pickImagesFromGallery();
    if (!isMounted.current || result.cancelled) return;
    setReceiptImages(prev => [...prev, ...result.images]);
    hapticFeedback.light();
  }, []);

  const takePhoto = useCallback(async () => {
    const result = await takePhotoWithCamera();
    if (!isMounted.current || result.cancelled) return;
    setReceiptImages(prev => [...prev, ...result.images]);
    hapticFeedback.light();
  }, []);

  const removeImage = useCallback((index: number) => {
    setReceiptImages(prev => prev.filter((_, i) => i !== index));
    hapticFeedback.light();
  }, []);

  const handleShowImageOptions = useCallback(() => {
    showImagePickerOptions(takePhoto, pickImage);
  }, [takePhoto, pickImage]);

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
              hapticFeedback.light();
            }}
            activeOpacity={0.8}
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.addButtonText}>{t('add_tire_set')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{t('new_tire_set')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  resetForm();
                  hapticFeedback.light();
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
                    hapticFeedback.selection();
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
                    hapticFeedback.selection();
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
                    hapticFeedback.selection();
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
                    hapticFeedback.selection();
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
                    hapticFeedback.selection();
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
                onPress={handleShowImageOptions}
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
              <Disc size={32} color={Colors.text.light} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>{t('no_tire_sets')}</Text>
            <Text style={styles.emptyText}>{t('add_tires_desc')}</Text>
          </View>
        ) : (
          <>
            {summerTires.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Sun size={18} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>{t('summer_tires')}</Text>
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
                  <Text style={styles.sectionTitle}>{t('winter_tires')}</Text>
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
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    ...typography.label,
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
    ...typography.button,
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
    ...typography.sectionTitle,
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
    ...typography.cardTitle,
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
