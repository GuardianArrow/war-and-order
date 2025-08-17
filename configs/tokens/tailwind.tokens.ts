/** Tailwind tokens: build role color scales + register CSS vars from palette.json */
import palette from "./palette.json";

/** Shades we support */
export const shades = ['50','100','200','300','400','500','600','700','800','900'] as const;
export type Shade = typeof shades[number];
export type RoleName = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

/* ----------------------------- utilities ----------------------------- */

function clamp(n: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, n)); }
function toHslParts(h: number, s: number, l: number) { return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`; }

/** Build a 50–900 scale from a single HSL triplet like "243 75% 59%" */
function buildScaleFromHslParts(hslParts: string) {
  const m = hslParts.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return {};
  const h = Number(m[1]); const s = Number(m[2]); const L = Number(m[3]);
  const Lmap: Record<Shade, number> = {
    '50': clamp(L + 38), '100': clamp(L + 30), '200': clamp(L + 22), '300': clamp(L + 14),
    '400': clamp(L + 7),  '500': clamp(L),      '600': clamp(L - 7),  '700': clamp(L - 14),
    '800': clamp(L - 22), '900': clamp(L - 30),
  };
  const out: Record<string, string> = {};
  (shades as readonly string[]).forEach(sh => { out[sh] = toHslParts(h, s, Lmap[sh as Shade]); });
  return out;
}

/** HEX (#RRGGBB) → H,S,L percentages (as 'H S% L%') */
function hexToHslParts(hex: string): string | null {
  const m = hex.trim().toLowerCase().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = (int >> 16) & 255, g = (int >> 8) & 255, b = int & 255;
  const r1 = r / 255, g1 = g / 255, b1 = b / 255;
  const max = Math.max(r1, g1, b1), min = Math.min(r1, g1, b1);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r1: h = (g1 - b1) / d + (g1 < b1 ? 6 : 0); break;
      case g1: h = (b1 - r1) / d + 2; break;
      default: h = (r1 - g1) / d + 4; break;
    }
    h /= 6;
  }
  return toHslParts(h * 360, s * 100, l * 100);
}

/** Normalize any value ('#hex', 'h s% l%', or 'hsl(h s% l%)') → 'h s% l%' */
function normalizeToHslParts(value: string): string | null {
  if (!value) return null;
  const v = String(value).trim();
  // Already "h s% l%"
  if (/^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/.test(v)) return v;
  // hsl(…)
  const hslMatch = v.match(/^hsl\(\s*([\d.]+)\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%\s*\)$/i);
  if (hslMatch) return toHslParts(Number(hslMatch[1]), Number(hslMatch[2]), Number(hslMatch[3]));
  // #hex
  const parts = hexToHslParts(v.startsWith('#') ? v : `#${v}`);
  if (parts) return parts;
  return null;
}

/* -------------------------- role scale resolvers -------------------------- */

