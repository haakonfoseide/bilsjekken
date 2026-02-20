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
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Wrench, Plus, Trash2, Camera, X, Check, FileText, Pencil } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useCarData } from "@/contexts/car-context";
import Colors, { typography } from "@/constants/colors";
import DatePicker from "@/components/DatePicker";
import EmptyState from "@/components/EmptyState";
import { 
  hapticFeedback, 
  confirmDelete, 
  formatDateLocalized,
  pickImagesFromGallery,
  takePhotoWithCamera,
  showImagePickerOptions 
} from "@/lib/utils";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

const SERVICE_TYPE_KEYS = [
  "service_type_oil_change",
  "service_type_eu_control",
  "service_type_tire_change",
  "service_type_brakes",
  "service_type_filter",
  "service_type_other",
] as const;

export default function ServiceScreen() {
  const { t, i18n } = useTranslation();
  const { serviceRecords, addServiceRecord, deleteServiceRecord, updateServiceRecord } = useCarData();
  const insets = useSafeAreaInsets();

  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [mileage, setMileage] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [location, setLocation] = useState("");
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const resetForm = useCallback(() => {
    setDate(new Date().toISOString().split("T")[0]);
    setMileage("");
    setType("");
    setDescription("");
    setCost("");
    setLocation("");
    setReceiptImages([]);
    setShowAddForm(false);
    setEditingRecord(null);
  }, []);

  const handleAdd = useCallback(() => {
    if (isSaving) return;
    if (!date || !mileage || !type || !description) {
      Alert.alert(t('error'), t('required_fields'));
      return;
    }
    setIsSaving(true);

    if (editingRecord) {
      updateServiceRecord(editingRecord, {
        date: new Date(date).toISOString(),
        mileage: parseInt(mileage),
        type,
        description,
        cost: cost ? parseFloat(cost) : undefined,
        location: location || undefined,
        receiptImages: receiptImages.length > 0 ? receiptImages : undefined,
      });
    } else {
      addServiceRecord({
        date: new Date(date).toISOString(),
        mileage: parseInt(mileage),
        type,
        description,
        cost: cost ? parseFloat(cost) : undefined,
        location: location || undefined,
        receiptImages: receiptImages.length > 0 ? receiptImages : undefined,
      });
    }

    resetForm();
    setIsSaving(false);
    hapticFeedback.success();
  }, [date, mileage, type, description, cost, location, receiptImages, editingRecord, isSaving, addServiceRecord, updateServiceRecord, resetForm]);

  const handleEdit = useCallback((record: typeof serviceRecords[0]) => {
    setEditingRecord(record.id);
    setDate(new Date(record.date).toISOString().split("T")[0]);
    setMileage(record.mileage.toString());
    setType(record.type);
    setDescription(record.description);
    setCost(record.cost?.toString() || "");
    setLocation(record.location || "");
    setReceiptImages(record.receiptImages || []);
    setShowAddForm(true);
    hapticFeedback.light();
  }, []);

  const handleDelete = useCallback((id: string) => {
    confirmDelete(t('delete_service'), t('delete_service_confirm'), () => {
      deleteServiceRecord(id);
      hapticFeedback.success();
    });
  }, [deleteServiceRecord]);

  const formatDate = useCallback((dateString: string) => {
    return formatDateLocalized(dateString, i18n.language);
  }, [i18n.language]);

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

  const hasFormChanges = useMemo(() => {
    return description !== "" || type !== "" || mileage !== "" || cost !== "" || location !== "" || receiptImages.length > 0;
  }, [description, type, mileage, cost, location, receiptImages]);

  const handleCloseForm = useUnsavedChanges(hasFormChanges && !editingRecord, () => {
    resetForm();
    hapticFeedback.light();
  });

  const sortedServiceRecords = useMemo(() => {
    return [...serviceRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [serviceRecords]);

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
            <Text style={styles.addButtonText}>{t('register_service')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{editingRecord ? t('edit_service') : t('new_service')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseForm}
              >
                <X size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>{t('date')} <Text style={styles.required}>*</Text></Text>
                <DatePicker
                  value={date}
                  onChange={setDate}
                  placeholder={t('select_date')}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>{t('service_mileage')} <Text style={styles.required}>*</Text></Text>
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
              <Text style={styles.label}>{t('service_type_label')} <Text style={styles.required}>*</Text></Text>
              <View style={styles.typeChips}>
                {SERVICE_TYPE_KEYS.map((typeKey) => {
                  const label = t(typeKey);
                  return (
                    <TouchableOpacity
                      key={typeKey}
                      style={[styles.typeChip, type === typeKey && styles.typeChipActive]}
                      onPress={() => {
                        const newType = type === typeKey ? "" : typeKey;
                        setType(newType);
                        if (newType && !description) {
                          setDescription(t(newType));
                        } else if (newType && description === t(type)) {
                          setDescription(t(newType));
                        }
                        hapticFeedback.selection();
                      }}
                    >
                      <Text style={[styles.typeChipText, type === typeKey && styles.typeChipTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('description')} <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder={t('what_was_done')}
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
                <Text style={styles.label}>{t('cost')} (kr)</Text>
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
                <Text style={styles.label}>{t('workshop')}</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder={t('location')}
                  placeholderTextColor={Colors.text.light}
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('receipts')}</Text>
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handleShowImageOptions}
                activeOpacity={0.8}
              >
                <Camera size={20} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.addImageText}>{t('add_image')}</Text>
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
              style={[styles.submitButton, isSaving && { opacity: 0.6 }]}
              onPress={handleAdd}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              <Check size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.submitButtonText}>{isSaving ? t('saving') : (editingRecord ? t('update_service') : t('save_service'))}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('service_history')}</Text>

        {serviceRecords.length === 0 ? (
          <EmptyState
            icon={<FileText size={32} color={Colors.text.light} strokeWidth={1.5} />}
            title={t('no_service_registered')}
            description={t('log_service_desc')}
          />
        ) : (
          <View style={styles.recordsList}>
            {sortedServiceRecords.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordIcon}>
                    <Wrench size={18} color={Colors.success} strokeWidth={2} />
                  </View>
                  <View style={styles.recordMeta}>
                    <Text style={styles.recordType}>{SERVICE_TYPE_KEYS.includes(record.type as any) ? t(record.type) : record.type}</Text>
                    <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                  </View>
                  <View style={styles.recordActions}>
                    <TouchableOpacity
                      onPress={() => handleEdit(record)}
                      style={styles.editButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Pencil size={16} color={Colors.primary} strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(record.id)}
                      style={styles.deleteButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={18} color={Colors.danger} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.recordDescription}>{record.description}</Text>

                <View style={styles.recordDetails}>
                  <View style={styles.recordDetailItem}>
                    <Text style={styles.recordDetailLabel}>{t('service_mileage')}</Text>
                    <Text style={styles.recordDetailValue}>
                      {record.mileage.toLocaleString(i18n.language)} km
                    </Text>
                  </View>
                  {record.cost && (
                    <View style={styles.recordDetailItem}>
                      <Text style={styles.recordDetailLabel}>{t('cost')}</Text>
                      <Text style={[styles.recordDetailValue, { color: Colors.success }]}>
                        {record.cost.toLocaleString(i18n.language)} kr
                      </Text>
                    </View>
                  )}
                  {record.location && (
                    <View style={styles.recordDetailItem}>
                      <Text style={styles.recordDetailLabel}>{t('workshop')}</Text>
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
    ...typography.button,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: Colors.text.primary,
    marginBottom: 14,
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
    ...typography.cardTitle,
    color: Colors.text.primary,
  },
  recordDate: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  recordActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editButton: {
    padding: 8,
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
