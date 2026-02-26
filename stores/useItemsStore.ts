/**
 * NexusMind - Items Store (Zustand)
 *
 * Manages the Items state for the Home feed and detail screens.
 * Provides optimistic updates - UI updates immediately while
 * the database write happens in the background.
 */

import { create } from "zustand";
import type { Item, AudioDetail, CreateItemPayload, UpdateItemPayload, ActionItemData } from "@/lib/types";
import * as db from "@/lib/database";

interface ItemsState {
  /** All loaded items (newest first) */
  items: Item[];
  /** Whether items are currently being loaded from DB */
  isLoading: boolean;
  /** Whether the initial load has completed */
  isInitialized: boolean;
  /** Error message if the last operation failed */
  error: string | null;

  /** Audio detail for the currently viewed audio item */
  currentAudioDetail: AudioDetail | null;
  isLoadingAudioDetail: boolean;

  // ─── Actions ─────────────────────────────────────────────────────

  /** Load all items from the database */
  loadItems: () => Promise<void>;

  /** Create a new item (optimistic: adds to list immediately) */
  addItem: (payload: CreateItemPayload) => Promise<Item>;

  /** Update an existing item (optimistic) */
  updateItem: (id: string, payload: UpdateItemPayload) => Promise<void>;

  /** Delete an item (optimistic: removes from list immediately) */
  deleteItem: (id: string) => Promise<void>;

  /** Load audio detail for a specific item */
  loadAudioDetail: (itemId: string) => Promise<void>;

  /** Toggle an action item's completed status (optimistic) */
  toggleActionItem: (itemId: string, actionItemId: string) => Promise<void>;

  /** Reset the store (for testing/dev) */
  reset: () => void;
}

export const useItemsStore = create<ItemsState>((set, get) => ({
  items: [],
  isLoading: false,
  isInitialized: false,
  error: null,
  currentAudioDetail: null,
  isLoadingAudioDetail: false,

  loadItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await db.getItems();
      set({ items, isLoading: false, isInitialized: true });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load items",
        isLoading: false,
      });
    }
  },

  addItem: async (payload) => {
    set({ error: null });

    // Optimistic: create a temporary item for the UI
    const tempId = `temp-${Date.now()}`;
    const optimisticItem: Item = {
      id: tempId,
      type: payload.type,
      title: payload.title,
      rawContent: payload.rawContent,
      summary: payload.summary ?? null,
      tags: payload.tags ?? [],
      sourceUrl: payload.sourceUrl ?? null,
      sourceLabel: payload.sourceLabel ?? null,
      author: payload.author ?? null,
      duration: payload.duration ?? null,
      imagePlaceholder: payload.imagePlaceholder ?? null,
      fileUri: payload.fileUri ?? null,
      processingStatus: payload.processingStatus ?? "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to the top of the list immediately
    set((state) => ({ items: [optimisticItem, ...state.items] }));

    try {
      // Persist to database
      const realItem = await db.createItem(payload);

      // Replace the temporary item with the real one
      set((state) => ({
        items: state.items.map((item) =>
          item.id === tempId ? realItem : item
        ),
      }));

      return realItem;
    } catch (e) {
      // Rollback: remove the optimistic item
      set((state) => ({
        items: state.items.filter((item) => item.id !== tempId),
        error: e instanceof Error ? e.message : "Failed to create item",
      }));
      throw e;
    }
  },

  updateItem: async (id, payload) => {
    const { items } = get();
    const original = items.find((i) => i.id === id);
    if (!original) return;

    // Optimistic update
    const optimistic: Item = { ...original, ...payload, updatedAt: new Date() };
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? optimistic : i)),
    }));

    try {
      const updated = await db.updateItem(id, payload);
      if (updated) {
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? updated : i)),
        }));
      }
    } catch (e) {
      // Rollback
      set((state) => ({
        items: state.items.map((i) => (i.id === id ? original : i)),
        error: e instanceof Error ? e.message : "Failed to update item",
      }));
    }
  },

  deleteItem: async (id) => {
    const { items } = get();
    const original = items.find((i) => i.id === id);

    // Optimistic removal
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    }));

    try {
      await db.deleteItem(id);
    } catch (e) {
      // Rollback
      if (original) {
        set((state) => ({
          items: [...state.items, original].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
          ),
          error: e instanceof Error ? e.message : "Failed to delete item",
        }));
      }
    }
  },

  loadAudioDetail: async (itemId) => {
    set({ isLoadingAudioDetail: true, currentAudioDetail: null });
    try {
      const detail = await db.getAudioDetailByItemId(itemId);
      set({ currentAudioDetail: detail, isLoadingAudioDetail: false });
    } catch (e) {
      set({
        isLoadingAudioDetail: false,
        error: e instanceof Error ? e.message : "Failed to load audio detail",
      });
    }
  },

  toggleActionItem: async (itemId, actionItemId) => {
    const { currentAudioDetail } = get();
    if (!currentAudioDetail || currentAudioDetail.itemId !== itemId) return;

    // Optimistic toggle
    const updatedItems = currentAudioDetail.actionItems.map((ai) =>
      ai.id === actionItemId ? { ...ai, completed: !ai.completed } : ai
    );

    set({
      currentAudioDetail: {
        ...currentAudioDetail,
        actionItems: updatedItems,
      },
    });

    try {
      await db.updateAudioActionItems(itemId, updatedItems);
    } catch (e) {
      // Rollback
      set({ currentAudioDetail });
    }
  },

  reset: () => {
    set({
      items: [],
      isLoading: false,
      isInitialized: false,
      error: null,
      currentAudioDetail: null,
      isLoadingAudioDetail: false,
    });
  },
}));
