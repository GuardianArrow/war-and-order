# Annexe 17 — Design System & Content Guidelines (LOCKED)
_Last Updated: 2025-08-17 (Europe/London)_

**Status:** LOCKED · **Scope:** Cross-cutting (Discord + PWA) · **Owner:** Design Lead / Tech Lead (R4) · **Approvals:** R5 for palette/brand changes

This annexe defines canonical **tokens, typography, color palettes, component variants, imagery specs**, and **copy conventions** for both the **PWA** and **Discord surfaces**. It complements interaction rules (Annexe 3), accessibility (Annexe 11), and privacy (Annexe 10).

**Cross-refs:** Annexe 1 (surface ownership) · Annexe 3 (UX) · Annexe 4 (schemas) · Annexe 5 (stack) · Annexe 6 (policy) · Annexe 7 (jobs) · Annexe 8 (observability) · Annexe 9 (CI/CD) · Annexe 10 (privacy) · Annexe 11 (a11y) · Annexe 14 (API) · Annexe 16 (repo layout)

---

## 17.1 Rationale & Goals
- **Consistency** across PWA and Discord embeds/buttons.
- **A11y-first**: WCAG 2.1 AA contrast; never rely on color alone (Annexe 11).
- **i18n-ready**: copy is **Module D** keys; length expansion tolerated (pseudo-locale).
- **Low-cost**: small asset sizes; Shared tokens in Tailwind + CSS vars.
- **Operable**: status colors map to policy/telemetry states; embeds readable on mobile.

---

## 17.2 Tokens & Theming (authoritative)
Declared in **`configs/tailwind.config.ts`** and **`apps/web/styles/globals.css`** as CSS variables. Discord uses the same **semantic names** via the embed builder in `packages/shared-comms`.

### 17.2.1 Semantic color tokens
> **Do not hardcode HEX in app code.** Use semantic tokens below. Values are a **starter palette** and may be re-skinned later without changing component code.

Light theme (suggested starter values):
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
  --bg: #0b1020;          /* near slate-950 with subtle hue */
  --fg: #e5e7eb;          /* gray-200 */
  --muted: #9ca3af;       /* gray-400 */
  --border: #1f2937;      /* gray-800 */

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

**Status mapping (must-use):**
- `info` → neutral notices, FYI banners, audience preview.
- `success` → completed/sent/attended.
- `warning` → deprecations, quiet-hours deferrals, soft alerts.
- `danger` → destructive, cancellations, policy denials.

> **A11y:** Text over solid status backgrounds must be ≥ **4.5:1** contrast (Annexe 11).

### 17.2.2 Elevation, radii, spacing
- **Radii:** `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-2xl: 24px`.
- **Shadows (subtle):** `--shadow-sm: 0 1px 2px rgba(0,0,0,.06)`, `--shadow-md: 0 6px 20px rgba(0,0,0,.12)`.
- **Spacing scale:** 4-pt steps (`2,4,8,12,16,20,24,32,40` etc.).

### 17.2.3 Typography
- **Families:** UI text → System UI / Inter; Mono → ui-monospace.
- **Scale (rem):** `xs .75`, `sm .875`, `base 1`, `lg 1.125`, `xl 1.25`, `2xl 1.5`, `3xl 1.875`, `4xl 2.25`.
- **Weights:** 400 normal, 500 medium, 600 semibold.
- **Use:** Page H1 `3xl/600`, Section H2 `2xl/600`, H3 `xl/600`, Body `base/400`, Small help `sm/400`.
- **Buttons:** `sm`=`.875/600`, `md`=`1/600`.
- **Line-height:** 1.35–1.6 depending on size.

---

## 17.3 Component Guidelines (PWA + Discord)
### 17.3.1 Buttons (PWA)
- **Variants:** `primary`, `secondary`, `subtle`, `destructive` (maps to tokens above).
- **Sizes:** `sm`, `md` (default).
- **Labels:** verb-first, ≤ **22 chars**, localizable; may include emoji (🌟) if helpful.
- **Icons:** `lucide-react` left-aligned; keep accessible text.
- **States:** hover, focus (outline 2px using `--primary`), disabled (opacity .5 + no color-only semantics).

### 17.3.2 Buttons (Discord)
- Use concise **localized** labels; emoji optional; **danger** variant only with confirm modal.
- Keep to **Annexe 3** limits; long flows deep-link (“Open in Dashboard”).

### 17.3.3 Cards & Panels (PWA)
- Card background `--card`; radius `--radius-xl` (`16–20px`); shadow `--shadow-md`.
- Headline + meta + actions row; optional thumbnail (16:9 or 1:1).

### 17.3.4 Discord Embeds
- **Color bar** uses semantic status token → convert to nearest HEX.
- **Title** short (≤ ~80 chars recommended), **Description** concise; long text goes to PWA.
- **Footer:** context (timezone, locale) and icon where helpful.
- Include **timestamp**; if image present, prefer a **thumbnail** except for hero visuals.

