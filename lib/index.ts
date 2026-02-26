/**
 * NexusMind - Lib barrel export
 */

export { getDatabase } from "./database";
export { runMigrations } from "./schema";
export { semanticSearch, cosineSimilarity, generatePlaceholderEmbedding } from "./vectorSearch";
export { seedDatabaseIfEmpty } from "./seed";
export type * from "./types";

// Capture services (Phase 3)
export {
  startRecording,
  stopRecording,
  cancelRecording,
  isRecordingActive,
  saveRecording,
  requestMicrophonePermission,
  type RecordingState,
  type RecordingResult,
} from "./capture/audioRecorder";
export { processShareIntent, type SharedContent, type ShareCaptureResult } from "./capture/shareIntent";
export {
  checkForNewScreenshots,
  initializeScreenshotBaseline,
  defineScreenshotTask,
  registerScreenshotWatcher,
  unregisterScreenshotWatcher,
  requestMediaLibraryPermission,
} from "./capture/screenshotWatcher";
export {
  captureLink,
  captureLinkFromClipboard,
  getClipboardUrl,
  clipboardHasUrl,
  isValidUrl,
  type LinkCaptureResult,
} from "./capture/linkCapture";
