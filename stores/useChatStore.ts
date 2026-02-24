/**
 * NexusMind - Chat Store (Zustand)
 *
 * Manages the chat/search conversation state.
 * In Phase 2 this persists messages to SQLite.
 * Phase 5 will wire the "send" action to the Retrieval Engine.
 */

import { create } from "zustand";
import type { ChatMessage, MediaCard, SearchResult } from "@/lib/types";
import * as db from "@/lib/database";
import { semanticSearch, generatePlaceholderEmbedding } from "@/lib/vectorSearch";

/** Default session ID for the main search chat */
const DEFAULT_SESSION = "main";

interface ChatState {
  /** Current chat messages */
  messages: ChatMessage[];
  /** Current session ID */
  sessionId: string;
  /** Whether messages are loading from DB */
  isLoading: boolean;
  /** Whether the AI is "thinking" (generating a response) */
  isThinking: boolean;
  /** Error from the last operation */
  error: string | null;

  // ─── Actions ─────────────────────────────────────────────────────

  /** Load messages for a session from the database */
  loadMessages: (sessionId?: string) => Promise<void>;

  /** Send a user message and trigger the retrieval pipeline */
  sendMessage: (content: string) => Promise<void>;

  /** Clear the current chat session */
  clearChat: () => Promise<void>;

  /** Reset store state */
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  sessionId: DEFAULT_SESSION,
  isLoading: false,
  isThinking: false,
  error: null,

  loadMessages: async (sessionId?: string) => {
    const sid = sessionId ?? get().sessionId;
    set({ isLoading: true, sessionId: sid, error: null });

    try {
      const messages = await db.getChatMessages(sid);
      set({ messages, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load messages",
        isLoading: false,
      });
    }
  },

  sendMessage: async (content) => {
    const { sessionId } = get();
    set({ error: null });

    // 1. Persist and show user message immediately
    try {
      const userMsg = await db.createChatMessage({
        sessionId,
        role: "user",
        content,
      });
      set((state) => ({ messages: [...state.messages, userMsg] }));
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to send message",
      });
      return;
    }

    // 2. Show "thinking" state
    set({ isThinking: true });

    try {
      // 3. Generate placeholder embedding for the query
      const queryVector = generatePlaceholderEmbedding(content);

      // 4. Perform semantic search
      const results = await semanticSearch(queryVector, 3, 0.1);

      // 5. Build assistant response
      let responseContent: string;
      let mediaCard: MediaCard | null = null;

      if (results.length > 0) {
        const topResult = results[0];
        responseContent = topResult.item.summary
          ? `I found this in your memory. ${topResult.item.summary}`
          : `I found "${topResult.item.title}" in your captures.`;

        // Build a media card for the top result if applicable
        if (
          topResult.item.type === "link" ||
          topResult.item.type === "screenshot"
        ) {
          mediaCard = {
            title: topResult.item.title,
            bulletPoints: topResult.item.tags.map((t) => t),
            sourceItemId: topResult.item.id,
          };

          if (topResult.item.imagePlaceholder === "video") {
            mediaCard.videoThumbnail = topResult.item.imagePlaceholder;
            mediaCard.videoDuration = topResult.item.duration ?? undefined;
          }
        }
      } else {
        responseContent =
          "I don't have this in my memory. Try capturing more content!";
      }

      // 6. Persist and show assistant message
      const assistantMsg = await db.createChatMessage({
        sessionId,
        role: "assistant",
        content: responseContent,
        mediaCard,
      });

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isThinking: false,
      }));
    } catch (e) {
      // Even on error, stop thinking and show a fallback message
      const fallbackMsg = await db.createChatMessage({
        sessionId: get().sessionId,
        role: "assistant",
        content: "Something went wrong while searching. Please try again.",
      });

      set((state) => ({
        messages: [...state.messages, fallbackMsg],
        isThinking: false,
        error: e instanceof Error ? e.message : "Search failed",
      }));
    }
  },

  clearChat: async () => {
    const { sessionId } = get();
    try {
      await db.clearChatSession(sessionId);
      set({ messages: [] });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to clear chat",
      });
    }
  },

  reset: () => {
    set({
      messages: [],
      sessionId: DEFAULT_SESSION,
      isLoading: false,
      isThinking: false,
      error: null,
    });
  },
}));
