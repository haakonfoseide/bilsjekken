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
  TextInput,
  KeyboardAvoidingView,
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
  File,
  StickyNote,
  Pencil,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { useCarData } from "@/contexts/car-context";
import Colors from "@/constants/colors";
import type { InsuranceDocument } from "@/types/car";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function InsuranceDocumentsScreen() {
  const insets = useSafeAreaInsets();
  const { carInfo, insuranceDocuments, addInsuranceDocument, deleteInsuranceDocument, updateInsuranceDocument } = useCarData();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Note Modal State
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [editingDocument, setEditingDocument] = useState<InsuranceDocument | null>(null);

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
        const uri = result.assets[0].uri;
        addInsuranceDocument({
          uri,
          type: 'image',
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
            uri: asset.uri,
            type: 'image',
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

  const pickPdf = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        addInsuranceDocument({
          uri: asset.uri,
          type: 'pdf',
          name: asset.name,
          addedDate: new Date().toISOString(),
        });
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("[InsuranceDocuments] PDF picker error:", error);
      Alert.alert("Feil", "Kunne ikke velge PDF. Prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  }, [addInsuranceDocument]);

  const handleSaveNote = useCallback(() => {
    if (!noteText.trim()) {
      Alert.alert("Mangler tekst", "Du må skrive noe i notatet.");
      return;
    }

    if (editingDocument) {
      updateInsuranceDocument(editingDocument.id, {
        uri: editingDocument.uri,
        type: editingDocument.type,
        name: noteTitle || "Notat",
        notes: noteText,
        addedDate: editingDocument.addedDate,
      });
    } else {
      addInsuranceDocument({
        uri: "",
        type: 'note',
        name: noteTitle || "Notat",
        notes: noteText,
        addedDate: new Date().toISOString(),
      });
    }

    setNoteText("");
    setNoteTitle("");
    setEditingDocument(null);
    setIsNoteModalVisible(false);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [noteText, noteTitle, editingDocument, addInsuranceDocument, updateInsuranceDocument]);

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

  const handleOpenDocument = useCallback(async (doc: InsuranceDocument) => {
    if (doc.type === 'image') {
      setSelectedImage(doc.uri);
    } else if (doc.type === 'pdf') {
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(doc.uri);
        } else {
          Alert.alert("Info", "Deling er ikke tilgjengelig på denne enheten.");
        }
      } catch (error) {
        console.error("Error sharing PDF:", error);
        Alert.alert("Feil", "Kunne ikke åpne PDF.");
      }
    } else if (doc.type === 'note') {
      Alert.alert(doc.name || "Notat", doc.notes);
    }
  }, []);

  const handleEditDocument = useCallback((doc: InsuranceDocument) => {
    if (doc.type === 'note') {
      setEditingDocument(doc);
      setNoteTitle(doc.name || "");
      setNoteText(doc.notes || "");
      setIsNoteModalVisible(true);
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

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
              Last opp forsikringsdokumenter, bilder av skademelding, eller skriv notater.
            </Text>
          </View>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: Colors.primary }]}
            onPress={takePhoto}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Camera size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.actionButtonText}>Ta bilde</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#DBEAFE" }]}
            onPress={pickImage}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <ImagePlus size={20} color={Colors.primary} strokeWidth={2.5} />
            <Text style={[styles.actionButtonText, { color: Colors.primary }]}>Bilde</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtonsRow}>
           <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FFEDD5" }]}
            onPress={pickPdf}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <File size={20} color="#F97316" strokeWidth={2.5} />
            <Text style={[styles.actionButtonText, { color: "#C2410C" }]}>PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#DCFCE7" }]}
            onPress={() => {
              setEditingDocument(null);
              setNoteTitle("");
              setNoteText("");
              setIsNoteModalVisible(true);
            }}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <StickyNote size={20} color="#16A34A" strokeWidth={2.5} />
            <Text style={[styles.actionButtonText, { color: "#15803D" }]}>Notat</Text>
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
                    style={styles.documentPreview}
                    onPress={() => handleOpenDocument(doc)}
                    activeOpacity={0.9}
                  >
                    {doc.type === 'image' ? (
                      <>
                        <Image
                          source={{ uri: doc.uri }}
                          style={styles.documentImage}
                          resizeMode="cover"
                        />
                        <View style={styles.zoomOverlay}>
                          <ZoomIn size={20} color="#fff" />
                        </View>
                      </>
                    ) : (
                      <View style={[styles.documentIconPreview, 
                        doc.type === 'pdf' ? { backgroundColor: "#FFF7ED" } : { backgroundColor: "#F0FDF4" }
                      ]}>
                        {doc.type === 'pdf' ? (
                           <File size={48} color="#F97316" strokeWidth={1.5} />
                        ) : (
                           <StickyNote size={48} color="#16A34A" strokeWidth={1.5} />
                        )}
                        {doc.type === 'pdf' && (
                           <View style={styles.zoomOverlay}>
                             <ZoomIn size={20} color="#fff" />
                           </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.documentInfo}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.documentName} numberOfLines={1}>
                        {doc.name || (doc.type === 'image' ? 'Bilde' : doc.type === 'pdf' ? 'Dokument' : 'Notat')}
                      </Text>
                      {doc.type === 'note' && doc.notes && (
                         <Text style={styles.notePreview} numberOfLines={2}>
                           {doc.notes}
                         </Text>
                      )}
                      <Text style={styles.documentDate}>
                        {formatDate(doc.addedDate)}
                      </Text>
                    </View>
                    <View style={styles.actionButtons}>
                      {doc.type === 'note' && (
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => handleEditDocument(doc)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Pencil size={16} color={Colors.primary} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteDocument(doc)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Trash2 size={16} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
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
              Last opp forsikringsdokumenter for å ha de lett tilgjengelig.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Image Modal */}
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

      {/* Add Note Modal */}
      <Modal
        visible={isNoteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsNoteModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.noteModalOverlay}
        >
          <View style={styles.noteModalContent}>
            <View style={styles.noteModalHeader}>
              <Text style={styles.noteModalTitle}>{editingDocument ? "Rediger notat" : "Nytt notat"}</Text>
              <TouchableOpacity onPress={() => {
                setIsNoteModalVisible(false);
                setEditingDocument(null);
                setNoteTitle("");
                setNoteText("");
              }}>
                <X size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.inputGroup}>
               <Text style={styles.label}>Tittel (valgfri)</Text>
               <TextInput
                 style={styles.input}
                 value={noteTitle}
                 onChangeText={setNoteTitle}
                 placeholder="F.eks. Skademelding info"
                 placeholderTextColor="#94A3B8"
               />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
               <Text style={styles.label}>Innhold</Text>
               <TextInput
                 style={[styles.input, styles.textArea]}
                 value={noteText}
                 onChangeText={setNoteText}
                 placeholder="Skriv notatet her..."
                 placeholderTextColor="#94A3B8"
                 multiline
                 textAlignVertical="top"
               />
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveNote}
            >
              <Text style={styles.saveButtonText}>{editingDocument ? "Oppdater notat" : "Lagre notat"}</Text>
            </TouchableOpacity>
          </View>
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

  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
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
    marginTop: 12,
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
  documentPreview: {
    width: "100%",
    height: 180,
    position: "relative",
    backgroundColor: "#F1F5F9",
  },
  documentImage: {
    width: "100%",
    height: "100%",
  },
  documentIconPreview: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 14,
  },
  documentName: {
     fontSize: 15,
     fontWeight: "600" as const,
     color: Colors.text.primary,
     marginBottom: 4,
  },
  notePreview: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  documentDate: {
    fontSize: 12,
    color: Colors.text.light,
    fontWeight: "500" as const,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
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

  noteModalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  noteModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    height: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  noteModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  noteModalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text.primary,
  },
  textArea: {
    flex: 1,
    minHeight: 120,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
});
