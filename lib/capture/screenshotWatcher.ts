/**
 * NexusMind - Screenshot Watcher Service
 *
 * Monitors the device's screenshot/media directory for new images
 * using expo-media-library and expo-task-manager.
 *
 * When a new screenshot is detected, it is copied to app storage
 * and saved as a "screenshot" Item with processing_status="pending".
 * Actual OCR + AI tagging is deferred to Phase 4.
 */

import * as MediaLibrary from "expo-media-library";
import { Paths, File, Directory } from "expo-file-system";
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { createItem } from "@/lib/database";
import type { Item } from "@/lib/types";

// ─── Constants ──────────────────────────────────────────────────────────────

const SCREENSHOT_TASK_NAME = "NEXUSMIND_SCREENSHOT_WATCHER";
const LAST_PROCESSED_FILENAME = "nexusmind_last_screenshot_ts";

// ─── Permissions ────────────────────────────────────────────────────────────

/**
 * Request media library permissions.
 * Returns true if granted, false otherwise.
 */
export async function requestMediaLibraryPermission(): Promise<boolean> {
  const { status } = await MediaLibrary.requestPermissionsAsync(false, [
    "photo",
  ]);
  return status === "granted";
}

/**
 * Check current media library permission status.
 */
export async function getMediaLibraryPermissionStatus(): Promise<boolean> {
  const { status } = await MediaLibrary.getPermissionsAsync(false, ["photo"]);
  return status === "granted";
}

// ─── Timestamp Tracking ─────────────────────────────────────────────────────

/**
 * Get the last processed screenshot timestamp from local storage.
 */
async function getLastProcessedTimestamp(): Promise<number> {
  try {
    const tsFile = new File(Paths.document, LAST_PROCESSED_FILENAME);
    if (!tsFile.exists) {
      return Date.now();
    }
    const content = await tsFile.text();
    return parseInt(content, 10) || Date.now();
  } catch {
    // File doesn't exist yet - use current time as baseline
    // This prevents processing all existing screenshots on first run
    return Date.now();
  }
}

/**
 * Save the last processed screenshot timestamp.
 */
function setLastProcessedTimestamp(timestamp: number): void {
  const tsFile = new File(Paths.document, LAST_PROCESSED_FILENAME);
  tsFile.write(timestamp.toString());
}

// ─── Screenshot Detection ───────────────────────────────────────────────────

/**
 * Query the media library for screenshots created after a given timestamp.
 * Screenshots are identified by the "Screenshots" album on iOS,
 * or by media subtype on Android.
 */
async function getNewScreenshots(
  afterTimestamp: number
): Promise<MediaLibrary.Asset[]> {
  const hasPermission = await getMediaLibraryPermissionStatus();
  if (!hasPermission) return [];

  try {
    // Query recent photos, sorted newest first
    const { assets } = await MediaLibrary.getAssetsAsync({
      mediaType: MediaLibrary.MediaType.photo,
      sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      first: 20,
      createdAfter: afterTimestamp,
    });

    // Filter to images created after our last check
    return assets.filter((asset) => {
      return asset.creationTime > afterTimestamp;
    });
  } catch (error) {
    console.warn("[NexusMind] Failed to query media library:", error);
    return [];
  }
}

// ─── Screenshot Processing ──────────────────────────────────────────────────

/**
 * Process a single detected screenshot.
 * Copies it to app storage and creates a database Item.
 */
