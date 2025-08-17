// apps/bot/discord/styles/embed-colors.ts
// Theme-aware Discord embed color helpers (per-guild)
// Reads named themes from configs/tokens/palette.json and supports both role-based and tone-based colors.

import palette from '../../../../configs/tokens/palette.json';

// ---- Types ----
export type RoleKey = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
export type EmbedTone = 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'critical' | 'neutral';
export type EventStatus = 'Draft' | 'Scheduled' | 'Live' | 'Completed' | 'Cancelled';

// ---- Internal helpers ----
const P: any = palette as any;
const DEFAULT_THEME_KEY: string = P?.defaults?.theme ?? 'default';

function pickTheme(themeKey?: string): any {
  const themes = P?.themes;
  if (themes && typeof themes === 'object') {
    return themes[themeKey ?? DEFAULT_THEME_KEY] ?? themes[DEFAULT_THEME_KEY] ?? themes[Object.keys(themes)[0]];
  }
  // Legacy fallback (no themes): synthesize a theme-like shape from legacy fields
  return {
    brand: P.brand,
    semantic: P.semantic,
    roles: { neutral: P.neutral },
  };
}

function normalizeHex(v?: string): `#${string}` {
  if (!v) return '#5865F2'; // Discord blurple fallback
  const s = String(v).trim();
  return (s.startsWith('#') ? s : (`#${s}`)) as `#${string}`;
}

function roleShadeHex(theme: any, role: RoleKey, shade = '500'): `#${string}` {
  // Prefer explicit roles scale, then semantic fallback, then brand.primary
  const hex =
    theme?.roles?.[role]?.[shade] ||
    theme?.semantic?.[role]?.hex ||
    theme?.brand?.primary?.hex ||
    '#5865F2';
  return normalizeHex(hex);
}

function toneHex(theme: any, tone: EmbedTone): `#${string}` {
  switch (tone) {
    case 'brand':
      return normalizeHex(theme?.brand?.primary?.hex ?? theme?.roles?.primary?.['600'] ?? '#4F46E5');
    case 'info':
      return normalizeHex(theme?.semantic?.info?.hex ?? theme?.roles?.primary?.['400'] ?? '#0EA5E9');
    case 'success':
      return normalizeHex(theme?.semantic?.success?.hex ?? theme?.roles?.success?.['500'] ?? '#16A34A');
    case 'warning':
      return normalizeHex(theme?.semantic?.warning?.hex ?? theme?.roles?.warning?.['500'] ?? '#F59E0B');
    case 'danger':
      return normalizeHex(theme?.semantic?.danger?.hex ?? theme?.roles?.danger?.['600'] ?? '#EF4444');
    case 'critical':
      return normalizeHex(theme?.semantic?.critical?.hex ?? theme?.roles?.danger?.['700'] ?? '#991B1B');
    case 'neutral':
    default:
      return normalizeHex(theme?.semantic?.neutral?.hex ?? theme?.roles?.neutral?.['500'] ?? '#64748B');
  }
}

/** Convert a hex color like #RRGGBB to the Discord embed integer */
export function hexToInt(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Invalid hex: ${hex}`);
  return parseInt(m[1], 16);
}

// ---- Public API (role-based) ----

/**
 * Role-based color for embeds (theme-aware).
 * Example: embedColorFor('midnight','warning','600')
 */
export function embedColorFor(themeKey: string, role: RoleKey, shade: string = '500'): number {
  const theme = pickTheme(themeKey);
  return hexToInt(roleShadeHex(theme, role, shade));
}

// ---- Public API (tone & status) ----

/** Map event status → tone (kept from legacy API) */
export const toneForEventStatus: Record<EventStatus, EmbedTone> = {
  Draft: 'neutral',
  Scheduled: 'info',
  Live: 'brand',
  Completed: 'success',
  Cancelled: 'danger',
};

/** Theme-aware tone → integer color */
export function colorFromToneWithTheme(themeKey: string, tone: EmbedTone): number {
  const theme = pickTheme(themeKey);
  return hexToInt(toneHex(theme, tone));
}

/** Theme-aware event status → integer color */
export function colorFromEventStatusWithTheme(themeKey: string, status: EventStatus): number {
  return colorFromToneWithTheme(themeKey, toneForEventStatus[status]);
}

// ---- Back-compat (default theme constants & helpers) ----
// These mirror the previous static exports, now sourced from the default theme so older imports continue to work.

const DEFAULT_THEME = pickTheme(DEFAULT_THEME_KEY);

/** Default-theme HEX per tone (for legacy callers) */
export const HEX: Record<EmbedTone, `#${string}`> = {
  brand: toneHex(DEFAULT_THEME, 'brand'),
  info: toneHex(DEFAULT_THEME, 'info'),
  success: toneHex(DEFAULT_THEME, 'success'),
  warning: toneHex(DEFAULT_THEME, 'warning'),
  danger: toneHex(DEFAULT_THEME, 'danger'),
  critical: toneHex(DEFAULT_THEME, 'critical'),
  neutral: toneHex(DEFAULT_THEME, 'neutral'),
} as const;

/** Default-theme INT per tone (for legacy callers) */
export const INT: Record<EmbedTone, number> = Object.fromEntries(
  (Object.entries(HEX) as [EmbedTone, `#${string}`][]).map(([k, v]) => [k, hexToInt(v)])
) as Record<EmbedTone, number>;

/** Legacy helper: tone → int, using default theme */
export function colorFromTone(tone: EmbedTone): number {
  return INT[tone];
}

/** Legacy helper: status → int, using default theme */
export function colorFromEventStatus(status: EventStatus): number {
  return colorFromTone(toneForEventStatus[status]);
}

/** Example:
 * const color = embedColorFor('midnight','warning'); // theme-aware int
 * const color2 = colorFromEventStatusWithTheme('default','Live'); // theme-aware via tone
 */