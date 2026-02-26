/**
 * NexusMind - Link Capture Service
 *
 * Handles capturing URLs from the clipboard ("Paste Link" quick action).
 * Fetches the URL content, strips HTML to plain text, and saves
 * as a "link" Item with processing_status="pending".
 *
 * AI summarization (3 bullet points) is deferred to Phase 4.
 */

import * as Clipboard from "expo-clipboard";
import { createItem } from "@/lib/database";
import type { Item } from "@/lib/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LinkCaptureResult {
  item: Item;
  title: string;
  url: string;
}

// ─── HTML Utilities ─────────────────────────────────────────────────────────

/**
 * Strip HTML tags from content to extract plain text.
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract page title from HTML.
 */
function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

/**
 * Extract OG metadata from HTML.
 */
function extractOgMeta(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const regex =
    /<meta\s+(?:property|name)=["']og:([^"']+)["']\s+content=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    meta[match[1]] = match[2];
  }

  return meta;
}

// ─── URL Validation ─────────────────────────────────────────────────────────

/**
 * Check if a string is a valid URL.
 */
export function isValidUrl(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Clipboard Operations ───────────────────────────────────────────────────

/**
 * Read text from the clipboard.
 * Returns null if clipboard is empty or not text.
 */
export async function getClipboardUrl(): Promise<string | null> {
  try {
    const hasString = await Clipboard.hasStringAsync();
    if (!hasString) return null;

    const text = await Clipboard.getStringAsync();
    if (!text) return null;

    // Check if it's a valid URL
    const trimmed = text.trim();
    if (isValidUrl(trimmed)) {
      return trimmed;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if the clipboard contains a URL (for UI state).
 */
export async function clipboardHasUrl(): Promise<boolean> {
  const url = await getClipboardUrl();
  return url !== null;
}

// ─── Content Fetching ───────────────────────────────────────────────────────

/**
 * Fetch a URL and extract structured content.
 */
async function fetchAndExtract(url: string): Promise<{
  title: string;
  content: string;
  sourceLabel: string;
  ogMeta: Record<string, string>;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "NexusMind/1.0 (Mobile Knowledge Capture)",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const ogMeta = extractOgMeta(html);
    const title = ogMeta.title || extractTitle(html) || url;
    const content = stripHtmlTags(html).substring(0, 5000);
    const sourceLabel =
      ogMeta.site_name || new URL(url).hostname.replace("www.", "");

    return { title, content, sourceLabel, ogMeta };
  } catch (error) {
    const hostname = new URL(url).hostname.replace("www.", "");
    return {
      title: hostname,
      content: `Link captured. Content will be processed when available.`,
      sourceLabel: hostname,
      ogMeta: {},
    };
  }
}

// ─── Main Entry Points ─────────────────────────────────────────────────────

/**
 * Capture a link from a URL string.
 * Fetches the content and saves to the database.
 *
 * @param url - The URL to capture
 * @returns The capture result with the created Item
 */
export async function captureLink(url: string): Promise<LinkCaptureResult> {
  const { title, content, sourceLabel } = await fetchAndExtract(url);

  const item = await createItem({
    type: "link",
    title,
    rawContent: content,
    sourceUrl: url,
    sourceLabel,
    processingStatus: "pending", // Phase 4: local SLM summarization
    tags: ["Link"],
  });

  return { item, title, url };
}

/**
 * Capture a link from the clipboard.
 * Reads the clipboard, validates the URL, fetches content, and saves.
 *
 * @returns The capture result, or null if clipboard doesn't contain a URL
 */
export async function captureLinkFromClipboard(): Promise<LinkCaptureResult | null> {
  const url = await getClipboardUrl();
  if (!url) return null;

  return captureLink(url);
}
