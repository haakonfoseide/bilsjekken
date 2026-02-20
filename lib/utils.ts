import { Platform, Alert } from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import i18n from "@/lib/i18n";

export const hapticFeedback = {
  light: () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },
  medium: () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },
  heavy: () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },
  selection: () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  },
  success: () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },
  error: () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
  warning: () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },
};

export const formatDateLocalized = (
  dateString: string,
  language: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(language, options ?? {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDateSimple = (
  dateString: string | null | undefined,
  language: string
): string => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString(language, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const getDaysAgo = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const formatNumber = (value: number, locale: string = "nb-NO"): string => {
  return value.toLocaleString(locale);
};

interface ImagePickerResult {
  images: string[];
  cancelled: boolean;
}

export const pickImagesFromGallery = async (): Promise<ImagePickerResult> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      i18n.t('permission_required'),
      i18n.t('permission_required_gallery')
    );
    return { images: [], cancelled: true };
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'] as ImagePicker.MediaType[],
    allowsMultipleSelection: true,
    quality: 0.8,
  });

  if (result.canceled || !result.assets) {
    return { images: [], cancelled: true };
  }

  return {
    images: result.assets.map((asset) => asset.uri),
    cancelled: false,
  };
};

export const takePhotoWithCamera = async (): Promise<ImagePickerResult> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      i18n.t('permission_required'),
      i18n.t('permission_required_camera')
    );
    return { images: [], cancelled: true };
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'] as ImagePicker.MediaType[],
    quality: 0.8,
  });

  if (result.canceled || !result.assets || !result.assets[0]) {
    return { images: [], cancelled: true };
  }

  return {
    images: [result.assets[0].uri],
    cancelled: false,
  };
};

export const showImagePickerOptions = (
  onTakePhoto: () => void,
  onPickFromGallery: () => void
) => {
  Alert.alert(i18n.t('add_photo_title'), i18n.t('choose_option'), [
    { text: i18n.t('take_photo'), onPress: onTakePhoto },
    { text: i18n.t('pick_from_gallery'), onPress: onPickFromGallery },
    { text: i18n.t('cancel'), style: "cancel" },
  ]);
};

export const confirmDelete = (
  title: string,
  message: string,
  onConfirm: () => void
) => {
  Alert.alert(title, message, [
    { text: i18n.t('cancel'), style: "cancel" },
    { text: i18n.t('delete'), style: "destructive", onPress: onConfirm },
  ]);
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const calculateAge = (dateString: string): { years: number; months: number } => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
  const diffMonths = Math.floor(
    (diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30)
  );
  return { years: diffYears, months: diffMonths };
};
