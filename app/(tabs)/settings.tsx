import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

function SettingsRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof FontAwesome>["name"];
  label: string;
  value?: string;
}) {
  return (
    <Pressable className="flex-row items-center py-4 border-b border-nexus-border">
      <View className="w-8 items-center">
        <FontAwesome name={icon} size={16} color="#9D00FF" />
      </View>
      <Text className="flex-1 text-white text-sm ml-3">{label}</Text>
      {value && (
        <Text className="text-nexus-text-secondary text-sm mr-2">{value}</Text>
      )}
      <FontAwesome name="chevron-right" size={12} color="#6E6E73" />
    </Pressable>
  );
}

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-nexus-bg" edges={["top"]}>
      <ScrollView className="flex-1 px-5">
        {/* Header */}
        <Text className="text-white text-2xl font-bold pt-4 pb-6">
          Settings
        </Text>

        {/* AI Section */}
        <Text className="text-nexus-purple text-xs font-bold mb-3 uppercase tracking-wider">
          On-Device AI
        </Text>
        <View className="bg-nexus-surface rounded-xl px-4 mb-6">
          <SettingsRow icon="microchip" label="AI Processing" value="On-Device" />
          <SettingsRow icon="database" label="Local Storage" value="124 MB" />
          <SettingsRow icon="shield" label="Privacy Mode" value="Strict" />
        </View>

        {/* App Section */}
        <Text className="text-nexus-purple text-xs font-bold mb-3 uppercase tracking-wider">
          App
        </Text>
        <View className="bg-nexus-surface rounded-xl px-4 mb-6">
          <SettingsRow icon="paint-brush" label="Theme" value="Dark" />
          <SettingsRow icon="bell-o" label="Notifications" value="On" />
          <SettingsRow icon="info-circle" label="About NexusMind" />
        </View>

        {/* Version */}
        <Text className="text-nexus-text-muted text-center text-xs mt-4">
          NexusMind v1.0.0 (MVP)
        </Text>
        <Text className="text-nexus-text-muted text-center text-xs mt-1 mb-8">
          100% On-Device AI • Zero Cloud
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
