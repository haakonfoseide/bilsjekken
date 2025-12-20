import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
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
  Trash2,
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
    tireInfo,
    cars,
    setActiveCar,
    deleteCar,
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

  const handleDeleteCar = (car: typeof cars[0]) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Alert.alert(
      "Slett bil",
      `Er du sikker på at du vil slette ${car.make} ${car.model}?`,
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Slett",
          style: "destructive",
          onPress: () => {
            deleteCar(car.id);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mine biler</Text>
              <TouchableOpacity
                style={styles.addCarIconButton}
                onPress={() => handlePress("/add-car")}
                activeOpacity={0.7}
              >
                <Plus size={20} color={Colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <View style={styles.carsList}>
              {cars.map((car) => {
                const isActive = car.id === carInfo?.id;
                return (
                  <TouchableOpacity
                    key={car.id}
                    style={[
                      styles.carCard,
                      isActive && styles.carCardActive,
                    ]}
                    onPress={() => {
                      setActiveCar(car.id);
                      if (Platform.OS !== "web") {
                        Haptics.selectionAsync();
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.carCardHeader}>
                      <Car
                        size={28}
                        color={isActive ? Colors.primary : Colors.text.secondary}
                        strokeWidth={2}
                      />
                      <View style={styles.carCardInfo}>
                        <Text style={styles.carCardTitle}>
                          {car.make} {car.model}
                        </Text>
                        <Text style={styles.carCardSubtitle}>
                          {car.year} • {car.licensePlate}
                        </Text>
                      </View>
                      {isActive && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Aktiv</Text>
                        </View>
                      )}
                    </View>
                    {isActive && car.color && (
                      <View style={styles.carDetailsRow}>
                        <View style={styles.carDetailItem}>
                          <Palette size={14} color={Colors.text.secondary} />
                          <Text style={styles.carDetailText}>{car.color}</Text>
                        </View>
                        {car.fuelType && (
                          <View style={styles.carDetailItem}>
                            <Fuel size={14} color={Colors.text.secondary} />
                            <Text style={styles.carDetailText}>{car.fuelType}</Text>
                          </View>
                        )}
                      </View>
                    )}
                    <View style={styles.carCardActions}>
                      <TouchableOpacity
                        style={styles.carActionButton}
                        onPress={() => handleEditCar(car)}
                        activeOpacity={0.7}
                      >
                        <Edit size={18} color={Colors.text.secondary} />
                        <Text style={styles.carActionText}>Rediger</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.carActionButton}
                        onPress={() => handleDeleteCar(car)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={18} color={Colors.danger} />
                        <Text style={[styles.carActionText, { color: Colors.danger }]}>
                          Slett
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {carInfo && (
              <TouchableOpacity
                style={styles.refreshCard}
                onPress={handleRefresh}
                disabled={isRefreshing}
                activeOpacity={0.7}
              >
                <View style={styles.refreshContent}>
                  <View style={styles.refreshIconContainer}>
                    {isRefreshing ? (
                      <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                      <RefreshCw size={20} color={Colors.primary} strokeWidth={2.5} />
                    )}
                  </View>
                  <View style={styles.refreshTextContainer}>
                    <Text style={styles.refreshTitle}>
                      {isRefreshing ? "Oppdaterer..." : "Oppdater fra Vegvesenet"}
                    </Text>
                    <Text style={styles.refreshSubtitle}>
                      Hent siste kjørelengde og EU-kontroll
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {carInfo && (
              <View style={styles.vehicleDetailsCard}>
                <Text style={styles.vehicleDetailsTitle}>Kjøretøyinformasjon</Text>
                
                {carInfo.registeredMileage && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Gauge size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Registrert kjørelengde</Text>
                      <Text style={styles.detailValue}>
                        {carInfo.registeredMileage.toLocaleString("no-NO")} km
                      </Text>
                      {carInfo.registeredMileageDate && (
                        <Text style={styles.detailSubValue}>
                          Registrert: {formatDateSimple(carInfo.registeredMileageDate)}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {carInfo.nextEuControlDate && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Calendar size={18} color={Colors.success} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Neste EU-kontroll</Text>
                      <Text style={styles.detailValue}>
                        {formatDateSimple(carInfo.nextEuControlDate)}
                      </Text>
                      {carInfo.euControlDate && (
                        <Text style={styles.detailSubValue}>
                          Sist kontrollert: {formatDateSimple(carInfo.euControlDate)}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {carInfo.vin && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Car size={18} color={Colors.text.secondary} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>VIN</Text>
                      <Text style={styles.detailValue}>{carInfo.vin}</Text>
                    </View>
                  </View>
                )}

                {carInfo.weight && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Weight size={18} color={Colors.text.secondary} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Egenvekt</Text>
                      <Text style={styles.detailValue}>{carInfo.weight} kg</Text>
                    </View>
                  </View>
                )}

                {carInfo.power && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Zap size={18} color={Colors.warning} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Effekt</Text>
                      <Text style={styles.detailValue}>{carInfo.power} kW</Text>
                    </View>
                  </View>
                )}

                {carInfo.registrationDate && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Calendar size={18} color={Colors.text.secondary} />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Førstegangsregistrert</Text>
                      <Text style={styles.detailValue}>
                        {formatDateSimple(carInfo.registrationDate)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            <View style={styles.statsGrid}>
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => handlePress("/wash")}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: "#dbeafe" }]}>
                  <Droplet size={24} color={Colors.primary} strokeWidth={2} />
                </View>
                <Text style={styles.statLabel}>Sist vasket</Text>
                <Text style={styles.statValue}>
                  {lastWash ? formatDate(lastWash.date) : "Aldri"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => handlePress("/service")}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: "#dcfce7" }]}>
                  <Wrench size={24} color={Colors.success} strokeWidth={2} />
                </View>
                <Text style={styles.statLabel}>Neste service</Text>
                <Text style={styles.statValue}>
                  {nextService
                    ? nextService.mileage > 0
                      ? `Om ${nextService.mileage} km`
                      : "Forfalt"
                    : "Ingen data"}
                </Text>
              </TouchableOpacity>

              <View style={styles.statCard}>
                <View style={[styles.iconCircle, { backgroundColor: "#fef3c7" }]}>
                  <Gauge size={24} color={Colors.warning} strokeWidth={2} />
                </View>
                <Text style={styles.statLabel}>Kilometerstand</Text>
                <Text style={styles.statValue}>
                  {carInfo?.currentMileage.toLocaleString("no-NO") || 0} km
                </Text>
              </View>

              <TouchableOpacity
                style={styles.statCard}
                onPress={() => handlePress("/tires")}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, { backgroundColor: "#fee2e2" }]}>
                  <CircleSlash2 size={24} color={Colors.danger} strokeWidth={2} />
                </View>
                <Text style={styles.statLabel}>Dekk alder</Text>
                <Text style={styles.statValue}>
                  {tireAge
                    ? `${tireAge.years} år ${tireAge.months} mnd`
                    : "Ingen data"}
                </Text>
              </TouchableOpacity>
            </View>

            {tireInfo && (
              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <CircleSlash2 size={20} color={Colors.text.secondary} />
                  <Text style={styles.infoTitle}>Dekkhotell</Text>
                </View>
                <Text style={styles.infoValue}>
                  {tireInfo.isAtTireHotel
                    ? `Lagret hos ${tireInfo.hotelLocation || "dekkhotell"}`
                    : "Ikke lagret på dekkhotell"}
                </Text>
              </View>
            )}

            {carInfo?.insurance && (
              <View style={styles.infoCard}>
                <View style={styles.infoHeader}>
                  <Text style={styles.infoTitle}>Forsikring</Text>
                </View>
                <Text style={styles.infoValue}>{carInfo.insurance}</Text>
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
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  addCarIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  carsList: {
    gap: 12,
    marginBottom: 24,
  },
  carCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  carCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "08",
  },
  carCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  carCardInfo: {
    flex: 1,
  },
  carCardTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  carCardSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: "500" as const,
  },
  activeBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#fff",
  },
  carCardActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  carActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 10,
  },
  carActionText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
    fontWeight: "500" as const,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  infoCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: "500" as const,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
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
    fontWeight: "700" as const,
  },
  scanReceiptButton: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  scanButtonContent: {
    flex: 1,
  },
  scanButtonTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  scanButtonSubtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  carDetailsRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  carDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  carDetailText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: "500" as const,
  },
  refreshCard: {
    backgroundColor: Colors.primary + "08",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary + "40",
  },
  refreshContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  refreshIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshTextContainer: {
    flex: 1,
  },
  refreshTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginBottom: 2,
  },
  refreshSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  vehicleDetailsCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  vehicleDetailsTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
    fontWeight: "500" as const,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  detailSubValue: {
    fontSize: 12,
    color: Colors.text.light,
    marginTop: 2,
  },
});
