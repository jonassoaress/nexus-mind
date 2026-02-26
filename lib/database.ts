/**
 * NexusMind - Database Service Layer
 *
 * Provides typed CRUD operations over the SQLite database.
 * All functions accept the database instance and return
 * application-level models (not raw DB rows).
 */

import * as SQLite from "expo-sqlite";
import { runMigrations } from "./schema";
import type {
  Item,
  ItemRow,
  CreateItemPayload,
  UpdateItemPayload,
  AudioDetail,
  AudioDetailRow,
  CreateAudioDetailPayload,
  ChatMessage,
  ChatMessageRow,
  MediaCard,
  Embedding,
  EmbeddingRow,
  CreateEmbeddingPayload,
  ActionItemData,
} from "./types";

// ─── Database Instance ───────────────────────────────────────────────────────

const DB_NAME = "nexusmind.db";

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or initialize the database singleton.
 * Runs migrations on first call.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await runMigrations(_db);
  return _db;
}

// ─── ID Generation ───────────────────────────────────────────────────────────

/** Generate a unique ID (timestamp + random suffix) */
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

// ─── Row ↔ Model Conversion ─────────────────────────────────────────────────

function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    rawContent: row.raw_content,
    summary: row.summary,
    tags: JSON.parse(row.tags) as string[],
    sourceUrl: row.source_url,
    sourceLabel: row.source_label,
    author: row.author,
    duration: row.duration,
    imagePlaceholder: row.image_placeholder,
    fileUri: row.file_uri ?? null,
    processingStatus: row.processing_status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function rowToAudioDetail(row: AudioDetailRow): AudioDetail {
  return {
    id: row.id,
    itemId: row.item_id,
    transcript: row.transcript,
    summary: row.summary,
    summaryTags: JSON.parse(row.summary_tags) as string[],
    actionItems: JSON.parse(row.action_items) as ActionItemData[],
    autoTags: JSON.parse(row.auto_tags) as string[],
    audioFileUri: row.audio_file_uri ?? null,
    currentTime: row.current_time,
    remainingTime: row.remaining_time,
    createdAt: new Date(row.created_at),
  };
}

function rowToChatMessage(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    mediaCard: row.media_card ? (JSON.parse(row.media_card) as MediaCard) : null,
    createdAt: new Date(row.created_at),
  };
}

function rowToEmbedding(row: EmbeddingRow): Embedding {
  return {
    id: row.id,
    itemId: row.item_id,
    vector: JSON.parse(row.vector) as number[],
    model: row.model,
    dimension: row.dimension,
    createdAt: new Date(row.created_at),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Items CRUD
// ═══════════════════════════════════════════════════════════════════════════

/** Create a new Item and return it */
export async function createItem(payload: CreateItemPayload): Promise<Item> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO items (id, type, title, raw_content, summary, tags, source_url, source_label, author, duration, image_placeholder, file_uri, processing_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    payload.type,
    payload.title,
    payload.rawContent,
    payload.summary ?? null,
    JSON.stringify(payload.tags ?? []),
    payload.sourceUrl ?? null,
    payload.sourceLabel ?? null,
    payload.author ?? null,
    payload.duration ?? null,
    payload.imagePlaceholder ?? null,
    payload.fileUri ?? null,
    payload.processingStatus ?? "pending",
    now,
    now
  );

  return (await getItemById(id))!;
}

/** Insert an Item with a specific ID (used for seeding) */
export async function insertItemWithId(
  id: string,
  payload: CreateItemPayload
): Promise<Item> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT OR REPLACE INTO items (id, type, title, raw_content, summary, tags, source_url, source_label, author, duration, image_placeholder, file_uri, processing_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    payload.type,
    payload.title,
    payload.rawContent,
    payload.summary ?? null,
    JSON.stringify(payload.tags ?? []),
    payload.sourceUrl ?? null,
    payload.sourceLabel ?? null,
    payload.author ?? null,
    payload.duration ?? null,
    payload.imagePlaceholder ?? null,
    payload.fileUri ?? null,
    payload.processingStatus ?? "completed",
    now,
    now
  );

  return (await getItemById(id))!;
}

/** Get a single Item by ID */
export async function getItemById(id: string): Promise<Item | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ItemRow>(
    "SELECT * FROM items WHERE id = ?",
    id
  );
  return row ? rowToItem(row) : null;
}

