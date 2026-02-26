/**
 * NexusMind - Audio Recorder Service
 *
 * Handles audio recording using expo-audio (SDK 54+).
 * Records audio, persists the file to app storage,
 * and saves a new "audio" Item + AudioDetail to the database.
 *
 * AI processing (speech-to-text, summarization) is deferred to Phase 4.
 */

import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
} from "expo-audio";
import type { AudioRecorder } from "expo-audio";
import type { RecorderState } from "expo-audio";
import { Paths, File, Directory } from "expo-file-system";
import { createItem, createAudioDetail } from "@/lib/database";
import type { Item } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  durationMs: number;
  metering: number | null;
}

export interface RecordingResult {
  uri: string;
  durationMs: number;
  item: Item;
}

// ─── Permissions ────────────────────────────────────────────────────────────

/**
 * Request microphone permissions.
 * Returns true if granted, false otherwise.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  const { granted } = await requestRecordingPermissionsAsync();
  return granted;
}

/**
 * Check current microphone permission status.
 */
export async function getMicrophonePermissionStatus(): Promise<boolean> {
  const { granted } = await getRecordingPermissionsAsync();
  return granted;
}

// ─── Recording Manager ─────────────────────────────────────────────────────

let _recorder: AudioRecorder | null = null;
let _statusInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start a new audio recording.
 * Must call requestMicrophonePermission() first.
 *
 * @param onStatusUpdate - Optional callback for recording status updates
 * @returns The AudioRecorder instance
 * @throws If permissions are not granted or recording fails
 */
export async function startRecording(
  onStatusUpdate?: (status: RecordingState) => void
): Promise<AudioRecorder> {
  // Ensure no existing recording is active
  if (_recorder) {
    try {
      await _recorder.stop();
    } catch {
      // Ignore errors from cleanup
    }
    _recorder = null;
  }

  // Clear any existing status polling
  if (_statusInterval) {
    clearInterval(_statusInterval);
    _statusInterval = null;
  }

  // Set audio mode for recording
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
  });

  // Create recorder via the module's AudioRecorder class
  const recorder = new AudioModule.AudioRecorder(
    RecordingPresets.HIGH_QUALITY
  );

  // Prepare and start
  await recorder.prepareToRecordAsync({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
  });
  recorder.record();

  _recorder = recorder;

  // Poll status for UI updates (metering, duration)
  if (onStatusUpdate) {
    _statusInterval = setInterval(() => {
      if (!_recorder) return;
      try {
        const state: RecorderState = _recorder.getStatus();
        onStatusUpdate({
          isRecording: state.isRecording,
          isPaused: !state.isRecording && state.canRecord,
          durationMs: state.durationMillis,
          metering: state.metering ?? null,
        });
      } catch {
        // Recorder may have been disposed
      }
    }, 100);
  }

  return recorder;
}

/**
 * Stop the current recording and return the file URI.
 *
 * @returns Object with the recording URI and duration
 * @throws If no recording is active
 */
export async function stopRecording(): Promise<{
  uri: string;
  durationMs: number;
}> {
  if (!_recorder) {
    throw new Error("No active recording to stop");
  }

  const recorder = _recorder;
  _recorder = null;

  // Stop status polling
  if (_statusInterval) {
    clearInterval(_statusInterval);
    _statusInterval = null;
  }

  // Get final status before stopping
  const finalState: RecorderState = recorder.getStatus();

  // Stop recording
  await recorder.stop();

  // Restore audio mode for playback
  await setAudioModeAsync({
    allowsRecording: false,
  });

  const uri = recorder.uri;
  if (!uri) {
    throw new Error("Recording completed but no URI was returned");
  }

  return {
    uri,
    durationMs: finalState.durationMillis,
  };
}

/**
 * Cancel and discard the current recording.
 */
export async function cancelRecording(): Promise<void> {
  if (!_recorder) return;

  const recorder = _recorder;
  _recorder = null;

  // Stop status polling
  if (_statusInterval) {
    clearInterval(_statusInterval);
    _statusInterval = null;
  }

  try {
    await recorder.stop();
    // Delete the temp file
    const uri = recorder.uri;
    if (uri) {
      const tempFile = new File(uri);
      if (tempFile.exists) {
        tempFile.delete();
      }
    }
  } catch {
    // Best-effort cleanup
  }

  await setAudioModeAsync({
    allowsRecording: false,
  });
}

/**
 * Check if a recording is currently active.
 */
export function isRecordingActive(): boolean {
  return _recorder !== null;
}

// ─── Persistence ────────────────────────────────────────────────────────────

/** Format milliseconds to "M:SS" string */
function formatDuration(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Persist a completed recording to app storage and save to the database.
 * Copies the temp recording file to a permanent location and creates
 * an Item + AudioDetail record.
 *
 * @param tempUri - The temporary file URI from the recording
 * @param durationMs - Recording duration in milliseconds
 * @returns The created Item and its database ID
 */
export async function saveRecording(
  tempUri: string,
  durationMs: number
): Promise<RecordingResult> {
  // Create the permanent audio directory
  const audioDir = new Directory(Paths.document, "audio");
  if (!audioDir.exists) {
    audioDir.create();
  }

  const filename = `recording_${Date.now()}.m4a`;
  const permanentFile = new File(audioDir, filename);

  // Copy temp recording to permanent location
  const tempFile = new File(tempUri);
  tempFile.copy(permanentFile);

  // Clean up temp file
  if (tempFile.exists) {
    tempFile.delete();
  }

  const permanentUri = permanentFile.uri;
  const durationStr = formatDuration(durationMs);
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Create the Item
  const item = await createItem({
    type: "audio",
    title: `Voice Note - ${dateStr}`,
    rawContent: "", // Transcript will be filled by Phase 4 AI
    duration: durationStr,
    fileUri: permanentUri,
    processingStatus: "pending", // Will be processed by Phase 4 AI
    tags: ["Voice Note"],
  });

  // Create the AudioDetail record
  await createAudioDetail({
    itemId: item.id,
    transcript: null, // Phase 4: local speech-to-text
    summary: "Recording saved. AI processing pending...",
    summaryTags: [],
    actionItems: [],
    autoTags: ["Voice Note"],
    audioFileUri: permanentUri,
    currentTime: "0:00",
    remainingTime: `-${durationStr}`,
  });

  return {
    uri: permanentUri,
    durationMs,
    item,
  };
}
