import { useCallback } from "react";
import { Alert } from "react-native";
import i18n from "@/lib/i18n";

export function useUnsavedChanges(
  hasChanges: boolean,
  onDiscard: () => void,
) {
  const handleClose = useCallback(() => {
    if (!hasChanges) {
      onDiscard();
      return;
    }

    Alert.alert(
      i18n.t("unsaved_changes_title"),
      i18n.t("unsaved_changes_message"),
      [
        { text: i18n.t("cancel"), style: "cancel" },
        { text: i18n.t("discard"), style: "destructive", onPress: onDiscard },
      ]
    );
  }, [hasChanges, onDiscard]);

  return handleClose;
}
