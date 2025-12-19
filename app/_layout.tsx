import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppState, AppStateStatus } from "react-native";
import { CarProvider } from "@/contexts/car-context";
import { trpc, trpcProviderClient } from "@/lib/trpc";
import AppSplash from "@/components/AppSplash";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          if (error.message.includes('Network') || error.message.includes('fetch')) {
            return failureCount < 3;
          }
          if (error.message.includes('404') || error.message.includes('NOT_FOUND')) {
            return false;
          }
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Tilbake" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: true }} />
      <Stack.Screen name="scan-receipt" options={{ headerShown: true, presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsReady(true);
      SplashScreen.hideAsync();
    }, 2500);
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      console.log("[RootLayout] AppState:", state);
    });
    return () => {
      clearTimeout(t);
      sub.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcProviderClient} queryClient={queryClient}>
        <CarProvider>
          <GestureHandlerRootView style={{ flex: 1 }} testID="gesture-root">
            <StatusBar style="auto" />
            {isReady ? <RootLayoutNav /> : <AppSplash testID="app-splash" />}
          </GestureHandlerRootView>
        </CarProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}
