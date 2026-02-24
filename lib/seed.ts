/**
 * NexusMind - Database Seeder
 *
 * Seeds the database with initial mock data so the UI has content
 * on first launch. This runs only once (checks if items already exist).
 *
 * Maps the Phase 1 mock data into the new database schema.
 */

import * as db from "./database";
import { createEmbedding } from "./database";
import { generatePlaceholderEmbedding } from "./vectorSearch";
import type { ActionItemData } from "./types";

/**
 * Seed the database if it's empty.
 * Safe to call multiple times - will no-op if data exists.
 */
export async function seedDatabaseIfEmpty(): Promise<void> {
  const count = await db.getItemCount();
  if (count > 0) return; // Already seeded

  console.log("[NexusMind] Seeding database with initial data...");

  // ─── Seed Items ──────────────────────────────────────────────────

  const item1 = await db.insertItemWithId("1", {
    type: "screenshot",
    title: "Starbucks Receipt",
    rawContent: "Starbucks Coffee receipt. Grande Latte $5.75, Tip $1.00. Total $6.75.",
    summary: "Starbucks coffee receipt for $6.75",
    tags: ["FINANCE"],
    imagePlaceholder: "receipt",
    processingStatus: "completed",
  });

  const item2 = await db.insertItemWithId("2", {
    type: "link",
    title: "Atomic Habits",
    rawContent:
      "Atomic Habits by James Clear. An Easy & Proven Way to Build Good Habits & Break Bad Ones.",
    summary: "Book about building good habits through small incremental changes",
    tags: ["TO READ"],
    author: "James Clear",
    sourceUrl: "https://jamesclear.com/atomic-habits",
    sourceLabel: "jamesclear.com",
    imagePlaceholder: "book",
    processingStatus: "completed",
  });

  const item3 = await db.insertItemWithId("3", {
    type: "link",
    title: "VLOOKUP Masterclass",
    rawContent:
      "Excel VLOOKUP tutorial. Learn how to use VLOOKUP, INDEX MATCH, and XLOOKUP in 60 seconds.",
    summary: "Quick tutorial on Excel lookup formulas including VLOOKUP and XLOOKUP",
    tags: ["EXCEL TUTORIAL"],
    sourceLabel: "TikTok \u2022 @excelwiz",
    imagePlaceholder: "video",
    duration: "0:59",
    processingStatus: "completed",
  });

  const item4 = await db.insertItemWithId("4", {
    type: "note",
    title:
      "Need to research more about the intersection of AI and biology for...",
    rawContent:
      "Need to research more about the intersection of AI and biology for the upcoming project. Look into protein folding, drug discovery, and genomics applications.",
    summary: "Research idea about AI applications in biology",
    tags: ["IDEA"],
    processingStatus: "completed",
  });

  // ─── Seed Audio Item + Detail ────────────────────────────────────

  const audioItem = await db.insertItemWithId("audio-1", {
    type: "audio",
    title: "Brainstorming Session",
    rawContent:
      "Brainstorming a new B2B SaaS idea for automated customer onboarding. The discussion focuses primarily on strategies for reducing churn during the critical first 14 days of user engagement.",
    summary:
      "Brainstorming a new B2B SaaS idea for automated customer onboarding focusing on reducing churn.",
    tags: ["Business", "Strategy"],
    duration: "2:23",
    processingStatus: "completed",
  });

  const actionItems: ActionItemData[] = [
    { id: "a1", text: "Draft initial user flow diagram", completed: false },
    {
      id: "a2",
      text: "Research competitor onboarding flows",
      completed: false,
    },
    { id: "a3", text: "Schedule meeting with design team", completed: false },
  ];

  await db.createAudioDetail({
    itemId: "audio-1",
    transcript:
      "So I've been thinking about this B2B SaaS idea for automated customer onboarding...",
    summary:
      "Brainstorming a new B2B SaaS idea for automated customer onboarding. The discussion focuses primarily on strategies for reducing churn during the critical first 14 days of user engagement.",
    summaryTags: ["#SaaS", "#Retention", "#ProductStrategy"],
    actionItems,
    autoTags: ["Business", "Strategy"],
    currentTime: "0:34",
    remainingTime: "-1:49",
  });

  // ─── Seed Chat Messages ──────────────────────────────────────────

  await db.createChatMessage({
    sessionId: "main",
    role: "user",
    content: "Find that TikTok video about Excel macros",
  });

  await db.createChatMessage({
    sessionId: "main",
    role: "assistant",
    content: "",
    mediaCard: {
      title: "Excel Macros in 60s",
      bulletPoints: [
        "Automate repetitive tasks instantly",
        "Record macro via Developer tab",
      ],
      videoThumbnail: "excel_video",
      videoDuration: "0:59",
      copyAction: "Copy Formula",
      sourceItemId: "3",
    },
  });

  await db.createChatMessage({
    sessionId: "main",
    role: "assistant",
    content:
      "Here is the formula extracted from the video. Would you like me to explain how to apply it?",
  });

  // ─── Seed Embeddings (placeholder vectors for semantic search) ──

  const allItems = [item1, item2, item3, item4, audioItem];

  for (const item of allItems) {
    const text = `${item.title} ${item.rawContent} ${item.tags.join(" ")}`;
    const vector = generatePlaceholderEmbedding(text);

    await createEmbedding({
      itemId: item.id,
      vector,
      model: "placeholder-hash",
      dimension: 384,
    });
  }

  console.log("[NexusMind] Database seeded successfully.");
}
