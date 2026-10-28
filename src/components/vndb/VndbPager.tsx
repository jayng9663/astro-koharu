import { useTranslation } from '@hooks/useTranslation';
import { Icon } from '@iconify/react';
import { cn } from '@lib/utils';

function getVisiblePages(totalPages: number, currentPage: number): number[] {
  const pages: number[] = [];
  for (let page = 1; page <= totalPages; page += 1) {
    if (totalPages <= 7 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2) {
      pages.push(page);
    }
  }
  return pages;
}

const ARROW_CLASS =
  'flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40';

interface VndbPagerProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function VndbPager({ currentPage, totalPages, onPageChange }: VndbPagerProps) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;
  const visiblePages = getVisiblePages(totalPages, currentPage);

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label={t('pagination.prev')}
        className={ARROW_CLASS}
      >
        <Icon icon="ri:arrow-left-s-line" className="size-4" />
      </button>
      <div className="flex gap-1">
        {visiblePages.map((page, index) => {
          const previousPage = visiblePages[index - 1];
          const showEllipsis = previousPage !== undefined && page - previousPage > 1;
          return (
            <span key={page} className="flex items-center">
              {showEllipsis && <span className="px-1 text-muted-foreground">…</span>}
              <button
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={currentPage === page ? 'page' : undefined}
                className={cn(
                  'min-w-[2rem] rounded-md px-2 py-1.5 text-sm transition-colors',
                  currentPage === page
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {page}
              </button>
            </span>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label={t('pagination.next')}
        className={ARROW_CLASS}
      >
        <Icon icon="ri:arrow-right-s-line" className="size-4" />
      </button>
    </div>
  );
}
