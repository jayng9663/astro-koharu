/**
 * VNDB tracking page configuration normalization.
 *
 * The page is opt-in: an absent section, or one without a usable `userId`, yields null.
 */

import { DEFAULT_COVER_HIDE_THRESHOLD } from '../vndb/constants';
import type { VndbConfig } from './types';

export const VNDB_DEFAULT_ICON = 'ri:gamepad-fill';

export interface ResolvedVndbConfig {
  /** VNDB user id (`u123`) or username. */
  userId: string;
  /** Navigation display name; the i18n key `nav.vndb` is used when absent. */
  label?: string;
  icon: string;
  /** Covers whose sexual or violence flag average (0-2) exceeds this are hidden. */
  hideCoverAbove: number;
}

export function normalizeVndbConfig(raw?: Partial<VndbConfig> | null): ResolvedVndbConfig | null {
  const source = (raw ?? {}) as Record<string, unknown>;
  const userId = typeof source.userId === 'string' ? source.userId.trim() : '';
  if (!userId) return null;
  const label = typeof source.label === 'string' && source.label.trim() ? source.label.trim() : undefined;
  const icon = typeof source.icon === 'string' && source.icon.trim() ? source.icon.trim() : VNDB_DEFAULT_ICON;
  const threshold = source.hideCoverAbove;
  const hideCoverAbove =
    typeof threshold === 'number' && Number.isFinite(threshold) && threshold >= 0 && threshold <= 2
      ? threshold
      : DEFAULT_COVER_HIDE_THRESHOLD;
  return { userId, label, icon, hideCoverAbove };
}
