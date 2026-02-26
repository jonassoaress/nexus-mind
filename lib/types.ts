/**
 * NexusMind - Core TypeScript types for Phase 2 (Database & Architecture)
 *
 * These types define the database models and are used across
 * the database service, Zustand stores, and UI components.
 */

// ─── Item Types ──────────────────────────────────────────────────────────────

/** The types of content NexusMind can capture */
export type ItemType = "screenshot" | "link" | "audio" | "note";

/** Processing status for AI pipeline */
export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

/** Database row for the Items table */
export interface ItemRow {
  id: string;
  type: ItemType;
  title: string;
  raw_content: string;
  summary: string | null;
  tags: string; // JSON-serialized string[]
  source_url: string | null;
  source_label: string | null;
  author: string | null;
  duration: string | null;
  image_placeholder: string | null;
  file_uri: string | null;
  processing_status: ProcessingStatus;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/** Application-level Item model (deserialized from DB row) */
export interface Item {
  id: string;
  type: ItemType;
  title: string;
  rawContent: string;
  summary: string | null;
  tags: string[];
  sourceUrl: string | null;
  sourceLabel: string | null;
  author: string | null;
  duration: string | null;
  imagePlaceholder: string | null;
  fileUri: string | null;
  processingStatus: ProcessingStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Embedding Types ─────────────────────────────────────────────────────────

/** Database row for the Embeddings table */
export interface EmbeddingRow {
  id: string;
  item_id: string;
  vector: string; // JSON-serialized number[] (float32 array)
  model: string; // e.g. "all-MiniLM-L6-v2"
  dimension: number; // e.g. 384
  created_at: string;
}

/** Application-level Embedding model */
export interface Embedding {
  id: string;
  itemId: string;
  vector: number[];
  model: string;
  dimension: number;
  createdAt: Date;
}

// ─── Audio Detail Types ──────────────────────────────────────────────────────

/** Action item extracted from audio transcription */
export interface ActionItemData {
  id: string;
  text: string;
  completed: boolean;
}

/** Database row for the AudioDetails table */
export interface AudioDetailRow {
  id: string;
  item_id: string;
  transcript: string | null;
  summary: string;
  summary_tags: string; // JSON-serialized string[]
  action_items: string; // JSON-serialized ActionItemData[]
  auto_tags: string; // JSON-serialized string[]
  audio_file_uri: string | null;
  current_time: string;
  remaining_time: string;
  created_at: string;
}

/** Application-level AudioDetail model */
export interface AudioDetail {
  id: string;
  itemId: string;
  transcript: string | null;
  summary: string;
  summaryTags: string[];
  actionItems: ActionItemData[];
  autoTags: string[];
  audioFileUri: string | null;
  currentTime: string;
  remainingTime: string;
  createdAt: Date;
}

// ─── Chat Types ──────────────────────────────────────────────────────────────

/** Rich media card embedded in a chat message */
export interface MediaCard {
  title: string;
  bulletPoints: string[];
  videoThumbnail?: string;
  videoDuration?: string;
  copyAction?: string;
  /** ID of the Item this card references */
  sourceItemId?: string;
}

export type ChatRole = "user" | "assistant";

/** Database row for the ChatMessages table */
export interface ChatMessageRow {
  id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  media_card: string | null; // JSON-serialized MediaCard
  created_at: string;
}

/** Application-level ChatMessage model */
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  mediaCard: MediaCard | null;
  createdAt: Date;
}

// ─── Vector Search Types ─────────────────────────────────────────────────────

/** Result from a semantic vector search */
export interface SearchResult {
  item: Item;
  score: number; // cosine similarity, 0 to 1
  embedding: Embedding;
}

// ─── Utility Types ───────────────────────────────────────────────────────────

/** Payload for creating a new Item (before DB assigns defaults) */
export type CreateItemPayload = Pick<
  Item,
  "type" | "title" | "rawContent"
> &
  Partial<
    Pick<
      Item,
      | "summary"
      | "tags"
      | "sourceUrl"
      | "sourceLabel"
      | "author"
      | "duration"
      | "imagePlaceholder"
      | "fileUri"
      | "processingStatus"
    >
  >;

/** Payload for updating an existing Item */
export type UpdateItemPayload = Partial<
  Omit<Item, "id" | "createdAt" | "updatedAt">
>;

/** Payload for creating a new AudioDetail */
export type CreateAudioDetailPayload = Omit<AudioDetail, "id" | "createdAt">;

/** Payload for storing an embedding */
export type CreateEmbeddingPayload = Omit<Embedding, "id" | "createdAt">;
