/**
 * NexusMind - Lib barrel export
 */

export { getDatabase } from "./database";
export { runMigrations } from "./schema";
export { semanticSearch, cosineSimilarity, generatePlaceholderEmbedding } from "./vectorSearch";
export { seedDatabaseIfEmpty } from "./seed";
export type * from "./types";
