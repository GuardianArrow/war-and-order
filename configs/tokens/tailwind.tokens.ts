/** Tailwind tokens: build role color scales + register CSS vars from palette.json */
import palette from "./palette.json";

/** Shades we support */
export const shades = ['50','100','200','300','400','500','600','700','800','900'] as const;
type Shade = typeof shades[number];
type RoleName = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

function clamp(n: number, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, n)); }
function toHsl(h: number, s: number, l: number) { return `${h} ${s}% ${l}%`; }

/** Build a 50–900 scale from a single HSL triplet like "243 75% 59%" */
function buildScaleFromHsl(hsl: string) {
  const m = hsl.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (!m) return {};
  const h = Number(m[1]); const s = Number(m[2]); const L = Number(m[3]);
  const Lmap: Record<Shade, number> = {
    '50': clamp(L + 38), '100': clamp(L + 30), '200': clamp(L + 22), '300': clamp(L + 14),
    '400': clamp(L + 7),  '500': clamp(L),      '600': clamp(L - 7),  '700': clamp(L - 14),
    '800': clamp(L - 22), '900': clamp(L - 30),
  };
  const out: Record<string, string> = {};
  (shades as readonly string[]).forEach(sh => { out[sh] = toHsl(h, s, Lmap[sh as Shade]); });
  return out;
}

/** Accept either pre-expanded role scales or your brand/semantic bases */
function ensureRoleScales(p: any) {
  if (p?.role?.primary?.['500']) return p.role; // already expanded

  const role: any = {};
  if (p?.brand?.primary?.hsl)  role.primary = buildScaleFromHsl(p.brand.primary.hsl);
  if (p?.semantic?.success?.hsl) role.success = buildScaleFromHsl(p.semantic.success.hsl);
  if (p?.semantic?.warning?.hsl) role.warning = buildScaleFromHsl(p.semantic.warning.hsl);
  if (p?.semantic?.danger?.hsl)  role.danger  = buildScaleFromHsl(p.semantic.danger.hsl);

  // Neutral: use provided scale if present, else a sane default
  role.neutral = p?.neutral?.['500']
    ? p.neutral
    : buildScaleFromHsl('220 15% 50%');

  return role;
}

/** Theme.colors.role → uses CSS vars so alpha works (… / <alpha-value>) */
export function roleColorPalette(p: any) {
  const make = (name: RoleName) => {
    const scale: Record<string, string> = {};
    (shades as readonly string[]).forEach(sh => {
      scale[sh] = `hsl(var(--role-${name}-${sh}) / <alpha-value>)`;
    });
    scale.DEFAULT = scale['500'];
    return scale;
  };
  return {
    primary: make('primary'),
    success: make('success'),
    warning: make('warning'),
    danger:  make('danger'),
    neutral: make('neutral'),
    border: { DEFAULT: `hsl(var(--role-neutral-700) / <alpha-value>)` }, // handy default
  };
}

/** Tailwind plugin: registers :root CSS variables from the palette */
export function makeRoleCssVars(p: any) {
  const role = ensureRoleScales(p);
  const vars: any = { ':root': {} };
  (Object.keys(role) as RoleName[]).forEach((name) => {
    (shades as readonly string[]).forEach((sh) => {
      const val = role[name]?.[sh];
      if (val) vars[':root'][`--role-${name}-${sh}`] = val;
    });
  });
  return function plugin({ addBase }: any) { addBase(vars); };
}
