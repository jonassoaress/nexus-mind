/**
 * NexusMind - Vector Search Utility
 *
 * Implements cosine similarity search over locally-stored embedding vectors.
 * In Phase 2, vectors are stored as JSON arrays in SQLite and search is
 * performed in JavaScript. Phase 5 will replace the embedding generation
 * with a real ONNX model (all-MiniLM-L6-v2).
 *
 * Design notes:
 * - Cosine similarity is computed in pure JS for now (no native deps needed).
 * - For small-to-medium datasets (<10k items), this approach is fast enough.
 * - The search runs off the main JS thread via Zustand async actions.
 */

import {
  getAllEmbeddings,
  getItemById,
} from "./database";
import type { Embedding, Item, SearchResult } from "./types";

// ─── Cosine Similarity ──────────────────────────────────────────────────────

/**
 * Compute cosine similarity between two vectors.
 * Returns a value between -1 and 1 (1 = identical direction).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Vector dimension mismatch: ${a.length} vs ${b.length}`
    );
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// ─── Semantic Search ─────────────────────────────────────────────────────────

/**
 * Search for items semantically similar to the query vector.
 *
 * @param queryVector - The embedding of the user's search query
 * @param topK - Number of results to return (default: 3, per AGENTS.md spec)
 * @param minScore - Minimum cosine similarity threshold (default: 0.3)
 * @returns Ranked search results with items and similarity scores
 */
export async function semanticSearch(
  queryVector: number[],
  topK: number = 3,
  minScore: number = 0.3
): Promise<SearchResult[]> {
  // Load all embeddings from SQLite
  const embeddings = await getAllEmbeddings();

  if (embeddings.length === 0) {
    return [];
  }

  // Compute similarity scores
  const scored: { embedding: Embedding; score: number }[] = [];

  for (const embedding of embeddings) {
    try {
      const score = cosineSimilarity(queryVector, embedding.vector);
      if (score >= minScore) {
        scored.push({ embedding, score });
      }
    } catch {
      // Skip embeddings with dimension mismatches
      continue;
    }
  }

  // Sort by score descending and take top K
  scored.sort((a, b) => b.score - a.score);
  const topResults = scored.slice(0, topK);

  // Resolve Items for each result
  const results: SearchResult[] = [];

  for (const { embedding, score } of topResults) {
    const item = await getItemById(embedding.itemId);
    if (item) {
      results.push({ item, score, embedding });
    }
  }

  return results;
}

// ─── Placeholder Embedding Generator ─────────────────────────────────────────

/**
 * Generate a placeholder embedding for text content.
 *
 * IMPORTANT: This is a deterministic hash-based placeholder for Phase 2.
 * Phase 5 will replace this with real ONNX MiniLM inference.
 *
 * The placeholder creates a 384-dimension vector (matching MiniLM output)
 * from a simple hash of the text, ensuring that identical text produces
 * identical vectors and similar text produces somewhat similar vectors.
 */
export function generatePlaceholderEmbedding(text: string): number[] {
  const dimension = 384;
  const vector = new Array<number>(dimension);

  // Simple seeded pseudo-random based on text content
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  // Generate deterministic vector from hash
  for (let i = 0; i < dimension; i++) {
    hash = ((hash << 13) ^ hash) | 0;
    hash = (hash * 0x5bd1e995) | 0;
    hash = ((hash >> 15) ^ hash) | 0;
    // Normalize to [-1, 1] range
    vector[i] = (hash % 1000) / 1000;
  }

  // L2-normalize the vector
  let norm = 0;
  for (let i = 0; i < dimension; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimension; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}
