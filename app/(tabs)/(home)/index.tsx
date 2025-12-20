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
                snapToInterval={Platform.OS === "ios" ? 160 : undefined}
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
                      <View style={styles.carSelectorIcon}>
                        <Car
                          size={24}
                          color={isActive ? Colors.primary : Colors.text.secondary}
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
                        <Text style={styles.carSelectorSubtitle}>
                          {car.licensePlate}
                        </Text>
                      </View>
                      {isActive && (
                        <View style={styles.activeIndicator} />
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
                    <View>
                      <Text style={styles.carBigTitle}>
                        {carInfo.make} {carInfo.model}
                      </Text>
                      <Text style={styles.carBigSubtitle}>
                        {carInfo.year} • {carInfo.licensePlate}
                      </Text>
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
                        <Text style={styles.statusLabel}>Kilometer</Text>
                        <ChevronRight size={12} color={Colors.text.secondary} />
                      </View>
                      <Text style={styles.statusValue}>
                        {carInfo.currentMileage.toLocaleString("no-NO")}
                      </Text>
                      {carInfo.registeredMileage && carInfo.registeredMileage !== carInfo.currentMileage && (
                        <Text style={styles.statusSubtext}>
                           Vegvesenet: {carInfo.registeredMileage.toLocaleString("no-NO")}
                        </Text>
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
                        // Add color logic for expired/soon?
                      ]}>
                        {carInfo.nextEuControlDate 
                          ? formatDateSimple(carInfo.nextEuControlDate)
                          : "Ukjent"
                        }
                      </Text>
                      {carInfo.euControlDate && (
                         <Text style={styles.statusSubtext}>
                           Sist: {formatDateSimple(carInfo.euControlDate)}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Quick Actions / Maintenance */}
                <Text style={styles.sectionTitle}>Vedlikehold</Text>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.maintenanceList}
                >
                  <TouchableOpacity
                    style={[styles.maintenanceCard, { backgroundColor: "#EFF6FF" }]}
                    onPress={() => handlePress("/wash")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.maintenanceIcon, { backgroundColor: "#DBEAFE" }]}>
                      <Droplet size={24} color={Colors.primary} strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.maintenanceTitle, { color: "#1E3A8A" }]}>Vask</Text>
                    <Text style={[styles.maintenanceValue, { color: "#1E40AF" }]}>
                      {lastWash ? formatDate(lastWash.date) : "Aldri"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.maintenanceCard, { backgroundColor: "#ECFDF5" }]}
                    onPress={() => handlePress("/service")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.maintenanceIcon, { backgroundColor: "#D1FAE5" }]}>
                      <Wrench size={24} color="#059669" strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.maintenanceTitle, { color: "#064E3B" }]}>Service</Text>
                    <Text style={[styles.maintenanceValue, { color: "#065F46" }]}>
                       {nextService
                        ? nextService.mileage > 0
                          ? `${nextService.mileage} km til`
                          : "Forfalt"
                        : "Ingen data"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.maintenanceCard, { backgroundColor: "#FEF2F2" }]}
                    onPress={() => handlePress("/tires")}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.maintenanceIcon, { backgroundColor: "#FEE2E2" }]}>
                      <CircleSlash2 size={24} color="#DC2626" strokeWidth={2.5} />
                    </View>
                    <Text style={[styles.maintenanceTitle, { color: "#7F1D1D" }]}>Dekk</Text>
                    <Text style={[styles.maintenanceValue, { color: "#991B1B" }]}>
                      {tireAge
                        ? `${tireAge.years} år`
                        : "Ingen info"}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>

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

        <TouchableOpacity
          style={styles.scanReceiptButton}
          onPress={() => handlePress("/scan-receipt" as never)}
          activeOpacity={0.7}
        >
          <ScanLine size={24} color={Colors.primary} strokeWidth={2} />
          <View style={styles.scanButtonContent}>
            <Text style={styles.scanButtonTitle}>Skann kvittering</Text>
            <Text style={styles.scanButtonSubtitle}>
              La AI kategorisere og legge til utgifter
            </Text>
          </View>
          <ChevronRight size={24} color={Colors.text.light} />
        </TouchableOpacity>
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
  },
  carSelectorItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    paddingRight: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
    minWidth: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  carSelectorItemActive: {
    borderColor: Colors.primary,
    backgroundColor: "#EFF6FF", // Light blue tint
  },
  carSelectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
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
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
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
    marginBottom: 4,
  },
  carBigSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.secondary,
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
    backgroundColor: "#E5E7EB",
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
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  statusLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.secondary,
    textTransform: "uppercase",
  },
  statusValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 11,
    color: Colors.text.light,
    textAlign: "center",
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
  maintenanceList: {
    gap: 12,
    paddingRight: 20,
    marginBottom: 24,
  },
  maintenanceCard: {
    padding: 16,
    borderRadius: 20,
    width: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
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
