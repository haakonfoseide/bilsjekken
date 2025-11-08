import { Stack, useRouter } from "expo-router";
import { TouchableOpacity, Platform } from "react-native";
import { Settings } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

export default function HomeStackLayout() {
  const router = useRouter();

  const handleSettingsPress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/settings" as never);
  };

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
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSettingsPress}
              style={{ marginRight: 8, padding: 8 }}
              activeOpacity={0.7}
            >
              <Settings size={24} color={Colors.text.primary} strokeWidth={2} />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
