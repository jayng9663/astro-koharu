import { useCallback, useEffect, useState } from 'react';
import { fetchVnDetail } from '@/lib/vndb/api';
import type { VndbDetailResult } from '@/types/vndb';

/** Details already fetched this visit, so reopening a VN is instant. */
const cache = new Map<string, VndbDetailResult>();

interface UseVndbDetailReturn {
  detail: VndbDetailResult | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

/** Loads a VN's details when an id is given; an id of null loads nothing. */
export function useVndbDetail(id: string | null): UseVndbDetailReturn {
  const [detail, setDetail] = useState<VndbDetailResult | null>(id ? (cache.get(id) ?? null) : null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const retry = useCallback(() => setTrigger((n) => n + 1), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger forces re-fetch on retry
  useEffect(() => {
    setError(null);
    if (!id) {
      setDetail(null);
      setIsLoading(false);
      return;
    }
    const cached = cache.get(id);
    if (cached) {
      setDetail(cached);
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    setDetail(null);
    setIsLoading(true);
    fetchVnDetail(id, fetch, controller.signal)
      .then((result) => {
        cache.set(id, result);
        if (!controller.signal.aborted) setDetail(result);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [id, trigger]);

  return { detail, isLoading, error, retry };
}
