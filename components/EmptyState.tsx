import { StyleSheet, Text, View } from "react-native";
import { ReactNode } from "react";
import Colors, { typography, palette } from "@/constants/colors";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <View style={styles.emptyState} testID="empty-state">
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.slate100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    ...typography.emptyTitle,
    color: Colors.text.primary,
    marginBottom: 6,
  },
  emptyText: {
    ...typography.emptyText,
    color: Colors.text.secondary,
    textAlign: "center",
  },
});