### 17.3.5 Badges & Pills
- Status → `success|info|warning|danger` with clear **text + icon** (no color alone).

---

## 17.4 Imagery & Asset Specs
> Storage: serve via the PWA (with CDN) or R2; Discord uploads as attachments. **Strip EXIF** on upload (Annexe 10).

### 17.4.1 Types & placements
- **Thumbnail (square):** 1:1 · **512×512** (min 256×256) · ≤ **200 KB** · `webp/png`.
- **Banner/Hero (wide):** 16:9 · **1280×720** (prefer 1600×900 or 1920×1080 for hero) · ≤ **400–800 KB** · `webp/jpg`.
- **Embed image (Discord):** prefer **16:9** ≤ ~1 MB; avoid text-heavy images.
- **Avatar/Icon:** 40–64 px logical.

### 17.4.2 Usage rules
- **Events:** card thumbnail optional; **broadcast post** should include **banner** if thematic.
- **Culture themes:** require **thumbnail**; gallery supports banner on feature.
- **Broadcasts/Announcements:** include **banner** if not purely operational.
- **Shield posts:** optional map/coords thumbnail; keep subtle to avoid clutter.

### 17.4.3 Content & a11y
- Provide **alt text** (PWA) / descriptive **caption** (Discord; no native alt).
- Avoid text embedded in images; rely on copy for localization.
- Center-safe composition (mobile crops).

---

## 17.5 Copy & Tone (i18n)
- **Keys only** (Module D). Examples: `events.publish.confirm_title`, `comms.preview.sample_label`.
- **Tone:** clear, concise, player-first; avoid jargon; sentence case in body; Title Case for titles.
- **Placeholders:** ICU with named vars (`{{count}}`, `{{time, time}}`); pluralize properly.
- **Emoji:** sparing; reinforce meaning, never replace it. Examples: ✅ Approved, ✖ Cancelled, 🔔 Reminder.

---

## 17.6 Broadcasts & Alerts
### 17.6.1 Layout
- **Title** (H2), **Summary** (≤ 140 chars), **Body** (≤ ~600 chars), **CTA** button (“Open in Dashboard”).
- **Status banner** color by message type (`info/success/warning/danger`).
- **Audience Preview** block shows **count + 10 samples** (Annexe 3/6).

### 17.6.2 Examples (i18n keys)
- `comms.broadcast.title_key`
- `comms.broadcast.summary_key`
- `comms.broadcast.cta_key`

---

## 17.7 Motion
- Use **Framer Motion**; respect **prefers-reduced-motion**.
- Durations: **150–250 ms** standard; **100 ms** micro; **300 ms** modal.
- Easing: `easeOut` for entrances, `easeIn` for exits; distances ≤ 16–24 px.

---

## 17.8 Iconography
- **lucide-react** set. Size 16/18/20 px in buttons; 24 px in cards.
- Always accompany with text label. Mirror directional icons in RTL (Annexe 11).

---

## 17.9 Implementation Notes
- **Tailwind tokens** mapped to CSS vars (`bg-[var(--card)]` via utility classes).
- **Theme switcher** (light/dark) using `next-themes` in PWA.
- **Embed builder** in `packages/shared-comms` consumes semantic tokens → Discord HEX; enforces copy limits and falls back to PWA links for long text.

---

## 17.10 QA & Gates
- **Contrast** passes AA (Annexe 11).
- **Pseudo-locale** shows no clipping (length + brackets).
- **RTL** verified on key flows.
- **File sizes** under caps; **EXIF stripped**.
- **Visual diffs** in CI for EN + pseudo-locale (Annexe 11).

---

## 17.11 Governance & Changes
- Palette/token changes require **R4 review** and **R5 approval**; update Tailwind + CSS vars and the embed builder mapping.
- Record changes in **Annexe 15 (Revision History)**.

---

## 17.12 Quick Reference (cheat sheet)
- **Buttons:** primary/secondary/subtle/destructive; verb-first labels; ≤ 22 chars.
- **Status colors:** info / success / warning / danger (semantic tokens).
- **Images:** thumbnail 512×512; banner 1280×720+; keep ≤ 200–800 KB; webp preferred.
- **Embeds:** short titles, concise body, use color bar; attach image only when it adds value.
- **Copy:** Module D keys; ICU; emoji optional; never color-only.

---

## 17.13 Design Snapshots
### Design Snapshot: Tokens
![Design Tokens](../../static/images/design/design-tokens.png)

### Design Snapshot: Components Gallery
![Design Components](../../static/images/design/design-components.png)

---

## 17.14 Revision Notes
- **2025-08-16:** Initial LOCKED version; seeded starter palette, typography scale, asset specs, and Discord/PWA alignment.
- **2025-08-17:** Added snapshot previews (tokens/components) for Annex 17 cross-ref.
