import type {
  VndbDetail,
  VndbDetailResult,
  VndbListResponse,
  VndbProducer,
  VndbUserListEntry,
  VndbUserStats,
} from '@/types/vndb';
import {
  API_PAGE_SIZE,
  DETAIL_FIELDS,
  LIST_FIELDS,
  MAX_API_PAGES,
  MAX_RELEASE_PAGES,
  RELEASE_FIELDS,
  VNDB_API_BASE,
} from './constants';
import { collectPublishers } from './detail';
import { isBlacklisted } from './utils';

type Fetcher = typeof fetch;

const USER_ID_PATTERN = /^u\d+$/;

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`VNDB API error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

/** Accepts a VNDB user id (`u12345`) as-is; resolves a username to its id. */
export async function resolveUserId(user: string, request: Fetcher = fetch): Promise<string> {
  if (USER_ID_PATTERN.test(user)) return user;
  const url = `${VNDB_API_BASE}/user?q=${encodeURIComponent(user)}`;
  const found = await readJson<Record<string, { id: string } | null>>(await request(url));
  const id = found[user]?.id;
  if (!id) throw new Error(`VNDB user not found: ${user}`);
  return id;
}

async function fetchListPage(userId: string, page: number, request: Fetcher, signal?: AbortSignal): Promise<VndbListResponse> {
  const res = await request(`${VNDB_API_BASE}/ulist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: userId,
      fields: LIST_FIELDS,
      sort: 'lastmod',
      reverse: true,
      results: API_PAGE_SIZE,
      page,
    }),
    signal,
  });
  return readJson<VndbListResponse>(res);
}

/**
 * A user's whole public list, newest change first, without blacklisted entries.
 * Pages are requested one after another because the API only says whether `more` follows.
 */
export async function fetchUserList(
  user: string,
  request: Fetcher = fetch,
  signal?: AbortSignal,
): Promise<VndbUserListEntry[]> {
  const userId = await resolveUserId(user, request);
  const entries: VndbUserListEntry[] = [];
  for (let page = 1; page <= MAX_API_PAGES; page += 1) {
    const { results, more } = await fetchListPage(userId, page, request, signal);
    entries.push(...results);
    if (!more) break;
  }
  return entries.filter((entry) => !isBlacklisted(entry.labels));
}

async function post<T>(path: string, body: unknown, request: Fetcher, signal?: AbortSignal): Promise<T> {
  const res = await request(`${VNDB_API_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  return readJson<T>(res);
}

async function fetchPublishers(id: string, request: Fetcher, signal?: AbortSignal): Promise<VndbProducer[]> {
  const releases: Array<{ producers: Array<VndbProducer & { publisher: boolean }> }> = [];
  for (let page = 1; page <= MAX_RELEASE_PAGES; page += 1) {
    const body = await post<{ more: boolean; results: typeof releases }>(
      'release',
      {
        filters: ['and', ['vn', '=', ['id', '=', id]], ['official', '=', 1]],
        fields: RELEASE_FIELDS,
        results: API_PAGE_SIZE,
        page,
      },
      request,
      signal,
    );
    releases.push(...body.results);
    if (!body.more) break;
  }
  return collectPublishers(releases);
}

/** Everything the detail window shows: the VN itself and, from its releases, its publishers. */
export async function fetchVnDetail(id: string, request: Fetcher = fetch, signal?: AbortSignal): Promise<VndbDetailResult> {
  const [vnBody, publishers] = await Promise.all([
    post<{ results: VndbDetail[] }>('vn', { filters: ['id', '=', id], fields: DETAIL_FIELDS }, request, signal),
    fetchPublishers(id, request, signal),
  ]);
  const vn = vnBody.results[0];
  if (!vn) throw new Error(`VNDB entry not found: ${id}`);
  return { vn, publishers };
}

/**
 * Totals of the user's own play-time votes. VNDB exposes only these two numbers, not the vote per VN.
 * Null when the user has voted no play times.
 */
export async function fetchUserStats(
  user: string,
  request: Fetcher = fetch,
  signal?: AbortSignal,
): Promise<VndbUserStats | null> {
  const url = `${VNDB_API_BASE}/user?q=${encodeURIComponent(user)}&fields=lengthvotes,lengthvotes_sum`;
  const found = await readJson<Record<string, { lengthvotes?: number; lengthvotes_sum?: number } | null>>(
    await request(url, { signal }),
  );
  const stats = found[user];
  if (!stats?.lengthvotes || !stats.lengthvotes_sum) return null;
  return { lengthVotes: stats.lengthvotes, lengthMinutes: stats.lengthvotes_sum };
}
