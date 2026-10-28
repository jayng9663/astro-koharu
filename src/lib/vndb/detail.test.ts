import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectPublishers,
  formatPlayTime,
  listExternalLinks,
  listTitles,
  parseDescription,
  pickTags,
  safeHttpUrl,
  toLanguageTag,
} from './detail';

test('only http(s) URLs are linkable', () => {
  assert.equal(safeHttpUrl('https://vndb.org/v1'), 'https://vndb.org/v1');
  assert.equal(safeHttpUrl('http://example.com'), 'http://example.com/');
  assert.equal(safeHttpUrl('javascript:alert(1)'), null);
  assert.equal(safeHttpUrl('data:text/html,x'), null);
  assert.equal(safeHttpUrl('not a url'), null);
});

test('descriptions keep text and turn [url] tags into links', () => {
  assert.deepEqual(parseDescription('A story.\n\n[From [url=http://en.wikipedia.org/wiki/X]Wikipedia[/url]]'), [
    { type: 'text', text: 'A story.\n\n[From ' },
    { type: 'link', text: 'Wikipedia', href: 'http://en.wikipedia.org/wiki/X' },
    { type: 'text', text: ']' },
  ]);
});

test('spoiler blocks are removed, including when several appear', () => {
  const parts = parseDescription('Start [spoiler]he dies[/spoiler] middle [SPOILER]so does she[/SPOILER] end');
  assert.deepEqual(parts, [{ type: 'text', text: 'Start  middle  end' }]);
});

test('formatting tags are stripped and unsafe link targets lose their link', () => {
  assert.deepEqual(parseDescription('[b]Bold[/b] [i]it[/i]'), [{ type: 'text', text: 'Bold it' }]);
  assert.deepEqual(parseDescription('[url=javascript:alert(1)]click[/url]'), [{ type: 'text', text: 'click' }]);
});

test('empty or missing descriptions yield no parts', () => {
  assert.deepEqual(parseDescription(null), []);
  assert.deepEqual(parseDescription(undefined), []);
  assert.deepEqual(parseDescription('   '), []);
  assert.deepEqual(parseDescription('[spoiler]only[/spoiler]'), []);
});

test('play time is minutes below an hour and hours with one decimal above', () => {
  assert.deepEqual(formatPlayTime(45), { unit: 'minutes', value: 45 });
  assert.deepEqual(formatPlayTime(3000), { unit: 'hours', value: 50 });
  assert.deepEqual(formatPlayTime(270), { unit: 'hours', value: 4.5 });
  assert.equal(formatPlayTime(0), null);
  assert.equal(formatPlayTime(null), null);
  assert.equal(formatPlayTime(Number.NaN), null);
});

const tag = (name: string, rating: number, spoiler = 0, category: 'cont' | 'ero' | 'tech' = 'cont', lie = false) => ({
  name,
  rating,
  spoiler,
  category,
  lie,
});

test('tags exclude spoilers, sexual content and disputed tags, best rated first', () => {
  const picked = pickTags([
    tag('Low', 1),
    tag('Top', 2.9),
    tag('Spoiler', 3, 1),
    tag('Lewd', 3, 0, 'ero'),
    tag('Lie', 3, 0, 'cont', true),
    tag('NVL', 2, 0, 'tech'),
  ]);
  assert.deepEqual(
    picked.map((entry) => entry.name),
    ['Top', 'NVL', 'Low'],
  );
});

test('the tag limit applies and missing tags are fine', () => {
  const many = Array.from({ length: 30 }, (_, i) => tag(`t${i}`, i / 10));
  assert.equal(pickTags(many).length, 14);
  assert.equal(pickTags(many, 3).length, 3);
  assert.deepEqual(pickTags(null), []);
});

const producer = (id: string, publisher: boolean) => ({ id, name: `name-${id}`, original: null, developer: false, publisher });

test('publishers are deduplicated, most frequent first, and developers-only entries skipped', () => {
  const result = collectPublishers([
    { producers: [producer('p1', true), producer('p2', true), producer('p3', false)] },
    { producers: [producer('p2', true)] },
    { producers: [producer('p2', true), producer('p1', true)] },
  ]);
  assert.deepEqual(
    result.map((entry) => entry.id),
    ['p2', 'p1'],
  );
  assert.deepEqual(Object.keys(result[0]).sort(), ['id', 'name', 'original']);
});

test('the publisher limit applies', () => {
  const releases = [{ producers: Array.from({ length: 12 }, (_, i) => producer(`p${i}`, true)) }];
  assert.equal(collectPublishers(releases).length, 8);
  assert.equal(collectPublishers(releases, 2).length, 2);
});

const title = (lang: string, text: string, official: boolean, main: boolean) => ({
  lang,
  title: text,
  latin: null,
  official,
  main,
});

test('titles list the main title first, then official ones by language, skipping unofficial', () => {
  const listed = listTitles([
    title('zh-Hans', 'c', false, false),
    title('ja', 'b', true, true),
    title('en', 'a', true, false),
    title('fr', 'd', true, false),
  ]);
  assert.deepEqual(
    listed.map((entry) => entry.lang),
    ['ja', 'en', 'fr'],
  );
  assert.deepEqual(listTitles(undefined), []);
});

test('VNDB language codes become BCP 47 tags', () => {
  assert.equal(toLanguageTag('ja'), 'ja');
  assert.equal(toLanguageTag('pt-br'), 'pt-BR');
  assert.equal(toLanguageTag('zh-hans'), 'zh-Hans');
  assert.equal(toLanguageTag('zh-Hant'), 'zh-Hant');
});

test('external links with non-http(s) URLs are dropped', () => {
  assert.deepEqual(
    listExternalLinks([
      { url: 'https://store.steampowered.com/app/1', label: 'Steam', name: 'steam' },
      { url: 'javascript:alert(1)', label: 'Bad', name: 'bad' },
    ]),
    [{ label: 'Steam', href: 'https://store.steampowered.com/app/1' }],
  );
  assert.deepEqual(listExternalLinks(undefined), []);
});
