import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function ServiceStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.cardBackground,
        },
        headerTintColor: Colors.text.primary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Service",
        }}
      />
    </Stack>
  );
}
