import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function WashStackLayout() {
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
          title: "Vaskhistorikk",
        }}
      />
    </Stack>
  );
}
