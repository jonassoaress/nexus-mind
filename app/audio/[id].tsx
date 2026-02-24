import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { MOCK_AUDIO_DETAIL } from "@/data/mockData";

// Waveform visualization (static bars for Phase 1)
function WaveformVisualizer() {
  // Generate fake waveform bars
  const bars = [
    3, 5, 8, 4, 6, 9, 7, 5, 8, 10, 6, 4, 7, 9, 5, 8, 6, 10, 7, 4, 8, 5, 9,
    6, 7, 4, 8, 10, 5, 7, 9, 6, 4, 8, 5, 7, 10, 6, 9, 4,
  ];
  const activeIndex = 12; // fake playhead position

  return (
    <View className="flex-row items-center justify-center h-16 gap-[2px] my-4">
      {bars.map((height, i) => (
        <View
          key={i}
          style={{ height: height * 5 }}
          className={`w-[3px] rounded-full ${
            i <= activeIndex ? "bg-nexus-purple" : "bg-nexus-purple/30"
          }`}
        />
      ))}
    </View>
  );
}

// Audio playback controls
function PlaybackControls() {
  const [isPlaying, setIsPlaying] = useState(false);
  const data = MOCK_AUDIO_DETAIL;

  return (
    <View className="flex-row items-center justify-between px-4 mt-2">
      <Text className="text-nexus-text-secondary text-xs font-mono">
        {data.currentTime}
      </Text>
      <View className="flex-row items-center gap-6">
        <Pressable>
          <FontAwesome name="undo" size={18} color="#8E8E93" />
        </Pressable>
        <Pressable
          onPress={() => setIsPlaying(!isPlaying)}
          className="w-14 h-14 rounded-full bg-nexus-purple items-center justify-center"
        >
          <FontAwesome
            name={isPlaying ? "pause" : "play"}
            size={20}
            color="#FFFFFF"
            style={isPlaying ? {} : { marginLeft: 3 }}
          />
        </Pressable>
        <Pressable>
          <FontAwesome name="repeat" size={18} color="#8E8E93" />
        </Pressable>
      </View>
      <Text className="text-nexus-text-secondary text-xs font-mono">
        {data.remainingTime}
      </Text>
    </View>
  );
}

export default function AudioDetailScreen() {
  const { id } = useLocalSearchParams();
  const data = MOCK_AUDIO_DETAIL;
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (itemId: string) => {
    setCheckedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: data.date,
          headerTitleAlign: "center",
          headerTitleStyle: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
          headerRight: () => (
            <Pressable className="mr-2">
              <FontAwesome name="ellipsis-v" size={18} color="#8E8E93" />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-nexus-bg" edges={["bottom"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Audio Player Card */}
          <View className="mx-4 mt-4 bg-nexus-surface rounded-2xl p-5">
            {/* Title row */}
            <View className="flex-row items-start justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-white text-xl font-bold mb-1">
                  {data.title}
                </Text>
                <Text className="text-nexus-text-secondary text-xs">
                  Auto-tagged: {data.autoTags.join(", ")}
                </Text>
              </View>
              {/* AI Processed Badge */}
              <View className="bg-nexus-purple/20 border border-nexus-purple/40 rounded-lg px-2.5 py-1.5">
                <Text className="text-nexus-purple text-[10px] font-bold">
                  {data.status}
                </Text>
              </View>
            </View>

            {/* Waveform */}
            <WaveformVisualizer />

            {/* Playback Controls */}
            <PlaybackControls />
          </View>

          {/* AI Summary Section */}
          <View className="mx-4 mt-6">
            <View className="flex-row items-center mb-3">
              <FontAwesome name="magic" size={14} color="#9D00FF" />
              <Text className="text-white text-sm font-bold ml-2 uppercase tracking-wider">
                AI Summary
              </Text>
            </View>

            <View className="bg-nexus-surface rounded-2xl p-4">
              <Text className="text-nexus-text-secondary text-sm leading-6">
                Brainstorming a new{" "}
                <Text className="text-white font-bold">B2B SaaS idea</Text> for
                automated customer onboarding. The discussion focuses primarily
                on strategies for{" "}
                <Text className="text-white font-bold">reducing churn</Text>{" "}
                during the critical first 14 days of user engagement.
              </Text>

              {/* Tags */}
              <View className="flex-row flex-wrap gap-2 mt-4">
                {data.summaryTags.map((tag) => (
                  <View
                    key={tag}
                    className="px-3 py-1.5 rounded-full border border-nexus-purple/40"
                  >
                    <Text className="text-nexus-purple text-xs font-medium">
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Action Items Section */}
          <View className="mx-4 mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <FontAwesome name="check-circle" size={14} color="#9D00FF" />
                <Text className="text-white text-sm font-bold ml-2 uppercase tracking-wider">
                  Action Items
                </Text>
              </View>
              <Text className="text-nexus-text-muted text-xs">
                {completedCount}/{data.actionItems.length}
              </Text>
            </View>

            <View className="bg-nexus-surface rounded-2xl overflow-hidden">
              {data.actionItems.map((item, index) => (
                <Pressable
                  key={item.id}
                  onPress={() => toggleItem(item.id)}
                  className={`flex-row items-center p-4 ${
                    index < data.actionItems.length - 1
                      ? "border-b border-nexus-border"
                      : ""
                  }`}
                >
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                      checkedItems[item.id]
                        ? "bg-nexus-purple border-nexus-purple"
                        : "border-nexus-text-muted"
                    }`}
                  >
                    {checkedItems[item.id] && (
                      <FontAwesome name="check" size={10} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    className={`text-sm flex-1 ${
                      checkedItems[item.id]
                        ? "text-nexus-text-muted line-through"
                        : "text-nexus-text-secondary"
                    }`}
                  >
                    {item.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Share FAB */}
        <View className="absolute bottom-8 right-5">
          <Pressable className="w-14 h-14 rounded-full bg-nexus-purple items-center justify-center shadow-lg">
            <FontAwesome name="share-alt" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}
