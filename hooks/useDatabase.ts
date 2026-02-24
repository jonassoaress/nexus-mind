/**
 * NexusMind - useDatabase hook
 *
 * Initializes the database and seeds it on first launch.
 * Should be called once at the root layout level.
 */

import { useEffect, useState } from "react";
import { getDatabase } from "@/lib/database";
import { seedDatabaseIfEmpty } from "@/lib/seed";

export function useDatabase() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        // Initialize database (runs migrations)
        await getDatabase();
        // Seed with mock data if empty
        await seedDatabaseIfEmpty();

        if (mounted) setIsReady(true);
      } catch (e) {
        console.error("[NexusMind] Database init failed:", e);
        if (mounted) {
          setError(e instanceof Error ? e.message : "Database init failed");
        }
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, error };
}
