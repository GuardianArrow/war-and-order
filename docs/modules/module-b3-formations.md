---
module: Module B.3 (Formation Builder)
version: v2025.08
status: Locked
last_updated: 2025-08-15 (Europe/London)
owners: [GuardianArrow]
annexe_refs:
  - Annexe 3 (UX Surface & Components)
  - Annexe 4 (Database Schemas)
  - Annexe 5 (Tech stack & Discord intents/scopes)
  - Annexe 6 (Policy Guard)
  - Annexe 8 (Observability)
  - Annexe 11 (Accessibility)
  - Annexe 14 (API Contracts)
  - Annexe 15 (Migrations & Seeds)
---

# Module B.3 — Formation Builder — **LOCKED**

## B3.1 Purpose
Provide members an interactive calculator to generate **target troop distributions** for common march types based on castle range, front/back row preference, and total march size. Supports default templates, per-player customisation, per-player overrides, “quick change”, saved formations, and an **R4/R5 Playground** to test templates before publish. Outputs are **ideal targets** (not limited by actual troop availability).

---

## B3.2 Roles & Permissions (Policy Guard; Annexe 6)
**Member+**
- Use calculator; view templates; save/load/delete own formations; apply own overrides.

**R3+**
- Create/update **guild-local** templates (if enabled); share results to channel if allowed.

**R4/R5**
- Create/update/archive **master** templates; publish to selector; use **Template Playground**; manage template release notes.

_All actions pass through Policy Guard; decisions logged (ALLOW/DENY/SOFT_ALLOW)._

---

## B3.3 Feature Flags (per-guild; see A5.2 / Annexe 4)
- `formations.enabled` — master switch  
- `formations.customTemplates` — allow R3+ to maintain local templates  
- `formations.shareToChannel` — enable “Share” posts of outputs  
- `formations.playground` — enable Template Playground for R4/R5  
- `formations.perUserOverrides` — enable Per-Player Overrides UI + calc  
- `formations.templateVersionNotes` — show release notes on templates  
- `maintenance.enabled` — global pause for background work (rare here)

---

## B3.4 Troop Model & Concepts
**Categories (8 + special):** Even/Odd Infantry, Cavalry, Archers, Mages; **Angels** (special).  
**Tiers:** T1–T13; odd/even handled separately.

**Rows**
- **Front:** Infantry **or** Cavalry  
- **Back:** Archers **or** Mages **or** Mixed (template ratio, default 50/50)

---

## B3.5 March Types & Template Model
**Default march types:** Solo, Team No-loss, Team Real-loss, Abyss Lord, Anubis (extensible).

**Template (stored)**
- `templateId` (ULID), `guildId`, `name`, `category` (PvE/PvP), `status: "active"|"archived"`  
- `castleRanges:` supported buckets `(22–25, 26–29, 30–33, 34–37, 38–40, 41–42)`  
- `rules[]` (per troop category)
  - `mode: "percent"|"exact"|"fill"|"conditional"`
  - `value: number` (percent/exact)
  - `priority: int` (allocation order; lower first)
  - `conditions?` e.g., `{ angelsMinTier: 10 }`
- `fillPolicy`
  - `backRowPreference: "archers"|"mages"|"mixed"` (default from user unless template overrides)
  - `mixedRatio: { archers: 0.5, mages: 0.5 }`
- `rounding: "floor"|"nearest"` (default **floor**)
- `overflowStrategy: "clipFillThenScalePercent"|"scaleAllNonExact"` (default **clipFillThenScalePercent**)
- **Versioning & Notes (NEW)**
  - `versionTag: string` (e.g., `"1.3.0"`)
  - `releaseNotes?: string` (i18n-key or markdown)
  - `changelog?: [{ versionTag, note, createdAt, createdBy }]`
- `i18nKeyName`, `i18nKeyDescription`, `createdBy`, `version`, `createdAt`, `updatedAt`

**Master vs Local**  
Master = R4/R5; Local = R3+ (if flagged). Masters can promote a local to master.

---

## B3.6 Inputs & Calculation Algorithm
**Inputs**
- `castleRange ∈ {22–25, 26–29, 30–33, 34–37, 38–40, 41–42}`
- `frontRow ∈ {Infantry, Cavalry}`
- `backRow ∈ {Archers, Mages, Mixed}`
- `totalMarchSize: int`
- `templateId` (or ad-hoc rules if permitted)
- **Per-Player Overrides** (if enabled) (NEW)
  - e.g., `{ bias: { archers: +0.02, mages: -0.02 }, caps?: { maxPercentForOddMages?: 0.35 } }`

