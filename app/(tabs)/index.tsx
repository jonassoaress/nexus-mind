import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  AppState,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useShareIntentContext } from "expo-share-intent";
import { useItemsStore } from "@/stores/useItemsStore";
import { captureLinkFromClipboard } from "@/lib/capture/linkCapture";
import { processShareIntent } from "@/lib/capture/shareIntent";
import {
  checkForNewScreenshots,
  requestMediaLibraryPermission,
  getMediaLibraryPermissionStatus,
  registerScreenshotWatcher,
} from "@/lib/capture/screenshotWatcher";
import type { Item } from "@/lib/types";

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

/** Format a Date to a relative timestamp string */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

// Processing Status Badge
function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return null;

  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-500/20", text: "text-amber-400", label: "PENDING" },
    processing: { bg: "bg-blue-500/20", text: "text-blue-400", label: "PROCESSING" },
    failed: { bg: "bg-red-500/20", text: "text-red-400", label: "FAILED" },
  };

  const c = config[status] ?? config.pending;

  return (
    <View className={`px-2 py-0.5 rounded-full ${c.bg} mb-1.5`}>
      <Text className={`text-[9px] font-bold ${c.text}`}>{c.label}</Text>
    </View>
  );
}

// Masonry Card Component
function CaptureCard({ item, isWide }: { item: Item; isWide?: boolean }) {
  const router = useRouter();
  const tag = item.tags[0];
  const tagStyle = tag ? getTagStyle(tag) : null;
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
      {!isTextOnly && item.imagePlaceholder && (
        <PlaceholderImage type={item.imagePlaceholder} large={isWide} />
      )}
      <View className="p-3">
        {/* Processing Status */}
        <StatusBadge status={item.processingStatus} />

        {/* Tag */}
        {tagStyle && tag && (
          <View className="flex-row mb-2">
            <View className={`px-2.5 py-1 rounded-full ${tagStyle.bg}`}>
              <Text className={`text-[10px] font-bold ${tagStyle.text}`}>
                {tag}
              </Text>
            </View>
          </View>
        )}

        {/* Source/Author info */}
        {item.sourceLabel && (
          <Text className="text-nexus-text-muted text-xs mb-1">
            {item.sourceLabel}
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
        {item.type !== "note" && (
          <Text className="text-nexus-text-muted text-[11px] mt-1.5">
            {formatTimestamp(item.createdAt)}
          </Text>
        )}
        {item.type === "note" && (
          <View className="flex-row items-center mt-2">
            <FontAwesome name="clock-o" size={11} color="#6E6E73" />
            <Text className="text-nexus-text-muted text-[11px] ml-1">
              {formatTimestamp(item.createdAt)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { items, isLoading, isInitialized, loadItems } = useItemsStore();
  const [isPastingLink, setIsPastingLink] = useState(false);

  // Share intent handling
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();

  // Load items from database on mount
  useEffect(() => {
    if (!isInitialized) {
      loadItems();
    }
  }, [isInitialized, loadItems]);

  // ─── Share Intent Processing ────────────────────────────────────
  useEffect(() => {
    if (hasShareIntent && shareIntent) {
      (async () => {
        try {
          const result = await processShareIntent(shareIntent);
          if (result) {
            await loadItems();
            Alert.alert(
              "Captured!",
              `Saved as ${result.type}: "${result.item.title}"`,
              [{ text: "OK" }]
            );
          }
        } catch (error) {
          console.error("[NexusMind] Share intent error:", error);
        } finally {
          resetShareIntent();
        }
      })();
    }
  }, [hasShareIntent, shareIntent, loadItems, resetShareIntent]);

  // ─── Screenshot Monitoring (on app resume) ─────────────────────
  useEffect(() => {
    // Initialize screenshot watcher permissions + registration
    (async () => {
      const hasPermission = await getMediaLibraryPermissionStatus();
      if (hasPermission) {
        try {
          await registerScreenshotWatcher();
        } catch {
          // Background fetch may not be available in dev
        }
      }
    })();

    // Check for new screenshots when app returns to foreground
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && isInitialized) {
        checkForNewScreenshots().then((newItems) => {
          if (newItems.length > 0) {
            loadItems();
          }
        });
      }
    });

    return () => subscription.remove();
  }, [isInitialized, loadItems]);

  // ─── Paste Link Handler ────────────────────────────────────────
  const handlePasteLink = useCallback(async () => {
    setIsPastingLink(true);
    try {
      const result = await captureLinkFromClipboard();
      if (result) {
        await loadItems();
        Alert.alert("Link Captured!", `"${result.title}" has been saved.`, [
          { text: "OK" },
        ]);
      } else {
        Alert.alert(
          "No URL Found",
          "Copy a URL to your clipboard first, then tap Paste Link.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Capture Error",
        error instanceof Error ? error.message : "Failed to capture link"
      );
    } finally {
      setIsPastingLink(false);
    }
  }, [loadItems]);

  // ─── Enable Screenshot Monitoring ──────────────────────────────
  const handleEnableScreenshots = useCallback(async () => {
    const granted = await requestMediaLibraryPermission();
    if (granted) {
      try {
        await registerScreenshotWatcher();
      } catch {
        // May not be available in dev
      }
      Alert.alert(
        "Screenshots Enabled",
        "NexusMind will now automatically detect and capture new screenshots.",
        [{ text: "OK" }]
      );
    }
  }, []);

  // Filter out audio items for the feed (they show in a different section)
  const feedItems = items.filter((i) => i.type !== "audio");

  // Split items for masonry layout (2 columns)
  const leftColumn = feedItems.filter((_, i) => i % 2 === 0);
  const rightColumn = feedItems.filter((_, i) => i % 2 !== 0);

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
          <Pressable onPress={handleEnableScreenshots}>
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
          <Pressable
            className={`flex-1 flex-row items-center justify-center bg-nexus-surface border border-nexus-border rounded-full py-3 ${isPastingLink ? "opacity-50" : ""}`}
            onPress={handlePasteLink}
            disabled={isPastingLink}
          >
            {isPastingLink ? (
              <ActivityIndicator size="small" color="#9D00FF" />
            ) : (
              <FontAwesome name="link" size={14} color="#9D00FF" />
            )}
            <Text className="text-white font-medium text-sm ml-2">
              {isPastingLink ? "Capturing..." : "Paste Link"}
            </Text>
          </Pressable>
          <Pressable
            className="flex-1 flex-row items-center justify-center bg-nexus-surface border border-nexus-border rounded-full py-3"
            onPress={() => router.push("/record")}
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

        {/* Loading State */}
        {isLoading && !isInitialized && (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#9D00FF" />
          </View>
        )}

        {/* Masonry Grid */}
        {feedItems.length > 0 && (
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
        )}

        {/* Empty State */}
        {isInitialized && feedItems.length === 0 && (
          <View className="items-center py-16 px-8">
            <FontAwesome name="inbox" size={48} color="#2A2A3E" />
            <Text className="text-nexus-text-secondary text-base mt-4 text-center">
              No captures yet. Share a link or take a screenshot to get started!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
