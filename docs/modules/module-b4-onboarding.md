---
module: Module B.4 (Onboarding & Profile Builder)
version: v2025.08
status: Locked
last_updated: 2025-08-15 (Europe/London)
owners: [GuardianArrow]
annexe_refs:
  - Annexe 3 (UX Surface & Components)
  - Annexe 4 (Database Schemas)
  - Annexe 5 (Tech stack & Discord intents/scopes)
  - Annexe 6 (Policy Guard)
  - Annexe 7 (Jobs, Scheduling & Idempotency)
  - Annexe 8 (Observability)
  - Annexe 10 (Data Protection & Privacy)
  - Annexe 11 (Accessibility)
  - Annexe 14 (API Contracts)
  - Annexe 15 (Migrations & Seeds)
---

# Module B.4 — Onboarding & Profile Builder — **LOCKED**

## B4.1 Purpose
Provide a unified, Discord-authenticated onboarding journey and a modular profile builder for visitors and members. Capture identity, locale, and mandatory agreements; assign roles; and populate gameplay profile sections. Works **button-first in Discord** with seamless **“Open in Dashboard”** hand-off for longer forms.

---

## B4.2 Roles & Permissions (Policy Guard; Annexe 6)
- **Everyone (new joiner):** start/resume onboarding; view/edit own profile.  
- **Member/Elite:** edit own profile sections; update availability; manage guru skills (self-service).  
- **R3:** view onboarding status dashboard; nudge users (no role writes).  
- **R4/R5:** approve Visitor→Member upgrades; manage role assignments; configure agreement versions; gatekeeper channel settings.

_All actions go through Policy Guard with ALLOW/DENY/SOFT_ALLOW decisions logged (Annexe 8). Discord role changes are mirrored atomically (best effort; see B4.12)._

---

## B4.3 Feature Flags (per-guild; see A5.2 & Annexe 4)
- `onboarding.enabled` — master switch.  
- `onboarding.dmFallbacks` — if DMs fail, post scoped thread prompts.  
- `onboarding.reacceptOnAgreementUpdate` — force re-accept on new ToS/VOWs versions.  
- `profiles.extendedSections` — enable optional sections (Farming, Groups).  
- `profiles.availability` — enable Availability Builder.  
- `profiles.mentorOptIn` — expose “Mentor availability” switch (ties to Module F).  
- `maintenance.enabled` — global pause (Annexe 7); shows banner and blocks new publishes.

---

## B4.4 Platform & Auth
- Discord is the single auth for bot & PWA (OAuth scopes: `identify`, `guilds`).  
- A user record is created on guild join (**status `pending`**).  
- PWA auto-links via OAuth to the same Discord ID (no extra passwords).

---

## B4.5 Gatekeeper Flow & Agreements
### B4.5.1 Code of Conduct (CoC)
- Presented in chosen language (Module D; EN fallback).  
- **Must Accept** to proceed beyond Gatekeeper.  
- If **Decline** → user remains Gatekeeper-only (sees just the Gatekeeper channel with **“Start/Resume Onboarding”**).

### B4.5.2 Visitor vs Member
- Prompt: “Are you an Alliance Member?”  
  - **Visitor:** assign Visitor role; skip VOWs; proceed to Minimal Profile.  
  - **Member:** proceed to Alliance **VOWs** (B4.5.3).

### B4.5.3 Alliance VOWs (members only)
- Translated (Module D). Must Accept to obtain **Member** role.  
- Visitor→Member upgrade later **replays VOWs** first.

### B4.5.4 Versioning & Re-acceptance
- Agreements stored as `{ docType, version, acceptedAt }`.  
- When R4/R5 bumps a version and `onboarding.reacceptOnAgreementUpdate=true`, affected users are **gated until re-accept** (soft gate: notifications include reminder; optional hard gate via Policy Guard).

---

## B4.6 Localisation & Identity (Step 1)
**Fields**
- Player (in-game) name — **required**  
- Country — type-ahead shortlist (Discord select with search; PWA text-to-filter)  
- Language — from supported locales (Module D)  
- Timezone — drop-down or auto-detect in PWA; confirm selection

**Defaults:** Language → EN; Timezone → UTC if skipped.  
**Storage:** saved in `users` / `user_profile` with `guildId`, `version`, timestamps.

