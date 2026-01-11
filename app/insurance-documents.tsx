import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import {
  Camera,
  ImagePlus,
  Trash2,
  X,
  ZoomIn,
  ShieldCheck,
  FileText,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useCarData } from "@/contexts/car-context";
import Colors from "@/constants/colors";
import type { InsuranceDocument } from "@/types/car";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function InsuranceDocumentsScreen() {
  const insets = useSafeAreaInsets();
  const { carInfo, insuranceDocuments, addInsuranceDocument, deleteInsuranceDocument } = useCarData();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestCameraPermission = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Tilgang kreves",
        "Vi trenger tilgang til kameraet for å ta bilder av forsikringsdokumenter.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  }, []);

  const requestMediaPermission = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Tilgang kreves",
        "Vi trenger tilgang til bildegalleriet for å velge forsikringsdokumenter.",
        [{ text: "OK" }]
      );
      return false;
    }
    return true;
  }, []);

  const takePhoto = useCallback(async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        addInsuranceDocument({
          imageUri,
          addedDate: new Date().toISOString(),
        });
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("[InsuranceDocuments] Camera error:", error);
      Alert.alert("Feil", "Kunne ikke ta bilde. Prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  }, [requestCameraPermission, addInsuranceDocument]);

  const pickImage = useCallback(async () => {
    const hasPermission = await requestMediaPermission();
    if (!hasPermission) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets.length > 0) {
        result.assets.forEach((asset) => {
          addInsuranceDocument({
            imageUri: asset.uri,
            addedDate: new Date().toISOString(),
          });
        });
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("[InsuranceDocuments] Image picker error:", error);
      Alert.alert("Feil", "Kunne ikke velge bilder. Prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  }, [requestMediaPermission, addInsuranceDocument]);

  const handleDeleteDocument = useCallback((doc: InsuranceDocument) => {
    Alert.alert(
      "Slett dokument",
      "Er du sikker på at du vil slette dette dokumentet?",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Slett",
          style: "destructive",
          onPress: () => {
            deleteInsuranceDocument(doc.id);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
          },
        },
      ]
    );
  }, [deleteInsuranceDocument]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("no-NO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Forsikringsdokumenter",
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
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <ShieldCheck size={24} color="#15803D" strokeWidth={2} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              {carInfo?.insurance || "Ingen forsikring registrert"}
            </Text>
            <Text style={styles.infoSubtitle}>
              Last opp eller ta bilde av forsikringsdokumentene dine for enkel oversikt
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cameraButton]}
            onPress={takePhoto}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Camera size={22} color="#fff" strokeWidth={2.5} />
            <Text style={styles.actionButtonText}>Ta bilde</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.uploadButton]}
            onPress={pickImage}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <ImagePlus size={22} color={Colors.primary} strokeWidth={2.5} />
            <Text style={[styles.actionButtonText, { color: Colors.primary }]}>
              Last opp
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Behandler...</Text>
          </View>
        )}

        {insuranceDocuments.length > 0 ? (
          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>
              Dokumenter ({insuranceDocuments.length})
            </Text>
            <View style={styles.documentsGrid}>
              {insuranceDocuments.map((doc) => (
                <View key={doc.id} style={styles.documentCard}>
                  <TouchableOpacity
                    style={styles.documentImageContainer}
                    onPress={() => setSelectedImage(doc.imageUri)}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: doc.imageUri }}
                      style={styles.documentImage}
                      resizeMode="cover"
                    />
                    <View style={styles.zoomOverlay}>
                      <ZoomIn size={20} color="#fff" />
                    </View>
                  </TouchableOpacity>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentDate}>
                      {formatDate(doc.addedDate)}
                    </Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteDocument(doc)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Trash2 size={16} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <FileText size={40} color={Colors.text.light} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Ingen dokumenter</Text>
            <Text style={styles.emptyText}>
              Ta bilde eller last opp forsikringsdokumentene dine for å ha de lett tilgjengelig
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={selectedImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedImage(null)}
          >
            <X size={28} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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

  infoCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#065F46",
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 13,
    color: "#047857",
    lineHeight: 18,
  },

  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  cameraButton: {
    backgroundColor: Colors.primary,
  },
  uploadButton: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#fff",
  },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.text.secondary,
  },

  documentsSection: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 14,
  },
  documentsGrid: {
    gap: 14,
  },
  documentCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  documentImageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  documentImage: {
    width: "100%",
    height: "100%",
  },
  zoomOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  documentInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  documentDate: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: "500" as const,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
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
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalClose: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  modalImage: {
    width: SCREEN_WIDTH - 40,
    height: "80%",
  },
});
