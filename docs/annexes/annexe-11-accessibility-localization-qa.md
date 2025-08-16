# Annexe 11 — Accessibility & Localization QA (LOCKED)

_Last Updated: 2025-08-15 (Europe/London)_

Defines standards, checklists, and test plans for **WCAG 2.1 AA** accessibility and localization quality across **Discord components** and the **Web PWA**.

---

## 11.1 Principles
- **Inclusive by default:** WCAG 2.1 AA; keyboard-only friendly; screen-reader readable.
- **Multilingual first:** every user-facing string resolves to **Module D i18n** keys.
- **Consistent surfaces:** predictable patterns between Discord “button-first” panels and the PWA (see **Annexe 3**).
- **Low friction:** short labels, clear icons/emoji (**never color alone**), minimal cognitive load.
- **Fail safe:** if a locale bundle fails, auto-fallback to **EN** with a non-blocking toast and a log.

---

## 11.2 Accessibility Standards — PWA

### Keyboard & Focus
- All interactive elements **tabbable**; visible **focus outline**; logical tab order.
- Modals **trap focus**; **Esc** closes; **Enter/Space** activates primary action.
- Minimum target size: **44×44 px** interactive hit area on touch.

### Screen Readers
- Landmarks: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`.
- **ARIA roles/labels** for custom controls; **live regions** for async status (e.g., “Saved”, “Queued”).
- Inputs have `<label for>`; errors linked via `aria-describedby`.

### Contrast & Motion
- Text contrast ≥ **4.5:1** (icons/large text ≥ **3:1**).
- Respect **prefers-reduced-motion**; provide non-animated alternatives.

### Timing
- Timeouts/countdowns announced; no critical auto-redirects; offer **“Extend time”**.

### Media & Images
- Meaningful **alt**; decorative images `aria-hidden="true"`.
- Culture uploads: **strip EXIF/geo** (see **Module E** & **Annexe 10**).

---

## 11.3 Accessibility Standards — Discord
- **Button-first** UI: **verbs + emoji**; never rely on color alone.
- Use **ephemeral** responses for sensitive actions.
- Modals: ≤ **5 inputs**; concise labels/placeholders; inline validation copy.
- Large lists or multi-step forms → **“Open in Dashboard”** deep-link (Annexe 3 switch rules).

---

## 11.4 Localization Standards — Module D (i18n)
- **ICU MessageFormat** for plurals, gender, ordinals; **variable parity** enforced.
- **Locale negotiation:** user preference → server default (**EN**).
- Date/number formatting via **Intl** (client) and server helpers (**Module D**).
- **RTL** support: set `dir="rtl"` on `<html>` for Arabic and Arabic-script locales; use **CSS logical properties** (padding/margin inline) so layouts auto-mirror.
- **Pseudo-locale qps:** length-expansion (+30–40%), bracket markers to catch clipping.

---

## 11.5 Fonts & Script Coverage (PWA)
- Primary UI: **System UI stack / Inter**; load **Noto** subsets on demand (Arabic, CJK, Cyrillic).
- **Noto Color Emoji** for emoji consistency.
- Locale-aware `:lang()` CSS to adjust stacks per script; **avoid >100 KB** first-load font cost.

---

## 11.6 Test Matrix (minimum)

| Area | Targets |
|---|---|
| Screen readers | NVDA (Windows), VoiceOver (iOS/macOS) |
| Browsers | Chrome, Safari, Firefox (latest two) |
| Locales | **EN** (LTR baseline), **ar** (RTL), **zh** (CJK), **ru** (Cyrillic) |
| Scenarios | Onboarding, event RSVP & publish, bulk attendance (A/L/X/I keys), CBSP request, shield alerts, mentor request/accept, culture submit/vote |

---

## 11.7 QA Checklists (feature PRs must pass)

### Strings & Layout
- No hardcoded text; keys exist in **EN**; locale fallback works.
- Long names (≥ **30 chars**) don’t clip; text **wraps** or **truncates with tooltip**.
- Numbers/dates **localized**; 12/24‑hour format aligns with locale.

### Discord Embeds
- Concise copy; links to **PWA** for details; buttons labeled with **verbs + emoji**.

### Forms
- Labels, hints, errors **localized**; placeholders never the only source of meaning.

### RTL
- Visual mirroring correct; icons not direction‑critical; charts axis labels readable.

---

## 11.8 Automation & CI Gates
- **a11y:** Playwright + **axe-core** automation on key pages/panels; build **fails on any critical violations**; warnings surfaced in PR.
- **i18n:** placeholder‑parity lint (ICU variables match across locales); missing‑key scanner; **pseudo-loc** build smoke.
- **Screenshots:** PR visual diffs for **EN/AR qps** on critical flows (calendar, attendance grid, onboarding).
- **Telemetry hooks:** log `i18n.missing_key` and `a11y.axe_violation` events (see **Annexe 8**) with `guildId`, `route`, `count` (no content).

---

## 11.9 Manual Test Plans (release)
- **Keyboard-only** path: create event → publish (audience preview) → live → complete; bulk attendance with **A/L/X/I** cycle, range‑select, undo.
- **RTL** sweep on onboarding and any newly added multi‑step form.
- **Pseudo-loc** run across Culture galleries & leaderboards; check overflow.
- **Low-vision** pass (high‑contrast mode) on calendar list & CBSP dashboard.

---

## 11.10 Known Platform Limits (Discord)
- No **alt text** on image attachments → include **caption text** with description.
- Max **25** select options; long lists require PWA deep‑link.
- Modal focus order controlled by Discord; we order inputs to match logical reading order.
- Emoji accessibility varies by client; include **text labels** that stand alone.

---

## 11.11 Governance & Roles
- **Accessibility Champion** (maintainer) signs off a11y checks on critical flows.
- **Language Leads & Reviewer** (Module D) approve locale updates; ensure **glossary** consistency.
- **Culture Mods** verify quiz Q/A per locale where applicable.

---

## 11.12 Failure Handling & Fallbacks
- Missing bundle or ICU error → **fallback to EN**, toast “Localized text unavailable”, log `i18n.format_error`.
- If a specific locale repeatedly fails (> **3 times** in 24h), temporarily **disable that locale** (feature flag in Settings) and notify Language Lead.

---

## 11.13 Cross-Refs & Telemetry
- **Module D:** keys, ICU, pseudo‑loc, glossary.
- **Annexe 3:** component patterns & “Open in Dashboard” rules.
- **Annexe 5:** tooling (Playwright/axe).
- **Annexe 8:** emit logs `i18n.missing_key`, `i18n.format_error`, `a11y.axe_violation`; track counts by route/locale.
- **Annexe 9:** CI stages must include a11y/i18n gates; releases blocked on critical failures.

---

## 11.14 Acceptance Criteria (must‑meet to ship)
- **Zero** critical axe violations on critical flows; **no AA failures** in checklists.
- **Pseudo-loc & RTL snapshots** show no clipping or broken layout.
- **Audience Preview** (broadcasts/events) localized; numbers/dates format per locale.
- Discord components use **short, localized labels**; **no color‑only** semantics.

---

## 11.15 Maintenance
- **Quarterly** a11y/i18n review; rotate sample locales (add one low‑coverage locale each quarter).
- Keep glossary (`/i18n/glossary.{locale}.json`) current for game terms (“march”, “rally”, “castle”, “CBSP”).
- Update this annexe when WCAG guidance or platform constraints change; record in **Annexe 15**.

---

**Status:** LOCKED — Any changes require R5 approval and an entry in **Annexe 15 (Revision History)**.
