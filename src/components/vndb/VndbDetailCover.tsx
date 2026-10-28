import { useTranslation } from '@hooks/useTranslation';
import { Icon } from '@iconify/react';
import { openModal } from '@store/modal';
import { shouldHideCover, vndbUrl } from '@/lib/vndb/utils';
import type { VndbDetail, VndbUserListEntry } from '@/types/vndb';

interface CoverImageProps {
  src: string;
  dims?: [number, number];
  zoomLabel: string;
  /** Present once the full-size cover is known; the thumbnail alone is too small to be worth zooming. */
  onZoom?: () => void;
}

function CoverImage({ src, dims, zoomLabel, onZoom }: CoverImageProps) {
  const image = <img src={src} alt="" width={dims?.[0]} height={dims?.[1]} decoding="async" referrerPolicy="no-referrer" />;
  if (!onZoom) return image;
  // Like an article image: click for the lightbox with zoom, pan and rotate.
  return (
    <button type="button" className="vndb-zoom-button" aria-label={zoomLabel} onClick={onZoom}>
      {image}
      <span className="vndb-zoom-badge" aria-hidden="true">
        <Icon icon="ri:zoom-in-line" className="size-4" />
      </span>
    </button>
  );
}

interface VndbDetailCoverProps {
  entry: VndbUserListEntry;
  /** The title the window shows, used as the zoomed image's alt text. */
  title: string;
  fullImage: VndbDetail['image'] | undefined;
  hideCoverAbove: number;
  coverRevealed: boolean;
  onCoverRevealedChange: (revealed: boolean) => void;
}

/** The cover column: the picture (or its placeholder) and the link to VNDB. */
export function VndbDetailCover({
  entry,
  title,
  fullImage,
  hideCoverAbove,
  coverRevealed,
  onCoverRevealedChange,
}: VndbDetailCoverProps) {
  const { t } = useTranslation();
  const listed = entry.vn.image;
  const isFlagged = shouldHideCover(listed, hideCoverAbove);
  const showCover = !isFlagged || coverRevealed;
  // The listing's thumbnail appears at once; the full-size cover replaces it when the details arrive.
  const fullCoverUrl = fullImage?.url;
  const coverSrc = fullCoverUrl ?? listed?.thumbnail;
  const coverDims = fullImage?.dims ?? listed?.thumbnail_dims;

  function zoomCover(src: string) {
    openModal('imageLightbox', { src, alt: title, images: [{ src, alt: title }], currentIndex: 0 });
  }

  return (
    <div className="vndb-detail-side">
      <div className={showCover && coverSrc ? 'vndb-detail-cover' : 'vndb-detail-cover is-placeholder'}>
        {showCover && coverSrc ? (
          <CoverImage
            src={coverSrc}
            dims={coverDims}
            zoomLabel={t('vndb.detail.zoom')}
            onZoom={fullCoverUrl ? () => zoomCover(fullCoverUrl) : undefined}
          />
        ) : (
          <div className="vndb-cover-hidden">
            <Icon icon="ri:eye-off-line" className="size-6" aria-hidden="true" />
            {isFlagged ? t('vndb.coverHidden') : t('vndb.noImage')}
            {isFlagged && (
              <button type="button" className="vndb-cover-toggle" onClick={() => onCoverRevealedChange(true)}>
                {t('vndb.showCover')}
              </button>
            )}
          </div>
        )}
        {isFlagged && coverRevealed && (
          <button
            type="button"
            className="vndb-cover-rehide"
            aria-label={t('vndb.hideCover')}
            title={t('vndb.hideCover')}
            onClick={() => onCoverRevealedChange(false)}
          >
            <Icon icon="ri:eye-off-line" className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <a href={vndbUrl(entry.id)} target="_blank" rel="noopener noreferrer" className="vndb-open-link">
        <Icon icon="ri:external-link-line" className="size-4" aria-hidden="true" />
        {t('vndb.detail.openVndb')}
      </a>
    </div>
  );
}
