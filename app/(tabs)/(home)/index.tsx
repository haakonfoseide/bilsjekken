import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
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
  RefreshCw,
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

  const handleSwitchCar = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (cars.length === 0) {
      handlePress("/settings");
      return;
    }

    if (cars.length === 1) {
      Alert.alert(
        "Legg til flere biler",
        "Du har bare én bil. Vil du legge til en ny bil?",
        [
          { text: "Avbryt", style: "cancel" },
          { text: "Legg til", onPress: () => handlePress("/settings") }
        ]
      );
      return;
    }

    const options = cars.map(car => ({
      text: `${car.make} ${car.model} (${car.licensePlate})`,
      onPress: () => {
        setActiveCar(car.id);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }));

    options.push({ text: "Avbryt", onPress: () => {} });

    Alert.alert("Velg bil", "Hvilken bil vil du se?", options);
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
        {carInfo ? (
          <>
            <View style={styles.carInfoCard}>
              <View style={styles.carInfoHeader}>
                <Car size={32} color={Colors.primary} strokeWidth={2} />
                <View style={styles.carInfoText}>
                  <Text style={styles.carMake}>
                    {carInfo.make} {carInfo.model}
                  </Text>
                  <Text style={styles.carDetails}>
                    {carInfo.year} • {carInfo.licensePlate}
                  </Text>
                </View>
                {cars.length > 0 && (
                  <TouchableOpacity 
                    style={styles.switchButton}
                    onPress={handleSwitchCar}
                    activeOpacity={0.7}
                  >
                    <RefreshCw size={20} color={Colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

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
                  {carInfo.currentMileage.toLocaleString("no-NO")} km
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

            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Text style={styles.infoTitle}>Forsikring</Text>
              </View>
              <Text style={styles.infoValue}>{carInfo.insurance}</Text>
            </View>
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
              onPress={() => handlePress("/settings")}
              activeOpacity={0.7}
            >
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
  carInfoCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  carInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  carInfoText: {
    flex: 1,
  },
  carMake: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  carDetails: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: "500" as const,
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
  switchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
});
