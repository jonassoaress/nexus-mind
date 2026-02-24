import React from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { MOCK_CAPTURES, type CaptureItem } from "@/data/mockData";

// Tag badge color mapping
function getTagStyle(tag: string): { bg: string; text: string } {
  switch (tag) {
    case "FINANCE":
      return { bg: "bg-nexus-purple", text: "text-white" };
    case "TO READ":
      return { bg: "bg-nexus-accent", text: "text-white" };
    case "EXCEL TUTORIAL":
      return { bg: "bg-nexus-purple", text: "text-white" };
    case "IDEA":
      return { bg: "bg-nexus-purple", text: "text-white" };
    default:
      return { bg: "bg-nexus-purple", text: "text-white" };
  }
}

// Placeholder images (colored blocks for Phase 1)
function PlaceholderImage({
  type,
  large,
}: {
  type: string;
  large?: boolean;
}) {
  const height = large ? "h-40" : "h-28";
  const colors: Record<string, string> = {
    receipt: "bg-amber-900/40",
    book: "bg-emerald-900/40",
    video: "bg-rose-900/30",
  };
  return (
    <View
      className={`${height} w-full rounded-xl ${colors[type] ?? "bg-nexus-surface"} items-center justify-center`}
    >
      {type === "video" && (
        <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
          <FontAwesome name="play" size={14} color="#FFFFFF" />
        </View>
      )}
      {type === "book" && (
        <FontAwesome name="book" size={28} color="#4ADE80" />
      )}
      {type === "receipt" && (
        <FontAwesome name="file-text-o" size={28} color="#FCD34D" />
      )}
    </View>
  );
}

// Masonry Card Component
function CaptureCard({ item, isWide }: { item: CaptureItem; isWide?: boolean }) {
  const router = useRouter();
  const tagStyle = getTagStyle(item.tags[0]);
  const isTextOnly = item.type === "note";

  return (
    <Pressable
      onPress={() => {
        if (item.type === "audio") {
          router.push(`/audio/${item.id}`);
        }
      }}
      className="bg-nexus-surface rounded-2xl overflow-hidden mb-3"
    >
      {!isTextOnly && item.imageUrl && (
        <PlaceholderImage type={item.imageUrl} large={isWide} />
      )}
      <View className="p-3">
        {/* Tag */}
        <View className="flex-row mb-2">
          <View className={`px-2.5 py-1 rounded-full ${tagStyle.bg}`}>
            <Text className={`text-[10px] font-bold ${tagStyle.text}`}>
              {item.tags[0]}
            </Text>
          </View>
        </View>

        {/* Source/Author info */}
        {item.source && (
          <Text className="text-nexus-text-muted text-xs mb-1">
            {item.source}
          </Text>
        )}
        {item.author && (
          <Text className="text-nexus-text-muted text-xs mb-1">
            {item.author}
          </Text>
        )}

        {/* Title / Content */}
        {isTextOnly ? (
          <Text className="text-nexus-text-secondary text-sm leading-5">
            {item.title}
          </Text>
        ) : (
          <Text className="text-white font-semibold text-sm">
            {item.title}
          </Text>
        )}

        {/* Timestamp */}
        {item.timestamp && (
          <Text className="text-nexus-text-muted text-[11px] mt-1.5">
            {item.type !== "note" ? item.timestamp : ""}
          </Text>
        )}
        {item.type === "note" && (
          <View className="flex-row items-center mt-2">
            <FontAwesome name="clock-o" size={11} color="#6E6E73" />
            <Text className="text-nexus-text-muted text-[11px] ml-1">
              {item.timestamp}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  // Split items for masonry layout (2 columns)
  const leftColumn = MOCK_CAPTURES.filter((_, i) => i % 2 === 0);
  const rightColumn = MOCK_CAPTURES.filter((_, i) => i % 2 !== 0);

  return (
    <SafeAreaView className="flex-1 bg-nexus-bg" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
          <View className="flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-nexus-purple items-center justify-center mr-2.5">
              <FontAwesome name="connectdevelop" size={18} color="#FFFFFF" />
            </View>
            <Text className="text-white text-xl font-bold">NexusMind</Text>
          </View>
          <Pressable>
            <FontAwesome name="bell-o" size={20} color="#8E8E93" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <Pressable
          onPress={() => router.push("/search")}
          className="mx-5 mb-4"
        >
          <View className="flex-row items-center bg-nexus-surface rounded-full px-4 py-3.5 border border-nexus-border">
            <Text className="flex-1 text-nexus-text-secondary text-sm">
              Ask your second brain...
            </Text>
            <FontAwesome name="microphone" size={16} color="#9D00FF" />
          </View>
        </Pressable>

        {/* Quick Actions */}
        <View className="flex-row px-5 mb-6 gap-3">
          <Pressable className="flex-1 flex-row items-center justify-center bg-nexus-surface border border-nexus-border rounded-full py-3">
            <FontAwesome name="link" size={14} color="#9D00FF" />
            <Text className="text-white font-medium text-sm ml-2">
              Paste Link
            </Text>
          </Pressable>
          <Pressable
            className="flex-1 flex-row items-center justify-center bg-nexus-surface border border-nexus-border rounded-full py-3"
            onPress={() => router.push("/audio/audio-1")}
          >
            <FontAwesome name="microphone" size={14} color="#9D00FF" />
            <Text className="text-white font-medium text-sm ml-2">
              Record Audio
            </Text>
          </Pressable>
        </View>

        {/* Section Header */}
        <View className="flex-row items-center justify-between px-5 mb-4">
          <Text className="text-white text-lg font-bold">Recent Captures</Text>
          <Pressable>
            <Text className="text-nexus-purple text-sm font-medium">
              View All
            </Text>
          </Pressable>
        </View>

        {/* Masonry Grid */}
        <View className="flex-row px-5 gap-3">
          {/* Left Column */}
          <View className="flex-1">
            {leftColumn.map((item) => (
              <CaptureCard key={item.id} item={item} />
            ))}
          </View>
          {/* Right Column */}
          <View className="flex-1">
            {rightColumn.map((item) => (
              <CaptureCard key={item.id} item={item} isWide />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
