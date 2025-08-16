*Target repo file:* `docs/modules/module-d-i18n-core.md`

---

module: Module D (Localization & Internationalization — i18n Core)
version: v2025.08
status: Locked
last_updated: 2025-08-15 (Europe/London)
owners: [GuardianArrow]
annexe_refs:
  - Module A (invariants, flags, maintenance)
  - Annexe 3 (UX Surface & Components)
  - Annexe 4 (Database Schemas)
  - Annexe 8 (Observability)
  - Annexe 9 (CI/CD & cache-busting)
  - Annexe 11 (Accessibility)
  - Annexe 14 (i18n API & ETag semantics)

---

# Module D — Localization & Internationalization (i18n) Core — ✅ **LOCKED**

## D1. Purpose
Provide a unified framework to localize all user-facing text across **Discord bot**, **PWA**, and **notifications**, with:
- Modular JSON bundles per module/feature.
- **ICU MessageFormat** for plurals/ordinals/gender and rich parameters.
- Predictable **fallbacks**, **missing-key telemetry**, and **pseudo-localization** for QA.
- A **lean**, community-friendly workflow that fits budget and team size.

## D2. Scope & Non-Goals
**In scope:** Discord strings (slash/buttons/modals/embeds/errors), PWA UI, notifications (DM/push/announcements), locale formatting & timezone display.  
**Out of scope:** machine-translate of UGC; user-generated content displays as written (optionally language-tagged).

## D3. Supported Locales (Phase 1)
**EN** (fallback), **ar, de, lt, sr, fr, pt-PT, es-ES, vi, zh, ko, ru, pl, uk, pt-BR, es-VE, ro, sv**.  
Adding a locale = create locale files + register (no code changes).

## D4. File & Namespace Structure
/i18n/
en/
core.json
onboarding.json
profiles.json
events.json
events_elite_wars.json
events_wof.json
cbsp.json
shields.json
mentors.json
comms.json
culture.json
ar/
core.json
...

**Conventions:** stable dotted keys (`"events.create.dialog.title"`), per-module namespaces; shared UI in `core.json`; **no inline literals**—always use `t()` / `tr()`.

## D5. MessageFormat & Variables (ICU)
Examples:
- **Plural:** `"rsvp.count": "{count, plural, one {# RSVP} other {# RSVPs}}"`
- **Ordinal:** `"rank.ordinal": "{pos, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}"`
- **Variables:** `"event.reminder": "{title} starts {start, date, short} {start, time, short}"`
- **Gender select:** `"mentor.assigned": "{gender, select, male {He} female {She} other {They}} will mentor you."`  
**Lint:** placeholder parity across locales.

## D6. Fallbacks & Missing Keys
**Chain:** userLocale → language base (e.g., `pt-BR`→`pt-PT`) → **en**.  
Missing keys render **EN** and log `i18n.missing_key { locale, key, namespace }`. Staging can show `‼key‼` wrappers.

## D7. Locale & Time-Zone Resolution
Locale from profile (`/setlanguage`); PWA suggests `navigator.language`.  
TZ from profile; PWA suggests `Intl.DateTimeFormat().resolvedOptions().timeZone`.  
**Store UTC** in DB; format per user TZ at render.

## D8. RTL & Layout
For RTL (e.g., **ar**): set `<html dir="rtl">`, use CSS logical properties, avoid directional ASCII art; mirror icons as needed.

## D9. Fonts & Encoding
System stacks with broad glyph coverage (CJK/Cyrillic). Emojis consistent. **UTF-8** everywhere.

## D10. Roles & Permissions (Translation Governance)
| Action | Maintainer | Language Lead | Reviewer | R4/R5 |
|---|---|---|---|---|
| Add/rename keys | ✅ | ❌ | ❌ | ✅ |
| Provide translations | ✅ | ✅ | ✅ | ✅ |
| Approve translations | ✅ | ❌ | ✅ | ✅ |
| Publish new locale | ✅ | ❌ | ❌ | ✅ |

## D11. Workflow (Lean, PR-first)
1) Author **EN** keys → 2) **extract/diff** → 3) **translate** → 4) **ICU/placeholder lint** → 5) **publish** (version bump, cache-bust) → 6) **post-deploy missing-key report** to `#localization-ops`.

