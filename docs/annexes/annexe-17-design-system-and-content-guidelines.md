# Annexe 17 — Design System, Theming & Content Guidelines (LOCKED)
_Last Updated: 2025-08-17 (Europe/London)_

**Status:** LOCKED (with theming extensions) · **Scope:** Cross‑cutting (Discord + PWA) · **Owner:** Design Lead / Tech Lead (R4) · **Approvals:** R5 for palette/brand changes

This annexe defines canonical **tokens, typography, color palettes, component variants, imagery specs**, **copy conventions**, and the **theming model** for both the **PWA** and **Discord surfaces**. It complements interaction rules (Annexe 3), accessibility (Annexe 11), and privacy (Annexe 10).

**Cross‑refs:** Annexe 1 (surface ownership) · Annexe 3 (UX) · Annexe 4 (schemas) · Annexe 5 (stack) · Annexe 6 (policy) · Annexe 7 (jobs) · Annexe 8 (observability) · Annexe 9 (CI/CD) · Annexe 10 (privacy) · Annexe 11 (a11y) · Annexe 14 (API) · Annexe 16 (repo layout)

---

## 17.1 Rationale & Goals
- **Consistency** across PWA and Discord embeds/buttons.
- **A11y‑first**: WCAG 2.1 AA contrast; never rely on color alone (Annexe 11).
- **i18n‑ready**: copy is **Module D** keys; length expansion tolerated (pseudo‑locale).
- **Low‑cost**: small asset sizes; shared tokens via Tailwind + CSS vars.
- **Operable**: status colors map to policy/telemetry states; embeds readable on mobile.
- **Multi‑tenant**: allow **named themes** and **per‑guild overrides** without code changes.

---

## 17.2 Tokens & Theming (authoritative)
Declared as CSS variables generated from token sources in `configs/tokens/`. The PWA consumes these via Tailwind utilities that read CSS vars. The bot consumes the **same semantic names** through an embed color mapper.

### 17.2.1 Semantic color tokens (default theme)
> **Do not hardcode HEX in app code.** Use semantic tokens below. Values are the **default** palette and may be re‑skinned later without changing component code.

Light theme (starter values):
```ts
:root {
  --bg: #ffffff;
  --fg: #0f172a;          /* slate-900 */
  --muted: #334155;       /* slate-700 */
  --border: #e5e7eb;      /* gray-200 */

  --primary: #4f46e5;     /* indigo-600 */
  --primary-600: #4f46e5;
  --primary-700: #4338ca;

  --secondary: #14b8a6;   /* teal-500 */
  --accent: #f59e0b;      /* amber-500 */

  --info: #0ea5e9;        /* sky-500/600 */
  --success: #16a34a;     /* green-600 */
  --warning: #d97706;     /* amber-600 */
  --danger: #dc2626;      /* red-600 */

  --card: #ffffff;
  --card-fg: #0f172a;
}
```

Dark theme:
```ts
:root[class~="dark"] {
  --bg: #0b1020;
  --fg: #e5e7eb;
  --muted: #9ca3af;
  --border: #1f2937;

  --primary: #6366f1;     /* indigo-500 for dark */
  --primary-600: #4f46e5;
  --primary-700: #4338ca;

  --secondary: #2dd4bf;
  --accent: #fbbf24;

  --info: #38bdf8;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;

  --card: #0f172a;
  --card-fg: #e5e7eb;
}
```

**Status mapping (must‑use):**
- `info` → neutral notices, FYI banners, audience preview.
- `success` → completed/sent/attended.
- `warning` → deprecations, quiet‑hours deferrals, soft alerts.
- `danger` → destructive, cancellations, policy denials.

> **A11y:** Text over solid status backgrounds must be ≥ **4.5:1** (Annexe 11).

### 17.2.2 Elevation, radii, spacing
- **Radii:** `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-2xl: 24px`.
- **Shadows:** `--shadow-sm: 0 1px 2px rgba(0,0,0,.06)`, `--shadow-md: 0 6px 20px rgba(0,0,0,.12)`.
- **Spacing:** 4‑pt steps (`2,4,8,12,16,20,24,32,40…`).

