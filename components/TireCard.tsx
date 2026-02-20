import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react-native";
import Colors, { typography, palette } from "@/constants/colors";
import { TireSet } from "@/types/car";
import { calculateAge } from "@/lib/utils";
import React from "react";

interface TireCardProps {
  tire: TireSet;
  onSetActive: (id: string) => void;
  onEdit: (tire: TireSet) => void;
  onDelete: (id: string) => void;
}

function TireCard({ tire, onSetActive, onEdit, onDelete }: TireCardProps) {
  const { t } = useTranslation();
  const age = calculateAge(tire.purchaseDate);
  const isOld = age.years >= 6;

  return (
    <TouchableOpacity
      style={[styles.tireCard, tire.isActive && styles.tireCardActive]}
      onPress={() => onSetActive(tire.id)}
      activeOpacity={0.8}
      testID={`tire-card-${tire.id}`}
    >
      <View style={styles.tireHeader}>
        {tire.isActive ? (
          <CheckCircle2 size={22} color={Colors.primary} strokeWidth={2.5} />
        ) : (
          <Circle size={22} color={palette.slate300} strokeWidth={2} />
        )}
        <View style={styles.tireInfo}>
          <Text style={styles.tireBrand}>{tire.brand}</Text>
          <Text style={styles.tireSize}>{tire.size}</Text>
        </View>
        <View style={styles.tireActions}>
          <TouchableOpacity
            onPress={() => onEdit(tire)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.editBtn}
          >
            <Pencil size={16} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(tire.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.deleteBtn}
          >
            <Trash2 size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tireDetails}>
        <View style={styles.tireDetailItem}>
          <Clock size={14} color={Colors.text.light} />
          <Text style={[styles.tireDetailText, isOld && styles.tireDetailWarning]}>
            {age.years} {t("years_short")} {age.months} {t("months_short")}
          </Text>
        </View>
        {tire.isAtTireHotel && (
          <View style={styles.tireDetailItem}>
            <MapPin size={14} color={Colors.primary} />
            <Text style={styles.tireDetailText}>
              {tire.hotelLocation || t("tire_hotel")}
            </Text>
          </View>
        )}
      </View>

      {isOld && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningBannerText}>{t("recommend_replace")}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default React.memo(TireCard);

const styles = StyleSheet.create({
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
    backgroundColor: palette.activeCardBg,
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
  tireActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  editBtn: {
    padding: 8,
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
    borderTopColor: palette.slate100,
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
    backgroundColor: palette.amber50,
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  warningBannerText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: palette.amber600,
  },
});
