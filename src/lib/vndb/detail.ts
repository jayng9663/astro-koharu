import type { VndbDetail, VndbDetailTitle, VndbProducer, VndbTag } from '@/types/vndb';

/** A piece of a VNDB description: plain text or a link. */
export type DescriptionPart = { type: 'text'; text: string } | { type: 'link'; text: string; href: string };

/** Only http(s) URLs are ever linked, whatever VNDB's markup or external links contain. */
export function safeHttpUrl(value: string): string | null {
  if (!URL.canParse(value)) return null;
  const url = new URL(value);
  return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
}

const SPOILER_BLOCK = /\[spoiler\][\s\S]*?\[\/spoiler\]/gi;
const URL_TAG = /\[url=([^\]\s]+)\]([\s\S]*?)\[\/url\]/gi;
const FORMAT_TAG = /\[\/?(?:b|i|u|s|quote|code|raw|spoiler)\]/gi;

/**
 * Turn VNDB's BBCode-like description into safe parts.
 * Spoiler blocks are dropped (never revealed), [url] tags become links, other formatting tags are removed.
 */
export function parseDescription(source: string | null | undefined): DescriptionPart[] {
  if (!source) return [];
  const text = source.replace(SPOILER_BLOCK, '').replace(/\r\n?/g, '\n');
  const parts: DescriptionPart[] = [];
  const pushText = (chunk: string) => {
    const cleaned = chunk.replace(FORMAT_TAG, '');
    if (cleaned) parts.push({ type: 'text', text: cleaned });
  };
  let cursor = 0;
  for (const match of text.matchAll(URL_TAG)) {
    pushText(text.slice(cursor, match.index));
    const href = safeHttpUrl(match[1]);
    const label = match[2].replace(FORMAT_TAG, '');
    if (href && label) parts.push({ type: 'link', text: label, href });
    else pushText(match[2]);
    cursor = match.index + match[0].length;
  }
  pushText(text.slice(cursor));
  const first = parts[0];
  if (first?.type === 'text') first.text = first.text.trimStart();
  const last = parts.at(-1);
  if (last?.type === 'text') last.text = last.text.trimEnd();
  return parts.filter((part) => part.text.length > 0);
}

export interface PlayTime {
  unit: 'hours' | 'minutes';
  value: number;
}

/** Average play time from votes: whole minutes under an hour, otherwise hours to one decimal. */
export function formatPlayTime(minutes: number | null | undefined): PlayTime | null {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) return null;
  if (minutes < 60) return { unit: 'minutes', value: Math.round(minutes) };
  return { unit: 'hours', value: Math.round(minutes / 6) / 10 };
}

const MAX_TAGS = 14;

/** The most representative tags: no spoilers, no sexual-content tags, no disputed ones, best rated first. */
export function pickTags(tags: readonly VndbTag[] | null | undefined, limit = MAX_TAGS): VndbTag[] {
  return (tags ?? [])
    .filter((tag) => tag.spoiler === 0 && !tag.lie && tag.category !== 'ero')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

/** Publishers across all release entries, most frequent first, each once. */
export function collectPublishers(
  releases: ReadonlyArray<{ producers: ReadonlyArray<VndbProducer & { publisher: boolean }> }>,
  limit = 8,
): VndbProducer[] {
  const counts = new Map<string, { producer: VndbProducer; count: number }>();
  for (const release of releases) {
    for (const { publisher, id, name, original } of release.producers) {
      if (!publisher) continue;
      const producer: VndbProducer = { id, name, original };
      const known = counts.get(id);
      if (known) known.count += 1;
      else counts.set(id, { producer, count: 1 });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ producer }) => producer);
}

/** Official titles plus the main one: the main title first, then by language. */
export function listTitles(titles: readonly VndbDetailTitle[] | null | undefined): VndbDetailTitle[] {
  return (titles ?? [])
    .filter((entry) => entry.official || entry.main)
    .sort((a, b) => Number(b.main) - Number(a.main) || a.lang.localeCompare(b.lang));
}

/** VNDB language codes are lower-case (`pt-br`, `zh-hans`); BCP 47 wants `pt-BR`, `zh-Hans`. */
export function toLanguageTag(code: string): string {
  const [language, ...rest] = code.split('-');
  return [
    language.toLowerCase(),
    ...rest.map((part) =>
      part.length === 2 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
    ),
  ].join('-');
}

/** The page for an external link, or null when its URL is not http(s). */
export function listExternalLinks(links: VndbDetail['extlinks'] | null | undefined): Array<{ label: string; href: string }> {
  return (links ?? []).flatMap((link) => {
    const href = safeHttpUrl(link.url);
    return href ? [{ label: link.label, href }] : [];
  });
}
