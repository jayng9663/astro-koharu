import type { VndbStatus } from '@/lib/vndb/constants';

// VNDB Kana API type definitions — only the fields this site requests.
// API docs: https://api.vndb.org/kana

/** Average of the community's image-flagging votes, 0 (safe / tame) to 2 (explicit / brutal). */
export interface VndbImage {
  thumbnail: string;
  thumbnail_dims: [number, number];
  sexual: number;
  violence: number;
}

export interface VndbTitle {
  lang: string;
  title: string;
  official: boolean;
  main: boolean;
}

export interface VndbVisualNovel {
  /** Main title, romanized for non-Latin originals. */
  title: string;
  /** Title in the original script. */
  alttitle: string | null;
  olang: string;
  released: string | null;
  /** Community rating, 10-100. */
  rating: number | null;
  titles: VndbTitle[];
  image: VndbImage | null;
}

export interface VndbLabel {
  id: number;
  label: string;
}

export interface VndbUserListEntry {
  /** VN id, e.g. `v17`. */
  id: string;
  /** The user's own vote, 10-100. */
  vote: number | null;
  lastmod: number;
  /** When the entry joined the list, unix seconds. */
  added: number;
  /** The user's own reading dates (`YYYY-MM-DD`, or less precise), when set. */
  started: string | null;
  finished: string | null;
  labels: VndbLabel[];
  vn: VndbVisualNovel;
}

export interface VndbListResponse {
  more: boolean;
  results: VndbUserListEntry[];
}

export interface VndbProducer {
  id: string;
  name: string;
  /** Name in the original script, when it differs. */
  original: string | null;
}

export interface VndbExtLink {
  url: string;
  label: string;
  name: string;
}

export interface VndbTag {
  name: string;
  /** Average vote, 0-3. */
  rating: number;
  /** 0 = none, 1 = minor, 2 = major spoiler. */
  spoiler: number;
  lie: boolean;
  category: 'cont' | 'ero' | 'tech';
}

export interface VndbDetailTitle extends VndbTitle {
  latin: string | null;
}

/** A VN as returned by `/vn` when opened in the detail window. */
export interface VndbDetail {
  id: string;
  title: string;
  alttitle: string | null;
  olang: string;
  /** 0 = finished, 1 = in development, 2 = cancelled. */
  devstatus: number;
  released: string | null;
  languages: string[];
  platforms: string[];
  /** Play time category, 1 (very short) to 5 (very long). */
  length: number | null;
  /** Average play time from user votes. */
  length_minutes: number | null;
  length_votes: number;
  rating: number | null;
  votecount: number;
  description: string | null;
  image: { url: string; dims: [number, number] } | null;
  titles: VndbDetailTitle[];
  aliases: string[];
  developers: VndbProducer[];
  extlinks: VndbExtLink[];
  tags: VndbTag[];
}

export interface VndbDetailResult {
  vn: VndbDetail;
  publishers: VndbProducer[];
}

/** Totals of a user's own play-time votes. VNDB does not expose them per VN. */
export interface VndbUserStats {
  /** How many VNs the user has voted a play time for. */
  lengthVotes: number;
  /** Sum of those votes. */
  lengthMinutes: number;
}

/** A list entry together with its list status, as the shelf and the detail window handle it. */
export interface VndbShelfItem {
  entry: VndbUserListEntry;
  status: VndbStatus | null;
}
