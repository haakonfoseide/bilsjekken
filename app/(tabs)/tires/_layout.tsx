import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function TiresStackLayout() {
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
          title: "Dekk",
        }}
      />
    </Stack>
  );
}
