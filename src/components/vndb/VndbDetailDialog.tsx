import { Dialog, DialogContent } from '@components/ui/dialog';
import { useTranslation } from '@hooks/useTranslation';
import { useVndbDetail } from '@hooks/useVndbDetail';
import { useStore } from '@nanostores/react';
import { $imageLightboxData } from '@store/modal';
import { useMemo, useRef } from 'react';
import { toLanguageTag } from '@/lib/vndb/detail';
import type { VndbShelfItem } from '@/types/vndb';
import { VndbDetailBody } from './VndbDetailBody';

interface VndbDetailDialogProps {
  target: VndbShelfItem | null;
  onClose: () => void;
  hideCoverAbove: number;
  coverRevealed: boolean;
  onCoverRevealedChange: (revealed: boolean) => void;
}

export function VndbDetailDialog({
  target,
  onClose,
  hideCoverAbove,
  coverRevealed,
  onCoverRevealedChange,
}: VndbDetailDialogProps) {
  const { t, locale } = useTranslation();
  // The window keeps showing the last VN while it animates closed.
  const lastTarget = useRef<VndbShelfItem | null>(null);
  if (target) lastTarget.current = target;
  const shown = target ?? lastTarget.current;
  const { detail, isLoading, error, retry } = useVndbDetail(target?.entry.id ?? null);
  // A modal dialog would block the lightbox's clicks and keys, so the window steps aside while the cover is zoomed.
  const lightboxOpen = useStore($imageLightboxData) !== null;

  const languageNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([toLanguageTag(locale)], { type: 'language' });
    } catch {
      return null;
    }
  }, [locale]);
  const languageName = (code: string) => {
    try {
      return languageNames?.of(toLanguageTag(code)) ?? code;
    } catch {
      return code;
    }
  };

  return (
    <Dialog open={target !== null && !lightboxOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        // Focus belongs to the lightbox while it is open; it returns to the window when the lightbox closes.
        onCloseAutoFocus={(event) => lightboxOpen && event.preventDefault()}
        closeLabel={t('vndb.detail.close')}
        className="vndb-detail-window flex max-h-[88vh] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0"
      >
        {shown && (
          <VndbDetailBody
            item={shown}
            detail={detail}
            isLoading={isLoading}
            error={error}
            retry={retry}
            hideCoverAbove={hideCoverAbove}
            coverRevealed={coverRevealed}
            onCoverRevealedChange={onCoverRevealedChange}
            languageName={languageName}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
