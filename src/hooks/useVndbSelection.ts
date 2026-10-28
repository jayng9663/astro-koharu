import { useMemo, useState } from 'react';
import type { VndbShelfItem } from '@/types/vndb';

/** Which VN's detail window is open, and which flagged covers the visitor chose to reveal this visit. */
export function useVndbSelection(items: readonly VndbShelfItem[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<ReadonlySet<string>>(new Set());

  const selected = useMemo(() => items.find(({ entry }) => entry.id === selectedId) ?? null, [items, selectedId]);

  return {
    selected,
    open: setSelectedId,
    /** Closing hands focus back to whatever opened the window, as a native dialog would. */
    close() {
      const id = selectedId;
      setSelectedId(null);
      if (id) {
        requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-vndb-open="${CSS.escape(id)}"]`)?.focus());
      }
    },
    isRevealed: (id: string) => revealedIds.has(id),
    setRevealed(id: string, revealed: boolean) {
      setRevealedIds((previous) => {
        const next = new Set(previous);
        if (revealed) next.add(id);
        else next.delete(id);
        return next;
      });
    },
  };
}
