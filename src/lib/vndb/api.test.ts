import assert from 'node:assert/strict';
import test from 'node:test';
import type { VndbUserListEntry } from '@/types/vndb';
import { fetchUserList, fetchUserStats, fetchVnDetail, resolveUserId } from './api';

const entry = (id: string, labelIds: number[]): VndbUserListEntry => ({
  id,
  vote: null,
  lastmod: 0,
  added: 0,
  started: null,
  finished: null,
  labels: labelIds.map((labelId) => ({ id: labelId, label: `label-${labelId}` })),
  vn: { title: id, alttitle: null, olang: 'ja', released: null, rating: null, titles: [], image: null },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, statusText: status === 200 ? 'OK' : 'Error' });

test('a user id is used as-is without a lookup', async () => {
  const request: typeof fetch = async () => assert.fail('no request expected');
  assert.equal(await resolveUserId('u12345', request), 'u12345');
});

test('a username is resolved through the user endpoint', async () => {
  const urls: string[] = [];
  const request: typeof fetch = async (input) => {
    urls.push(String(input));
    return json({ example_user: { id: 'u12345', username: 'example_user' } });
  };
  assert.equal(await resolveUserId('example_user', request), 'u12345');
  assert.deepEqual(urls, ['https://api.vndb.org/kana/user?q=example_user']);
});

test('an unknown username is an error', async () => {
  const request: typeof fetch = async () => json({ nobody: null });
  await assert.rejects(resolveUserId('nobody', request), /not found/);
});

test('pages are followed while the API reports more, and blacklisted entries are dropped', async () => {
  const bodies: Array<{ user: string; page: number; results: number }> = [];
  const request: typeof fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    bodies.push({ user: body.user, page: body.page, results: body.results });
    return body.page === 1
      ? json({ more: true, results: [entry('v1', [2]), entry('v2', [6])] })
      : json({ more: false, results: [entry('v3', [5, 7])] });
  };
  const list = await fetchUserList('u1', request);
  assert.deepEqual(
    list.map((e) => e.id),
    ['v1', 'v3'],
  );
  assert.deepEqual(bodies, [
    { user: 'u1', page: 1, results: 100 },
    { user: 'u1', page: 2, results: 100 },
  ]);
});

test('the image flag fields are requested', async () => {
  let fields = '';
  const request: typeof fetch = async (_input, init) => {
    fields = JSON.parse(String(init?.body)).fields;
    return json({ more: false, results: [] });
  };
  await fetchUserList('u1', request);
  assert.match(fields, /sexual/);
  assert.match(fields, /violence/);
});

test('an HTTP error surfaces as an error', async () => {
  const request: typeof fetch = async () => json({}, 429);
  await assert.rejects(fetchUserList('u1', request), /429/);
});

test('the detail window combines the VN with the publishers found in its official releases', async () => {
  const calls: Array<{ path: string; body: Record<string, unknown> }> = [];
  const request: typeof fetch = async (input, init) => {
    const body = JSON.parse(String(init?.body));
    calls.push({ path: String(input).replace('https://api.vndb.org/kana/', ''), body });
    if (String(input).endsWith('/vn')) return json({ results: [{ id: 'v67', title: 'Higurashi' }] });
    return json({
      more: false,
      results: [{ producers: [{ id: 'p1', name: 'MangaGamer', original: null, developer: false, publisher: true }] }],
    });
  };
  const result = await fetchVnDetail('v67', request);
  assert.equal(result.vn.id, 'v67');
  assert.deepEqual(result.publishers, [{ id: 'p1', name: 'MangaGamer', original: null }]);
  assert.deepEqual(calls.map((call) => call.path).sort(), ['release', 'vn']);
  assert.deepEqual(calls.find((call) => call.path === 'vn')?.body.filters, ['id', '=', 'v67']);
});

test('an unknown VN id is an error', async () => {
  const request: typeof fetch = async (input) =>
    String(input).endsWith('/vn') ? json({ results: [] }) : json({ more: false, results: [] });
  await assert.rejects(fetchVnDetail('v0', request), /not found/);
});

test('release pages are followed for publishers', async () => {
  const pages: number[] = [];
  const request: typeof fetch = async (input, init) => {
    if (String(input).endsWith('/vn')) return json({ results: [{ id: 'v1' }] });
    const { page } = JSON.parse(String(init?.body));
    pages.push(page);
    return json({ more: page < 2, results: [] });
  };
  await fetchVnDetail('v1', request);
  assert.deepEqual(pages, [1, 2]);
});

test('the play-time totals come from the user endpoint', async () => {
  let url = '';
  const request: typeof fetch = async (input) => {
    url = String(input);
    return json({ u1: { id: 'u1', lengthvotes: 40, lengthvotes_sum: 58957 } });
  };
  assert.deepEqual(await fetchUserStats('u1', request), { lengthVotes: 40, lengthMinutes: 58957 });
  assert.match(url, /fields=lengthvotes,lengthvotes_sum/);
});

test('a user without play-time votes, or an unknown user, has no totals', async () => {
  assert.equal(await fetchUserStats('u1', async () => json({ u1: { id: 'u1', lengthvotes: 0, lengthvotes_sum: 0 } })), null);
  assert.equal(await fetchUserStats('u1', async () => json({ u1: null })), null);
});