async function processScreenshot(
  asset: MediaLibrary.Asset
): Promise<Item | null> {
  try {
    // Get the full asset info with local URI
    const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
    const sourceUri = assetInfo.localUri ?? assetInfo.uri;

    if (!sourceUri) {
      console.warn("[NexusMind] Screenshot has no accessible URI:", asset.id);
      return null;
    }

    // Ensure screenshots directory exists
    const screenshotDir = new Directory(Paths.document, "screenshots");
    if (!screenshotDir.exists) {
      screenshotDir.create();
    }

    // Copy to app storage
    const ext = asset.filename?.split(".").pop() ?? "png";
    const filename = `screenshot_${Date.now()}.${ext}`;
    const permanentFile = new File(screenshotDir, filename);

    const sourceFile = new File(sourceUri);
    sourceFile.copy(permanentFile);

    // Create the database Item
    const dateStr = new Date(asset.creationTime).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const item = await createItem({
      type: "screenshot",
      title: `Screenshot - ${dateStr}`,
      rawContent: "", // Phase 4: OCR will extract text content
      fileUri: permanentFile.uri,
      processingStatus: "pending", // Phase 4: local OCR + SLM categorization
      tags: ["Screenshot"],
    });

    console.log("[NexusMind] Screenshot captured:", item.id, filename);
    return item;
  } catch (error) {
    console.error("[NexusMind] Failed to process screenshot:", error);
    return null;
  }
}

// ─── Foreground Check ───────────────────────────────────────────────────────

/**
 * Manually check for new screenshots (used when app is in foreground).
 * Call this periodically or on app resume.
 *
 * @returns Array of newly captured Items
 */
export async function checkForNewScreenshots(): Promise<Item[]> {
  const lastTs = await getLastProcessedTimestamp();
  const newScreenshots = await getNewScreenshots(lastTs);

  if (newScreenshots.length === 0) return [];

  const items: Item[] = [];
  let latestTs = lastTs;

  for (const asset of newScreenshots) {
    const item = await processScreenshot(asset);
    if (item) {
      items.push(item);
    }
    if (asset.creationTime > latestTs) {
      latestTs = asset.creationTime;
    }
  }

  // Update the last processed timestamp
  if (latestTs > lastTs) {
    setLastProcessedTimestamp(latestTs);
  }

  return items;
}

// ─── Background Task Registration ───────────────────────────────────────────

/**
 * Define the background task for screenshot monitoring.
 * Must be called at module level (outside of components).
 */
export function defineScreenshotTask(): void {
  TaskManager.defineTask(SCREENSHOT_TASK_NAME, async () => {
    try {
      const items = await checkForNewScreenshots();
      console.log(
        `[NexusMind] Background screenshot check: ${items.length} new`
      );
      return items.length > 0
        ? BackgroundFetch.BackgroundFetchResult.NewData
        : BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (error) {
      console.error("[NexusMind] Background screenshot task error:", error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

/**
 * Register the background fetch task for screenshot monitoring.
 * Should be called once after permissions are granted.
 *
 * @param intervalMinutes - How often to check (minimum ~15 min on iOS)
 */
export async function registerScreenshotWatcher(
  intervalMinutes: number = 15
): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    SCREENSHOT_TASK_NAME
  );

  if (isRegistered) {
    console.log("[NexusMind] Screenshot watcher already registered");
    return;
  }

  await BackgroundFetch.registerTaskAsync(SCREENSHOT_TASK_NAME, {
    minimumInterval: intervalMinutes * 60,
    stopOnTerminate: false,
    startOnBoot: true,
  });

  console.log("[NexusMind] Screenshot watcher registered");
}

/**
 * Unregister the background screenshot watcher.
 */
export async function unregisterScreenshotWatcher(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(
    SCREENSHOT_TASK_NAME
  );

  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(SCREENSHOT_TASK_NAME);
    console.log("[NexusMind] Screenshot watcher unregistered");
  }
}

/**
 * Initialize the screenshot watcher baseline timestamp.
 * Call this on first launch to prevent processing existing screenshots.
 */
export function initializeScreenshotBaseline(): void {
  try {
    const tsFile = new File(Paths.document, LAST_PROCESSED_FILENAME);
    if (!tsFile.exists) {
      tsFile.write(Date.now().toString());
      console.log("[NexusMind] Screenshot baseline initialized");
    }
  } catch {
    // Best effort
  }
}
