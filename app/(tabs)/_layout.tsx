import { Tabs } from "expo-router";
import { Car, Droplet, Wrench, CircleSlash2 } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useTranslation } from "react-i18next";

import Colors from "@/constants/colors";

export default function TabLayout() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tabIconSelected,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Platform.OS === "ios" ? "transparent" : Colors.cardBackground,
          borderTopWidth: 0, // Remove top border for cleaner look
          elevation: 0,      // Remove shadow on Android for consistency if using blur (though blur is iOS only here)
          position: "absolute", // Required for blur to show content behind
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarBackground: () => (
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          ) : undefined
        ),
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600" as const,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: t('overview'),
          tabBarIcon: ({ color }) => <Car size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="wash"
        options={{
          title: t('wash'),
          tabBarIcon: ({ color }) => <Droplet size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="service"
        options={{
          title: t('service'),
          tabBarIcon: ({ color }) => <Wrench size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="tires"
        options={{
          title: t('tires'),
          tabBarIcon: ({ color }) => <CircleSlash2 size={24} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
