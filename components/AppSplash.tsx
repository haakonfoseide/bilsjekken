import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import Colors from "@/constants/colors";

type AppSplashProps = { testID?: string };

export default function AppSplash({ testID }: AppSplashProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== "web" }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: Platform.OS !== "web" }),
    ]).start();
  }, [fade, scale]);

  const logoUri = `https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/0fqfyz4dr0uy3dexm37vy`;

  return (
    <View style={styles.root} testID={testID ?? "app-splash"}>
      <LinearGradient colors={["#0ea5e9", Colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bg}>
        <Animated.View style={[styles.card, { opacity: fade, transform: [{ scale }] }]}>
          <Image source={{ uri: logoUri }} style={styles.logo} contentFit="contain" accessibilityLabel="BilSjekken logo" />
          <Text style={styles.title}>Bilsjekken</Text>
          <Text style={styles.subtitle}>Alt om din bil, på ett sted</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0f172a" },
  bg: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingVertical: 28,
    paddingHorizontal: 32,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  logo: { width: 96, height: 96, marginBottom: 16, borderRadius: 20 },
  title: { fontSize: 28, fontWeight: "800" as const, color: Colors.text.primary },
  subtitle: { marginTop: 6, fontSize: 14, color: Colors.text.secondary, fontWeight: "600" as const },
});
