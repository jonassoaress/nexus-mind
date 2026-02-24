import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useChatStore } from "@/stores/useChatStore";
import type { ChatMessage } from "@/lib/types";

// User message bubble
function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <View className="items-end mb-4">
      <View className="flex-row items-end gap-2">
        <View className="bg-nexus-surface rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]">
          <Text className="text-white text-sm leading-5">
            {message.content}
          </Text>
        </View>
        <View>
          <Text className="text-nexus-text-muted text-[10px] mb-1">You</Text>
          <View className="w-8 h-8 rounded-full bg-nexus-border items-center justify-center">
            <FontAwesome name="user" size={14} color="#8E8E93" />
          </View>
        </View>
      </View>
    </View>
  );
}

// AI assistant bubble with optional rich media card
function AssistantBubble({ message }: { message: ChatMessage }) {
  const { mediaCard } = message;

  return (
    <View className="items-start mb-4">
      <View className="flex-row items-start gap-2 max-w-[90%]">
        {/* AI Avatar */}
        <View className="w-8 h-8 rounded-full bg-nexus-purple items-center justify-center mt-1">
          <FontAwesome name="connectdevelop" size={14} color="#FFFFFF" />
        </View>

        <View className="flex-1">
          {/* Rich Media Card */}
          {mediaCard && (
            <View className="bg-nexus-surface rounded-2xl overflow-hidden mb-2">
              {/* Video Thumbnail Placeholder */}
              {mediaCard.videoThumbnail && (
                <View className="h-40 bg-gray-800 items-center justify-center relative">
                  <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                    <FontAwesome name="play" size={16} color="#FFFFFF" />
                  </View>
                  {/* Apple logo + Duration overlay */}
                  <View className="absolute bottom-2 left-3 flex-row items-center">
                    <FontAwesome name="apple" size={14} color="#FFFFFF" />
                  </View>
                  <View className="absolute bottom-2 right-3 bg-black/60 rounded px-1.5 py-0.5">
                    <Text className="text-white text-[10px] font-medium">
                      {mediaCard.videoDuration}
                    </Text>
                  </View>
                </View>
              )}

              <View className="p-4">
                {/* Title */}
                <Text className="text-white font-bold text-base mb-3">
                  {mediaCard.title}
                </Text>

                {/* Bullet Points */}
                {mediaCard.bulletPoints.map((point, i) => (
                  <View key={i} className="flex-row items-start mb-2">
                    <View className="w-2 h-2 rounded-full bg-nexus-purple mt-1.5 mr-2" />
                    <Text className="text-nexus-text-secondary text-sm flex-1 leading-5">
                      {point}
                    </Text>
                  </View>
                ))}

                {/* Copy Formula Button */}
                {mediaCard.copyAction && (
                  <Pressable className="bg-nexus-purple rounded-full py-3 mt-3 items-center flex-row justify-center">
                    <FontAwesome
                      name="magic"
                      size={14}
                      color="#FFFFFF"
                    />
                    <Text className="text-white font-semibold text-sm ml-2">
                      {mediaCard.copyAction}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Text-only message */}
          {message.content ? (
            <View className="bg-nexus-surface rounded-2xl rounded-bl-sm px-4 py-3">
              <Text className="text-white text-sm leading-5">
                {message.content}
              </Text>
            </View>
          ) : null}

          {/* Timestamp */}
          {message.createdAt ? (
            <Text className="text-nexus-text-muted text-[10px] mt-1.5 ml-1">
              {formatChatTimestamp(message.createdAt)}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

/** Format a chat message timestamp */
function formatChatTimestamp(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) return `Today ${time}`;
  return `${date.toLocaleDateString()} ${time}`;
}

/** Thinking indicator bubble */
function ThinkingBubble() {
  return (
    <View className="items-start mb-4">
      <View className="flex-row items-start gap-2">
        <View className="w-8 h-8 rounded-full bg-nexus-purple items-center justify-center mt-1">
          <FontAwesome name="connectdevelop" size={14} color="#FFFFFF" />
        </View>
        <View className="bg-nexus-surface rounded-2xl rounded-bl-sm px-4 py-3">
          <View className="flex-row items-center gap-1.5">
            <ActivityIndicator size="small" color="#9D00FF" />
            <Text className="text-nexus-text-secondary text-sm ml-1">
              Searching your memory...
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const { messages, isLoading, isThinking, loadMessages, sendMessage } =
    useChatStore();

  // Load chat messages from database on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isThinking]);

  const handleSend = async () => {
    const text = query.trim();
    if (!text || isThinking) return;

    setQuery("");
    await sendMessage(text);
  };

  // Get the first message timestamp for the header
  const firstTimestamp =
    messages.length > 0
      ? formatChatTimestamp(messages[0].createdAt).toUpperCase()
      : "";

  return (
    <SafeAreaView className="flex-1 bg-nexus-bg" edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Timestamp header */}
          {firstTimestamp ? (
            <Text className="text-nexus-text-muted text-[11px] text-center mb-6 font-medium uppercase tracking-wider">
              {firstTimestamp}
            </Text>
          ) : null}

          {/* Loading state */}
          {isLoading && (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color="#9D00FF" />
            </View>
          )}

          {/* Empty state */}
          {!isLoading && messages.length === 0 && (
            <View className="items-center py-16 px-8">
              <FontAwesome name="search" size={40} color="#2A2A3E" />
              <Text className="text-nexus-text-secondary text-base mt-4 text-center">
                Ask your second brain anything. I'll search your captures to
                find the answer.
              </Text>
            </View>
          )}

          {/* Messages */}
          {messages.map((msg) =>
            msg.role === "user" ? (
              <UserBubble key={msg.id} message={msg} />
            ) : (
              <AssistantBubble key={msg.id} message={msg} />
            )
          )}

          {/* Thinking indicator */}
          {isThinking && <ThinkingBubble />}
        </ScrollView>

        {/* Input Bar */}
        <View className="px-4 pb-2 pt-2 border-t border-nexus-border">
          <View className="flex-row items-center bg-nexus-surface rounded-full px-4 py-2">
            <Pressable className="mr-3">
              <View className="w-7 h-7 rounded-full border border-nexus-purple items-center justify-center">
                <FontAwesome name="plus" size={12} color="#9D00FF" />
              </View>
            </Pressable>
            <TextInput
              className="flex-1 text-white text-sm py-1.5"
              placeholder="Ask follow-up..."
              placeholderTextColor="#6E6E73"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!isThinking}
            />
            <Pressable className="ml-3" onPress={handleSend}>
              {query.trim() ? (
                <FontAwesome name="arrow-circle-up" size={22} color="#9D00FF" />
              ) : (
                <FontAwesome name="microphone" size={18} color="#9D00FF" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
