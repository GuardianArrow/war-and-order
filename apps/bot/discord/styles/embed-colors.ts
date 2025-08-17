// apps/bot/discord/styles/embed-colors.ts
// Theme-aware Discord embed color helpers (per-guild).
// Reads named themes from configs/tokens/palette.json and supports both role-based and tone-based colors.
// Also supports per-guild overrides like { "--role-primary-500": "#123456" }.

import palette from '../../../../configs/tokens/palette.json';

// ---------- Types ----------
export type RoleKey = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
export type EmbedTone = 'brand' | 'info' | 'success' | 'warning' | 'danger' | 'critical' | 'neutral';
export type EventStatus = 'Draft' | 'Scheduled' | 'Live' | 'Completed' | 'Cancelled';

// Per-guild token overrides: CSS var name → hex string
export type TokenOverrideMap = Partial<Record<string, string>>;

// ---------- Internals ----------
const P: any = palette as any;
const DEFAULT_THEME_KEY: string = P?.defaults?.theme ?? 'default';

function pickTheme(themeKey?: string): any {
  const themes = P?.themes;
  if (themes && typeof themes === 'object') {
    // explicit key → default → first available
    return themes[themeKey ?? DEFAULT_THEME_KEY] ?? themes[DEFAULT_THEME_KEY] ?? themes[Object.keys(themes)[0]];
  }
  // Legacy fallback (single palette structure)
  return {
    brand: P.brand,
    semantic: P.semantic,
    roles: {
      primary: P.brand?.primary ? expandSingle(P.brand.primary) : undefined,
      success: P.semantic?.success ? expandSingle(P.semantic.success) : undefined,
      warning: P.semantic?.warning ? expandSingle(P.semantic.warning) : undefined,
      danger:  P.semantic?.danger  ? expandSingle(P.semantic.danger)  : undefined,
      neutral: P.neutral
    }
  };
}

/** If given a single {hex|hsl}, synthesize a scale object with a '500' entry. */
function expandSingle(obj: any) {
  if (!obj) return undefined;
  const hex = obj.hex ?? obj['500'];
  return hex ? { '500': hex } : undefined;
}

function normalizeHex(v?: string): `#${string}` {
  if (!v) return '#5865F2'; // Discord blurple fallback
  const s = String(v).trim();
  return (s.startsWith('#') ? s : (`#${s}`)) as `#${string}`;
}

function roleShadeKey(role: RoleKey, shade: string) {
  return `--role-${role}-${shade}`;
}

function fromOverrides(
  overrides: TokenOverrideMap | undefined,
  role: RoleKey,
  shade: string
): `#${string}` | undefined {
  if (!overrides) return undefined;
  const raw = overrides[roleShadeKey(role, shade)];
  if (!raw) return undefined;
  return normalizeHex(String(raw));
}

function fromTheme(theme: any, role: RoleKey, shade: string): `#${string}` {
  // Prefer roles scale; accept top-level role scales as well; fall back to semantic or brand primary
  const hex =
    theme?.roles?.[role]?.[shade] ||
    theme?.[role]?.[shade] ||
    theme?.semantic?.[role]?.hex ||
    theme?.brand?.primary?.hex ||
    '#5865F2';
  return normalizeHex(hex);
}

