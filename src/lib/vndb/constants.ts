export const VNDB_API_BASE = 'https://api.vndb.org/kana';
export const VNDB_SITE_BASE = 'https://vndb.org';

export const ITEMS_PER_PAGE = 24;
/** The API caps `results` at 100 per request. */
export const API_PAGE_SIZE = 100;
export const MAX_API_PAGES = 20;

/** Covers whose average sexual or violence flag exceeds this (scale 0-2) are not displayed. */
export const DEFAULT_COVER_HIDE_THRESHOLD = 1.8;

const STATUS_KEYS = ['playing', 'finished', 'stalled', 'dropped', 'wishlist'] as const;
export type VndbStatus = (typeof STATUS_KEYS)[number];

/** VNDB's built-in list labels. Lower id wins when an entry carries several (a replay is `Playing` + `Finished`). */
export const STATUS_BY_LABEL_ID: Readonly<Record<number, VndbStatus>> = {
  1: 'playing',
  2: 'finished',
  3: 'stalled',
  4: 'dropped',
  5: 'wishlist',
};
export const BLACKLIST_LABEL_ID = 6;

export const LIST_FIELDS = [
  'id',
  'vote',
  'lastmod',
  'added',
  'started',
  'finished',
  'labels{id,label}',
  'vn{title,alttitle,olang,released,rating,titles{lang,title,official,main},image{thumbnail,thumbnail_dims,sexual,violence}}',
].join(', ');

export const DETAIL_FIELDS = [
  'title',
  'alttitle',
  'olang',
  'devstatus',
  'released',
  'languages',
  'platforms',
  'length',
  'length_minutes',
  'length_votes',
  'rating',
  'votecount',
  'description',
  'image{url,dims}',
  'titles{lang,title,latin,official,main}',
  'aliases',
  'developers{id,name,original}',
  'extlinks{url,label,name}',
  'tags{name,rating,spoiler,lie,category}',
].join(', ');

export const RELEASE_FIELDS = 'producers{id,name,original,developer,publisher}';
export const MAX_RELEASE_PAGES = 5;
