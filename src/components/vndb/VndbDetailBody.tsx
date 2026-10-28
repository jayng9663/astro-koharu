import { DialogTitle } from '@components/ui/dialog';
import { useTranslation } from '@hooks/useTranslation';
import { parseDescription } from '@/lib/vndb/detail';
import { getDisplayTitle } from '@/lib/vndb/utils';
import type { VndbDetailResult, VndbShelfItem } from '@/types/vndb';
import { VndbDescription } from './VndbDescription';
import { VndbDetailCover } from './VndbDetailCover';
import { VndbDetailFacts } from './VndbDetailFacts';

interface VndbDetailBodyProps {
  item: VndbShelfItem;
  detail: VndbDetailResult | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  hideCoverAbove: number;
  coverRevealed: boolean;
  onCoverRevealedChange: (revealed: boolean) => void;
  languageName: (code: string) => string;
}

/** The window's content: a fixed header, then the cover beside the facts and description as they load. */
export function VndbDetailBody({
  item,
  detail,
  isLoading,
  error,
  retry,
  hideCoverAbove,
  coverRevealed,
  onCoverRevealedChange,
  languageName,
}: VndbDetailBodyProps) {
  const { t, locale } = useTranslation();
  const listed = item.entry.vn;
  const title = getDisplayTitle(listed, locale);
  const original = listed.alttitle && listed.alttitle !== title ? listed.alttitle : null;

  return (
    <>
      <div className="vndb-detail-head">
        <DialogTitle className="text-xl leading-snug">{title}</DialogTitle>
        {original && <p className="vndb-detail-original">{original}</p>}
      </div>
      <div className="vndb-detail-scroll">
        <div className="vndb-detail">
          <VndbDetailCover
            entry={item.entry}
            title={title}
            fullImage={detail?.vn.image}
            hideCoverAbove={hideCoverAbove}
            coverRevealed={coverRevealed}
            onCoverRevealedChange={onCoverRevealedChange}
          />
          <div className="vndb-detail-main">
            {isLoading && (
              <div className="space-y-3" aria-hidden="true">
                {Array.from({ length: 6 }, (_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
                  <div key={i} className="h-4 animate-pulse rounded bg-muted" style={{ width: `${90 - i * 9}%` }} />
                ))}
              </div>
            )}
            {error && (
              <div className="flex flex-col items-start gap-3 py-2">
                <p className="text-muted-foreground text-sm">{t('vndb.detail.error')}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
                >
                  {t('vndb.retry')}
                </button>
              </div>
            )}
            {detail && <VndbDetailFacts item={item} detail={detail} languageName={languageName} />}
            {detail && <VndbDescription parts={parseDescription(detail.vn.description)} />}
          </div>
        </div>
      </div>
    </>
  );
}
