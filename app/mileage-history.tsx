import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Gauge,
  ArrowLeft,
  History,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useCarData } from "@/contexts/car-context";
import Colors from "@/constants/colors";
import { useState, useMemo } from "react";
import { Calendar, LocaleConfig } from "react-native-calendars";

LocaleConfig.locales['no'] = {
  monthNames: [
    'Januar',
    'Februar',
    'Mars',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Desember'
  ],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'],
  dayNames: ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'],
  dayNamesShort: ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'],
  today: 'I dag'
};
LocaleConfig.defaultLocale = 'no';

export default function MileageHistoryScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { carInfo, mileageRecords, addMileageRecord, updateMileageRecord, deleteMileageRecord } = useCarData();
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<{ id: string; mileage: number; date: string } | null>(null);
  const [newMileage, setNewMileage] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCalendar, setShowCalendar] = useState(false);

  const allRecords = useMemo(() => {
    if (!carInfo) return [];

    const userRecords = mileageRecords.map(r => ({
      id: r.id || '',
      mileage: r.mileage,
      date: r.date,
      source: 'user' as const,
      type: 'reading',
    }));
    
    return userRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [mileageRecords, carInfo]);

  if (!carInfo) {
    return (
      <View style={styles.container}>
        <Text>{t('no_car_selected')}</Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'nb' ? 'no-NO' : i18n.language;
    return new Date(dateString).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const openAddModal = () => {
    setNewMileage("");
    setNewDate(new Date().toISOString().split('T')[0]);
    setShowCalendar(false);
    setIsAddModalVisible(true);
  };

  const closeAddModal = () => {
    setIsAddModalVisible(false);
    setShowCalendar(false);
  };

  const closeEditModal = () => {
    setIsEditModalVisible(false);
    setShowCalendar(false);
  };

  const handleAddMileage = () => {
    const mileageNum = parseInt(newMileage, 10);
    if (!mileageNum || mileageNum <= 0) {
      Alert.alert(t('error'), t('enter_valid_mileage'));
      return;
    }

    addMileageRecord({
      mileage: mileageNum,
      date: newDate,
    });

    closeAddModal();
  };

  const handleEditMileage = () => {
    if (!editingRecord) return;

    const mileageNum = parseInt(newMileage, 10);
    if (!mileageNum || mileageNum <= 0) {
      Alert.alert(t('error'), t('enter_valid_mileage'));
      return;
    }

    updateMileageRecord(editingRecord.id, {
      mileage: mileageNum,
      date: newDate,
    });

    setEditingRecord(null);
    closeEditModal();
  };

  const handleDeleteMileage = (id: string) => {
    Alert.alert(
      t('delete_mileage'),
      t('delete_mileage_confirm'),
      [
        { text: t('cancel'), style: "cancel" },
        {
          text: t('delete'),
          style: "destructive",
          onPress: () => deleteMileageRecord(id),
        },
      ]
    );
  };

  const openEditModal = (record: { id: string; mileage: number; date: string }) => {
    setEditingRecord(record);
    setNewMileage(record.mileage.toString());
    setNewDate(record.date);
    setIsEditModalVisible(true);
    setShowCalendar(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('mileage')}</Text>
          <TouchableOpacity 
            onPress={openAddModal}
            style={styles.addButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Plus size={24} color={Colors.primary} />
          </TouchableOpacity> 
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statsLabel}>{t('current_reading')}</Text>
              <Text style={styles.statsValue}>
                {carInfo.currentMileage?.toLocaleString(i18n.language === 'nb' ? 'no-NO' : i18n.language)} km
              </Text>
            </View>
            <View style={styles.statsIcon}>
              <Gauge size={24} color={Colors.primary} />
            </View>
          </View>
          {allRecords.length > 1 && (
            <View style={styles.statsFooter}>
              <TrendingUp size={14} color={Colors.success} />
              <Text style={styles.statsFooterText}>
                {t('km_since_last', { value: allRecords[0].mileage - allRecords[1].mileage })}
              </Text>
            </View>
          )}
        </View>

      </View>

      <FlatList
        data={allRecords}
        keyExtractor={(item) => item.id || item.date}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const isFirst = index === 0;
          return (
            <View style={styles.timelineItem}>
              <View style={styles.timelineLeft}>
                <View style={[
                  styles.timelineDot, 
                  isFirst && styles.timelineDotActive,
                ]}>
                  <Gauge size={12} color="#fff" />
                </View>
                {index !== allRecords.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              
              <View style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
                  <View style={styles.recordActions}>
                    <TouchableOpacity 
                      onPress={() => openEditModal(item)}
                      style={styles.actionButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Edit2 size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleDeleteMileage(item.id)}
                      style={styles.actionButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={styles.recordMileage}>
                  {item.mileage.toLocaleString(i18n.language === 'nb' ? 'no-NO' : i18n.language)} km
                </Text>
                
                {index < allRecords.length - 1 && (
                  <Text style={styles.recordDiff}>
                    +{item.mileage - allRecords[index + 1].mileage} km
                  </Text>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <History size={48} color={Colors.text.light} />
            <Text style={styles.emptyText}>{t('no_mileage_recorded')}</Text>
            <Text style={styles.emptySubtext}>{t('tap_to_add')}</Text>
          </View>
        }
      />

      {/* Add Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeAddModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
        <Pressable 
          style={styles.modalOverlay}
          onPress={closeAddModal}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('add_mileage')}</Text>
              <TouchableOpacity onPress={closeAddModal}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('mileage')}</Text>
                <TextInput
                  style={styles.input}
                  value={newMileage}
                  onChangeText={setNewMileage}
                  placeholder={t('mileage_placeholder')}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.text.light}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('date')}</Text>
                <TouchableOpacity 
                  style={styles.dateInputContainer}
                  onPress={() => {
                    if (!showCalendar) Keyboard.dismiss();
                    setShowCalendar(!showCalendar);
                  }}
                >
                  <CalendarIcon size={20} color={Colors.text.secondary} />
                  <Text style={styles.dateInputText}>{formatDate(newDate)}</Text>
                </TouchableOpacity>
                {showCalendar && (
                  <View style={styles.calendarContainer}>
                    <Calendar
                      enableSwipeMonths={true}
                      current={newDate}
                      onDayPress={(day: { dateString: string }) => {
                        setNewDate(day.dateString);
                        setShowCalendar(false);
                      }}
                      markedDates={{
                        [newDate]: {selected: true, selectedColor: Colors.primary}
                      }}
                      renderArrow={(direction: 'left' | 'right') => (
                        direction === 'left' ? 
                        <ChevronLeft size={24} color={Colors.primary} /> : 
                        <ChevronRight size={24} color={Colors.primary} />
                      )}
                      theme={{
                        todayTextColor: Colors.primary,
                        arrowColor: Colors.primary,
                        textDayFontWeight: '500',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: '500',
                      }}
                    />
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleAddMileage}
              >
                <Text style={styles.modalButtonText}>{t('add_btn')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeEditModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
        <Pressable 
          style={styles.modalOverlay}
          onPress={closeEditModal}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('edit_mileage')}</Text>
              <TouchableOpacity onPress={closeEditModal}>
                <X size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('mileage')}</Text>
                <TextInput
                  style={styles.input}
                  value={newMileage}
                  onChangeText={setNewMileage}
                  placeholder={t('mileage_placeholder')}
                  keyboardType="numeric"
                  placeholderTextColor={Colors.text.light}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('date')}</Text>
                <TouchableOpacity 
                  style={styles.dateInputContainer}
                  onPress={() => {
                    if (!showCalendar) Keyboard.dismiss();
                    setShowCalendar(!showCalendar);
                  }}
                >
                  <CalendarIcon size={20} color={Colors.text.secondary} />
                  <Text style={styles.dateInputText}>{formatDate(newDate)}</Text>
                </TouchableOpacity>
                {showCalendar && (
                  <View style={styles.calendarContainer}>
                    <Calendar
                      enableSwipeMonths={true}
                      current={newDate}
                      onDayPress={(day: { dateString: string }) => {
                        setNewDate(day.dateString);
                        setShowCalendar(false);
                      }}
                      markedDates={{
                        [newDate]: {selected: true, selectedColor: Colors.primary}
                      }}
                      renderArrow={(direction: 'left' | 'right') => (
                        direction === 'left' ? 
                        <ChevronLeft size={24} color={Colors.primary} /> : 
                        <ChevronRight size={24} color={Colors.primary} />
                      )}
                      theme={{
                        todayTextColor: Colors.primary,
                        arrowColor: Colors.primary,
                        textDayFontWeight: '500',
                        textMonthFontWeight: 'bold',
                        textDayHeaderFontWeight: '500',
                      }}
                    />
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleEditMileage}
              >
                <Text style={styles.modalButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    height: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
  },
  statsCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 4,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statsValue: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -1,
  },
  statsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  statsFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 6,
    backgroundColor: "#F0FDF4",
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statsFooterText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: "600",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    padding: 4,
    borderRadius: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  activeTabText: {
    color: Colors.text.primary,
  },
  
  // List
  listContent: {
    padding: 20,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 0,
  },
  timelineLeft: {
    alignItems: "center",
    width: 24,
    marginRight: 16,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    borderWidth: 2,
    borderColor: "#F2F4F7",
  },
  timelineDotActive: {
    transform: [{ scale: 1.1 }],
    borderColor: "#fff",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  timelineDotVegvesen: {
    backgroundColor: Colors.text.secondary,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#E5E7EB",
    marginVertical: 4,
  },
  recordCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recordActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  recordDate: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  sourceTag: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sourceTagUser: {
    backgroundColor: "#EFF6FF",
  },
  sourceTagVegvesen: {
    backgroundColor: "#F3F4F6",
  },
  sourceTagText: {
    fontSize: 10,
    fontWeight: "700",
  },
  sourceTagTextUser: {
    color: Colors.primary,
  },
  sourceTagTextVegvesen: {
    color: Colors.text.secondary,
  },
  recordMileage: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  recordDiff: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 4,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: "600",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.text.light,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  dateInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
  },
  dateInputText: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
  },
  calendarContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