## D12. Pseudo-Localization (QA)
Pseudo-locale **`qps`**: expand ~35%, bracket text (e.g., `「 Ｅ𝒙åmplê 」`). Use in **staging** to detect clipping/overflow.

## D13. Style Guide & Glossary
- Discord = concise labels; PWA = full sentences.  
- No trailing punctuation in **buttons**.  
- Glossary per locale at `/i18n/glossary.{locale}.json` for game terms (march, rally, slot, castle, CBSP).

## D14. API & Runtime Contracts (Annexe 14)
Server: `GET /i18n/{locale}/{namespace}` → bundle JSON. Use **ETag**; clients send **If-None-Match**.  
Errors: `I18N.LOCALE_UNSUPPORTED`, `I18N.NAMESPACE_UNKNOWN`.  
Helpers: `t(locale, key, params)`, `tr(userId, key, params)`.  
PWA: `useI18n()` hook; **lazy-load per namespace**; **IndexedDB** cache with version.

## D15. Discord Commands & Dev Utilities
`/setlanguage <locale>`, `/translate missing` (R4/R5 summary), staging-only `/i18n pseudoloc on|off` (feature-flagged).  
**All bot embeds/components use keys—no literals.**

## D16. Notification Templates (ties to Module C)
Templates in `comms.json` + module files.  
Short variants for DM/push.  
ICU times: `"{start, date, short} {start, time, short}"`.  
Do **not** encode Quiet Hours/emergency in copy—those are **metadata** in Module C.

## D17. Performance & Caching
Small bundles (≤ **50KB gz**). Server memory cache + CDN; PWA IndexedDB. Preload `core.json`, **lazy-load** others.

## D18. Error Handling & Resilience
ICU error → fall back to EN; log `i18n.format_error`.  
Bundle fetch failure → retry once → fall back to EN; show non-blocking toast in PWA.

## D19. Governance & Versioning
`i18nVersion` (semver) in manifest; key renames ship with **aliases for one release**; change log maintained.

## D20. Module Integration Requirements
Every feature module (A/B/C/…): declare **namespaces**, seed **EN keys**, use `t()/tr()`, add **ICU/placeholder tests**, link **glossary**.

## D21. Adoption & Migration Plan
Phase 1 new features use keys → Phase 2 replace legacy literals → Phase 3 enable missing-key alerts → Phase 4 pseudo-loc staging & fix overflows.

## D22. Feature Flags & Maintenance (Module A)
Flags: `i18n.enabled`, `i18n.pseudo.enabled` (staging), `i18n.locale.<code>.enabled`.  
Maintenance Mode: i18n **fetch OK**; editing/publishing bundles requires `maintenance=false`.  
Optimistic concurrency: manifests/bundle indices carry **version**; edits use **ETag/If-Match**.

## D23. Observability & QA (Annexe 8 / 11)
**Logs:** `i18n.missing_key`, `i18n.format_error`, `i18n.bundle_fetch_error`.  
**Metrics:** `i18n_missing_keys_total{locale,namespace}`, `i18n_bundle_load_ms{namespace}`, `i18n_pseudoloc_sessions{env}`.  
**Dashboards:** coverage/error rates per locale; pseudo-loc usage.  
**Accessibility:** verify pseudo-loc (Annexe 11); RTL mirroring; screen-reader labels.

## D24. Data & Storage Notes (Annexe 4)
Optional metadata collections:
- `i18n_manifests { locale, namespaces[], version, updatedAt }`
- `i18n_missing_log` (rotating; feeds translators’ queue)  
Guild overrides **off by default** (global bundles).

## D25. Cross-References
Module A (invariants/flags/maintenance) · Module C (message templates & delivery) · Module B.7 (Events keys under `events*.json`; attendance under `events_attendance.json`) · Annexes **8/9/11/14**.

## D26. Change Log
- **2025-08-15:** Renamed module **I → D**; added feature flags, ETag/If-Match, observability metrics; cross-refs updated to A/C/B.7/Annexes 8/9/11/14.  
- **2025-08-14:** Initial lock.