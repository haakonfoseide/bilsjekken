import { Tabs } from "expo-router";
import { Car, Droplet, Wrench, CircleSlash2 } from "lucide-react-native";
import React from "react";

import Colors from "@/constants/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.tabIconSelected,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.cardBackground,
          borderTopColor: Colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600" as const,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Oversikt",
          tabBarIcon: ({ color }) => <Car size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="wash"
        options={{
          title: "Vask",
          tabBarIcon: ({ color }) => <Droplet size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="service"
        options={{
          title: "Service",
          tabBarIcon: ({ color }) => <Wrench size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="tires"
        options={{
          title: "Dekk",
          tabBarIcon: ({ color }) => <CircleSlash2 size={24} color={color} strokeWidth={2} />,
        }}
      />
    </Tabs>
  );
}