---

## B4.7 Profile Builder (Modular Sections)
Sections are independent (add/remove without schema break). Controlled by `profiles.extendedSections`.

### B4.7.1 Personal & Experience
- **Age range:** Under 18, 18–30, 31–50, 51+ (no DOB).  
- Years playing; short bio; multi-realm (Y/N).  
- **Guru Builder:** self-select skills (e.g., Marches & Formations, Titan Pro…). Bot assigns/removes matching Discord roles in real time.

### B4.7.2 Farming Profile
- Farming alliances (0..n): 3-letter tag + alliance castle coords (`xxxx:xxxx`)  
- Number of farms  
- Member of **CBSP?** (read-only; managed by Module B.1 join/exit)  
- Uses a farmer? (Y/N)

### B4.7.3 Gameplay Groups
- **Elite Wars Group** (A–E)  
- **Elite Adventures Role** (Main Attacker / Blocker)  
- **War of Frontiers slot:** {01–02, 10–11, 15–16, 19–20, 22–23}  
- **Team assignment:** from DB master Teams (stores Team ID + friendly name) and sets a matching Discord role (Annexe 16)

### B4.7.4 Availability Builder (if `profiles.availability`)
- For each day (Mon–Sun): create time blocks with status **Available / Limited / Quiet / Do Not Disturb**  
- Skip allowed; can edit later  
- **Quiet Hours** are honoured by notifications (Module A / Annexe 7)

### B4.7.5 Formation Defaults
- Default Front Row, Back Row (incl. Mixed), Castle Range → used by **B.3 Formation Builder**

### B4.7.6 Mentor Opt-in (if `profiles.mentorOptIn`)
- “Available to Mentor?” toggle; preferred topics from Guru roles  
- Creates a mentor availability entry consumed by **Module F**

---

## B4.8 Review & Save (Final Step)
- Show summary; allow section edits before submit  
- Save to DB; log agreement **ACCEPT** events with timestamps & versions  
- Remove Gatekeeper once **CoC** accepted (and **VOWs** if Member)  
- Visitor path: Gatekeeper removed after CoC acceptance; can **upgrade later**

---

## B4.9 UI Surfaces (Annexe 3)
**Discord (button-first)**
- Gatekeeper channel pinned message: **“Start/Resume Onboarding”** → ephemeral wizard  
- Selects for country/language/timezone; modals for name & bio; buttons for Accept/Decline  
- Minimal slash:
  - `/onboard start|resume`
  - `/onboard upgrade` (Visitor→Member)
  - `/profile view`, `/profile edit`

**Web/PWA**
- Guided multi-step form with **save progress** and **return later**  
- Localized content (Module D); right-to-left support (Annexe 11)  
- **Open in Dashboard** when Discord hits list/field limits

---

## B4.10 Data & Schemas (Annexe 4 mirror)
_All docs include `guildId`, `version`, `createdAt`, `updatedAt`._

- **`users`**: `userId`, `discordTag`, `status: "pending"|"visitor"|"member"`, `locale`, `timezone`  
- **`user_profile`**: in-game name, country, ageRange, bio, yearsPlaying, multiRealm, formationDefaults, teams/groups, WoF slot, mentorOptIn, etc.  
- **`user_availability`**: weekly blocks `{ day, startMin, endMin, status }`  
- **`agreements`**: `{ userId, docType: "CoC"|"VOWS", version, acceptedAt }`  
- **`user_guru_roles`**: `{ roleKey, grantedAt }` (also mirrored to Discord)  
- **`user_program_flags`**: e.g., `cbspMember: boolean` (readonly; updated by B.1)

**Indexes:** `{ guildId, userId }` on all; `{ guildId, status }` on `users` for dashboards.

---

## B4.11 API Contracts (Annexe 14)
_Headers: `X-Guild-ID` (required), **If-Match** on updates (CAS), **Idempotency-Key** on POSTs._

- `POST /onboarding/start` — returns current step  
- `POST /onboarding/answer` — saves step data (CAS; modular payload)  
- `POST /onboarding/accept` — `{ docType, version }` → logs acceptance; advances flow  
- `POST /onboarding/upgrade` — trigger Visitor→Member (Policy Guard checks)  
- `GET /users/{userId}/profile` / `PUT /users/{userId}/profile` — view/update (CAS)  
- `GET /users/{userId}/availability` / `PUT …` — CRUD weekly blocks  
- `GET /agreements/versions` — CoC/VOWs active version info  
- `PUT /agreements/versions` — R4/R5 set new version (triggers re-accept if flag set)

