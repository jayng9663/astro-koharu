import { useCallback, useEffect, useState } from 'react';
import { fetchUserList, fetchUserStats } from '@/lib/vndb/api';
import type { VndbUserListEntry, VndbUserStats } from '@/types/vndb';

interface UseVndbDataReturn {
  entries: VndbUserListEntry[];
  /** Totals of the user's own play-time votes; null while loading, when unavailable or when there are none. */
  stats: VndbUserStats | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useVndbData(userId: string): UseVndbDataReturn {
  const [entries, setEntries] = useState<VndbUserListEntry[]>([]);
  const [stats, setStats] = useState<VndbUserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const retry = useCallback(() => setTrigger((n) => n + 1), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger forces re-fetch on retry
  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    setEntries([]);
    setStats(null);

    // The totals are a bonus: failing to load them must not take the list down with it.
    fetchUserStats(userId, fetch, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setStats(result);
      })
      .catch(() => {});

    fetchUserList(userId, fetch, controller.signal)
      .then((list) => {
        if (!controller.signal.aborted) setEntries(list);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [userId, trigger]);

  return { entries, stats, isLoading, error, retry };
}
