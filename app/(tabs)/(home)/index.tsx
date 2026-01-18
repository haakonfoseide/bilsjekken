import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useMemo } from "react";
import {
  Car,
  Droplet,
  Wrench,
  Gauge,
  CircleSlash2,
  ChevronRight,
  ScanLine,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Fuel,

  ShieldCheck,
  Info,
  Settings,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useCarData } from "@/contexts/car-context";
import Colors from "@/constants/colors";

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  
  const {
    carInfo,
    getLastWash,
    getNextService,
    getTireAge,
    cars,
    setActiveCar,
  } = useCarData();

  const lastWash = getLastWash();
  const nextService = getNextService();
  const tireAge = getTireAge();

  const handlePress = useCallback((route: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as never);
  }, [router]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('today');
    if (diffDays === 1) return t('yesterday');
    if (diffDays < 7) return t('days_ago', { count: diffDays });
    if (diffDays < 30) return t('weeks_ago', { count: Math.floor(diffDays / 7) });
    if (diffDays < 365) return t('months_ago', { count: Math.floor(diffDays / 30) });
    return t('years_ago', { count: Math.floor(diffDays / 365) });
  }, [t]);

  const formatDateSimple = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return t('unknown');
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }, [t, i18n.language]);

  const carHighlights = useMemo(() => {
    if (!carInfo) return [];

    const items: {
      key: "fuel" | "insurance";
      label: string;
      value: string;
      icon: "Fuel" | "ShieldCheck";
      tint: string;
      bg: string;
      border: string;
    }[] = [];

    const fuelValue = (carInfo.fuelType ?? "").trim();
    if (fuelValue) {
      items.push({
        key: "fuel",
        label: t('fuel'),
        value: fuelValue,
        icon: "Fuel",
        tint: "#0E7490",
        bg: "#ECFEFF",
        border: "#A5F3FC",
      });
    }

    const insuranceValue = (carInfo.insurance ?? "").trim();
    // Always show insurance button
    items.push({
      key: "insurance",
      label: t('insurance'),
      value: insuranceValue || t('insurance'),
      icon: "ShieldCheck",
      tint: "#15803D",
      bg: "#ECFDF5",
      border: "#BBF7D0",
    });

    return items;
  }, [carInfo, t]);



  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 100 : 40 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {cars.length > 0 ? (
          <>
            <View style={[styles.header, { paddingTop: insets.top + 24, paddingBottom: 16 }]}>
              <Text style={styles.headerTitle}>{t('my_car')}</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => handlePress("/app-settings")}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Settings size={22} color={Colors.text.secondary} strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => handlePress("/add-car")}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Plus size={22} color={Colors.primary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {cars.length > 1 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carSelectorContent}
                style={styles.carSelector}
              >
                {cars.map((car) => {
                  const isActive = car.id === carInfo?.id;
                  return (
                    <TouchableOpacity
                      key={car.id}
                      style={[
                        styles.carChip,
                        isActive && styles.carChipActive,
                      ]}
                      onPress={() => {
                        if (car.id !== carInfo?.id) {
                          setActiveCar(car.id);
                          if (Platform.OS !== "web") {
                            Haptics.selectionAsync();
                          }
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.carChipText, isActive && styles.carChipTextActive]}>
                        {car.licensePlate}
                      </Text>
                      {isActive && (
                        <CheckCircle2 size={14} color="#fff" strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {carInfo && (
              <View style={styles.content}>
                <View style={styles.carCard}>
                  <View style={styles.carCardHeader}>
                    <View style={styles.carIconContainer}>
                      <Car size={28} color="#fff" strokeWidth={2} />
                    </View>
                    <View style={styles.carInfo}>
                      <Text style={styles.carName} numberOfLines={1}>
                        {carInfo.make} {carInfo.model}
                      </Text>
                      <View style={styles.carMeta}>
                        <View style={styles.plateBadge}>
                          <Text style={styles.plateText}>{carInfo.licensePlate}</Text>
                        </View>
                        <Text style={styles.carYear}>{carInfo.year}</Text>
                      </View>
                    </View>
                  </View>

                  {carHighlights.length > 0 && (
                    <View style={styles.highlightsRow} testID="car-highlights">
                      {carHighlights.map((it: (typeof carHighlights)[number]) => {
                        const Icon = it.icon === "Fuel" ? Fuel : ShieldCheck;

                        const isClickable = it.key === "insurance" || it.key === "fuel";
                        const ChipWrapper = isClickable ? TouchableOpacity : View;
                        const getChipRoute = () => {
                          if (it.key === "insurance") return "/insurance-documents";
                          if (it.key === "fuel") return "/fuel";
                          return "";
                        };
                        const chipProps = isClickable ? {
                          onPress: () => handlePress(getChipRoute()),
                          activeOpacity: 0.7,
                        } : {};

                        return (
                          <ChipWrapper
                            key={it.key}
                            style={[
                              styles.highlightChip,
                              { backgroundColor: it.bg, borderColor: it.border },
                            ]}
                            testID={`car-highlight-${it.key}`}
                            {...chipProps}
                          >
                            <View style={[styles.highlightIcon, { backgroundColor: it.tint + "14" }]}>
                              <Icon size={16} color={it.tint} strokeWidth={2.5} />
                            </View>
                            <Text style={[styles.highlightValue, { color: it.tint }]} numberOfLines={1}>
                              {it.value}
                            </Text>
                          </ChipWrapper>
                        );
                      })}
                    </View>
                  )}

                  <View style={styles.statsRow}>
                    <TouchableOpacity 
                      style={styles.statItem}
                      onPress={() => handlePress("/mileage-history")}
                      activeOpacity={0.7}
                    >
                      <View style={styles.statHeader}>
                        <Gauge size={16} color={Colors.primary} />
                        <Text style={styles.statLabel}>{t('mileage')}</Text>
                        <ChevronRight size={14} color={Colors.text.light} />
                      </View>
                      <Text style={styles.statValue}>
                        {Number.isFinite(carInfo.currentMileage)
                          ? `${carInfo.currentMileage.toLocaleString(i18n.language)} km`
                          : "—"}
                      </Text>
                      {carInfo.registeredMileage && carInfo.registeredMileage > carInfo.currentMileage && (
                        <View style={styles.warningBadge}>
                          <AlertCircle size={10} color={Colors.danger} />
                          <Text style={styles.warningText}>
                            {t('vegvesenet_mileage', { value: carInfo.registeredMileage.toLocaleString(i18n.language) })}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                      <View style={styles.statHeader}>
                        <Calendar size={16} color={Colors.success} />
                        <Text style={styles.statLabel}>{t('eu_control')}</Text>
                      </View>
                      <Text style={styles.statValue}>
                        {carInfo.nextEuControlDate 
                          ? formatDateSimple(carInfo.nextEuControlDate)
                          : t('unknown')
                        }
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.quickActions}>
                  <TouchableOpacity
                    style={[styles.quickAction, { backgroundColor: "#EBF5FF" }]}
                    onPress={() => handlePress("/wash")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: "#DBEAFE" }]}>
                      <Droplet size={20} color="#2563EB" strokeWidth={2.5} />
                    </View>
                    <View style={styles.quickActionContent}>
                      <Text style={[styles.quickActionTitle, { color: "#1E40AF" }]}>{t('wash')}</Text>
                      <Text style={[styles.quickActionValue, { color: "#3B82F6" }]}>
                        {lastWash ? formatDate(lastWash.date) : t('not_registered')}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#93C5FD" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickAction, { backgroundColor: "#ECFDF5" }]}
                    onPress={() => handlePress("/service")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: "#D1FAE5" }]}>
                      <Wrench size={20} color="#059669" strokeWidth={2.5} />
                    </View>
                    <View style={styles.quickActionContent}>
                      <Text style={[styles.quickActionTitle, { color: "#065F46" }]}>{t('service')}</Text>
                      <Text style={[styles.quickActionValue, { color: "#10B981" }]}>
                        {nextService
                          ? nextService.mileage > 0
                            ? t('km_until', { value: nextService.mileage.toLocaleString(i18n.language) })
                            : t('overdue')
                          : t('not_planned')}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#6EE7B7" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.quickAction, { backgroundColor: "#FEF2F2" }]}
                    onPress={() => handlePress("/tires")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.quickActionIcon, { backgroundColor: "#FEE2E2" }]}>
                      <CircleSlash2 size={20} color="#DC2626" strokeWidth={2.5} />
                    </View>
                    <View style={styles.quickActionContent}>
                      <Text style={[styles.quickActionTitle, { color: "#991B1B" }]}>{t('tires')}</Text>
                      <Text style={[styles.quickActionValue, { color: "#EF4444" }]}>
                        {tireAge ? t('year_old', { count: tireAge.years }) : t('not_registered')}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#FCA5A5" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.vehicleInfoCta}
                  onPress={() => handlePress("/vehicle-info")}
                  activeOpacity={0.8}
                  testID="vehicle-info-cta"
                >
                  <View style={styles.vehicleInfoCtaLeft}>
                    <View style={styles.vehicleInfoCtaIcon}>
                      <Info size={20} color={Colors.primary} strokeWidth={2.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vehicleInfoCtaTitle}>{t('information')}</Text>
                      <Text style={styles.vehicleInfoCtaSubtitle} numberOfLines={1}>
                        {t('view_edit_car_info')}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={Colors.text.light} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => handlePress("/scan-receipt")}
                  activeOpacity={0.8}
                >
                  <View style={styles.scanIconWrap}>
                    <ScanLine size={22} color="#fff" strokeWidth={2.5} />
                  </View>
                  <View style={styles.scanContent}>
                    <Text style={styles.scanTitle}>{t('scan_receipt')}</Text>
                    <Text style={styles.scanSubtitle}>{t('scan_receipt_subtitle')}</Text>
                  </View>
                  <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={[styles.header, { paddingTop: insets.top + 24, paddingBottom: 16 }]}>
              <Text style={styles.headerTitle}>{t('my_car')}</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => handlePress("/app-settings")}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Settings size={22} color={Colors.text.secondary} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Car size={48} color={Colors.text.light} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>{t('welcome')}</Text>
              <Text style={styles.emptyText}>
                {t('add_car_desc')}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => handlePress("/add-car")}
                activeOpacity={0.8}
              >
                <Plus size={20} color="#fff" strokeWidth={2.5} />
                <Text style={styles.emptyButtonText}>{t('add_car')}</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 40,
  },
  
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  carSelector: {
    marginBottom: 16,
  },
  carSelectorContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  carChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  carChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  carChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  carChipTextActive: {
    color: "#fff",
  },

  content: {
    paddingHorizontal: 20,
  },

  carCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  carCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  carIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  carInfo: {
    flex: 1,
  },
  carName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 6,
  },
  carMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plateBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  plateText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  carYear: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: "500" as const,
  },
  carActions: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  highlightsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  highlightChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 40,
  },
  highlightIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightValue: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: -0.1,
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
  },
  statItem: {
    flex: 1,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: "500" as const,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 14,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  warningText: {
    fontSize: 10,
    color: Colors.danger,
    fontWeight: "600" as const,
  },

  quickActions: {
    gap: 10,
    marginBottom: 24,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    marginBottom: 2,
  },
  quickActionValue: {
    fontSize: 13,
    fontWeight: "500" as const,
  },

  vehicleInfoCta: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  vehicleInfoCtaLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
    paddingRight: 12,
  },
  vehicleInfoCtaIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  vehicleInfoCtaTitle: {
    fontSize: 14,
    fontWeight: "800" as const,
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  vehicleInfoCtaSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: "500" as const,
    marginTop: 2,
  },

  scanButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  scanIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  scanContent: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
    marginBottom: 2,
  },
  scanSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
});
