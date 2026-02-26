/**
 * NexusMind - Database Schema & Migrations
 *
 * Defines the SQLite schema and handles versioned migrations.
 * Uses expo-sqlite's synchronous API for schema operations.
 */

import type { SQLiteDatabase } from "expo-sqlite";

const CURRENT_VERSION = 2;

/**
 * Run all pending migrations to bring the DB up to CURRENT_VERSION.
 * Called once at app startup before any reads/writes.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // Enable WAL mode for better concurrent read performance
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");

  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version;"
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    await migrateToV1(db);
  }

  if (currentVersion < 2) {
    await migrateToV2(db);
  }

  await db.execAsync(`PRAGMA user_version = ${CURRENT_VERSION};`);
}

// ─── Migration V1: Initial Schema ───────────────────────────────────────────

async function migrateToV1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    -- ═══════════════════════════════════════════════════════════════
    -- Items: The core content table (screenshots, links, audio, notes)
    -- ═══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS items (
      id                TEXT PRIMARY KEY NOT NULL,
      type              TEXT NOT NULL CHECK(type IN ('screenshot', 'link', 'audio', 'note')),
      title             TEXT NOT NULL,
      raw_content       TEXT NOT NULL DEFAULT '',
      summary           TEXT,
      tags              TEXT NOT NULL DEFAULT '[]',
      source_url        TEXT,
      source_label      TEXT,
      author            TEXT,
      duration          TEXT,
      image_placeholder TEXT,
      processing_status TEXT NOT NULL DEFAULT 'pending'
                        CHECK(processing_status IN ('pending', 'processing', 'completed', 'failed')),
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Index for feed queries (newest first, filtered by type)
    CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
    CREATE INDEX IF NOT EXISTS idx_items_status ON items(processing_status);

    -- ═══════════════════════════════════════════════════════════════
    -- Embeddings: Vector storage for semantic search
    -- Vectors are stored as JSON arrays of float32 values.
    -- Cosine similarity is computed in JS (Phase 5 will use ONNX).
    -- ═══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS embeddings (
      id          TEXT PRIMARY KEY NOT NULL,
      item_id     TEXT NOT NULL,
      vector      TEXT NOT NULL,
      model       TEXT NOT NULL DEFAULT 'all-MiniLM-L6-v2',
      dimension   INTEGER NOT NULL DEFAULT 384,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_embeddings_item_id ON embeddings(item_id);

    -- ═══════════════════════════════════════════════════════════════
    -- AudioDetails: Extended metadata for audio captures
    -- ═══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS audio_details (
      id              TEXT PRIMARY KEY NOT NULL,
      item_id         TEXT NOT NULL UNIQUE,
      transcript      TEXT,
      summary         TEXT NOT NULL DEFAULT '',
      summary_tags    TEXT NOT NULL DEFAULT '[]',
      action_items    TEXT NOT NULL DEFAULT '[]',
      auto_tags       TEXT NOT NULL DEFAULT '[]',
      current_time    TEXT NOT NULL DEFAULT '0:00',
      remaining_time  TEXT NOT NULL DEFAULT '0:00',
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_audio_details_item_id ON audio_details(item_id);

    -- ═══════════════════════════════════════════════════════════════
    -- ChatMessages: Conversation history for the search/chat screen
    -- ═══════════════════════════════════════════════════════════════
    CREATE TABLE IF NOT EXISTS chat_messages (
      id          TEXT PRIMARY KEY NOT NULL,
      session_id  TEXT NOT NULL,
      role        TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content     TEXT NOT NULL DEFAULT '',
      media_card  TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at ASC);
  `);
}

// ─── Migration V2: Add file_uri column for captured content ─────────────────

async function migrateToV2(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    -- Add file_uri column to items for audio recordings and screenshot images
    ALTER TABLE items ADD COLUMN file_uri TEXT;

    -- Add audio_file_uri column to audio_details for the recorded audio file path
    ALTER TABLE audio_details ADD COLUMN audio_file_uri TEXT;
  `);
}
