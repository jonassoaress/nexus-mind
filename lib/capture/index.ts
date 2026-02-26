/**
 * NexusMind - Capture Engine barrel export (Phase 3)
 *
 * Re-exports all capture services for convenient importing.
 */

// Audio recording
export {
  requestMicrophonePermission,
  getMicrophonePermissionStatus,
  startRecording,
  stopRecording,
  cancelRecording,
  isRecordingActive,
  saveRecording,
  type RecordingState,
  type RecordingResult,
} from "./audioRecorder";

// Share intent processing
export {
  processShareIntent,
  type SharedContent,
  type ShareCaptureResult,
} from "./shareIntent";

// Screenshot monitoring
export {
  requestMediaLibraryPermission,
  getMediaLibraryPermissionStatus,
  checkForNewScreenshots,
  defineScreenshotTask,
  registerScreenshotWatcher,
  unregisterScreenshotWatcher,
  initializeScreenshotBaseline,
} from "./screenshotWatcher";

// Link capture from clipboard
export {
  captureLink,
  captureLinkFromClipboard,
  getClipboardUrl,
  clipboardHasUrl,
  isValidUrl,
  type LinkCaptureResult,
} from "./linkCapture";