### 17.2.3 Typography
- **Families:** UI text → System UI / Inter; Mono → ui‑monospace.
- **Scale (rem):** `xs .75`, `sm .875`, `base 1`, `lg 1.125`, `xl 1.25`, `2xl 1.5`, `3xl 1.875`, `4xl 2.25`.
- **Weights:** 400 / 500 / 600.
- **Use:** H1 `3xl/600`, H2 `2xl/600`, H3 `xl/600`, Body `base/400`, Help `sm/400`.

---

### 17.2.4 Theme structure (named themes + overrides)
We support multiple **named themes** plus **per‑guild overrides**.

**Source of truth:** `configs/tokens/palette.json`

```json
{
  "themes": {
    "default": {
      "primary": { "50":"…","100":"…","500":"#4f46e5","600":"#4f46e5","700":"#4338ca" },
      "success": { "500":"#16a34a" },
      "warning": { "500":"#d97706" },
      "danger":  { "500":"#dc2626" },
      "neutral": { "500":"#64748b" }
    },
    "midnight": {
      "primary": { "500":"#7c3aed","600":"#6d28d9","700":"#5b21b6" },
      "success": { "500":"#10b981" },
      "warning": { "500":"#f59e0b" },
      "danger":  { "500":"#ef4444" },
      "neutral": { "500":"#94a3b8" }
    }
  },
  "tokens": {
    "fonts": { "sans": "var(--font-sans-inter)", "serif": "var(--font-serif-lora)" },
    "radii": { "xl": "16px" },
    "shadows": { "md": "0 6px 20px rgba(0,0,0,.12)" }
  }
}
```

**CSS var emission:** For each `themeKey`, we emit a block of variables. The **default** theme binds to `:root`. Non‑default themes bind to `[data-theme="<key>"]`.

Example (emitted):
```css
:root{ --role-primary-500:#4f46e5; --role-success-500:#16a34a; /* … */ }
[data-theme="midnight"]{ --role-primary-500:#7c3aed; /* … */ }
```

### 17.2.5 Runtime selection (PWA)
- The PWA sets `data-theme="<key>"` on `<html>` to switch themes live.
- Persistence via `next-themes` (`storageKey: "wao-theme"`).
- Fonts, radii and shadows are routed through CSS variables so themes can alter them.

**Preview convention:** components gallery accepts `?theme=<key>` to force a theme for screenshots.

### 17.2.6 Bot mapping (Discord embeds)
The bot uses a single utility to translate semantic roles → HEX → integer:

```
embedColorFor(themeKey, role, shade='500') → 0xRRGGBB
```
- Source palette: `configs/tokens/palette.json` (same as PWA).
- Fallbacks: missing theme → `default`; missing role/shade → `primary-500`; ultimate fallback → Discord blurple `#5865F2`.

### 17.2.7 Overrides & precedence
1. **Per‑guild overrides** (DB) — e.g. `{ "--role-primary-500": "#123456" }`.
2. **Named theme** selected for guild — e.g. `midnight`.
3. **Default theme** (`:root`).

> Implementers must always resolve colors through the mapper so overrides are honored across bot and PWA.

---

## 17.3 Component Guidelines (PWA + Discord)
### 17.3.1 Buttons (PWA)
- **Variants:** `primary`, `secondary`, `subtle`, `destructive` (maps to tokens above).
- **Sizes:** `sm`, `md`.
- **Labels:** verb‑first, ≤ **22 chars**, localizable; emoji optional.
- **Icons:** `lucide-react` left‑aligned; keep accessible text.
- **States:** hover; focus outline `2px` using `--primary`; disabled uses opacity + not color only.

### 17.3.2 Buttons (Discord)
- Localized labels; emoji optional; `danger` variant only with confirm modal.
- Long flows deep‑link to the dashboard (Annexe 3).

