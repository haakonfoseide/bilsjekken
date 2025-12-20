import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Car,
  Droplet,
  Wrench,
  Gauge,
  CircleSlash2,
  ChevronRight,
  ScanLine,
  Plus,
  Edit,
  RefreshCw,
  Calendar,
  Fuel,
  Palette,
  Weight,
  Zap,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useCarData } from "@/contexts/car-context";
import Colors from "@/constants/colors";

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    carInfo,
    getLastWash,
    getNextService,
    getTireAge,
    cars,
    setActiveCar,
    refreshCarInfo,
    isRefreshing,
  } = useCarData();

  const lastWash = getLastWash();
  const nextService = getNextService();
  const tireAge = getTireAge();

  const handlePress = (route: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as never);
  };

  const handleEditCar = (car: typeof cars[0]) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveCar(car.id);
    handlePress("/settings");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "I dag";
    if (diffDays === 1) return "I går";
    if (diffDays < 7) return `${diffDays} dager siden`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} uker siden`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} måneder siden`;
    return `${Math.floor(diffDays / 365)} år siden`;
  };

  const formatDateSimple = (dateString: string | null | undefined) => {
    if (!dateString) return "Ukjent";
    const date = new Date(dateString);
    return date.toLocaleDateString("no-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleRefresh = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    refreshCarInfo();
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
      >
        {cars.length > 0 ? (
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Garasjen</Text>
                <Text style={styles.headerSubtitle}>
                  {cars.length} {cars.length === 1 ? "bil" : "biler"} registrert
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addCarButton}
                onPress={() => handlePress("/add-car")}
                activeOpacity={0.7}
              >
                <Plus size={20} color="#fff" strokeWidth={2.5} />
                <Text style={styles.addCarButtonText}>Legg til</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.carSelectorContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carSelectorContent}
                decelerationRate="fast"
                snapToInterval={Platform.OS === "ios" ? 172 : undefined} // 160 width + 12 gap
              >
                {cars.map((car) => {
                  const isActive = car.id === carInfo?.id;
                  return (
                    <TouchableOpacity
                      key={car.id}
                      style={[
                        styles.carSelectorItem,
                        isActive && styles.carSelectorItemActive,
                      ]}
                      onPress={() => {
                        if (car.id !== carInfo?.id) {
                          setActiveCar(car.id);
                          if (Platform.OS !== "web") {
                            Haptics.selectionAsync();
                          }
                        }
                      }}
                      activeOpacity={0.9}
                    >
                      <View style={[styles.carSelectorIcon, isActive && styles.carSelectorIconActive]}>
                        <Car
                          size={24}
                          color={isActive ? "#fff" : Colors.text.secondary}
                          strokeWidth={2}
                        />
                      </View>
                      <View style={styles.carSelectorInfo}>
                        <Text 
                          style={[
                            styles.carSelectorTitle, 
                            isActive && styles.carSelectorTitleActive
                          ]} 
                          numberOfLines={1}
                        >
                          {car.make} {car.model}
                        </Text>
                        <Text style={[styles.carSelectorSubtitle, isActive && styles.carSelectorSubtitleActive]}>
                          {car.licensePlate}
                        </Text>
                      </View>
                      {isActive && (
                        <View style={styles.activeCheck}>
                           <CheckCircle2 size={16} color={Colors.primary} fill="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {carInfo && (
              <View style={styles.dashboardContent}>
                {/* Main Car Status Card */}
                <View style={styles.mainStatusCard}>
                  <View style={styles.mainStatusHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.carBigTitle} numberOfLines={1}>
                        {carInfo.make} {carInfo.model}
                      </Text>
                      <View style={styles.carBadgeRow}>
                         <View style={styles.plateBadge}>
                           <View style={styles.plateFlag}>
                             <Text style={styles.plateFlagText}>N</Text>
                           </View>
                           <Text style={styles.plateText}>{carInfo.licensePlate}</Text>
                         </View>
                         <Text style={styles.carYearBadge}>{carInfo.year}</Text>
                      </View>
                    </View>
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={handleRefresh}
                        disabled={isRefreshing}
                      >
                         {isRefreshing ? (
                          <ActivityIndicator size="small" color={Colors.primary} />
                        ) : (
                          <RefreshCw size={20} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleEditCar(carInfo)}
                      >
                        <Edit size={20} color={Colors.text.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.statusDivider} />

                  <View style={styles.statusGrid}>
                    <TouchableOpacity 
                      style={styles.statusItem}
                      onPress={() => handlePress("/mileage-history")}
                      activeOpacity={0.7}
                    >
                      <View style={styles.statusLabelRow}>
                        <Gauge size={14} color={Colors.text.secondary} />
                        <Text style={styles.statusLabel}>Kilometerstand</Text>
                        <ChevronRight size={12} color={Colors.text.secondary} />
                      </View>
                      <Text style={styles.statusValue}>
                        {Number.isFinite(carInfo.currentMileage)
                          ? `${carInfo.currentMileage.toLocaleString("no-NO")} km`
                          : "—"}
                      </Text>

                      {carInfo.registeredMileage ? (
                        carInfo.registeredMileage > carInfo.currentMileage ? (
                          <View style={styles.warningContainer}>
                            <AlertCircle size={12} color={Colors.danger} />
                            <Text style={styles.warningText}>
                              Vegvesenet: {carInfo.registeredMileage.toLocaleString("no-NO")}
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.statusSubtext}>
                            Vegvesenet sist: {formatDateSimple(carInfo.registeredMileageDate)}
                          </Text>
                        )
                      ) : (
                        <Text style={styles.statusSubtext}>Ingen km-data fra Vegvesenet ennå</Text>
                      )}
                    </TouchableOpacity>

                    <View style={styles.statusVerticalLine} />

                    <View style={styles.statusItem}>
                      <View style={styles.statusLabelRow}>
                        <Calendar size={14} color={Colors.text.secondary} />
                        <Text style={styles.statusLabel}>EU-kontroll</Text>
                      </View>
                      <Text style={[
                        styles.statusValue,
                        // Logic for red text if expired could be added here
                      ]}>
                        {carInfo.nextEuControlDate 
                          ? formatDateSimple(carInfo.nextEuControlDate)
                          : "Ukjent"
                        }
                      </Text>
                      {carInfo.nextEuControlDate && (
                         <Text style={styles.statusSubtext}>
                           Frist for godkjenning
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Quick Actions / Maintenance */}
                <Text style={styles.sectionTitle}>Vedlikehold</Text>

                <View style={styles.maintenanceGrid}>
                  <TouchableOpacity
                    style={[styles.maintenanceCard, styles.maintenanceCardGrid, { backgroundColor: "#EFF6FF" }]}
                    onPress={() => handlePress("/wash")}
                    activeOpacity={0.85}
                    testID="home-maintenance-wash"
                  >
                    <View style={[styles.maintenanceIcon, { backgroundColor: "#DBEAFE" }]}>
                      <Droplet size={22} color={Colors.primary} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.maintenanceTitle, { color: "#1E3A8A" }]}>Vask</Text>
                    <Text style={[styles.maintenanceValue, { color: "#1E40AF" }]} numberOfLines={1}>
                      {lastWash ? formatDate(lastWash.date) : "Aldri"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.maintenanceCard, styles.maintenanceCardGrid, { backgroundColor: "#ECFDF5" }]}
                    onPress={() => handlePress("/service")}
                    activeOpacity={0.85}
                    testID="home-maintenance-service"
                  >
                    <View style={[styles.maintenanceIcon, { backgroundColor: "#D1FAE5" }]}>
                      <Wrench size={22} color="#059669" strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.maintenanceTitle, { color: "#064E3B" }]}>Service</Text>
                    <Text style={[styles.maintenanceValue, { color: "#065F46" }]} numberOfLines={1}>
                      {nextService
                        ? nextService.mileage > 0
                          ? `${nextService.mileage} km til`
                          : "Forfalt"
                        : "Ingen data"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.maintenanceCard, styles.maintenanceCardGrid, { backgroundColor: "#FEF2F2" }]}
                    onPress={() => handlePress("/tires")}
                    activeOpacity={0.85}
                    testID="home-maintenance-tires"
                  >
                    <View style={[styles.maintenanceIcon, { backgroundColor: "#FEE2E2" }]}>
                      <CircleSlash2 size={22} color="#DC2626" strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.maintenanceTitle, { color: "#7F1D1D" }]}>Dekk</Text>
                    <Text style={[styles.maintenanceValue, { color: "#991B1B" }]} numberOfLines={1}>
                      {tireAge ? `${tireAge.years} år` : "Ingen info"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Technical Specs Collapsible-ish */}
                <Text style={styles.sectionTitle}>Spesifikasjoner</Text>
                <View style={styles.specsCard}>
                  <View style={styles.specRow}>
                    <View style={styles.specItem}>
                      <Text style={styles.specLabel}>Effekt</Text>
                      <View style={styles.specValueRow}>
                        <Zap size={14} color={Colors.warning} />
                        <Text style={styles.specValue}>{carInfo.power ? `${carInfo.power} kW` : "-"}</Text>
                      </View>
                    </View>
                    <View style={styles.specDivider} />
                    <View style={styles.specItem}>
                      <Text style={styles.specLabel}>Vekt</Text>
                      <View style={styles.specValueRow}>
                        <Weight size={14} color={Colors.text.secondary} />
                        <Text style={styles.specValue}>{carInfo.weight ? `${carInfo.weight} kg` : "-"}</Text>
                      </View>
                    </View>
                    <View style={styles.specDivider} />
                    <View style={styles.specItem}>
                      <Text style={styles.specLabel}>Drivstoff</Text>
                      <View style={styles.specValueRow}>
                        <Fuel size={14} color={Colors.text.secondary} />
                        <Text style={styles.specValue}>{carInfo.fuelType || "-"}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.specsDividerHorizontal} />
                  
                  <View style={styles.specRow}>
                    <View style={styles.specItem}>
                      <Text style={styles.specLabel}>Farge</Text>
                      <View style={styles.specValueRow}>
                        <Palette size={14} color={Colors.text.secondary} />
                        <Text style={styles.specValue} numberOfLines={1}>{carInfo.color || "-"}</Text>
                      </View>
                    </View>
                    <View style={styles.specDivider} />
                    <View style={styles.specItem}>
                      <Text style={styles.specLabel}>Reg. dato</Text>
                       <View style={styles.specValueRow}>
                        <Calendar size={14} color={Colors.text.secondary} />
                        <Text style={styles.specValue}>
                          {carInfo.registrationDate ? new Date(carInfo.registrationDate).getFullYear() : "-"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {carInfo.vin && (
                    <>
                      <View style={styles.specsDividerHorizontal} />
                      <View style={styles.vinRow}>
                         <Text style={styles.specLabel}>VIN</Text>
                         <Text style={styles.vinText}>{carInfo.vin}</Text>
                      </View>
                    </>
                  )}
                </View>
                
                <TouchableOpacity
                  style={styles.scanReceiptButton}
                  onPress={() => handlePress("/scan-receipt" as never)}
                  activeOpacity={0.7}
                >
                  <View style={styles.scanIconContainer}>
                    <ScanLine size={24} color="#fff" strokeWidth={2} />
                  </View>
                  <View style={styles.scanButtonContent}>
                    <Text style={styles.scanButtonTitle}>Skann kvittering</Text>
                    <Text style={styles.scanButtonSubtitle}>
                      Registrer utgifter automatisk med AI
                    </Text>
                  </View>
                  <ChevronRight size={20} color={Colors.text.light} />
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Car size={64} color={Colors.text.light} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Ingen bil registrert</Text>
            <Text style={styles.emptyText}>
              Trykk på knappen under for å legge til din bil
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handlePress("/add-car")}
              activeOpacity={0.7}
            >
              <Plus size={24} color="#fff" strokeWidth={2.5} />
              <Text style={styles.addButtonText}>Legg til bil</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F7", // Slightly grey background for better card contrast
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: "500",
    marginTop: 2,
  },
  addCarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addCarButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  // Car Selector
  carSelectorContainer: {
    marginBottom: 20,
  },
  carSelectorContent: {
    paddingHorizontal: 20,
    gap: 12,
    paddingRight: 40, // Add extra padding at end
  },
  carSelectorItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    paddingRight: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 12,
    minWidth: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  carSelectorItemActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EFF6FF",
  },
  carSelectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  carSelectorIconActive: {
    backgroundColor: Colors.primary,
  },
  carSelectorInfo: {
    flex: 1,
  },
  carSelectorTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  carSelectorTitleActive: {
    color: Colors.primary,
  },
  carSelectorSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  carSelectorSubtitleActive: {
    color: Colors.primary,
    opacity: 0.8,
  },
  activeCheck: {
    marginLeft: 4,
  },

  // Dashboard
  dashboardContent: {
    paddingHorizontal: 20,
  },
  
  // Main Status Card
  mainStatusCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 24,
  },
  mainStatusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  carBigTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text.primary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  carBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plateBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  plateFlag: {
    backgroundColor: "#00529C",
    paddingHorizontal: 6,
    paddingVertical: 2,
    height: "100%",
    justifyContent: "center",
  },
  plateFlagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  plateText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  carYearBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.secondary,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 20,
  },
  statusGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusItem: {
    flex: 1,
    alignItems: "center",
  },
  statusVerticalLine: {
    width: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 16,
  },
  statusLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  statusSubtext: {
    fontSize: 11,
    color: Colors.text.light,
    textAlign: "center",
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  warningText: {
    fontSize: 10,
    color: Colors.danger,
    fontWeight: "600",
  },

  // Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 16,
    marginLeft: 4,
  },

  // Maintenance
  maintenanceGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  maintenanceCard: {
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  maintenanceCardGrid: {
    flex: 1,
    minWidth: 0,
  },
  maintenanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  maintenanceTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  maintenanceValue: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Specs
  specsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  specItem: {
    flex: 1,
    alignItems: "center",
  },
  specDivider: {
    width: 1,
    backgroundColor: "#F3F4F6",
  },
  specsDividerHorizontal: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 16,
  },
  specLabel: {
    fontSize: 12,
    color: Colors.text.light,
    marginBottom: 6,
    fontWeight: "500",
  },
  specValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  specValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  vinRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vinText: {
    fontSize: 14,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: Colors.text.primary,
    fontWeight: "500",
  },

  // Scan Button
  scanReceiptButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  scanIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  scanButtonContent: {
    flex: 1,
  },
  scanButtonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  scanButtonSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.text.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: 32,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