**Allocation order (deterministic)**
1. **Exact** rules (by priority)  
2. **Percent** rules (of total march size)  
3. **Per-Player Overrides** adjust the percent layer (NEW)  
4. **Conditional** rules (e.g., Angels if T10+)  
5. **Fill** uses remaining capacity (respect back-row policy)

_Overrides bias the percent layer before conditional/fill. They do not affect **Exact** allocations. After biasing, overflow rules apply (B3.7)._

---

## B3.7 Validation, Rounding & Overflow
**Validation**
- Percent rules sum **≤ 100** (excluding Fill)  
- Exact + Percent (after overrides) **≤ capacity** (pre-overflow normalisation)

**Rounding**
- Default **floor** per category  
- Rounding loss accumulates; final **Fill** absorbs leftover if possible

**Overflow**
1) **Clip Fill to zero**  
2) If still > capacity → **scale down Percent categories proportionally** (Exact intact)  
   - Floor results; any remaining single seats go to **back-row preference**  
3) Alternate strategy `scaleAllNonExact`: scale **both** Percent and Fill (template-controlled)

**Underflow**
- Assign remainder to Fill; if no Fill exists, assign to **back-row preference**

---

## B3.8 Customisation, Saved Formations & Overrides
- **Manual Edits:** After calc, users may overwrite any numbers  
- **Save** formation to profile; **Load/Edit/Delete** later  
- **Quick Change:** Change any single input and recalc instantly  
- **Profile Memory:** Store default castle range and rows  
- **Per-Player Overrides** (if `formations.perUserOverrides`) (NEW)
  - Users define small persistent biases (e.g., “favour Archers **+2%**”)  
  - Shown and auto-applied during calc; visible in result summary  
  - Policy Guard caps bias (e.g., **±5%**)

---

## B3.9 Template Playground (R4/R5) (NEW)
**Goal:** test & compare template behaviour across ranges/sizes before publishing.

**Capabilities**
- Run **batch calculations** across:
  - Multiple `castleRanges` and `totalMarchSize` samples
  - Different back-row choices and rounding/overflow strategies
- Visualise:
  - Category allocations; **percent loss due to rounding**; overflow normalisations
  - Warnings for frequent overflow/underflow
- Side-by-side compare **current active vs draft** template
- Export a **diff report** (CSV/JSON) with hotspots

**Publish flow**
- Save **draft** → add `versionTag` + `releaseNotes` → **Publish to active**
- Auto-increment `versionTag` or require explicit

**UX**
- PWA-only, gated by `formations.playground` and R4/R5 role  
- Tabs: **Inputs / Results / Compare / Notes**  
- “Impact preview” message on publish (who sees it, which event shortcuts reference it)

---

## B3.10 UX Surfaces (Annexe 3 compliant)
**Discord (button-first)**
- `/formation` or “Open Panel” → **ephemeral** calculator  
- Selects: castle range, front/back, march type; modal: total size  
- Buttons: **Calculate**, **Save**, **Set Default**, **Load…**, **Share** (if enabled), **Open in Dashboard**  
- Output: embedded **monospace table** + **Copy** button  
- If `formations.perUserOverrides` → **My Overrides** modal

**Web/PWA**
- Real-time calc; saved formations; import/export JSON  
- Per-Player Overrides editor (sliders with ±% constraints)  
- Template Playground (R4/R5): simulations, comparisons, release notes editor  
- **Accessibility** (Annexe 11): labelled inputs, described result tables, keyboard support

---

## B3.11 Data Model (Annexe 4 mirror) — updated
_All docs include `guildId`, `version`, `createdAt`, `updatedAt`._

### B3.11.1 `formation_templates`
- As in **B3.5**, plus `versionTag`, `releaseNotes?`, `changelog?[]`, optional `status: "draft"|"active"|"archived"`  
- **Indexes:** `{ guildId, status }`, `{ guildId, name }`, `{ guildId, versionTag }`

### B3.11.2 `user_formations`
- `guildId`, `userId`, `formationId` (ULID), `name`, `inputs`, `allocations`, `notes?`, audit/version fields

### B3.11.3 `formation_usage` (optional TTL **180d**)
- `guildId`, `userId`, `templateId?`, `at`, `context?`, audit/version

### B3.11.4 `user_formation_overrides` (NEW)
- `guildId`, `userId` (**unique**)  
- `bias?`: `{ archers?: number, mages?: number }` (e.g., ±0.05)  
- `caps?`: `{ maxPercentForOddMages?: number, … }`  
- `lastAppliedAt?`, audit/version fields

---

## B3.12 API Contracts (Annexe 14)
_Headers: `X-Guild-ID` (required), **If-Match** on updates, optional **Idempotency-Key**._

