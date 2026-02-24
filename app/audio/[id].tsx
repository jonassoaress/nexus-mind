import React, { useEffect } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useItemsStore } from "@/stores/useItemsStore";

// Waveform visualization (static bars for Phase 1)
function WaveformVisualizer() {
  const bars = [
    3, 5, 8, 4, 6, 9, 7, 5, 8, 10, 6, 4, 7, 9, 5, 8, 6, 10, 7, 4, 8, 5, 9,
    6, 7, 4, 8, 10, 5, 7, 9, 6, 4, 8, 5, 7, 10, 6, 9, 4,
  ];
  const activeIndex = 12;

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
function PlaybackControls({
  currentTime,
  remainingTime,
}: {
  currentTime: string;
  remainingTime: string;
}) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <View className="flex-row items-center justify-between px-4 mt-2">
      <Text className="text-nexus-text-secondary text-xs font-mono">
        {currentTime}
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
        {remainingTime}
      </Text>
    </View>
  );
}

export default function AudioDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    items,
    currentAudioDetail,
    isLoadingAudioDetail,
    loadAudioDetail,
    toggleActionItem,
    loadItems,
    isInitialized,
  } = useItemsStore();

  // Load items if not already loaded
  useEffect(() => {
    if (!isInitialized) {
      loadItems();
    }
  }, [isInitialized, loadItems]);

  // Load audio detail when the screen mounts
  useEffect(() => {
    if (id) {
      loadAudioDetail(id);
    }
  }, [id, loadAudioDetail]);

  // Find the parent item for metadata
  const parentItem = items.find((i) => i.id === id);
  const data = currentAudioDetail;

  const completedCount =
    data?.actionItems.filter((ai) => ai.completed).length ?? 0;

  // Loading state
  if (isLoadingAudioDetail || !data) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: "",
            headerTitleAlign: "center",
            headerTitleStyle: {
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: "600",
            },
          }}
        />
        <SafeAreaView className="flex-1 bg-nexus-bg items-center justify-center">
          <ActivityIndicator size="large" color="#9D00FF" />
          <Text className="text-nexus-text-secondary mt-3">
            Loading audio detail...
          </Text>
        </SafeAreaView>
      </>
    );
  }

  const title = parentItem?.title ?? "Audio";
  const tags = parentItem?.tags ?? [];
  const duration = parentItem?.duration ?? "0:00";
  const dateLabel = parentItem
    ? `Voice Note - ${parentItem.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : "Voice Note";

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: dateLabel,
          headerTitleAlign: "center",
          headerTitleStyle: {
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "600",
          },
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
                  {title}
                </Text>
                <Text className="text-nexus-text-secondary text-xs">
                  Auto-tagged: {data.autoTags.join(", ")}
                </Text>
              </View>
              {/* AI Processed Badge */}
              <View className="bg-nexus-purple/20 border border-nexus-purple/40 rounded-lg px-2.5 py-1.5">
                <Text className="text-nexus-purple text-[10px] font-bold">
                  {parentItem?.processingStatus === "completed"
                    ? "AI PROCESSED"
                    : parentItem?.processingStatus?.toUpperCase() ?? "PENDING"}
                </Text>
              </View>
            </View>

            {/* Waveform */}
            <WaveformVisualizer />

            {/* Playback Controls */}
            <PlaybackControls
              currentTime={data.currentTime}
              remainingTime={data.remainingTime}
            />
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
                {data.summary}
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
                  onPress={() => {
                    if (id) toggleActionItem(id, item.id);
                  }}
                  className={`flex-row items-center p-4 ${
                    index < data.actionItems.length - 1
                      ? "border-b border-nexus-border"
                      : ""
                  }`}
                >
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                      item.completed
                        ? "bg-nexus-purple border-nexus-purple"
                        : "border-nexus-text-muted"
                    }`}
                  >
                    {item.completed && (
                      <FontAwesome name="check" size={10} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    className={`text-sm flex-1 ${
                      item.completed
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
