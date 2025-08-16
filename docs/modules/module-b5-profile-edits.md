---
module: Module B.5 (Profile Edits & Removals)
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
  - Annexe 16 (Server layout & permission templates)
  - Annexe 13 (Risk & Future-Proofing)
---

# Module B.5 — Profile Edits & Removals — **LOCKED**

## B5.1 Purpose
Provide players a fast, safe way to update profile data **and** a clean, auditable exit that removes personal data, cancels alerts, and prevents orphaned references—whether the user runs “exit server” or simply leaves the Discord guild.

---

## B5.2 Roles & Permissions (Policy Guard; Annexe 6)
- **Member / Elite:** view & edit own profile; request exit.  
- **R3:** view onboarding/profiles dashboard (read-only); nudge users (no role writes).  
- **R4 / R5:** admin purge (hard delete), set grace window, configure Gatekeeper channel, manage role removals, run bulk exports (DSR).  
_All decisions go through Policy Guard (ALLOW / DENY / SOFT_ALLOW) with reasons logged (Annexe 8)._

---

## B5.3 Feature Flags (per-guild; see Module A §A5.2 & Annexe 4)
- `profiles.edit.enabled` — master switch for profile editing  
- `profiles.exit.enabled` — enables exit server flow  
- `profiles.exit.graceWindowDays` — integer; default **0** (disabled)  
- `onboarding.dmFallbacks` — DM→scoped thread fallback (reuse from B.4)  
- `maintenance.enabled` — global pause (Annexe 7); blocks **new destructive** actions unless `jobs.allowDuringMaintenance=true` for privacy ops

---

## B5.4 Scope & Principles
- **Discord ID + guildId** are the single source-of-truth keys  
- Low-friction edits via Discord buttons/modals; **Open in Dashboard** for long forms/bulk  
- **Privacy-first deletions:** personal/profile data is hard deleted; operational aggregates anonymised  
- **Rejoin-safe (optional):** tombstone checkpoint enables restore during a grace window

---

## B5.5 Profile Editing
### B5.5.1 Access Points
- **Discord:** `/profile edit` → ephemeral panel (buttons/selects/modals)  
- **Web/PWA:** “My Profile” tabs: Personal, Farming, Groups, Availability, Formation Defaults

### B5.5.2 Editable Sections
- **Personal/Experience:** country, language, timezone, age range, years playing, bio, multi-realm  
- **Guru skills:** add/remove → bot grants/removes matching Discord roles in real time  
- **Farming:** alliances (abbr + coords), number of farms, “uses a farmer”  
  - `memberOfCBSP` is **read-only** (managed by Module B.1)  
- **Gameplay groups:** Elite Wars group, Elite Adventures role, WoF timeslot, Team (sets matching Discord role, Annexe 16)  
- **Availability:** Mon–Sun blocks: Available / Limited / Quiet / DND; reset to defaults  
- **Formation defaults:** Front/Back (incl. Mixed), Castle Range (feeds Module B.3)

### B5.5.3 Validation & UX
- Required: player name, country, language, timezone  
- Fallbacks remain EN/UTC if unset  
- All timestamps saved in **UTC**; displayed user-local  
- **Optimistic concurrency:** updates use **If-Match** (see B5.10); stale writes show **“Refresh & Reapply”** (Annexe 3)

### B5.5.4 Logging
- Lightweight audit: `lastEditedAt`, section key, `editorId` (self vs admin), result

---

## B5.6 Exit Server — User Initiated
### B5.6.1 Triggers
- **Discord:** `/account exit` or button on profile panel  
- **Web/PWA:** “Delete Account & Data” in settings

### B5.6.2 Confirmation (2-step)
1) Warning modal/summary (localized) with explicit list of deletions & effects  
2) Type-to-confirm (**DELETE**) or Confirm button

### B5.6.3 Immediate Effects (Atomic)
**Hard delete of:**  
- `user_profile`, `user_availability`, formation defaults & **saved formations** (Module B.3), **agreements** (CoC/VOWs), **guru/program flags**  
- Program links: CBSP member linkages severed (historical CBSP aggregates kept but **anonymised**)
- **Shield** subscriptions & **pending alerts** (Module B.2)

**Service unlinks:**  
- Cancel reminders & queues (events, shields, availability) via **job fan-out cancel** (Annexe 7)  
- Remove from open rosters/queues elsewhere

**Discord roles:**  
- Remove all roles; assign **Gatekeeper** only; restrict visibility to Gatekeeper channel with “You may now exit the server”

**Sessions/tokens:**  
- Invalidate PWA sessions (logout everywhere)

### B5.6.4 Optional Grace Window
If `profiles.exit.graceWindowDays > 0`:
- Create **tombstone** `{ userId, guildId, deletedAt, restoreUntil }` (no personal fields)  
- If user rejoins & requests restore **before** `restoreUntil`, allow restore; else **auto-purge**

---

## B5.7 Auto-Cleanup on Actual Leave (`guildMemberRemove`)
When Discord signals a leave **without** running exit:
- Perform the same deletion routine (hard delete, cancel alerts, anonymise operational data)  
- No Gatekeeper assignment (user already gone)  
- Log the cleanup event (admin dashboard)

---

## B5.8 Data Ownership & Retention
- **Hard delete:** all user-owned profile data & agreements  
- **Keep (anonymised):**
  - CBSP collection aggregates, depot totals (program-owned). Replace player ref with `"Deleted User #<hash>"`  
  - Shield post history created by others remains; if user was **host**, mark host as `"Deleted User #<hash>"` and **auto-close** active posts
- Minimal audit: store **non-PII markers** (hashed ID, action type, timestamp) for integrity  
- Retention & DSR flows per **Annexe 10**

---

