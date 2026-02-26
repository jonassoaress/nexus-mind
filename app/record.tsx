/**
 * NexusMind - Audio Recording Screen
 *
 * Full-screen recording interface triggered from the Home screen's
 * "Record Audio" button. Provides a visual recording indicator,
 * timer, and save/cancel controls.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, Pressable, Alert, Animated } from "react-native";
import { useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  requestMicrophonePermission,
  startRecording,
  stopRecording,
  cancelRecording,
  saveRecording,
  type RecordingState,
} from "@/lib/capture/audioRecorder";
import { useItemsStore } from "@/stores/useItemsStore";

// ─── Metering Visualizer ────────────────────────────────────────────────────

function LiveWaveform({ metering }: { metering: number | null }) {
  // Generate bars based on metering level
  const barCount = 30;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const center = barCount / 2;
    const distFromCenter = Math.abs(i - center) / center;
    // Metering is in dB (usually -160 to 0), normalize to 0-1
    const level = metering !== null ? Math.max(0, (metering + 60) / 60) : 0;
    const height = Math.max(
      4,
      (1 - distFromCenter * 0.6) * level * 50 + Math.random() * 4
    );
    return height;
  });

  return (
    <View className="flex-row items-center justify-center h-24 gap-[2px] my-8">
      {bars.map((height, i) => (
        <View
          key={i}
          style={{ height }}
          className="w-[3px] rounded-full bg-nexus-purple"
        />
      ))}
    </View>
  );
}

// ─── Timer Display ──────────────────────────────────────────────────────────

function RecordingTimer({ durationMs }: { durationMs: number }) {
  const totalSecs = Math.floor(durationMs / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  return (
    <Text className="text-white text-5xl font-mono font-light text-center">
      {timeStr}
    </Text>
  );
}

// ─── Pulsing Record Indicator ───────────────────────────────────────────────

function PulsingDot({ isRecording }: { isRecording: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      opacity.setValue(1);
    }
  }, [isRecording, opacity]);

  return (
    <View className="flex-row items-center justify-center mb-6">
      <Animated.View
        style={{ opacity }}
        className="w-3 h-3 rounded-full bg-red-500 mr-2"
      />
      <Text className="text-nexus-text-secondary text-sm font-medium uppercase tracking-widest">
        {isRecording ? "Recording" : "Ready"}
      </Text>
    </View>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function RecordScreen() {
  const router = useRouter();
  const { loadItems } = useItemsStore();

  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    durationMs: 0,
    metering: null,
  });

  const handleStatusUpdate = useCallback((state: RecordingState) => {
    setRecordingState(state);
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "NexusMind needs microphone access to record voice notes. Please enable it in Settings.",
          [{ text: "OK" }]
        );
        return;
      }

      await startRecording(handleStatusUpdate);
      setIsRecording(true);
    } catch (error) {
      Alert.alert(
        "Recording Error",
        error instanceof Error ? error.message : "Failed to start recording"
      );
    }
  }, [handleStatusUpdate]);

  const handleStopAndSave = useCallback(async () => {
    if (!isRecording) return;

    setIsSaving(true);
    try {
      const { uri, durationMs } = await stopRecording();
      setIsRecording(false);

      // Save to database
      const result = await saveRecording(uri, durationMs);

      // Refresh the items list
      await loadItems();

      // Navigate to the audio detail screen
      router.replace(`/audio/${result.item.id}`);
    } catch (error) {
      setIsSaving(false);
      setIsRecording(false);
      Alert.alert(
        "Save Error",
        error instanceof Error ? error.message : "Failed to save recording"
      );
    }
  }, [isRecording, loadItems, router]);

  const handleCancel = useCallback(async () => {
    if (isRecording) {
      await cancelRecording();
      setIsRecording(false);
    }
    router.back();
  }, [isRecording, router]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Record Voice Note",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: "#0A0A0F" },
          headerTintColor: "#FFFFFF",
          headerShadowVisible: false,
          headerTitleStyle: {
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "600",
          },
          headerLeft: () => (
            <Pressable onPress={handleCancel} className="ml-2">
              <Text className="text-nexus-text-secondary text-base">
                Cancel
              </Text>
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-nexus-bg" edges={["bottom"]}>
        <View className="flex-1 justify-center items-center px-8">
          {/* Recording Indicator */}
          <PulsingDot isRecording={isRecording} />

          {/* Timer */}
          <RecordingTimer durationMs={recordingState.durationMs} />

          {/* Live Waveform */}
          <LiveWaveform metering={recordingState.metering} />

          {/* Status Text */}
          <Text className="text-nexus-text-muted text-sm text-center mb-12">
            {!isRecording && !isSaving && "Tap the button to start recording"}
            {isRecording && "Tap again to stop and save"}
            {isSaving && "Saving your voice note..."}
          </Text>

          {/* Controls */}
          <View className="flex-row items-center justify-center gap-8">
            {/* Cancel Button */}
            {isRecording && (
              <Pressable
                onPress={handleCancel}
                className="w-14 h-14 rounded-full bg-nexus-surface border border-nexus-border items-center justify-center"
              >
                <FontAwesome name="trash-o" size={20} color="#FF3B30" />
              </Pressable>
            )}

            {/* Record / Stop Button */}
            <Pressable
              onPress={isRecording ? handleStopAndSave : handleStartRecording}
              disabled={isSaving}
              className={`w-20 h-20 rounded-full items-center justify-center ${
                isRecording
                  ? "bg-red-500/20 border-2 border-red-500"
                  : "bg-nexus-purple"
              } ${isSaving ? "opacity-50" : ""}`}
            >
              {isRecording ? (
                <View className="w-7 h-7 rounded-sm bg-red-500" />
              ) : (
                <FontAwesome name="microphone" size={28} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>

        {/* Bottom hint */}
        <View className="px-8 pb-4">
          <Text className="text-nexus-text-muted text-xs text-center">
            Voice notes are processed locally on your device.{"\n"}
            AI transcription & summary will be available in a future update.
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}
