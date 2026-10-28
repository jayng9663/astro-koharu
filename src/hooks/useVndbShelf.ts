import { useTranslation } from '@hooks/useTranslation';
import { getScrollBehavior } from '@lib/motion-level';
import { useMemo, useRef, useState } from 'react';
import { ITEMS_PER_PAGE, type VndbStatus } from '@/lib/vndb/constants';
import { DEFAULT_DIRECTION, DEFAULT_SORT_KEY, type SortDirection, sortEntries, type VndbSortKey } from '@/lib/vndb/sort';
import { getDisplayTitle, getEntryStatus } from '@/lib/vndb/utils';
import type { VndbShelfItem, VndbUserListEntry } from '@/types/vndb';

export type VndbFilter = VndbStatus | 'all';

/** Filtering, sorting and paging of the list; every change of the view returns to page 1. */
export function useVndbShelf(entries: VndbUserListEntry[]) {
  const { locale } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<VndbFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<VndbSortKey>(DEFAULT_SORT_KEY);
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_DIRECTION[DEFAULT_SORT_KEY]);
  const shelfRef = useRef<HTMLDivElement>(null);

  const items = useMemo<VndbShelfItem[]>(
    () => entries.map((entry) => ({ entry, status: getEntryStatus(entry.labels) })),
    [entries],
  );

  const filterCounts = useMemo(() => {
    const counts: Partial<Record<VndbFilter, number>> = { all: items.length };
    for (const { status } of items) {
      if (status) counts[status] = (counts[status] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    const visible = activeFilter === 'all' ? items : items.filter(({ status }) => status === activeFilter);
    return sortEntries(visible, sortKey, sortDirection, locale, (entry) => getDisplayTitle(entry.vn, locale));
  }, [items, activeFilter, sortKey, sortDirection, locale]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const pageItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  /** Switching pages from the bottom pager brings the shelf's top back into view instead of leaving the reader mid-page. */
  function goToPage(page: number) {
    setCurrentPage(page);
    const shelf = shelfRef.current;
    if (shelf && shelf.getBoundingClientRect().top < 0) {
      shelf.scrollIntoView({ behavior: getScrollBehavior(), block: 'start' });
    }
  }

  return {
    items,
    filterCounts,
    pageItems,
    totalPages,
    currentPage,
    goToPage,
    shelfRef,
    activeFilter,
    sortKey,
    sortDirection,
    setFilter(filter: VndbFilter) {
      setActiveFilter(filter);
      setCurrentPage(1);
    },
    setSortKey(key: VndbSortKey) {
      setSortKey(key);
      setSortDirection(DEFAULT_DIRECTION[key]);
      setCurrentPage(1);
    },
    toggleSortDirection() {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
      setCurrentPage(1);
    },
  };
}