**Errors:** `400 VALIDATION_INVALID_INPUT`, `403 POLICY_GUARD_DENY`, `404 NOT_FOUND`, `409 CONFLICT.WRITE_STALE`, `429 RATE_LIMIT`, `503 MAINTENANCE_MODE`.

---

## B4.12 Jobs, Reliability & Concurrency (Annexe 7)
- **Nudges:** queued DMs/mentions for users stuck in Gatekeeper **> 24/72h**  
- **DM fallbacks** (if enabled): when DM fails, use gated thread ping; log reason  
- **CAS:** all profile/agreements writes carry `version`; stale writes → **409** → UI “Refresh & Reapply” (Annexe 3)  
- **Maintenance Mode:** blocks onboarding publishes; read-only views remain

---

## B4.13 Observability (Annexe 8)
**Logs**
module=B.4 action=start|answer|accept|upgrade|profile.update|availability.update result=allow|deny reason=… userId guildId
**Metrics**
- `onboarding_starts_total{guild}`
- `onboarding_completions_total{guild}`
- `onboarding_time_to_complete_seconds` (histogram)
- `agreement_accept_total{docType,version}`
- `gatekeeper_stuck_total{>24h,>72h}`
- `dm_fallback_total{reason}`

**Alerts (soft)**
- 10% joins stuck **>72h**  
- Agreement acceptance rate **<80%** 48h after version bump

---

## B4.14 Privacy, Retention & DSR (Annexe 10)
- **Minimization:** store age range, not DOB; no emails, no real names  
- **Retention:** onboarding logs normal; agreements retained **while in guild + 1 year** (audit), unless stricter local policy  
- **DSR:** user can export/delete profile; delete cascades (Module E) remove personal fields and agreement records; audit retains non-identifying counts

---

## B4.15 i18n & Accessibility (Module D, Annexe 11)
- All strings via **i18n keys**; EN fallback  
- Right-to-left languages supported in PWA; Discord embeds minimized & plain  
- **WCAG 2.1 AA:** labelled inputs, focus order, ARIA live regions for step changes  
- **ICU plurals** for copy (“1 step left”, “2 steps left”)

---

## B4.16 Discord Integration (Annexe 5 & 16)
- **Intents:** Guilds, Guild Members (to assign roles), DM (optional for nudges)  
- **Permissions:** Manage Roles (limited), Send Messages, Manage Threads (for Gatekeeper), Manage Webhooks (optional)  
- Component limits: **5 rows**, **5 buttons/row**, **≤25 options/select**  
- Button-first panels; **Open in Dashboard** for long lists (countries) & availability grids

---

## B4.17 Risks & Future-Proofing (Annexe 13)
- DM closed → rely on `onboarding.dmFallbacks`  
- Agreement churn → versioning + re-accept flag  
- Locale gaps → fallback EN; “Report missing translation” hook (Module D dev tools)  
- Schema growth → modular collections; avoid a monolith profile blob  
- Migration → new fields seeded idempotently with defaults (Annexe 15)

---

## B4.18 Revision
- **2025-08-15:** Migrated to Module B.4; added feature flags, CAS, DM fallbacks, agreement versioning/re-accept, availability builder gating, mentor opt-in, full API/obs/privacy/Discord sections. (**LOCKED**)

---

## Δ Delta Notes
- Consolidated Gatekeeper logic; clarified Visitor vs Member forks and upgrades  
- Added re-accept on doc version and nudges/metrics for stuck users  
- Tightened Policy Guard mapping and Discord permission scope

## ⚙ Annexe Deltas
- **Annexe 4 (DB):** confirm/add `users`, `user_profile`, `user_availability`, `agreements`, `user_guru_roles`, `user_program_flags` with `guildId/version/timestamps`  
- **Annexe 14 (API):** add `/onboarding/*`, `/users/*/profile`, `/agreements/versions`  
- **Annexe 3 (UX):** Gatekeeper launcher panel; modals/selects; dashboard hand-off  
- **Annexe 8 (Obs):** metrics + alerts listed above