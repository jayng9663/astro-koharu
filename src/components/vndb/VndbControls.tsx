import { useTranslation } from '@hooks/useTranslation';
import type { VndbFilter } from '@hooks/useVndbShelf';
import { Icon } from '@iconify/react';
import type { TranslationKey } from '@/i18n/types';
import type { VndbStatus } from '@/lib/vndb/constants';
import { formatPlayTime } from '@/lib/vndb/detail';
import { SORT_KEYS, type SortDirection, type VndbSortKey } from '@/lib/vndb/sort';
import type { VndbUserStats } from '@/types/vndb';
import { STATUS_LABEL_KEYS } from './VndbCard';

const SORT_LABEL_KEYS: Record<VndbSortKey, TranslationKey> = {
  updated: 'vndb.sort.updated',
  added: 'vndb.sort.added',
  released: 'vndb.sort.released',
  finished: 'vndb.sort.finished',
  title: 'vndb.sort.title',
  myVote: 'vndb.sort.myVote',
  rating: 'vndb.sort.rating',
};

/** Filter order on the shelf: what was read, what is being read, then what is waiting. */
const FILTER_ORDER: readonly VndbStatus[] = ['finished', 'playing', 'wishlist', 'stalled', 'dropped'];

interface VndbControlsProps {
  activeFilter: VndbFilter;
  filterCounts: Partial<Record<VndbFilter, number>>;
  onFilterChange: (filter: VndbFilter) => void;
  stats: VndbUserStats | null;
  sortKey: VndbSortKey;
  sortDirection: SortDirection;
  onSortKeyChange: (key: VndbSortKey) => void;
  onSortDirectionToggle: () => void;
}

/** Status tabs, the reported play-time total and the sort selector. */
export function VndbControls({
  activeFilter,
  filterCounts,
  onFilterChange,
  stats,
  sortKey,
  sortDirection,
  onSortKeyChange,
  onSortDirectionToggle,
}: VndbControlsProps) {
  const { t } = useTranslation();
  const totalPlayTime = formatPlayTime(stats?.lengthMinutes);
  const directionLabel = t(sortDirection === 'asc' ? 'vndb.sort.asc' : 'vndb.sort.desc');

  return (
    <>
      <div className="index-tabs bangumi-type-tabs">
        <button type="button" aria-pressed={activeFilter === 'all'} onClick={() => onFilterChange('all')}>
          {t('vndb.all')}
          <sup>{filterCounts.all}</sup>
        </button>
        {FILTER_ORDER.filter((key) => (filterCounts[key] ?? 0) > 0).map((key) => (
          <button key={key} type="button" aria-pressed={activeFilter === key} onClick={() => onFilterChange(key)}>
            {t(STATUS_LABEL_KEYS[key])}
            <sup>{filterCounts[key]}</sup>
          </button>
        ))}
      </div>

      <div className="vndb-toolbar">
        {stats && totalPlayTime && (
          <p className="vndb-stats">
            {t('vndb.stats.playTime', {
              time: t(totalPlayTime.unit === 'hours' ? 'vndb.detail.hours' : 'vndb.detail.minutes', { n: totalPlayTime.value }),
              count: stats.lengthVotes,
            })}
          </p>
        )}
        <div className="vndb-sort">
          <label className="vndb-sort-label" htmlFor="vndb-sort-key">
            {t('vndb.sort.label')}
          </label>
          <select
            id="vndb-sort-key"
            className="vndb-sort-select"
            value={sortKey}
            onChange={(event) => onSortKeyChange(event.target.value as VndbSortKey)}
          >
            {SORT_KEYS.map((key) => (
              <option key={key} value={key}>
                {t(SORT_LABEL_KEYS[key])}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="vndb-sort-direction"
            onClick={onSortDirectionToggle}
            aria-label={directionLabel}
            title={directionLabel}
          >
            <Icon icon={sortDirection === 'asc' ? 'ri:sort-asc' : 'ri:sort-desc'} className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
}
