import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import Colors from "@/constants/colors";

export default function WashStackLayout() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.cardBackground,
        },
        headerTintColor: Colors.text.primary,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: "600" as const,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('wash'),
        }}
      />
    </Stack>
  );
}
