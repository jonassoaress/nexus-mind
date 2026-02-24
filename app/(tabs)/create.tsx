import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function CreateScreen() {
  return (
    <SafeAreaView className="flex-1 bg-nexus-bg items-center justify-center px-8">
      <View className="w-20 h-20 rounded-full bg-nexus-purple-muted items-center justify-center mb-6">
        <FontAwesome name="plus" size={32} color="#9D00FF" />
      </View>
      <Text className="text-white text-xl font-bold mb-2">Quick Capture</Text>
      <Text className="text-nexus-text-secondary text-center text-sm leading-5">
        Paste a link, record audio, or take a screenshot to add to your second brain.
      </Text>
    </SafeAreaView>
  );
}
