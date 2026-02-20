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
  AlertTriangle,
  RefreshCw,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as Haptics from "expo-haptics";
import { generateObject } from "@rork-ai/toolkit-sdk";
import { z } from "zod";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const lastImageRef = useRef<{ uri: string; base64?: string } | null>(null);
  
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const processImage = async (uri: string) => {
    try {
      // Optimize image for iOS and network performance
      // Resize to max 600px width (down from 800) and compress to jpeg 0.4 (down from 0.5)
      // Also request base64 directly to avoid FileSystem read issues
      const manipulatedResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 600 } }],
        { 
          compress: 0.4, 
          format: ImageManipulator.SaveFormat.JPEG, 
          base64: true 
        }
      );
      return { uri: manipulatedResult.uri, base64: manipulatedResult.base64 };
    } catch (error) {
      console.warn("Image manipulation failed, using original:", error);
      return { uri, base64: undefined };
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t('permission_required_title'),
        t('camera_receipt_desc')
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'] as ImagePicker.MediaType[],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!isMounted.current) return;

    if (!result.canceled && result.assets && result.assets[0]) {
      const originalUri = result.assets[0].uri;
      
      setSelectedImage(originalUri);
      setAnalysisFailed(false);
      
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      const { uri, base64 } = await processImage(originalUri);
      lastImageRef.current = { uri, base64 };
      analyzeReceipt(uri, base64);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t('permission_required_title'),
        t('gallery_receipt_desc')
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as ImagePicker.MediaType[],
      quality: 0.8,
      allowsEditing: false,
    });

    if (!isMounted.current) return;

    if (!result.canceled && result.assets && result.assets[0]) {
      const originalUri = result.assets[0].uri;
      
      setSelectedImage(originalUri);
      setAnalysisFailed(false);
      
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      const { uri, base64 } = await processImage(originalUri);
      lastImageRef.current = { uri, base64 };
      analyzeReceipt(uri, base64);
    }
  };

  const analyzeReceipt = async (imageUri: string, providedBase64?: string) => {
    setAnalyzing(true);
    setAnalysisFailed(false);
    const maxRetries = 2;
    let lastError: unknown = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Receipt] Starting analysis (attempt ${attempt + 1}/${maxRetries + 1})...`);
        
        let base64Image = "";
        
        if (providedBase64) {
          base64Image = `data:image/jpeg;base64,${providedBase64}`;
        } else if (Platform.OS === "web") {
            base64Image = await fetch(imageUri)
            .then((r) => r.blob())
            .then(
                (blob) =>
                new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = () => reject(new Error("Failed to read image"));
                    reader.readAsDataURL(blob);
                })
            );
        } else {
            // Native: Use expo-file-system as fallback
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: "base64",
            });
            base64Image = `data:image/jpeg;base64,${base64}`;
        }

        console.log("[Receipt] Image converted to base64, calling AI...");
        console.log(`[Receipt] Base64 length: ${base64Image.length} chars (~${Math.round(base64Image.length * 0.75 / 1024)} KB)`);

        // Add timeout to prevent hanging requests in production
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Request timed out after 60 seconds")), 60000);
        });

        const result = await Promise.race([generateObject({
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
        }), timeoutPromise]);

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
    
    if (errorObj?.message?.includes("JSON Parse") || errorObj?.message?.includes("parse")) {
      errorMessage = "AI-tjenesten returnerte ugyldig data. Dette kan skyldes nettverksproblemer. Prøv igjen senere eller legg til manuelt.";
    } else if (errorObj?.message?.includes("network") || errorObj?.message?.includes("fetch") || errorObj?.message?.includes("NetworkError")) {
      errorMessage = "Nettverksfeil. Sjekk internettforbindelsen din og prøv igjen.";
    } else if (errorObj?.message?.includes("read image")) {
      errorMessage = "Kunne ikke lese bildet. Prøv å ta et nytt bilde.";
    }

    // Append technical error for debugging in TestFlight
    errorMessage += `\n\nTeknisk feil: ${errorObj?.message || String(lastError) || "Ukjent"}`;
    
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
    setAnalysisFailed(true);
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
        Alert.alert(t('added_title'), t('wash_added'), [
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
        Alert.alert(t('added_title'), t('service_added'), [
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
            pathname: "/tires" as any,
            params: {
              prefillData: JSON.stringify(tireData),
            },
          });
        }, 100);
        break;

      case "other":
        Alert.alert(
          t('unknown_category'),
          t('unknown_category_desc'),
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
        return t('car_wash_label');
      case "service":
        return t('service');
      case "tires":
        return t('tires');
      default:
        return t('other_label');
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
          title: t('scan_document'),
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
            <Text style={styles.emptyTitle}>{t('scan_receipt_or_service')}</Text>
            <Text style={styles.emptyText}>
              {t('scan_receipt_desc')}
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={takePhoto}
                activeOpacity={0.8}
              >
                <Camera size={20} color="#fff" strokeWidth={2} />
                <Text style={styles.primaryButtonText}>{t('take_photo')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Upload size={20} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.secondaryButtonText}>{t('upload_image')}</Text>
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
                  setAnalysisFailed(false);
                  lastImageRef.current = null;
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
                <Text style={styles.analysingText}>{t('analyzing_receipt')}</Text>
                <Text style={styles.analysingSubtext}>
                  {t('may_take_seconds')}
                </Text>
              </View>
            ) : analysisFailed ? (
              <View style={styles.errorCard}>
                <AlertTriangle size={40} color={Colors.danger} strokeWidth={1.5} />
                <Text style={styles.errorTitle}>{t('analysis_failed_title') || 'Analysering feilet'}</Text>
                <Text style={styles.errorSubtext}>{t('analysis_failed_desc') || 'Kunne ikke analysere bildet. Prøv igjen eller legg til manuelt.'}</Text>
                <TouchableOpacity
                  style={styles.retryActionButton}
                  onPress={() => {
                    if (lastImageRef.current) {
                      analyzeReceipt(lastImageRef.current.uri, lastImageRef.current.base64);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <RefreshCw size={18} color="#fff" strokeWidth={2} />
                  <Text style={styles.retryActionButtonText}>{t('try_again') || 'Prøv igjen'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setSelectedImage(null);
                    setAnalysis(null);
                    setAnalysisFailed(false);
                    lastImageRef.current = null;
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.retryButtonText}>{t('choose_new_image') || 'Velg nytt bilde'}</Text>
                </TouchableOpacity>
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
                      {t('confident', { value: analysis.confidence })}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>{t('details')}</Text>

                  {analysis.description && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('description')}</Text>
                      <Text style={styles.detailValue}>
                        {analysis.description}
                      </Text>
                    </View>
                  )}

                  {analysis.merchant && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('merchant')}</Text>
                      <Text style={styles.detailValue}>{analysis.merchant}</Text>
                    </View>
                  )}

                  {analysis.amount && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('amount')}</Text>
                      <Text style={styles.detailValue}>
                        {analysis.amount.toLocaleString("no-NO")} kr
                      </Text>
                    </View>
                  )}

                  {analysis.date && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('date')}</Text>
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
                      <Text style={styles.detailLabel}>{t('mileage')}</Text>
                      <Text style={styles.detailValue}>
                        {analysis.mileage.toLocaleString("no-NO")} km
                      </Text>
                    </View>
                  )}

                  {analysis.nextServiceDue && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('next_service_at')}</Text>
                      <Text style={styles.detailValue}>
                        {analysis.nextServiceDue.toLocaleString("no-NO")} km
                      </Text>
                    </View>
                  )}

                  {analysis.items && analysis.items.length > 0 && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t('items')}</Text>
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
                      {t('confirm_and_add')}
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
                    <Text style={styles.retryButtonText}>{t('try_again')}</Text>
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
  errorCard: {
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
  errorTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center" as const,
    marginBottom: 24,
    lineHeight: 20,
  },
  retryActionButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginBottom: 12,
    width: "100%",
  },
  retryActionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
});
