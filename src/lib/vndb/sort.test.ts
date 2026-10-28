import assert from 'node:assert/strict';
import test from 'node:test';
import type { VndbUserListEntry } from '@/types/vndb';
import { DEFAULT_DIRECTION, SORT_KEYS, sortEntries } from './sort';

interface Spec {
  id: string;
  title?: string;
  lastmod?: number;
  added?: number;
  released?: string | null;
  finished?: string | null;
  vote?: number | null;
  rating?: number | null;
}

const item = (spec: Spec) => ({
  entry: {
    id: spec.id,
    vote: spec.vote ?? null,
    lastmod: spec.lastmod ?? 0,
    added: spec.added ?? 0,
    started: null,
    finished: spec.finished ?? null,
    labels: [],
    vn: {
      title: spec.title ?? spec.id,
      alttitle: null,
      olang: 'ja',
      released: spec.released ?? null,
      rating: spec.rating ?? null,
      titles: [],
      image: null,
    },
  } satisfies VndbUserListEntry,
});

const ids = (items: Array<{ entry: VndbUserListEntry }>) => items.map(({ entry }) => entry.id);
const title = (entry: VndbUserListEntry) => entry.vn.title;

test('numbers sort in both directions without mutating the input', () => {
  const input = [item({ id: 'a', lastmod: 2 }), item({ id: 'b', lastmod: 3 }), item({ id: 'c', lastmod: 1 })];
  assert.deepEqual(ids(sortEntries(input, 'updated', 'desc', 'en', title)), ['b', 'a', 'c']);
  assert.deepEqual(ids(sortEntries(input, 'updated', 'asc', 'en', title)), ['c', 'a', 'b']);
  assert.deepEqual(ids(input), ['a', 'b', 'c']);
});

test('entries without a value come last, whichever the direction', () => {
  const input = [item({ id: 'none' }), item({ id: 'low', vote: 60 }), item({ id: 'high', vote: 90 })];
  assert.deepEqual(ids(sortEntries(input, 'myVote', 'desc', 'en', title)), ['high', 'low', 'none']);
  assert.deepEqual(ids(sortEntries(input, 'myVote', 'asc', 'en', title)), ['low', 'high', 'none']);
});

test('release dates compare as text, partial dates included, and TBA counts as missing', () => {
  const input = [
    item({ id: 'tba', released: 'TBA' }),
    item({ id: 'y2020', released: '2020' }),
    item({ id: 'old', released: '1998-12-11' }),
    item({ id: 'new', released: '2026-09-25' }),
    item({ id: 'none', released: null }),
  ];
  assert.deepEqual(ids(sortEntries(input, 'released', 'desc', 'en', title)), ['new', 'y2020', 'old', 'tba', 'none']);
  assert.deepEqual(ids(sortEntries(input, 'released', 'asc', 'en', title)), ['old', 'y2020', 'new', 'tba', 'none']);
});

test('finished dates and community ratings sort', () => {
  const input = [
    item({ id: 'a', finished: '2021-11-13', rating: 70 }),
    item({ id: 'b', finished: '2026-04-01', rating: 90 }),
    item({ id: 'c', rating: 80 }),
  ];
  assert.deepEqual(ids(sortEntries(input, 'finished', 'desc', 'en', title)), ['b', 'a', 'c']);
  assert.deepEqual(ids(sortEntries(input, 'rating', 'desc', 'en', title)), ['b', 'c', 'a']);
});

test('titles use the locale collation and numbers inside titles compare as numbers', () => {
  const input = [
    item({ id: '10', title: 'Part 10' }),
    item({ id: '2', title: 'Part 2' }),
    item({ id: 'b', title: 'banana' }),
    item({ id: 'A', title: 'Apple' }),
  ];
  assert.deepEqual(ids(sortEntries(input, 'title', 'asc', 'en', title)), ['A', 'b', '2', '10']);
  assert.deepEqual(ids(sortEntries(input, 'title', 'desc', 'en', title)), ['10', '2', 'b', 'A']);
});

test('the title comes from the supplied getter, so a localized title sorts as shown', () => {
  const input = [item({ id: 'x', title: 'Zeta' }), item({ id: 'y', title: 'Alpha' })];
  const reversed = (entry: VndbUserListEntry) => (entry.id === 'x' ? 'Aaa' : 'Zzz');
  assert.deepEqual(ids(sortEntries(input, 'title', 'asc', 'en', reversed)), ['x', 'y']);
});

test('ties keep their original order in both directions', () => {
  const input = [item({ id: 'a', vote: 80 }), item({ id: 'b', vote: 80 }), item({ id: 'c', vote: 80 })];
  assert.deepEqual(ids(sortEntries(input, 'myVote', 'desc', 'en', title)), ['a', 'b', 'c']);
  assert.deepEqual(ids(sortEntries(input, 'myVote', 'asc', 'en', title)), ['a', 'b', 'c']);
});

test('every sort key has a default direction', () => {
  for (const key of SORT_KEYS) assert.ok(DEFAULT_DIRECTION[key] === 'asc' || DEFAULT_DIRECTION[key] === 'desc');
  assert.equal(DEFAULT_DIRECTION.title, 'asc');
  assert.equal(DEFAULT_DIRECTION.updated, 'desc');
});
