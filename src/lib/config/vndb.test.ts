import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeVndbConfig, VNDB_DEFAULT_ICON } from './vndb';

test('an absent section or one without a user id disables the page', () => {
  assert.equal(normalizeVndbConfig(undefined), null);
  assert.equal(normalizeVndbConfig(null), null);
  assert.equal(normalizeVndbConfig({}), null);
  assert.equal(normalizeVndbConfig({ userId: '   ' }), null);
  assert.equal(normalizeVndbConfig({ userId: 225408 } as never), null);
});

test('defaults are applied per field', () => {
  assert.deepEqual(normalizeVndbConfig({ userId: ' u12345 ' }), {
    userId: 'u12345',
    label: undefined,
    icon: VNDB_DEFAULT_ICON,
    hideCoverAbove: 1.8,
  });
});

test('a custom label, icon and threshold are kept', () => {
  assert.deepEqual(normalizeVndbConfig({ userId: 'u1', label: 'VN Log', icon: 'ri:book-open-fill', hideCoverAbove: 1 }), {
    userId: 'u1',
    label: 'VN Log',
    icon: 'ri:book-open-fill',
    hideCoverAbove: 1,
  });
});

test('a threshold outside the 0-2 flag scale falls back to the default', () => {
  for (const hideCoverAbove of [-1, 2.5, Number.NaN, '1.8']) {
    assert.equal(normalizeVndbConfig({ userId: 'u1', hideCoverAbove: hideCoverAbove as never })?.hideCoverAbove, 1.8);
  }
});
