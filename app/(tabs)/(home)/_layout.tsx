import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function HomeStackLayout() {
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
          title: "Oversikt",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