/** Get all Items, newest first, with optional type filter */
export async function getItems(options?: {
  type?: Item["type"];
  limit?: number;
  offset?: number;
}): Promise<Item[]> {
  const db = await getDatabase();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (options?.type) {
    conditions.push("type = ?");
    params.push(options.type);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = options?.limit ? `LIMIT ${options.limit}` : "";
  const offset = options?.offset ? `OFFSET ${options.offset}` : "";

  const rows = await db.getAllAsync<ItemRow>(
    `SELECT * FROM items ${where} ORDER BY created_at DESC ${limit} ${offset}`,
    ...params
  );

  return rows.map(rowToItem);
}

/** Update an Item and return the updated version */
export async function updateItem(
  id: string,
  payload: UpdateItemPayload
): Promise<Item | null> {
  const db = await getDatabase();
  const sets: string[] = [];
  const params: (string | number | null)[] = [];

  if (payload.title !== undefined) {
    sets.push("title = ?");
    params.push(payload.title);
  }
  if (payload.rawContent !== undefined) {
    sets.push("raw_content = ?");
    params.push(payload.rawContent);
  }
  if (payload.summary !== undefined) {
    sets.push("summary = ?");
    params.push(payload.summary);
  }
  if (payload.tags !== undefined) {
    sets.push("tags = ?");
    params.push(JSON.stringify(payload.tags));
  }
  if (payload.sourceUrl !== undefined) {
    sets.push("source_url = ?");
    params.push(payload.sourceUrl);
  }
  if (payload.sourceLabel !== undefined) {
    sets.push("source_label = ?");
    params.push(payload.sourceLabel);
  }
  if (payload.author !== undefined) {
    sets.push("author = ?");
    params.push(payload.author);
  }
  if (payload.duration !== undefined) {
    sets.push("duration = ?");
    params.push(payload.duration);
  }
  if (payload.imagePlaceholder !== undefined) {
    sets.push("image_placeholder = ?");
    params.push(payload.imagePlaceholder);
  }
  if (payload.fileUri !== undefined) {
    sets.push("file_uri = ?");
    params.push(payload.fileUri);
  }
  if (payload.processingStatus !== undefined) {
    sets.push("processing_status = ?");
    params.push(payload.processingStatus);
  }

  if (sets.length === 0) return getItemById(id);

  sets.push("updated_at = ?");
  params.push(new Date().toISOString());
  params.push(id);

  await db.runAsync(
    `UPDATE items SET ${sets.join(", ")} WHERE id = ?`,
    ...params
  );

  return getItemById(id);
}

/** Delete an Item (cascades to embeddings, audio_details, etc.) */
export async function deleteItem(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM items WHERE id = ?", id);
}

/** Get total item count */
export async function getItemCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM items"
  );
  return result?.count ?? 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// AudioDetails CRUD
// ═══════════════════════════════════════════════════════════════════════════

/** Create an AudioDetail record linked to an Item */
export async function createAudioDetail(
  payload: CreateAudioDetailPayload
): Promise<AudioDetail> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO audio_details (id, item_id, transcript, summary, summary_tags, action_items, auto_tags, audio_file_uri, current_time, remaining_time, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    payload.itemId,
    payload.transcript ?? null,
    payload.summary,
    JSON.stringify(payload.summaryTags),
    JSON.stringify(payload.actionItems),
    JSON.stringify(payload.autoTags),
    payload.audioFileUri ?? null,
    payload.currentTime,
    payload.remainingTime,
    now
  );

  return (await getAudioDetailByItemId(payload.itemId))!;
}

/** Get AudioDetail by the parent Item ID */
export async function getAudioDetailByItemId(
  itemId: string
): Promise<AudioDetail | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AudioDetailRow>(
    "SELECT * FROM audio_details WHERE item_id = ?",
    itemId
  );
  return row ? rowToAudioDetail(row) : null;
}

/** Update action item completion status */
export async function updateAudioActionItems(
  itemId: string,
  actionItems: ActionItemData[]
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE audio_details SET action_items = ? WHERE item_id = ?",
    JSON.stringify(actionItems),
    itemId
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ChatMessages CRUD
// ═══════════════════════════════════════════════════════════════════════════

/** Add a message to a chat session */
export async function createChatMessage(params: {
  sessionId: string;
  role: ChatMessage["role"];
  content: string;
  mediaCard?: MediaCard | null;
}): Promise<ChatMessage> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO chat_messages (id, session_id, role, content, media_card, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    params.sessionId,
    params.role,
    params.content,
    params.mediaCard ? JSON.stringify(params.mediaCard) : null,
    now
  );

  const row = await db.getFirstAsync<ChatMessageRow>(
    "SELECT * FROM chat_messages WHERE id = ?",
    id
  );
  return rowToChatMessage(row!);
}

/** Get all messages for a chat session, in chronological order */
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ChatMessageRow>(
    "SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC",
    sessionId
  );
  return rows.map(rowToChatMessage);
}

/** Delete all messages in a session */
export async function clearChatSession(sessionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "DELETE FROM chat_messages WHERE session_id = ?",
    sessionId
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Embeddings CRUD
// ═══════════════════════════════════════════════════════════════════════════

/** Store an embedding vector for an Item */
export async function createEmbedding(
  payload: CreateEmbeddingPayload
): Promise<Embedding> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO embeddings (id, item_id, vector, model, dimension, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    payload.itemId,
    JSON.stringify(payload.vector),
    payload.model,
    payload.dimension,
    now
  );

  const row = await db.getFirstAsync<EmbeddingRow>(
    "SELECT * FROM embeddings WHERE id = ?",
    id
  );
  return rowToEmbedding(row!);
}

/** Get all embeddings (for vector search) */
export async function getAllEmbeddings(): Promise<Embedding[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<EmbeddingRow>(
    "SELECT * FROM embeddings ORDER BY created_at DESC"
  );
  return rows.map(rowToEmbedding);
}

/** Get embedding for a specific item */
export async function getEmbeddingByItemId(
  itemId: string
): Promise<Embedding | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<EmbeddingRow>(
    "SELECT * FROM embeddings WHERE item_id = ?",
    itemId
  );
  return row ? rowToEmbedding(row) : null;
}

/** Delete embedding for an item */
export async function deleteEmbedding(itemId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM embeddings WHERE item_id = ?", itemId);
}
