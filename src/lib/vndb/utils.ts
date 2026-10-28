import type { VndbImage, VndbLabel, VndbVisualNovel } from '@/types/vndb';
import { BLACKLIST_LABEL_ID, STATUS_BY_LABEL_ID, VNDB_SITE_BASE, type VndbStatus } from './constants';

/**
 * Whether a cover must not be shown.
 *
 * Fails closed: an image whose flag averages are missing or not numeric is hidden,
 * since the rule cannot be evaluated. A VN without any image has nothing to hide.
 */
export function shouldHideCover(image: VndbImage | null | undefined, threshold: number): boolean {
  if (!image) return false;
  const { sexual, violence } = image;
  if (typeof sexual !== 'number' || typeof violence !== 'number' || Number.isNaN(sexual) || Number.isNaN(violence)) return true;
  return sexual > threshold || violence > threshold;
}

/** The list status of an entry, or null when it only carries other labels (e.g. just `Voted`). */
export function getEntryStatus(labels: readonly VndbLabel[]): VndbStatus | null {
  const ids = labels.map((label) => label.id).filter((id) => id in STATUS_BY_LABEL_ID);
  return ids.length > 0 ? STATUS_BY_LABEL_ID[Math.min(...ids)] : null;
}

export function isBlacklisted(labels: readonly VndbLabel[]): boolean {
  return labels.some((label) => label.id === BLACKLIST_LABEL_ID);
}

/** Official title languages tried for a site locale, most specific first. English keeps VNDB's main title. */
const LOCALE_TITLE_LANGS: Readonly<Record<string, readonly string[]>> = {
  'zh-tw': ['zh-Hant', 'zh-Hans'],
  zh: ['zh-Hans', 'zh-Hant'],
  ja: ['ja'],
  ko: ['ko'],
};

/** Title shown for a locale: an official translation if VNDB has one, else the original-script title, else the main title. */
export function getDisplayTitle(vn: Pick<VndbVisualNovel, 'title' | 'alttitle' | 'titles'>, locale: string): string {
  const langs = LOCALE_TITLE_LANGS[locale.toLowerCase()];
  if (!langs) return vn.title;
  for (const lang of langs) {
    const match = vn.titles?.find((entry) => entry.lang === lang && entry.official);
    if (match) return match.title;
  }
  return vn.alttitle || vn.title;
}

/** VNDB scores are 10-100; show them on the familiar 10-point scale. */
export function formatScore(score: number): string {
  return (score / 10).toFixed(1);
}

export function vndbUrl(id: string): string {
  return `${VNDB_SITE_BASE}/${id}`;
}
