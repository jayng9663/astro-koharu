import type { VndbUserListEntry } from '@/types/vndb';

export const SORT_KEYS = ['updated', 'added', 'released', 'finished', 'title', 'myVote', 'rating'] as const;
export type VndbSortKey = (typeof SORT_KEYS)[number];
export type SortDirection = 'asc' | 'desc';

export const DEFAULT_SORT_KEY: VndbSortKey = 'updated';

/** Where each sort starts: newest and best first, titles A to Z. */
export const DEFAULT_DIRECTION: Readonly<Record<VndbSortKey, SortDirection>> = {
  updated: 'desc',
  added: 'desc',
  released: 'desc',
  finished: 'desc',
  title: 'asc',
  myVote: 'desc',
  rating: 'desc',
};

type SortValue = number | string | null;

/** A release date VNDB has not fixed yet (`TBA`) sorts like a missing one. */
function releaseValue(released: string | null): string | null {
  return released && /^\d{4}/.test(released) ? released : null;
}

function sortValue(entry: VndbUserListEntry, key: Exclude<VndbSortKey, 'title'>): SortValue {
  switch (key) {
    case 'updated':
      return entry.lastmod;
    case 'added':
      return entry.added;
    case 'released':
      return releaseValue(entry.vn.released);
    case 'finished':
      return entry.finished;
    case 'myVote':
      return entry.vote;
    case 'rating':
      return entry.vn.rating;
  }
}

/**
 * Sort list items by `key`. Stable, does not mutate. Entries without a value for the key
 * (no vote, not finished, release date to be announced) always come last, in either direction.
 * Titles are compared with the locale's collation, using the title the card shows.
 */
export function sortEntries<T extends { entry: VndbUserListEntry }>(
  items: readonly T[],
  key: VndbSortKey,
  direction: SortDirection,
  locale: string,
  getTitle: (entry: VndbUserListEntry) => string,
): T[] {
  const sign = direction === 'asc' ? 1 : -1;
  const collator = new Intl.Collator(locale, { numeric: true, sensitivity: 'base' });

  const decorated = items.map((item, index) => ({
    item,
    index,
    value: key === 'title' ? getTitle(item.entry) : sortValue(item.entry, key),
  }));

  decorated.sort((a, b) => {
    const aMissing = a.value === null || a.value === '';
    const bMissing = b.value === null || b.value === '';
    if (aMissing || bMissing) return aMissing === bMissing ? a.index - b.index : aMissing ? 1 : -1;
    let order: number;
    if (typeof a.value === 'number' && typeof b.value === 'number') order = a.value - b.value;
    else if (key === 'title') order = collator.compare(String(a.value), String(b.value));
    else order = String(a.value) < String(b.value) ? -1 : String(a.value) > String(b.value) ? 1 : 0;
    return order === 0 ? a.index - b.index : order * sign;
  });
  return decorated.map(({ item }) => item);
}
