/**
 * NexusMind - Share Intent Handler
 *
 * Processes content shared to the app via the native Share Sheet.
 * Handles shared URLs, text, and image files.
 * Saves captured content to SQLite with processing_status="pending".
 *
 * AI summarization is deferred to Phase 4.
 */

import { Paths, File, Directory } from "expo-file-system";
import { createItem } from "@/lib/database";
import type { Item } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Normalized share intent data (from expo-share-intent hook) */
export interface SharedContent {
  text?: string | null;
  webUrl?: string | null;
  type?: string | null;
  meta?: Record<string, string | undefined> | null;
  files?: Array<{
    path: string;
    mimeType: string;
    fileName?: string;
    size?: number | null;
    width?: number | null;
    height?: number | null;
  }> | null;
}

export interface ShareCaptureResult {
  item: Item;
  type: "link" | "screenshot" | "note";
}

// ─── HTML Stripping ─────────────────────────────────────────────────────────

/**
 * Strip HTML tags from content to extract plain text.
 * Used to get readable content from fetched web pages.
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "") // Remove scripts
    .replace(/<style[\s\S]*?<\/style>/gi, "") // Remove styles
    .replace(/<[^>]+>/g, " ") // Remove HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

/**
 * Extract a title from HTML content.
 */
function extractTitleFromHtml(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

// ─── URL Content Fetching ───────────────────────────────────────────────────

/**
 * Fetch a URL and extract its text content.
 * Uses a simple fetch with timeout for Phase 3.
 * Full HTML->text pipeline will be enhanced in Phase 4.
 */
async function fetchUrlContent(url: string): Promise<{
  title: string;
  content: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "NexusMind/1.0 (Mobile Knowledge Capture)",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { title: url, content: `Failed to fetch: HTTP ${response.status}` };
    }

    const html = await response.text();
    const title = extractTitleFromHtml(html) ?? url;
    const content = stripHtmlTags(html).substring(0, 5000); // Limit raw content size

    return { title, content };
  } catch (error) {
    return {
      title: url,
      content: `URL captured. Content fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// ─── Share Intent Processing ────────────────────────────────────────────────

/**
 * Process a shared web URL.
 * Fetches the page content, strips HTML, and saves as a "link" Item.
 */
async function processSharedUrl(
  url: string,
  meta?: Record<string, string | undefined> | null
): Promise<Item> {
  const { title, content } = await fetchUrlContent(url);

  // Use OG metadata title if available
  const finalTitle = meta?.title || title;
  const sourceLabel = meta?.["og:site_name"] ?? new URL(url).hostname;

  return createItem({
    type: "link",
    title: finalTitle,
    rawContent: content,
    sourceUrl: url,
    sourceLabel: sourceLabel,
    processingStatus: "pending", // Phase 4: local SLM summarization
    tags: ["Shared Link"],
  });
}

/**
 * Process shared plain text content.
 * Saves as a "note" type Item.
 */
async function processSharedText(text: string): Promise<Item> {
  // Use first line or first 60 chars as title
  const firstLine = text.split("\n")[0]?.trim() ?? text;
  const title =
    firstLine.length > 60 ? firstLine.substring(0, 57) + "..." : firstLine;

  return createItem({
    type: "note",
    title,
    rawContent: text,
    processingStatus: "pending",
    tags: ["Shared Note"],
  });
}

/**
 * Process a shared image file (e.g. screenshot shared from gallery).
 * Copies the file to app storage and saves as a "screenshot" Item.
 */
async function processSharedImage(file: {
  path: string;
  mimeType: string;
  fileName?: string;
}): Promise<Item> {
  // Create permanent screenshots directory
  const screenshotDir = new Directory(Paths.document, "screenshots");
  if (!screenshotDir.exists) {
    screenshotDir.create();
  }

  const ext = file.mimeType.split("/")[1] ?? "png";
  const filename = file.fileName ?? `shared_${Date.now()}.${ext}`;
  const permanentFile = new File(screenshotDir, filename);

  // Copy shared file to permanent storage
  const sourceFile = new File(file.path);
  sourceFile.copy(permanentFile);

  return createItem({
    type: "screenshot",
    title: `Shared Image - ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
    rawContent: "", // Phase 4: OCR will extract text
    fileUri: permanentFile.uri,
    processingStatus: "pending", // Phase 4: local OCR + SLM
    tags: ["Shared Image"],
  });
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

/**
 * Process incoming shared content from the native Share Sheet.
 * Detects the content type and delegates to the appropriate handler.
 *
 * @param shared - The shared content from useShareIntent hook
 * @returns The captured result with the saved Item
 */
export async function processShareIntent(
  shared: SharedContent
): Promise<ShareCaptureResult | null> {
  // Priority 1: Web URL
  if (shared.webUrl) {
    const item = await processSharedUrl(shared.webUrl, shared.meta);
    return { item, type: "link" };
  }

  // Priority 2: Image files
  if (shared.files && shared.files.length > 0) {
    const imageFile = shared.files.find((f) =>
      f.mimeType.startsWith("image/")
    );
    if (imageFile) {
      const item = await processSharedImage(imageFile);
      return { item, type: "screenshot" };
    }
  }

  // Priority 3: Plain text
  if (shared.text) {
    // Check if the text is actually a URL
    const urlPattern = /^https?:\/\/\S+$/i;
    if (urlPattern.test(shared.text.trim())) {
      const item = await processSharedUrl(shared.text.trim(), shared.meta);
      return { item, type: "link" };
    }

    const item = await processSharedText(shared.text);
    return { item, type: "note" };
  }

  // No processable content
  return null;
}