**Templates**
- `GET /formations/templates` — list active (and draft for R4/R5)  
- `POST /formations/templates` — create (R3+ local if enabled; R4/R5 master)  
- `PUT /formations/templates/{id}` — update (CAS)  
- `POST /formations/templates/{id}/publish` — set to active with `{ versionTag, releaseNotes }` **(NEW)**

**Playground (R4/R5)**
- `POST /formations/playground/calc` — batch simulate (not persisted) **(NEW)**  
- `POST /formations/playground/compare` — compare draft vs active **(NEW)**

**Calculation & Sharing**
- `POST /formations/calc` — run calculation (applies per-user overrides if enabled)  
- `POST /formations/share` — post result to a channel/thread (if enabled)

**Saved formations**
- `GET /users/{userId}/formations`  
- `POST /users/{userId}/formations` (idempotent by name)  
- `PUT /users/{userId}/formations/{formationId}` (CAS)  
- `DELETE /users/{userId}/formations/{formationId}`

**Overrides**
- `GET /users/{userId}/formation-overrides` **(NEW)**  
- `PUT /users/{userId}/formation-overrides` (CAS) **(NEW)**

**Errors**
- `400` `VALIDATION_INVALID_INPUT` / `PERCENT_OVERFLOW` / `EXACT_OVERFLOW`  
- `403` `POLICY_GUARD_DENY` / `FEATURE_DISABLED`  
- `404` `NOT_FOUND`  
- `409` `CONFLICT.WRITE_STALE`  
- `429` `RATE_LIMIT`  
- `503` `MAINTENANCE_MODE`

---

## B3.13 Observability (Annexe 8)
**Logs**
module=B.3 action=calc|save|load|delete|template.create|template.update|template.publish|playground.calc|playground.compare|overrides.get|overrides.update|share result=allow|deny reason=… actorId guildId
**Metrics**
- `formation_calculations_total{template,range,front,back}`
- `formation_overrides_applied_total{guild}` **(NEW)**
- `template_playground_runs_total{guild}` **(NEW)**
- `template_publish_total{versionTag}` **(NEW)**
- `formation_share_total{channel}`

**Alerts (soft)**
- **Overflow normalisation rate > 10%** for a template (bad defaults)  
- Playground run error rate **> 2%**  
- Publish **without** releaseNotes when flag enabled

---

## B3.14 Privacy & Retention (Annexe 10)
- Store only gameplay metadata & small override values (± percentages)  
- `formation_usage` TTL suggested **180 days**  
- Users may delete overrides and saved formations (DSR)  
- Release notes are template metadata (non-personal)

---

## B3.15 Integrations
- **Onboarding/Profile (B.4):** store default castle range & rows; expose overrides tab when enabled  
- **Events (Module H):** one-click load for relevant events (H1/H2)  
- **i18n (Module D):** all copy via keys (including release notes headings)  
- **Annexe 3:** Discord panel patterns; “Open in Dashboard” for complex edits

---

## B3.16 Discord Integration (Annexe 5 & 16)
- **Intents:** Guilds, Guild Members (role gating), Guild Messages (sharing)  
- **Permissions:** Send Messages, Manage Webhooks (rich shares)  
- Buttons/selects within platform constraints (5 rows, 5 buttons/row, 25 options/select)  
- **Ephemeral** calculator; non-ephemeral shares

---

## B3.17 Risks & Future-Proofing
- Template drift → mitigated by Playground testing & **overflow metrics**  
- Rounding disputes → expose rounding mode; default **floor**  
- Over-biasing via overrides → cap with Policy Guard (±5%) and show note in result  
- Churn → `versionTag` + release notes keep players informed  
- Migration → idempotent seeds & rename helpers (Annexe 15)

---

## B3.18 Revision
- **2025-08-15:** Added Template Playground, Template Version Notes, and Per-Player Overrides; expanded data/APIs/UX/metrics; tightened overflow rules. (**LOCKED**)

---

## Δ Delta Notes
- New flags: `formations.playground`, `formations.perUserOverrides`, `formations.templateVersionNotes`  
- Extended `formation_templates` with `versionTag`, `releaseNotes`, `changelog`, `status`  
- Added `user_formation_overrides` collection & endpoints  
- New Playground endpoints; publish flow with notes; extra metrics & alerts

## ⚙ Annexe Deltas
- **Annexe 4 (DB):** add `user_formation_overrides`; extend `formation_templates` with versioning/release notes; optional `status="draft"`  
- **Annexe 14 (API):** add `/formations/playground/*`, `/formations/templates/{id}/publish`, `/users/{id}/formation-overrides`  
- **Annexe 3 (UX):** add “My Overrides” modal; PWA Playground surface  
- **Annexe 8 (Obs):** new metrics + soft alerts above