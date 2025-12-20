import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Gauge,
  ArrowLeft,
  History,
  TrendingUp,
  Building2,
  User,
} from "lucide-react-native";
import { useCarData } from "@/contexts/car-context";
import Colors from "@/constants/colors";
import { useState, useMemo } from "react";

export default function MileageHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { carInfo, mileageRecords } = useCarData();
  const [activeTab, setActiveTab] = useState<'all' | 'user' | 'vegvesen'>('all');

  // Combine and sort records
  const allRecords = useMemo(() => {
    if (!carInfo) return [];

    const userRecords = mileageRecords.map(r => ({
      id: r.id,
      mileage: r.mileage,
      date: r.date,
      source: 'user' as const,
      type: 'Avlesning',
    }));

    const vegvesenRecords = (carInfo.mileageHistory || []).map((r, index) => ({
      id: `vv-${index}`,
      mileage: r.mileage,
      date: r.date,
      source: 'vegvesen' as const,
      type: 'EU-kontroll', // Usually from EU control
    }));

    const combined = [...userRecords, ...vegvesenRecords];
    
    // Sort by date descending
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [mileageRecords, carInfo]);

  const filteredRecords = useMemo(() => {
    if (activeTab === 'all') return allRecords;
    return allRecords.filter(r => r.source === activeTab);
  }, [allRecords, activeTab]);

  if (!carInfo) {
    return (
      <View style={styles.container}>
        <Text>Ingen bil valgt</Text>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("no-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
          <Text style={styles.headerTitle}>Kilometerstand</Text>
          <View style={{ width: 40 }} /> 
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statsLabel}>Nåværende stand</Text>
              <Text style={styles.statsValue}>
                {carInfo.currentMileage?.toLocaleString("no-NO")} km
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
                {allRecords[0].mileage - allRecords[1].mileage} km siden sist
              </Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>Alle</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'vegvesen' && styles.activeTab]}
            onPress={() => setActiveTab('vegvesen')}
          >
            <Text style={[styles.tabText, activeTab === 'vegvesen' && styles.activeTabText]}>Vegvesenet</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'user' && styles.activeTab]}
            onPress={() => setActiveTab('user')}
          >
            <Text style={[styles.tabText, activeTab === 'user' && styles.activeTabText]}>Egne</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredRecords}
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
                  item.source === 'vegvesen' && styles.timelineDotVegvesen
                ]}>
                  {item.source === 'vegvesen' ? (
                    <Building2 size={12} color="#fff" />
                  ) : (
                    <User size={12} color="#fff" />
                  )}
                </View>
                {index !== filteredRecords.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              
              <View style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
                  <View style={[
                    styles.sourceTag,
                    item.source === 'vegvesen' ? styles.sourceTagVegvesen : styles.sourceTagUser
                  ]}>
                    <Text style={[
                      styles.sourceTagText,
                      item.source === 'vegvesen' ? styles.sourceTagTextVegvesen : styles.sourceTagTextUser
                    ]}>
                      {item.source === 'vegvesen' ? 'Vegvesenet' : 'Avlesning'}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.recordMileage}>
                  {item.mileage.toLocaleString("no-NO")} km
                </Text>
                
                {index < filteredRecords.length - 1 && (
                  <Text style={styles.recordDiff}>
                    +{item.mileage - filteredRecords[index + 1].mileage} km
                  </Text>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <History size={48} color={Colors.text.light} />
            <Text style={styles.emptyText}>Ingen historikk funnet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F4F7",
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
  },
});
