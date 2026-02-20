import "@/lib/i18n";
import { useTranslation } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppState, AppStateStatus, InteractionManager } from "react-native";
import { enableFreeze, enableScreens } from "react-native-screens";
import { CarProvider } from "@/contexts/car-context";
import { trpc, trpcProviderClient } from "@/lib/trpc";
import { log } from "@/lib/logger";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import AppSplash from "@/components/AppSplash";

enableScreens(true);
enableFreeze(true);

void SplashScreen.preventAutoHideAsync().catch((e: unknown) => {
  log("[SplashScreen] preventAutoHideAsync failed", e);
});

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
  const { t } = useTranslation();
  return (
    <Stack screenOptions={{ headerBackTitle: t('back') }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="scan-receipt" options={{ headerShown: true, presentation: "modal" }} />
      <Stack.Screen name="vehicle-info" options={{ headerShown: true, title: t('vehicle_info') }} />
      <Stack.Screen name="insurance-documents" options={{ headerShown: true, title: t('insurance_documents') }} />
      <Stack.Screen name="fuel" options={{ headerShown: true, title: t('fuel') }} />
      <Stack.Screen name="mileage-history" options={{ headerShown: true, title: t('mileage_history') }} />
      <Stack.Screen name="add-car" options={{ headerShown: true, title: t('add_car') }} />
      <Stack.Screen name="app-settings" options={{ headerShown: true, title: t('settings') }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    let didCancel = false;

    const hide = () => {
      void SplashScreen.hideAsync().catch((e: unknown) => {
        log("[SplashScreen] hideAsync failed", e);
      });
    };

    const task = InteractionManager.runAfterInteractions(() => {
      if (didCancel) return;
      setIsReady(true);
      requestAnimationFrame(() => {
        if (didCancel) return;
        hide();
      });
    });

    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      log("[RootLayout] AppState:", state);
    });

    return () => {
      didCancel = true;
      task.cancel();
      sub.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcProviderClient} queryClient={queryClient}>
        <CarProvider>
          <GestureHandlerRootView style={{ flex: 1 }} testID="gesture-root">
            <StatusBar style="auto" />
            <AppErrorBoundary>
              {isReady ? <RootLayoutNav /> : <AppSplash testID="app-splash" />}
            </AppErrorBoundary>
          </GestureHandlerRootView>
        </CarProvider>
      </trpc.Provider>
    </QueryClientProvider>
  );
}
