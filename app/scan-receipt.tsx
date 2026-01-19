import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import {
  Camera,
  Upload,
  X,
  Sparkles,
  CheckCircle2,
  Wrench,
  Droplet,
  Disc,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as Haptics from "expo-haptics";
import { generateObject } from "@rork-ai/toolkit-sdk";
import { z } from "zod";
import Colors from "@/constants/colors";
import { useCarData } from "@/contexts/car-context";

const ReceiptSchema = z.object({
  category: z
    .enum(["wash", "service", "tires", "other"])
    .describe(
      "Category of the car expense: wash (car wash), service (maintenance, repair, oil change, service booklet entry), tires (tire purchase, tire change), other"
    ),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe("Confidence level 0-100 of the categorization"),
  amount: z.number().nullable().optional().describe("Total amount in NOK if visible"),
  date: z.string().nullable().optional().describe("Service/receipt date in YYYY-MM-DD format if visible"),
  merchant: z.string().nullable().optional().describe("Store, workshop name, or mechanic name if visible"),
  description: z
    .string()
    .describe("Brief description of what was purchased or service performed. For service booklet entries, describe the service work done."),
  items: z
    .array(z.string())
    .optional()
    .describe("List of items or services from the receipt/service booklet. For service booklets, list all work performed (oil change, filter replacement, inspection, etc.)"),
  mileage: z
    .number()
    .nullable()
    .optional()
    .describe("Car mileage/odometer reading if mentioned. For service booklets this is usually prominently displayed."),
  tireDimensions: z
    .string()
    .nullable()
    .optional()
    .describe("Tire dimensions if visible (e.g., '205/55 R16', '225/45 R17'). Look for width/profile/rim size pattern."),
  tireWidth: z
    .number()
    .nullable()
    .optional()
    .describe("Tire width in mm (e.g., 205, 225)"),
  tireProfile: z
    .number()
    .nullable()
    .optional()
    .describe("Tire profile/aspect ratio (e.g., 55, 45)"),
  tireRimSize: z
    .number()
    .nullable()
    .optional()
    .describe("Tire rim size in inches (e.g., 16, 17)"),
  tireBrand: z
    .string()
    .nullable()
    .optional()
    .describe("Tire brand if visible (e.g., Michelin, Continental, Pirelli, Nokian)"),
  tireModel: z
    .string()
    .nullable()
    .optional()
    .describe("Tire model name if visible (e.g., Pilot Sport, WinterContact)"),
  tireType: z
    .enum(["summer", "winter", "allseason", "unknown"])
    .nullable()
    .optional()
    .describe("Type of tire: summer, winter, allseason, or unknown"),
  tireQuantity: z
    .number()
    .nullable()
    .optional()
    .describe("Number of tires purchased (usually 2 or 4)"),
  isServiceBooklet: z
    .boolean()
    .optional()
    .describe("True if this is a service booklet entry rather than a regular receipt"),
  nextServiceDue: z
    .number()
    .nullable()
    .optional()
    .describe("Next service due at this mileage if mentioned in service booklet"),
});

type ReceiptAnalysis = z.infer<typeof ReceiptSchema>;

export default function ScanReceiptScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    addWashRecord,
    addServiceRecord,
    carInfo,
  } = useCarData();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ReceiptAnalysis | null>(null);
  
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const processImage = async (uri: string): Promise<{ uri: string; base64: string | undefined }> => {
    try {
      console.log("[Receipt] Processing image:", uri.substring(0, 100) + "...");
      
      // Optimize image for iOS and network performance
      // Resize to max 600px width and compress to jpeg 0.4
      // Request base64 directly to avoid FileSystem read issues on iOS
      const manipulatedResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 600 } }],
        { 
          compress: 0.4, 
          format: ImageManipulator.SaveFormat.JPEG, 
          base64: true 
        }
      );
      
      console.log("[Receipt] Image processed successfully, base64 length:", manipulatedResult.base64?.length || 0);
      
      if (!manipulatedResult.base64) {
        console.warn("[Receipt] ImageManipulator did not return base64, will try FileSystem fallback");
      }
      
      return { uri: manipulatedResult.uri, base64: manipulatedResult.base64 };
    } catch (error) {
      console.error("[Receipt] Image manipulation failed:", error);
      // Return original URI, will try FileSystem fallback in analyzeReceipt
      return { uri, base64: undefined };
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Tillatelse påkrevd",
        "Vi trenger tilgang til kameraet for å ta bilde av kvitteringen."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!isMounted.current) return;

    if (!result.canceled && result.assets && result.assets[0]) {
      const originalUri = result.assets[0].uri;
      
      // Show local preview immediately
      setSelectedImage(originalUri);
      
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // Process and analyze
      const { uri, base64 } = await processImage(originalUri);
      analyzeReceipt(uri, base64);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Tillatelse påkrevd",
        "Vi trenger tilgang til bildegalleriet for å velge et bilde."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!isMounted.current) return;

    if (!result.canceled && result.assets && result.assets[0]) {
      const originalUri = result.assets[0].uri;
      
      setSelectedImage(originalUri);
      
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      const { uri, base64 } = await processImage(originalUri);
      analyzeReceipt(uri, base64);
    }
  };

  const analyzeReceipt = async (imageUri: string, providedBase64?: string) => {
    setAnalyzing(true);
    const maxRetries = 2;
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Receipt] Starting analysis (attempt ${attempt + 1}/${maxRetries + 1})...`);
        
        let base64Image = "";
        
        if (providedBase64) {
          console.log("[Receipt] Using provided base64 from ImageManipulator");
          base64Image = `data:image/jpeg;base64,${providedBase64}`;
        } else if (Platform.OS === "web") {
          console.log("[Receipt] Web platform: fetching image as blob");
          base64Image = await fetch(imageUri)
            .then((r) => r.blob())
            .then(
              (blob) =>
                new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result as string);
                  reader.onerror = () => reject(new Error("Failed to read image blob"));
                  reader.readAsDataURL(blob);
                })
            );
        } else {
          // Native iOS/Android: Use expo-file-system as fallback
          console.log("[Receipt] Native platform: reading file with FileSystem");
          try {
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
              encoding: "base64",
            });
            base64Image = `data:image/jpeg;base64,${base64}`;
          } catch (fsError) {
            console.error("[Receipt] FileSystem read failed:", fsError);
            throw new Error(`Kunne ikke lese bildefilen: ${fsError instanceof Error ? fsError.message : String(fsError)}`);
          }
        }
        
        if (!base64Image || base64Image.length < 100) {
          throw new Error("Ugyldig bildedata - bildet ble ikke lest riktig");
        }

        console.log("[Receipt] Image converted to base64, calling AI...");
        console.log(`[Receipt] Base64 length: ${base64Image.length} chars (~${Math.round(base64Image.length * 0.75 / 1024)} KB)`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
        
        const result = await generateObject({
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this image which can be either a regular receipt OR a service booklet entry (servicehefte) from a car. Extract all relevant information:\n\n" +
                    "- Category: wash (car wash), service (maintenance, repair, oil change, service booklet entries), tires (tire purchase/change), or other\n" +
                    "- If this is a SERVICE BOOKLET (servicehefte) entry, set isServiceBooklet=true and pay special attention to:\n" +
                    "  * Mileage/odometer reading (kilometerstand)\n" +
                    "  * Date of service\n" +
                    "  * What work was performed (oil change, filter replacement, inspection, brake service, etc.)\n" +
                    "  * Workshop/mechanic name\n" +
                    "  * Next service due mileage if mentioned\n" +
                    "- For TIRE receipts/invoices, pay special attention to:\n" +
                    "  * Tire dimensions (format: width/profile Rrim, e.g., 205/55 R16)\n" +
                    "  * Tire brand and model\n" +
                    "  * Type of tire (summer, winter, all-season)\n" +
                    "  * Number of tires purchased\n" +
                    "- For regular receipts, extract: amount, date, merchant, description, items, and mileage if mentioned\n" +
                    "- Provide a confidence score (0-100) for your categorization\n" +
                    "- Use null for any field that cannot be determined from the image\n\n" +
                    "The goal is to help track all car maintenance and expenses in one place.",
                },
                {
                  type: "image",
                  image: base64Image,
                },
              ],
            },
          ],
          schema: ReceiptSchema,
        });
        
        clearTimeout(timeoutId);

        console.log("[Receipt] Analysis complete:", result);
        
        if (!isMounted.current) return;

        setAnalysis(result);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setAnalyzing(false);
        return;
      } catch (error: unknown) {
        if (!isMounted.current) return;
        lastError = error;
        console.error(`[Receipt] Analysis error (attempt ${attempt + 1}):`, error);
        
        if (attempt < maxRetries) {
          console.log(`[Receipt] Retrying in ${(attempt + 1) * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
        }
      }
    }

    const errorObj = lastError as { message?: string; stack?: string; name?: string } | null;
    console.error("[Receipt] All retry attempts failed:", {
      message: errorObj?.message,
      stack: errorObj?.stack,
      name: errorObj?.name,
    });
    
    if (!isMounted.current) return;

    let errorMessage = "Kunne ikke analysere kvitteringen etter flere forsøk. Legg til manuelt i riktig kategori.";
    
    const errorString = errorObj?.message?.toLowerCase() || "";
    
    if (errorString.includes("json parse") || errorString.includes("parse") || errorString.includes("unexpected token")) {
      errorMessage = "AI-tjenesten returnerte ugyldig data. Dette kan skyldes nettverksproblemer. Prøv igjen senere eller legg til manuelt.";
    } else if (errorString.includes("network") || errorString.includes("fetch") || errorString.includes("networkerror") || errorString.includes("failed to fetch")) {
      errorMessage = "Nettverksfeil. Sjekk internettforbindelsen din og prøv igjen.";
    } else if (errorString.includes("read image") || errorString.includes("bildefil") || errorString.includes("ugyldig bildedata")) {
      errorMessage = "Kunne ikke lese bildet. Prøv å ta et nytt bilde.";
    } else if (errorString.includes("abort") || errorString.includes("timeout")) {
      errorMessage = "Forespørselen tok for lang tid. Sjekk internettforbindelsen og prøv igjen.";
    } else if (errorString.includes("413") || errorString.includes("too large") || errorString.includes("payload")) {
      errorMessage = "Bildet er for stort. Prøv å ta et nytt bilde nærmere kvitteringen.";
    }

    // Append technical error for debugging
    const techError = errorObj?.message || String(lastError) || "Ukjent feil";
    errorMessage += `\n\nTeknisk info: ${techError.substring(0, 200)}`;
    
    Alert.alert(
      "Analysering feilet", 
      errorMessage,
      [
        { text: "Prøv igjen", onPress: () => analyzeReceipt(imageUri, providedBase64) },
        { text: "Avbryt", style: "cancel" },
      ]
    );
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setAnalyzing(false);
  };

  const handleConfirm = () => {
    if (!analysis) return;

    const today = new Date().toISOString();
    const receiptDate = analysis.date
      ? new Date(analysis.date).toISOString()
      : today;

    switch (analysis.category) {
      case "wash":
        addWashRecord({
          date: receiptDate,
          type: analysis.merchant || "Bilvask",
          notes: analysis.description,
        });
        Alert.alert("Lagt til!", "Vasken er registrert i historikken.", [
          { text: "OK", onPress: () => router.back() },
        ]);
        break;

      case "service":
        addServiceRecord({
          date: receiptDate,
          mileage: analysis.mileage ?? carInfo?.currentMileage ?? 0,
          type: analysis.merchant ?? "Service",
          description: analysis.description,
          cost: analysis.amount ?? undefined,
          location: analysis.merchant ?? undefined,
          receiptImages: selectedImage ? [selectedImage] : undefined,
        });
        Alert.alert("Lagt til!", "Servicen er registrert i historikken.", [
          { text: "OK", onPress: () => router.back() },
        ]);
        break;

      case "tires":
        const tireData = {
          merchant: analysis.merchant ?? undefined,
          description: analysis.description,
          amount: analysis.amount ?? undefined,
          date: analysis.date ?? undefined,
          items: analysis.items,
          receiptImages: selectedImage ? [selectedImage] : undefined,
          tireDimensions: analysis.tireDimensions ?? undefined,
          tireWidth: analysis.tireWidth ?? undefined,
          tireProfile: analysis.tireProfile ?? undefined,
          tireRimSize: analysis.tireRimSize ?? undefined,
          tireBrand: analysis.tireBrand ?? undefined,
          tireModel: analysis.tireModel ?? undefined,
          tireType: analysis.tireType ?? undefined,
          tireQuantity: analysis.tireQuantity ?? undefined,
        };
        
        console.log("[Receipt] Navigating to tires with data:", tireData);
        
        router.back();
        setTimeout(() => {
          router.push({
            pathname: "/tires",
            params: {
              prefillData: JSON.stringify(tireData),
            },
          });
        }, 100);
        break;

      case "other":
        Alert.alert(
          "Ukjent kategori",
          "Denne kvitteringen ble ikke kategorisert som vask, service eller dekk. Legg den til manuelt i riktig kategori.",
          [{ text: "OK", onPress: () => router.back() }]
        );
        break;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "wash":
        return <Droplet size={24} color={Colors.primary} strokeWidth={2} />;
      case "service":
        return <Wrench size={24} color={Colors.success} strokeWidth={2} />;
      case "tires":
        return <Disc size={24} color={Colors.danger} strokeWidth={2} />;
      default:
        return <Sparkles size={24} color={Colors.text.secondary} strokeWidth={2} />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "wash":
        return "Bilvask";
      case "service":
        return "Service";
      case "tires":
        return "Dekk";
      default:
        return "Annet";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "wash":
        return "#dbeafe";
      case "service":
        return "#dcfce7";
      case "tires":
        return "#fee2e2";
      default:
        return Colors.background;
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: "Skann dokument",
          headerStyle: { backgroundColor: Colors.cardBackground },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!selectedImage ? (
          <View style={styles.emptyState}>
            <View style={styles.iconWrapper}>
              <Camera size={48} color={Colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Skann kvittering eller servicehefte</Text>
            <Text style={styles.emptyText}>
              Ta et bilde av en kvittering eller en side fra serviceheftet ditt. AI vil
              analysere dokumentet og hente ut all relevant informasjon om bilen.
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={takePhoto}
                activeOpacity={0.8}
              >
                <Camera size={20} color="#fff" strokeWidth={2} />
                <Text style={styles.primaryButtonText}>Ta bilde</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Upload size={20} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.secondaryButtonText}>Last opp bilde</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  setSelectedImage(null);
                  setAnalysis(null);
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <X size={20} color="#fff" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {analyzing ? (
              <View style={styles.analysingCard}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.analysingText}>Analyserer kvittering...</Text>
                <Text style={styles.analysingSubtext}>
                  Dette kan ta noen sekunder
                </Text>
              </View>
            ) : analysis ? (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: getCategoryColor(analysis.category) },
                    ]}
                  >
                    {getCategoryIcon(analysis.category)}
                    <Text style={styles.categoryName}>
                      {getCategoryName(analysis.category)}
                    </Text>
                  </View>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {analysis.confidence}% sikker
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Detaljer</Text>

                  {analysis.description && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Beskrivelse</Text>
                      <Text style={styles.detailValue}>
                        {analysis.description}
                      </Text>
                    </View>
                  )}

                  {analysis.merchant && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Forretning</Text>
                      <Text style={styles.detailValue}>{analysis.merchant}</Text>
                    </View>
                  )}

                  {analysis.amount && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Beløp</Text>
                      <Text style={styles.detailValue}>
                        {analysis.amount.toLocaleString("no-NO")} kr
                      </Text>
                    </View>
                  )}

                  {analysis.date && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Dato</Text>
                      <Text style={styles.detailValue}>
                        {new Date(analysis.date).toLocaleDateString("no-NO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </Text>
                    </View>
                  )}

                  {analysis.isServiceBooklet && (
                    <View style={styles.serviceBookletBadge}>
                      <Text style={styles.serviceBookletText}>📖 Servicehefte</Text>
                    </View>
                  )}

                  {analysis.mileage && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Kilometerstand</Text>
                      <Text style={styles.detailValue}>
                        {analysis.mileage.toLocaleString("no-NO")} km
                      </Text>
                    </View>
                  )}

                  {analysis.nextServiceDue && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Neste service ved</Text>
                      <Text style={styles.detailValue}>
                        {analysis.nextServiceDue.toLocaleString("no-NO")} km
                      </Text>
                    </View>
                  )}

                  {analysis.items && analysis.items.length > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Poster</Text>
                      <View style={styles.itemsList}>
                        {analysis.items.map((item, index) => (
                          <Text key={index} style={styles.itemText}>
                            • {item}
                          </Text>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                  >
                    <CheckCircle2 size={20} color="#fff" strokeWidth={2} />
                    <Text style={styles.confirmButtonText}>
                      Bekreft og legg til
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => {
                      setSelectedImage(null);
                      setAnalysis(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.retryButtonText}>Prøv igjen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        )}
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
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    minHeight: 500,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonGroup: {
    width: "100%",
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  secondaryButton: {
    backgroundColor: Colors.cardBackground,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  contentContainer: {
    padding: 16,
  },
  imageContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: Colors.cardBackground,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 400,
    resizeMode: "contain",
  },
  removeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: Colors.danger,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  analysingCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  analysingText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginTop: 16,
  },
  analysingSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
  },
  resultCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  confidenceBadge: {
    backgroundColor: Colors.success,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#fff",
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 16,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  itemsList: {
    marginTop: 4,
  },
  itemText: {
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: 4,
  },
  actionButtons: {
    gap: 12,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  retryButton: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  retryButtonText: {
    color: Colors.text.secondary,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  serviceBookletBadge: {
    backgroundColor: "#fef3c7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  serviceBookletText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#92400e",
  },
});
