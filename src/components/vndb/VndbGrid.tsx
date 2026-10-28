import { useMotionLevel } from '@hooks/useMotionLevel';
import { AnimatePresence, m } from 'motion/react';
import type { VndbShelfItem } from '@/types/vndb';
import { VndbCard } from './VndbCard';

interface VndbGridProps {
  items: readonly VndbShelfItem[];
  /** Changes whenever the view does, so the grid re-enters instead of morphing. */
  viewKey: string;
  hideCoverAbove: number;
  showStatus: boolean;
  isRevealed: (id: string) => boolean;
  onRevealedChange: (id: string, revealed: boolean) => void;
  onOpen: (id: string) => void;
}

export function VndbGrid({ items, viewKey, hideCoverAbove, showStatus, isRevealed, onRevealedChange, onOpen }: VndbGridProps) {
  const shouldReduceMotion = useMotionLevel() === 'reduced';
  return (
    <AnimatePresence mode="popLayout">
      <m.div
        key={viewKey}
        className="bangumi-grid"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
      >
        {items.map(({ entry, status }) => (
          <VndbCard
            key={entry.id}
            entry={entry}
            status={status}
            hideCoverAbove={hideCoverAbove}
            showStatus={showStatus}
            revealed={isRevealed(entry.id)}
            onRevealedChange={(revealed) => onRevealedChange(entry.id, revealed)}
            onOpen={() => onOpen(entry.id)}
          />
        ))}
      </m.div>
    </AnimatePresence>
  );
}