## B5.9 UI & Commands (Annexe 3)
**Discord**
- `/profile view` — read-only summary  
- `/profile edit` — open panel  
- `/account exit` — begin exit flow  
- `/account cancel-exit` — only if grace window and pending  
- **Admin (R4+):** `/account purge @user` — hard delete + cancel alerts (rate-limited)

**Web/PWA**
- “My Profile” tabs; edit per section  
- “Delete Account & Data” button  
- If Gatekeeper: “Start/Resume Onboarding” (Module B.4)

---

## B5.10 API Contracts (Annexe 14)
_Headers: `X-Guild-ID` (required), **If-Match** (updates), **Idempotency-Key** (POST/DELETE)._

- `GET /users/{userId}/profile` — fetch view  
- `PUT /users/{userId}/profile` — update (**CAS**, 409 on stale)  
- `GET /users/{userId}/availability` / `PUT` — CRUD weekly blocks  
- `POST /account/exit` — initiate exit; returns summary & **confirmation token**  
- `DELETE /account/exit` — confirm delete (**idempotent**)  
- `POST /account/restore` — within grace window (if enabled)  
- **Admin:** `DELETE /admin/users/{userId}` — purge (Policy Guard enforces R4+)

**Error families:**  
`400 VALIDATION_INVALID_INPUT` • `401 UNAUTHENTICATED` • `403 POLICY_GUARD_DENY` • `404 NOT_FOUND` • `409 CONFLICT.WRITE_STALE` • `409 EXIT_IN_PROGRESS` • `429 RATE_LIMIT` • `503 MAINTENANCE_MODE`

---

## B5.11 Jobs & Reliability (Annexe 7)
- **Exit orchestrator** performs: cancel reminders, remove roles, delete docs, anonymise aggregates, create tombstone (if configured)  
- **Idempotent** with `Idempotency-Key`; retries with bounded backoff; **DLQ** on persistent failures  
- **Maintenance Mode:** destructive actions require `jobs.allowDuringMaintenance=true` (privacy ops allowed); else queued & paused  
- **DM fallbacks:** if DMs closed, use scoped thread pings; log reason

---

## B5.12 Observability (Annexe 8)
**Logs**
module=B.5 action=profile.update|exit.request|exit.confirm|auto.cleanup|admin.purge result=allow|deny reason=… userId guildId
**Metrics**
- `profile_edits_total{section}`
- `exits_requested_total` / `exits_completed_total`
- `auto_cleanups_total`
- `exit_time_to_complete_seconds` (histogram)
- `dm_fallback_total{reason}`

**Alerts**
- Spike in **auto-cleanups** (> X/day)  
- Exit **failures** in DLQ > threshold

---

## B5.13 i18n & Accessibility (Module D / Annexe 11)
- All strings via **i18n keys**; EN fallback; RTL supported in PWA  
- Exit warnings use **ICU plurals** & clear, non-color cues  
- Keyboard-accessible modals; focus returns to primary action; **ARIA live** updates

---

## B5.14 Discord Integration (Annexe 5 & 16)
- **Intents:** Guilds, Guild Members (role management)  
- **Permissions:** Manage Roles (limited), Send Messages, Manage Threads (Gatekeeper), Manage Webhooks (optional)  
- Component limits respected: **5 rows/message**, **5 buttons/row**, **≤25 options/select**  
- Button-first flows with **Open in Dashboard** for long edits/exports

---

## B5.15 Risks & Future-Proofing (Annexe 13)
- **Partial deletes:** operations are transactional per entity; orchestration **retries idempotently**  
- **Race with departure:** guild leave may fire mid-exit; handler treats both paths as **idempotent delete**  
- **Program orphans:** enforce cascade cleanup for CBSP, Shields, Events  
- **Data growth:** TTL indexes for tombstones; review retention in Annexe 10

---

## B5.16 Integrations & Cascades
- **Module B.1 (CBSP):** remove CBSP role; sever member links; anonymise prior aggregates; `user_program_flags.cbspMember=false`  
- **Module B.2 (Shields):** remove subscriptions, cancel alerts, close hosted posts (host → Deleted User #…); notify subscribers host unavailable  
- **Module B.3 (Formations):** delete saved formations & usage history  
- **Module B.4 (Onboarding):** delete agreement acceptances; re-accept required on rejoin  
- **Module H (Events):** cancel pending reminders; mark attendance “Left Guild”; keep event aggregates

---

## B5.17 Revision
- **2025-08-15:** Migrated to Module B.5; added feature flags, CAS & “Refresh & Reapply”, maintenance gates, DM fallbacks, tombstone grace window, full API/obs/privacy/Discord alignment. (**LOCKED**)

---

## Δ Delta Notes
- Unified exit orchestration with **idempotent jobs**; standardized headers & error codes  
- Added **grace window** via tombstones (optional)  
- Tied all **destructive actions** into Maintenance Mode policy  
- Clarified **program data ownership** & anonymisation

## ⚙ Annexe Deltas to apply
- **Annexe 4 (DB):** ensure `users`, `user_profile`, `user_availability`, `agreements`, `user_guru_roles`, `user_program_flags`, `tombstones` include `{ guildId, version, createdAt, updatedAt }`; add **TTL** on `tombstones.restoreUntil`  
- **Annexe 14 (API):** add endpoints listed in **B5.10**; require `X-Guild-ID`, `If-Match`, `Idempotency-Key`  
- **Annexe 7 (Jobs):** add `exit_orchestrator`, `cascade_cleanup`, `dm_fallback_sender`  
- **Annexe 8 (Telemetry):** add metrics & alerts listed in **B5.12**  
- **Annexe 3 (UX):** add profile panel actions, exit modal, dashboard hand-off  
- **Annexe 16 (Discord Layout):** confirm Gatekeeper channel & permissions
