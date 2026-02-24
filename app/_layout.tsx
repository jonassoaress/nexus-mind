import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";

import "../global.css";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
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
      </Stack>
    </>
  );
}
