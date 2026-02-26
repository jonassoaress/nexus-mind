import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { ShareIntentProvider } from "expo-share-intent";
import { useDatabase } from "@/hooks/useDatabase";
import {
  defineScreenshotTask,
  initializeScreenshotBaseline,
} from "@/lib/capture/screenshotWatcher";

import "../global.css";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Define background task at module level (required by expo-task-manager)
defineScreenshotTask();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Initialize database & run migrations before rendering
  const { isReady: dbReady, error: dbError } = useDatabase();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (dbError) console.error("[NexusMind] DB Error:", dbError);
  }, [dbError]);

  useEffect(() => {
    if (loaded && dbReady) {
      SplashScreen.hideAsync();
      // Initialize screenshot baseline on first launch
      initializeScreenshotBaseline();
    }
  }, [loaded, dbReady]);

  if (!loaded || !dbReady) {
    return null;
  }

  return (
    <ShareIntentProvider
      options={{
        debug: __DEV__,
        resetOnBackground: true,
      }}
    >
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0A0A0F" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="search"
          options={{
            headerShown: true,
            headerTitle: "Semantic Search",
            headerTitleAlign: "center",
            headerStyle: { backgroundColor: "#0A0A0F" },
            headerTintColor: "#FFFFFF",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="audio/[id]"
          options={{
            headerShown: true,
            headerTitle: "",
            headerStyle: { backgroundColor: "#0A0A0F" },
            headerTintColor: "#FFFFFF",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="record"
          options={{
            headerShown: false,
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
    </ShareIntentProvider>
  );
}