/** Build role scales for a *single theme*; accepts theme.roles (hex or hsl) or brand/semantic HSL. */
function ensureThemeRoleScales(theme: any, rootFallback?: any) {
  const roles: Partial<Record<RoleName, Record<string, string>>> = {};
  const sourceRoles = theme?.roles;

  const ensureScale = (name: RoleName, base?: Record<string,string>, hslSeed?: string) => {
    if (base && base['500']) {
      // Convert each shade to HSL parts
      const scale: Record<string, string> = {};
      for (const [shade, val] of Object.entries(base)) {
        const norm = normalizeToHslParts(String(val));
        if (norm) scale[shade] = norm;
      }
      if (Object.keys(scale).length) { roles[name] = scale; return; }
    }
    if (hslSeed) {
      roles[name] = buildScaleFromHslParts(hslSeed);
      return;
    }
  };

  // Prefer explicit theme.roles scales (hex or hsl)
  ensureScale('primary', sourceRoles?.primary, theme?.brand?.primary?.hsl || rootFallback?.brand?.primary?.hsl);
  ensureScale('success', sourceRoles?.success, theme?.semantic?.success?.hsl || rootFallback?.semantic?.success?.hsl);
  ensureScale('warning', sourceRoles?.warning, theme?.semantic?.warning?.hsl || rootFallback?.semantic?.warning?.hsl);
  ensureScale('danger',  sourceRoles?.danger,  theme?.semantic?.danger?.hsl  || rootFallback?.semantic?.danger?.hsl);
  ensureScale('neutral', sourceRoles?.neutral, undefined);

  // Neutral fallback: theme.roles.neutral OR rootFallback.neutral scale OR a generated neutral
  if (!roles.neutral) {
    if (rootFallback?.neutral?.['500']) {
      const scale: Record<string, string> = {};
      for (const [shade, val] of Object.entries(rootFallback.neutral)) {
        const norm = normalizeToHslParts(String(val)) ?? normalizeToHslParts('#64748B'); // attempt best-effort
        if (norm) scale[shade] = norm;
      }
      roles.neutral = scale;
    } else {
      roles.neutral = buildScaleFromHslParts('220 15% 50%');
    }
  }

  // As a guard, if primary is missing, synthesize from brand.primary.hsl or a sensible default
  if (!roles.primary) {
    const seed = theme?.brand?.primary?.hsl || rootFallback?.brand?.primary?.hsl || '243 75% 59%';
    roles.primary = buildScaleFromHslParts(seed);
  }

  return roles as Record<RoleName, Record<string, string>>;
}

/** Compute role scales for every theme in the palette; supports legacy (no themes). */
function computeAllThemeRoleScales(p: any) {
  const out: Record<string, Record<RoleName, Record<string, string>>> = {};
  if (p?.themes && typeof p.themes === 'object') {
    for (const [key, theme] of Object.entries<any>(p.themes)) {
      out[key] = ensureThemeRoleScales(theme, p);
    }
  } else {
    // Legacy: synthesize a single 'default' theme from legacy fields
    const legacyTheme = { brand: p?.brand, semantic: p?.semantic, roles: { neutral: p?.neutral } };
    out['default'] = ensureThemeRoleScales(legacyTheme, p);
  }
  return out;
}

/* ------------------------------- tailwind APIs ------------------------------- */

/** Theme.colors.role → uses CSS vars so alpha works (… / <alpha-value>) */
export function roleColorPalette() {
  const make = (name: RoleName) => {
    const scale: Record<string, string> = {};
    (shades as readonly string[]).forEach(sh => {
      scale[sh] = `hsl(var(--role-${name}-${sh}) / <alpha-value>)`;
    });
    (scale as any).DEFAULT = scale['500'];
    return scale;
  };
  return {
    primary: make('primary'),
    success: make('success'),
    warning: make('warning'),
    danger:  make('danger'),
    neutral: make('neutral'),
    border: { DEFAULT: `hsl(var(--role-neutral-700) / <alpha-value>)` } // handy default
  };
}

/**
 * Tailwind plugin: registers CSS variables for *all themes*.
 * - ':root' gets the default theme
 * - '[data-theme="<key>"]' gets the others
 */
export function makeThemeCssVars() {
  const themes = computeAllThemeRoleScales(palette as any);
  const vars: Record<string, Record<string, string>> = {};

  for (const [key, roles] of Object.entries(themes)) {
    const selector = key === 'default' ? ':root' : `[data-theme="${key}"]`;
    vars[selector] = vars[selector] || {};
    (Object.keys(roles) as RoleName[]).forEach((name) => {
      (shades as readonly string[]).forEach((sh) => {
        const val = roles[name]?.[sh];
        if (val) vars[selector][`--role-${name}-${sh}`] = val;
      });
    });
  }

  return function plugin({ addBase }: any) { addBase(vars); };
}

/** Back-compat alias (older configs imported makeRoleCssVars) */
export const makeRoleCssVars = makeThemeCssVars;

/* ------------------------------- helpers (optional exports) ------------------------------- */

export function getThemeKeys(): string[] {
  if ((palette as any)?.themes) return Object.keys((palette as any).themes);
  return ['default'];
}
