import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import { useState, useMemo, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  label?: string;
}

const WEEKDAYS = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];
const MONTHS = [
  "Januar", "Februar", "Mars", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Desember"
];

export default function DatePicker({ value, onChange, placeholder = "Velg dato", label }: DatePickerProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  const initialDate = useMemo(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  }, [value]);

  const [viewDate, setViewDate] = useState(initialDate);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayOfMonth = useMemo(() => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  }, [year, month]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }, [firstDayOfMonth, daysInMonth]);

  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return null;
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth(),
      day: parsed.getDate(),
    };
  }, [value]);

  const isSelected = useCallback((day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.year === year &&
      selectedDate.month === month &&
      selectedDate.day === day
    );
  }, [selectedDate, year, month]);

  const isToday = useCallback((day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  }, [year, month]);

  const handleDayPress = useCallback((day: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(dateStr);
    setIsVisible(false);
  }, [year, month, onChange]);

  const goToPrevMonth = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setViewDate(new Date(year, month - 1, 1));
  }, [year, month]);

  const goToNextMonth = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setViewDate(new Date(year, month + 1, 1));
  }, [year, month]);

  const formatDisplayDate = useMemo(() => {
    if (!value) return placeholder;
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return placeholder;
    return parsed.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [value, placeholder]);

  const openPicker = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setViewDate(parsed);
      }
    }
    setIsVisible(true);
  }, [value]);

  return (
    <>
      <TouchableOpacity
        style={styles.input}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <Calendar size={18} color={Colors.text.secondary} />
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {formatDisplayDate}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.calendarContainer}>
                <View style={styles.header}>
                  <TouchableOpacity
                    onPress={goToPrevMonth}
                    style={styles.navButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <ChevronLeft size={24} color={Colors.text.primary} />
                  </TouchableOpacity>
                  <Text style={styles.monthYearText}>
                    {MONTHS[month]} {year}
                  </Text>
                  <TouchableOpacity
                    onPress={goToNextMonth}
                    style={styles.navButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <ChevronRight size={24} color={Colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.weekdaysRow}>
                  {WEEKDAYS.map((day) => (
                    <View key={day} style={styles.weekdayCell}>
                      <Text style={styles.weekdayText}>{day}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.daysGrid}>
                  {calendarDays.map((day, index) => (
                    <View key={index} style={styles.dayCell}>
                      {day !== null && (
                        <TouchableOpacity
                          style={[
                            styles.dayButton,
                            isSelected(day) && styles.selectedDay,
                            isToday(day) && !isSelected(day) && styles.todayDay,
                          ]}
                          onPress={() => handleDayPress(day)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              isSelected(day) && styles.selectedDayText,
                              isToday(day) && !isSelected(day) && styles.todayDayText,
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsVisible(false)}
                >
                  <Text style={styles.closeButtonText}>Lukk</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  inputText: {
    fontSize: 16,
    color: Colors.text.primary,
    flex: 1,
  },
  placeholderText: {
    color: Colors.text.light,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 360,
  },
  calendarContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  weekdaysRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  weekdayCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    padding: 2,
  },
  dayButton: {
    flex: 1,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedDay: {
    backgroundColor: Colors.primary,
  },
  todayDay: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.text.primary,
  },
  selectedDayText: {
    color: "#fff",
    fontWeight: "700" as const,
  },
  todayDayText: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
  closeButton: {
    marginTop: 16,
    padding: 14,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
});
