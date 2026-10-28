import { useTranslation } from '@hooks/useTranslation';
import { Icon } from '@iconify/react';
import { cn } from '@lib/utils';
import type { TranslationKey } from '@/i18n/types';
import type { VndbStatus } from '@/lib/vndb/constants';
import { formatScore, getDisplayTitle, shouldHideCover, vndbUrl } from '@/lib/vndb/utils';
import type { VndbUserListEntry } from '@/types/vndb';

export const STATUS_LABEL_KEYS: Record<VndbStatus, TranslationKey> = {
  playing: 'vndb.playing',
  finished: 'vndb.finished',
  stalled: 'vndb.stalled',
  dropped: 'vndb.dropped',
  wishlist: 'vndb.wishlist',
};

interface VndbCardProps {
  entry: VndbUserListEntry;
  status: VndbStatus | null;
  /** Covers whose sexual or violence flag average exceeds this are replaced by a placeholder until revealed. */
  hideCoverAbove: number;
  /** The status is redundant once the list is already filtered to one status. */
  showStatus: boolean;
  /** Whether the visitor asked to see this card's flagged cover. */
  revealed: boolean;
  onRevealedChange: (revealed: boolean) => void;
  /** Opens the detail window. */
  onOpen: () => void;
}

export function VndbCard({ entry, status, hideCoverAbove, showStatus, revealed, onRevealedChange, onOpen }: VndbCardProps) {
  const { t, locale } = useTranslation();
  const { vn } = entry;
  const href = vndbUrl(entry.id);
  const title = getDisplayTitle(vn, locale);
  const year = vn.released?.slice(0, 4);
  // The user's own vote wins over the community rating and is inked in the accent color.
  const isUserVote = entry.vote !== null;
  const score = entry.vote ?? vn.rating;
  const isPlaying = status === 'playing';
  const isFlagged = shouldHideCover(vn.image, hideCoverAbove);
  const showCover = !isFlagged || revealed;

  // The card is not one big link: the cover opens the detail window and only the title links out to VNDB.
  return (
    <div className="bangumi-card vndb-card group">
      <div className="bangumi-poster vndb-poster">
        {/* A flagged cover is not rendered until asked for, so its URL does not reach the page or the network. */}
        {!showCover ? (
          <div className="vndb-cover-hidden">
            <Icon icon="ri:eye-off-line" className="size-6" aria-hidden="true" />
            {t('vndb.coverHidden')}
            <div className="vndb-cover-actions">
              <button type="button" className="vndb-cover-toggle" onClick={() => onRevealedChange(true)}>
                {t('vndb.showCover')}
              </button>
              <button type="button" className="vndb-cover-toggle" data-vndb-open={entry.id} onClick={onOpen}>
                {t('vndb.details')}
              </button>
            </div>
          </div>
        ) : vn.image ? (
          <button
            type="button"
            className="vndb-poster-link"
            data-vndb-open={entry.id}
            aria-label={t('vndb.detail.open', { title })}
            onClick={onOpen}
          >
            <img
              src={vn.image.thumbnail}
              alt=""
              width={vn.image.thumbnail_dims[0]}
              height={vn.image.thumbnail_dims[1]}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
          </button>
        ) : (
          <button
            type="button"
            className="vndb-poster-link flex items-center justify-center text-muted-foreground text-xs"
            data-vndb-open={entry.id}
            aria-label={t('vndb.detail.open', { title })}
            onClick={onOpen}
          >
            {t('vndb.noImage')}
          </button>
        )}
        {isFlagged && revealed && (
          <button
            type="button"
            className="vndb-cover-rehide"
            aria-label={t('vndb.hideCover')}
            title={t('vndb.hideCover')}
            onClick={() => onRevealedChange(false)}
          >
            <Icon icon="ri:eye-off-line" className="size-4" aria-hidden="true" />
          </button>
        )}
        {isPlaying && showStatus && <span className="bangumi-ribbon">{t('vndb.playing')}</span>}
      </div>
      <h2 className="bangumi-title" title={title}>
        <a href={href} target="_blank" rel="noopener noreferrer" className="vndb-title-link">
          {title}
        </a>
      </h2>
      <p className="bangumi-meta">
        {showStatus && status && !isPlaying && <span>{t(STATUS_LABEL_KEYS[status])}</span>}
        {year && <span>{year}</span>}
        {score !== null && (
          <span className={cn('tabular-nums', isUserVote && 'bangumi-own-score')}>★ {formatScore(score)}</span>
        )}
      </p>
    </div>
  );
}
