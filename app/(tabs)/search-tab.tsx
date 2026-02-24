import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchTabPlaceholder() {
  // This tab just redirects to the search stack screen via the listener
  // in _layout.tsx. This file exists to satisfy Expo Router's file-based routing.
  return (
    <SafeAreaView className="flex-1 bg-nexus-bg items-center justify-center">
      <Text className="text-nexus-text-secondary">Redirecting to search...</Text>
    </SafeAreaView>
  );
}
