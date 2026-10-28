import { useTranslation } from '@hooks/useTranslation';

export function VndbLoading() {
  return (
    <div className="space-y-4 py-8" aria-hidden="true">
      <div className="flex gap-5">
        {Array.from({ length: 4 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
          <div key={i} className="h-5 w-14 animate-pulse rounded bg-muted" />
        ))}
      </div>
      <div className="bangumi-grid">
        {Array.from({ length: 10 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable id
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] rounded-xl bg-muted" />
            <div className="mt-2 h-3.5 w-3/4 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function VndbError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 py-8">
      <p className="text-muted-foreground">{t('vndb.error')}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
      >
        {t('vndb.retry')}
      </button>
    </div>
  );
}

export function VndbEmpty() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center py-8">
      <p className="text-muted-foreground">{t('vndb.noItems')}</p>
    </div>
  );
}