### 17.3.3 Cards & Panels (PWA)
- `--card` background; radius `--radius-2xl` where available; shadow `--shadow-md`.

### 17.3.4 Discord Embeds
- Color bar uses semantic role via the mapper; prefer concise title and description; include timestamp; prefer thumbnail over hero unless needed.

### 17.3.5 Badges & Pills
- `success|info|warning|danger` with **text + icon** (no color only).

---

## 17.4 Imagery & Asset Specs
> Serve via PWA (CDN) or R2; Discord uploads as attachments. **Strip EXIF** (Annexe 10).

- **Thumbnail (1:1):** 512×512 (min 256×256) · ≤ 200 KB · `webp/png`.
- **Banner/Hero (16:9):** 1280×720 (preferred 1600×900/1920×1080) · ≤ 400–800 KB · `webp/jpg`.
- **Embed image:** prefer 16:9 ≤ ~1 MB.
- Provide **alt** in PWA / **caption** in Discord.

---

## 17.5 Copy & Tone (i18n)
- Module D keys only; ICU placeholders; sentence case body, Title Case titles; emoji sparing.

---

## 17.6 QA & Gates
- AA contrast; pseudo‑locale; RTL checks; size caps; EXIF stripped; visual diffs in CI for EN + pseudo.

---

## 17.7 Governance & Changes
- Palette/token changes → **R4 review** + **R5 approval**; update Tailwind vars + embed mapper.
- Record changes in **Annexe 15 (Revision History)**.

---

## 17.8 Theming Data & Storage (spec)
> DB changes will be added to **Annexe 4 (Database Schemas)**. This section defines the contract.

**Collection:** `guild_theme_configs`  
**Key:** `guildId` (unique)

**Document shape (canonical):**
```json
{
  "_id": "ObjectId",
  "guildId": "123456789012345678",
  "themeKey": "default",
  "overrides": {
    "--role-primary-500": "#123456"
  },
  "updatedBy": "userId|system",
  "updatedAt": "2025-08-17T12:34:56.000Z"
}
```

**Types (packages/shared-schema):**
```ts
export type TokenOverrideMap = Partial<Record<string, string>>;

export interface GuildThemeConfig {
  guildId: string;
  themeKey: string;          // 'default' | 'midnight' | future keys
  overrides?: TokenOverrideMap;
  updatedBy?: string;
  updatedAt: string;         // ISO
}
```

**Resolution contract (both PWA & Bot):**
1) pick `themeKey` (guild → user → default),  
2) merge overrides,  
3) resolve semantic → HEX/var,  
4) enforce a11y fallbacks when required.

**Admin ops (bot slash, PWA admin):**
- `theme.set key:<default|midnight|…>`
- `theme.override name:<--role-primary-500> value:<#RRGGBB>`
- `theme.show`

---

## 17.9 Implementation Notes
- Tailwind utilities bind to CSS vars, e.g. `bg-[var(--card)]`.
- Theme switching via `data-theme` on `<html>` (persist with `next-themes`).
- Embed mapper uses shared palette JSON to keep parity with PWA.
- Screenshots in CI capture `/design/tokens` and `/design/components` for documentation completeness.

---

## 17.10 Design Snapshots
> The following screenshots are generated by Playwright in CI (`docs/static/images/design/*`).

**Tokens — default theme**  
![Design Tokens — default](../../static/images/design/design-tokens.png)

**Tokens — midnight theme**  
![Design Tokens — midnight](../../static/images/design/design-tokens--midnight.png)

**Components Gallery — default theme**  
![Design Components — default](../../static/images/design/design-components.png)

**Components Gallery — midnight theme**  
![Design Components — midnight](../../static/images/design/design-components--midnight.png)

---

## 17.11 Revision Notes
- **2025‑08‑17:** Added named themes, per‑guild overrides, storage contract (`guild_theme_configs`), and dual-theme documentation screenshots.
- **2025‑08‑16:** Initial LOCKED version; seeded starter palette, typography scale, asset specs, and Discord/PWA alignment.