/** Convert a hex color like #RRGGBB to the Discord embed integer */
export function hexToInt(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Invalid hex: ${hex}`);
  return parseInt(m[1], 16);
}

// ---------- Public API (role-based) ----------

/**
 * Role-based color for embeds (theme-aware, override-aware).
 * Example: embedColorFor('midnight','warning','600', overrides)
 */
export function embedColorFor(
  themeKey: string,
  role: RoleKey,
  shade: string = '500',
  overrides?: TokenOverrideMap
): number {
  const theme = pickTheme(themeKey);
  const hex = fromOverrides(overrides, role, shade) ?? fromTheme(theme, role, shade);
  return hexToInt(hex);
}

// ---------- Tone & status helpers ----------

/** Map event status → tone (kept from legacy API) */
export const toneForEventStatus: Record<EventStatus, EmbedTone> = {
  Draft: 'neutral',
  Scheduled: 'info',
  Live: 'brand',
  Completed: 'success',
  Cancelled: 'danger',
};

// Small mapping from tone → (role, preferred shade) with sensible fallbacks.
function toneToRole(tone: EmbedTone): { role: RoleKey; shade: string; fallback?: `#${string}` } {
  switch (tone) {
    case 'brand':   return { role: 'primary', shade: '600', fallback: '#4F46E5' };
    case 'info':    // not a role; approximate using primary-400 if semantic not present
      return { role: 'primary', shade: '400', fallback: '#0EA5E9' };
    case 'success': return { role: 'success', shade: '500', fallback: '#16A34A' };
    case 'warning': return { role: 'warning', shade: '500', fallback: '#F59E0B' };
    case 'danger':  return { role: 'danger',  shade: '600', fallback: '#EF4444' };
    case 'critical':return { role: 'danger',  shade: '700', fallback: '#991B1B' };
    case 'neutral':
    default:        return { role: 'neutral', shade: '500', fallback: '#64748B' };
  }
}

/** Theme-aware tone → integer color; honors overrides */
export function colorFromToneWithTheme(
  themeKey: string,
  tone: EmbedTone,
  overrides?: TokenOverrideMap
): number {
  const theme = pickTheme(themeKey);

  // First try semantic tone direct from theme (if provided)
  const semanticHex = theme?.semantic?.[tone]?.hex as string | undefined;
  if (semanticHex) return hexToInt(normalizeHex(semanticHex));

  // Otherwise map tone → role/shade and resolve with overrides
  const { role, shade, fallback } = toneToRole(tone);
  const hex = fromOverrides(overrides, role, shade) ?? fromTheme(theme, role, shade) ?? fallback ?? '#5865F2';
  return hexToInt(hex);
}

/** Theme-aware event status → integer color; honors overrides */
export function colorFromEventStatusWithTheme(
  themeKey: string,
  status: EventStatus,
  overrides?: TokenOverrideMap
): number {
  return colorFromToneWithTheme(themeKey, toneForEventStatus[status], overrides);
}

// ---------- Back-compat (default theme constants & helpers) ----------
// These mirror the previous static exports, now sourced from the default theme so older imports continue to work.

const DEFAULT_THEME = pickTheme(DEFAULT_THEME_KEY);

/** Default-theme HEX per tone (for legacy callers) */
export const HEX: Record<EmbedTone, `#${string}`> = {
  brand:   normalizeHex(DEFAULT_THEME?.brand?.primary?.hex ?? DEFAULT_THEME?.roles?.primary?.['600'] ?? '#4F46E5'),
  info:    normalizeHex(DEFAULT_THEME?.semantic?.info?.hex ?? DEFAULT_THEME?.roles?.primary?.['400'] ?? '#0EA5E9'),
  success: normalizeHex(DEFAULT_THEME?.semantic?.success?.hex ?? DEFAULT_THEME?.roles?.success?.['500'] ?? '#16A34A'),
  warning: normalizeHex(DEFAULT_THEME?.semantic?.warning?.hex ?? DEFAULT_THEME?.roles?.warning?.['500'] ?? '#F59E0B'),
  danger:  normalizeHex(DEFAULT_THEME?.semantic?.danger?.hex  ?? DEFAULT_THEME?.roles?.danger?.['600']  ?? '#EF4444'),
  critical:normalizeHex(DEFAULT_THEME?.semantic?.critical?.hex?? DEFAULT_THEME?.roles?.danger?.['700']  ?? '#991B1B'),
  neutral: normalizeHex(DEFAULT_THEME?.semantic?.neutral?.hex ?? DEFAULT_THEME?.roles?.neutral?.['500'] ?? '#64748B'),
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

/** Examples:
 *   const color = embedColorFor('midnight','warning'); // theme-aware int
 *   const color2 = colorFromEventStatusWithTheme('default','Live'); // theme-aware via tone
 *   const color3 = embedColorFor('default','primary','500',{ '--role-primary-500':'#123456' }); // override wins
 */
