import assert from 'node:assert/strict';
import test from 'node:test';
import type { VndbImage } from '@/types/vndb';
import { DEFAULT_COVER_HIDE_THRESHOLD } from './constants';
import { formatScore, getDisplayTitle, getEntryStatus, isBlacklisted, shouldHideCover, vndbUrl } from './utils';

const image = (sexual: number, violence: number): VndbImage => ({
  thumbnail: 'https://t.vndb.org/x.jpg',
  thumbnail_dims: [256, 384],
  sexual,
  violence,
});
const label = (id: number) => ({ id, label: `label-${id}` });

test('covers at or below the threshold are shown, strictly above are hidden', () => {
  assert.equal(shouldHideCover(image(0, 0), DEFAULT_COVER_HIDE_THRESHOLD), false);
  assert.equal(shouldHideCover(image(1.8, 0), DEFAULT_COVER_HIDE_THRESHOLD), false);
  assert.equal(shouldHideCover(image(1.81, 0), DEFAULT_COVER_HIDE_THRESHOLD), true);
  assert.equal(shouldHideCover(image(2, 0), DEFAULT_COVER_HIDE_THRESHOLD), true);
});

test('either the sexual or the violence flag can hide a cover', () => {
  assert.equal(shouldHideCover(image(0, 1.9), DEFAULT_COVER_HIDE_THRESHOLD), true);
  assert.equal(shouldHideCover(image(1.1, 1.8), DEFAULT_COVER_HIDE_THRESHOLD), false);
  assert.equal(shouldHideCover(image(1.9, 1.9), DEFAULT_COVER_HIDE_THRESHOLD), true);
});

test('the threshold is a parameter', () => {
  assert.equal(shouldHideCover(image(1, 0), 0.5), true);
  assert.equal(shouldHideCover(image(1, 0), 1), false);
});

test('a VN without an image has nothing to hide, an image with unreadable flags fails closed', () => {
  assert.equal(shouldHideCover(null, DEFAULT_COVER_HIDE_THRESHOLD), false);
  assert.equal(shouldHideCover(undefined, DEFAULT_COVER_HIDE_THRESHOLD), false);
  assert.equal(shouldHideCover({ ...image(0, 0), sexual: undefined } as never, DEFAULT_COVER_HIDE_THRESHOLD), true);
  assert.equal(shouldHideCover({ ...image(0, 0), violence: Number.NaN }, DEFAULT_COVER_HIDE_THRESHOLD), true);
});

test('the status is the lowest built-in label id; Voted and custom labels carry no status', () => {
  assert.equal(getEntryStatus([label(2), label(7)]), 'finished');
  assert.equal(getEntryStatus([label(2), label(1)]), 'playing');
  assert.equal(getEntryStatus([label(5)]), 'wishlist');
  assert.equal(getEntryStatus([label(7)]), null);
  assert.equal(getEntryStatus([label(13)]), null);
  assert.equal(getEntryStatus([]), null);
});

test('only label 6 blacklists an entry', () => {
  assert.equal(isBlacklisted([label(6)]), true);
  assert.equal(isBlacklisted([label(1), label(7)]), false);
});

const vn = {
  title: 'Higurashi no Naku Koro ni',
  alttitle: 'ひぐらしのなく頃に',
  titles: [
    { lang: 'en', title: 'Higurashi When They Cry', official: true, main: false },
    { lang: 'zh-Hans', title: '寒蝉鸣泣之时', official: false, main: false },
    { lang: 'zh-Hant', title: '暮蟬鳴泣時', official: true, main: false },
  ],
};

test('English shows the main title', () => {
  assert.equal(getDisplayTitle(vn, 'en'), 'Higurashi no Naku Koro ni');
});

test('zh-tw prefers an official Traditional title, zh an official Simplified one', () => {
  assert.equal(getDisplayTitle(vn, 'zh-tw'), '暮蟬鳴泣時');
  const onlyHans = { ...vn, titles: [{ lang: 'zh-Hans', title: '寒蝉鸣泣之时', official: true, main: false }] };
  assert.equal(getDisplayTitle(onlyHans, 'zh'), '寒蝉鸣泣之时');
  assert.equal(getDisplayTitle(onlyHans, 'zh-tw'), '寒蝉鸣泣之时');
});

test('unofficial translations are skipped in favour of the original-script title', () => {
  const unofficial = { ...vn, titles: [{ lang: 'zh-Hans', title: '寒蝉鸣泣之时', official: false, main: false }] };
  assert.equal(getDisplayTitle(unofficial, 'zh'), 'ひぐらしのなく頃に');
  assert.equal(getDisplayTitle({ ...unofficial, alttitle: null }, 'zh-tw'), 'Higurashi no Naku Koro ni');
});

test('scores are shown on a 10-point scale with one decimal', () => {
  assert.equal(formatScore(90), '9.0');
  assert.equal(formatScore(79.7), '8.0');
  assert.equal(formatScore(62.5), '6.3');
});

test('entries link to their VNDB page', () => {
  assert.equal(vndbUrl('v67'), 'https://vndb.org/v67');
});
