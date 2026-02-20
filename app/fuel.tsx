import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Alert,
  Keyboard,
  InputAccessoryView,
} from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useCallback, useMemo } from "react";
import {
  Fuel,
  Plus,
  Trash2,
  X,
  Droplet,
  Coins,
  Gauge,
  Calendar,
  TrendingUp,
  Pencil,
  Keyboard as KeyboardIcon,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useCarData } from "@/contexts/car-context";
import Colors from "@/constants/colors";
import DatePicker from "@/components/DatePicker";
import type { FuelRecord } from "@/types/car";

export default function FuelScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { carInfo, fuelRecords, addFuelRecord, updateFuelRecord, deleteFuelRecord } = useCarData();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [liters, setLiters] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [currentMileage, setCurrentMileage] = useState("");
  const [notes, setNotes] = useState("");
  const [isFullTank, setIsFullTank] = useState(true);
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().split("T")[0]);
  const inputAccessoryViewID = "fuel-keyboard-toolbar";

  const resetForm = useCallback(() => {
    setLiters("");
    setPricePerLiter("");
    setCurrentMileage("");
    setNotes("");
    setIsFullTank(true);
    setFuelDate(new Date().toISOString().split("T")[0]);
    setEditingRecord(null);
    setIsModalVisible(false);
  }, []);

  const formatPriceInput = useCallback((value: string) => {
    const cleaned = value.replace(/[^0-9,\.]/g, "").replace(",", ".");
    setPricePerLiter(cleaned);
  }, []);

  const formatPriceOnBlur = useCallback(() => {
    if (pricePerLiter) {
      const num = parseFloat(pricePerLiter.replace(",", "."));
      if (!isNaN(num)) {
        setPricePerLiter(num.toFixed(2).replace(".", ","));
      }
    }
  }, [pricePerLiter]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const sortedRecords = useMemo(() => {
    return [...fuelRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [fuelRecords]);

  const stats = useMemo(() => {
    if (sortedRecords.length < 2) return null;

    let totalLiters = 0;
    let totalCost = 0;
    const chronological = [...sortedRecords].reverse();
    let validConsumptionCount = 0;
    let totalConsumption = 0;

    for (let i = 1; i < chronological.length; i++) {
      const current = chronological[i];
      const prev = chronological[i - 1];

      if (current.mileage && prev.mileage) {
        const dist = current.mileage - prev.mileage;
        if (dist > 0 && current.fullTank) {
          const consumption = (current.liters / dist) * 10;
          totalConsumption += consumption;
          validConsumptionCount++;
        }
      }

      if (current.liters) totalLiters += current.liters;
      if (current.totalCost) totalCost += current.totalCost;
      else if (current.liters && current.pricePerLiter) totalCost += (current.liters * current.pricePerLiter);
    }

    if (chronological.length > 0) {
      const first = chronological[0];
      if (first.liters) totalLiters += first.liters;
      if (first.totalCost) totalCost += first.totalCost;
      else if (first.liters && first.pricePerLiter) totalCost += (first.liters * first.pricePerLiter);
    }

    const avgConsumption = validConsumptionCount > 0 ? totalConsumption / validConsumptionCount : 0;

    return {
      avgConsumption: avgConsumption.toFixed(2),
      totalCost: Math.round(totalCost),
      totalLiters: Math.round(totalLiters),
    };
  }, [sortedRecords]);

  const handleSaveFuel = useCallback(() => {
    if (!liters || !currentMileage) {
      Alert.alert(t('missing_info'), t('fuel_missing_fields'));
      return;
    }

    const litersNum = parseFloat(liters.replace(",", "."));
    const priceNum = pricePerLiter ? parseFloat(pricePerLiter.replace(",", ".")) : undefined;
    const mileageNum = parseInt(currentMileage.replace(/\s/g, ""), 10);

    if (isNaN(litersNum) || isNaN(mileageNum)) {
      Alert.alert(t('invalid_value'), t('fuel_check_numbers'));
      return;
    }

    const totalCost = priceNum ? litersNum * priceNum : undefined;

    const recordData = {
      date: new Date(fuelDate).toISOString(),
      liters: litersNum,
      pricePerLiter: priceNum,
      totalCost,
      mileage: mileageNum,
      fullTank: isFullTank,
      notes: notes.trim() || undefined,
    };

    if (editingRecord) {
      updateFuelRecord(editingRecord, recordData);
    } else {
      addFuelRecord(recordData);
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    resetForm();
  }, [liters, pricePerLiter, currentMileage, notes, isFullTank, fuelDate, editingRecord, addFuelRecord, updateFuelRecord, resetForm, t]);

  const handleEdit = useCallback((record: FuelRecord) => {
    setEditingRecord(record.id);
    setFuelDate(new Date(record.date).toISOString().split("T")[0]);
    setLiters(record.liters.toString());
    setPricePerLiter(record.pricePerLiter?.toString().replace(".", ",") || "");
    setCurrentMileage(record.mileage?.toString() || "");
    setNotes(record.notes || "");
    setIsFullTank(record.fullTank ?? true);
    setIsModalVisible(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      t('fuel_delete_title'),
      t('fuel_delete_confirm'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('delete'),
          style: "destructive",
          onPress: () => {
            deleteFuelRecord(id);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
          },
        },
      ]
    );
  }, [deleteFuelRecord, t]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language === 'nb' ? 'no-NO' : i18n.language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, [i18n.language]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('fuel'),
          headerStyle: { backgroundColor: "#F8FAFC" },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {stats && (
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: "#ECFEFF" }]}>
                  <TrendingUp size={18} color="#0E7490" />
                </View>
                <View>
                  <Text style={styles.statLabel}>{t('avg_consumption')}</Text>
                  <Text style={styles.statValue}>{stats.avgConsumption} l/mil</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: "#ECFDF5" }]}>
                  <Coins size={18} color="#059669" />
                </View>
                <View>
                  <Text style={styles.statLabel}>{t('total_cost')}</Text>
                  <Text style={styles.statValue}>{stats.totalCost.toLocaleString(i18n.language === 'nb' ? 'no-NO' : i18n.language)} kr</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (carInfo?.currentMileage) {
              setCurrentMileage(carInfo.currentMileage.toString());
            }
            setFuelDate(new Date().toISOString().split("T")[0]);
            setIsModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Plus size={22} color="#fff" strokeWidth={2.5} />
          <Text style={styles.addButtonText}>{t('register_fuel')}</Text>
        </TouchableOpacity>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{t('history')}</Text>
        </View>

        {sortedRecords.length > 0 ? (
          <View style={styles.list}>
            {sortedRecords.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.dateContainer}>
                    <Calendar size={14} color={Colors.text.light} />
                    <Text style={styles.dateText}>{formatDate(record.date)}</Text>
                  </View>
                  <View style={styles.recordActions}>
                    <TouchableOpacity
                      onPress={() => handleEdit(record)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.actionBtn}
                    >
                      <Pencil size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(record.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.actionBtn}
                    >
                      <Trash2 size={16} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.recordDetails}>
                  <View style={styles.detailItem}>
                    <Droplet size={18} color={Colors.primary} />
                    <Text style={styles.detailValue}>{record.liters} L</Text>
                  </View>

                  {record.pricePerLiter != null && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>{t('price_per_liter_short')}:</Text>
                      <Text style={styles.detailValue}>{record.pricePerLiter} kr</Text>
                    </View>
                  )}

                  {record.totalCost != null && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailValueBold}>{Math.round(record.totalCost)} kr</Text>
                    </View>
                  )}
                </View>

                {record.mileage != null && (
                  <View style={styles.mileageRow}>
                    <Gauge size={14} color={Colors.text.light} />
                    <Text style={styles.mileageText}>{record.mileage.toLocaleString(i18n.language === 'nb' ? 'no-NO' : i18n.language)} km</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Fuel size={40} color={Colors.text.light} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>{t('no_fuel_records')}</Text>
            <Text style={styles.emptyText}>{t('no_fuel_desc')}</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={resetForm}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRecord ? t('edit_fuel') : t('new_fuel')}
              </Text>
              <TouchableOpacity onPress={resetForm}>
                <X size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('date')}</Text>
                <DatePicker
                  value={fuelDate}
                  onChange={setFuelDate}
                  placeholder={t('select_date')}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('liters')}</Text>
                <View style={styles.inputContainer}>
                  <Droplet size={20} color={Colors.text.light} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={liters}
                    onChangeText={setLiters}
                    placeholder="0.0"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#94A3B8"
                    returnKeyType="done"
                    inputAccessoryViewID={Platform.OS === "ios" ? inputAccessoryViewID : undefined}
                  />
                  <Text style={styles.unit}>L</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('price_per_liter')}</Text>
                <View style={styles.inputContainer}>
                  <Coins size={20} color={Colors.text.light} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={pricePerLiter}
                    onChangeText={formatPriceInput}
                    onBlur={formatPriceOnBlur}
                    placeholder="00,00"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#94A3B8"
                    returnKeyType="done"
                    inputAccessoryViewID={Platform.OS === "ios" ? inputAccessoryViewID : undefined}
                  />
                  <Text style={styles.unit}>kr</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('mileage')}</Text>
                <View style={styles.inputContainer}>
                  <Gauge size={20} color={Colors.text.light} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={currentMileage}
                    onChangeText={setCurrentMileage}
                    placeholder="0"
                    keyboardType="number-pad"
                    placeholderTextColor="#94A3B8"
                    returnKeyType="done"
                    inputAccessoryViewID={Platform.OS === "ios" ? inputAccessoryViewID : undefined}
                  />
                  <Text style={styles.unit}>km</Text>
                </View>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.label}>{t('full_tank')}</Text>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[styles.toggleOption, isFullTank && styles.toggleOptionActive]}
                    onPress={() => setIsFullTank(true)}
                  >
                    <Text style={[styles.toggleOptionText, isFullTank && styles.toggleOptionTextActive]}>
                      {t('yes')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleOption, !isFullTank && styles.toggleOptionActive]}
                    onPress={() => setIsFullTank(false)}
                  >
                    <Text style={[styles.toggleOptionText, !isFullTank && styles.toggleOptionTextActive]}>
                      {t('no')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('notes_optional')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={t('fuel_notes_placeholder')}
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveFuel}>
                <Text style={styles.saveButtonText}>
                  {editingRecord ? t('update') : t('save')}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={styles.keyboardToolbar}>
            <TouchableOpacity style={styles.keyboardDoneButton} onPress={dismissKeyboard}>
              <KeyboardIcon size={18} color={Colors.primary} />
              <Text style={styles.keyboardDoneText}>{t('done')}</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}
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
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
  },
  addButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  listHeader: {
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  list: {
    gap: 12,
  },
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: "500" as const,
  },
  recordActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionBtn: {
    padding: 8,
  },
  recordDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  detailValueBold: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  mileageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  mileageText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  form: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text.primary,
  },
  unit: {
    fontSize: 14,
    color: Colors.text.light,
    fontWeight: "600" as const,
    marginLeft: 8,
  },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
  },
  toggleOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 60,
    alignItems: "center",
  },
  toggleOptionActive: {
    backgroundColor: Colors.primary,
  },
  toggleOptionText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  toggleOptionTextActive: {
    color: "#fff",
  },
  keyboardToolbar: {
    backgroundColor: "#F8FAFC",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  keyboardDoneButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    gap: 6,
  },
  keyboardDoneText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
});
