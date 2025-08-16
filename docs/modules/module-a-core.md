---
module: Module A (Core System Architecture & Layers)
version: v2025.08
status: Locked
last_updated: 2025-08-15 (Europe/London)
owners: [GuardianArrow]
annexe_refs:
  - Annexe 3 (UX Surface & Components)
  - Annexe 4 (Database Schemas)
  - Annexe 5 (Tech stack & Discord intents/scopes)
  - Annexe 6 (Policy Guard rules)
  - Annexe 7 (Jobs, Scheduling & Idempotency)
  - Annexe 8 (Observability)
  - Annexe 9 (CI/CD & Release)
  - Annexe 10 (Data Protection & Privacy)
  - Annexe 14 (API Contracts)
---

# Module A — Core System Architecture & Layers (LOCKED)

## A1. Purpose
Module A defines the system-wide architecture, invariants, and cross-cutting services every feature module must follow. It is the single source of truth for:
- Auth & Identity; Roles & Permissions (**Policy Guard**)
- Internationalisation (**i18n**) & Time rules
- Data Storage & Schemas
- Notifications & Messaging plumbing
- Security, Audit, Reliability (jobs, idempotency)
- Observability (logs/metrics/traces), CI/CD, Privacy
- Feature Flags (per-guild capability switches)

All modules **MUST** adhere to Module A and the compatible annexes.

---

## A2. Project Overview

### Goals
- One hub for onboarding, coordination, events, roles, and culture.  
- Chat-first in Discord; mobile-first PWA for dashboards/forms.  
- Reduce R4/R5 admin via automation & templating.  
- Operate within **£20/month**.

### Targets
- ~100 players across time zones.  
- Primary UX: **Discord Bot**; Secondary UX: **Web PWA**.  
- Storage: **MongoDB Atlas (free tier)** + optional in-memory LRU cache.  
- Low-latency responses; **job-driven** background work.

### Core Integrations
- **Discord = authentication layer** for bot & PWA (OAuth).  
- PWA → backend API **owned by the bot service**.  
- All times stored **UTC**, displayed in user’s timezone.  
- Localisation bundles (JSON) for bot & PWA strings.  
- See **Annexe 5** for SDKs, versions, intents/scopes/permissions.

---

## A2.5 Baseline Capability Surface (summary)
(Details live in Modules and sub-modules.)
1. **Onboarding & Role Assignment** — guided flow; language/TZ; Visitor→Member; profile builder.  
2. **Permissions & Roles** — Policy Guard; role lookups; guru/specialist role assignment.  
3. **Events & RSVP** — creation, templates, RSVPs, reminders; **Discord Scheduled Events mirroring**.  
4. **Announcements** — scheduled broadcasts; multi-language; **Quiet Hours** aware.  
5. **Directory & Profiles** — search; cards; availability; mentor matching.  
6. **Moderation** — mute/warn/kick/ban; audit logs.  
7. **Web PWA** — login with Discord; calendars; bulk ops; analytics.  
8. **Data & Storage** — Mongo schemas; **TTL & cleanup jobs**.  
9. **Notifications** — DMs, channel posts, optional web push.  
10. **Feature Flags** — per-guild toggles to enable/disable at runtime.

---

## A3. High-Level Architecture

### Apps
- **bot** — Discord interactions, component handlers, event mirroring, alerts.  
- **api** — REST/GraphQL for PWA; policy checks; audit; rate-limit & auth.  
- **web** — PWA (mobile-first, offline-friendly reads, i18n).  
- **worker** — queues, reminders, rollups, cleanup, exports.

### Shared packages
- **policy** — Policy Guard rules & helpers (reads Feature Flags).  
- **schema** — TS types & JSON Schemas (mirrors Annexe 4).  
- **i18n** — Module D keys & locale bundles.

### Data
- **MongoDB Atlas** (Annexe 4); **TTL indexes** where viable; scheduled cleanup jobs otherwise.

### Telemetry
- Logs/Metrics/Traces (Annexe 8).

### CI/CD
- GitHub Actions; **Blue-Green** deploy; release discipline (Annexe 9).

### Privacy
- DPA, retention, DSR (Annexe 10).

---

## A4. Auth & Identity
- PWA OAuth scopes: `identify`, `guilds`.  
- Bot installation scopes: `bot`, `applications.commands`.  
- Every record **scoped by `guildId`** (multi-guild safety; no cross-guild leakage).  
- Identifiers are **Discord IDs** (no emails/real names).  
- Discord intents/scopes & bot permissions detailed in Annexe 5.

### A4.1 Data Invariants (normative)
All mutable documents MUST include:
- `guildId: string` (required, indexed)  
- `version: int` (CAS; see **A9.2**)  
- `createdAt: ISODate`, `updatedAt: ISODate`  
- Soft-delete when applicable: `deletedAt?: ISODate`, `deletedBy?: string`  
  - Hard deletes only for privacy erasure (Annexe 10).

---

## A5. Roles & Permissions (**Policy Guard**)
- Rank roles: **R5, R4, R3, Elite, Member, Visitor**.  
- Program/Specialist roles (e.g., **CBSP Manager/Member**, **Mentor**) & **Guru** roles (skills).

**Policy Guard** is authoritative for authorization:
- Minimum rank per action; role ownership/manager checks.  
- **Quiet Hours & rate-limit aware** broadcast gating.  
- **Feature Flag evaluation before permission checks** (see **A5.2**).  
- All decisions **ALLOW / DENY / SOFT_ALLOW** logged with reasons (Annexe 8).  
- Command defaults are minimal; rely on Policy Guard + Discord role checks.

### A5.1 Default Capability Matrix (baseline reference)
(Policy Guard may override; this is the default template.)

| Role   | Create Events | Manage Roles | Broadcast | Approve Plans | Moderate | Kick/Ban | Mute | RSVP | View Schedules | Set Availability |
|--------|----------------|--------------|-----------|---------------|----------|----------|------|------|----------------|------------------|
| **R5** | ✅              | ✅            | ✅         | ✅             | ✅        | ✅        | ✅    | ✅    | ✅              | ✅                |
| **R4** | ✅ (Promote)    | ✅            | ✅         | ✅             | ✅        | ✅        | ✅    | ✅    | ✅              | ✅                |
| **R3** | ❌              | ❌            | ✅         | ❌             | ✅        | ❌        | ✅    | ✅    | ✅              | ✅                |
| **Elite** | ❌           | ❌            | ❌         | ❌             | ❌        | ❌        | ❌    | ✅    | ✅              | ✅                |
| **Member** | ❌          | ❌            | ❌         | ❌             | ❌        | ❌        | ❌    | ✅    | ✅              | ✅                |
| **Visitor** | ❌         | ❌            | ❌         | ❌             | ❌        | ❌        | ❌    | ❌    | ✅ (limited)    | ❌                |

### A5.2 Feature Flags (per-guild; runtime)
**Purpose.** Enable/disable modules and fine-grained capabilities per guild **without redeploys**.  
**Storage.** `settings.featureFlags` in Annexe 4 (schema below).

**Example keys (namespaced):**
- `events.enabled`, `events.eliteWars`, `events.wof`, `events.publishToDiscordScheduler`  
- `cbsp.enabled`, `cbsp.depotEditing`  
- `shields.enabled`  
- `mentor.enabled`, `mentor.maxStudents`  
- `culture.enabled`, `culture.quizzes`, `culture.kudos`  
- `attendance.bulkMarking`  
- `maintenance.enabled` (see **A7.1/A9.1**)

**Evaluation order (per request)**
1. **Maintenance Mode** hard-deny gate (A7.1/A9.1).  
2. **Feature Flag** resolution (guild-scoped; default **false** if missing).  
3. **Policy Guard** permission checks (role/rank, program membership).

**Outcomes.**
- Disabled feature → **SOFT_ALLOW=false**: explain “Feature unavailable” with key name.  
- Logs include `{ flagKey, evaluated=false }`.  
- UI hides disabled controls; slash handlers reply with localized notice.

**Ops.**
- Flags editable by **R5** via PWA admin (Annexe 14 endpoints).  
- Changes **audited** and **effective immediately**; workers re-read flags on job start.

---

## A6. Localization & Time
- **Module D** manages i18n keys, locales, ICU plurals, and RTL.  
- **Supported (Phase 1):** EN (fallback), Arabic, German, Lithuanian, Serbian, French, Portuguese, Spanish, Vietnamese, Chinese, Korean, Russian, Polish, Ukrainian, Brazilian Portuguese, Venezuelan Spanish, Romanian, Swedish.  
- **Times:** store **UTC**, display user-local TZ (profile setting or auto-detected on first PWA visit).  
- Reminder/job logic uses **UTC**; only formatting is TZ-localized.

---

## A7. Notifications & Messaging
- Delivery: **DM**, channel posts, **web push** (opt-in).  
- Audience targeting by roles/programs/teams; **Quiet Hours honored**.  
- **Job-driven** with retries & dedupe (Annexe 7).  
- For **Discord Scheduled Events mirroring** see Module H (Events) and Annexe 5.

### A7.1 Maintenance Mode (global pause)
A global maintenance flag pauses reminder/broadcast fan-out and prevents new publishes.
- **UX:** Leader panels show “Maintenance Mode active—sends paused.”  
- **Delivery:** Workers enqueue but **do not deliver** alerts while enabled (Annexe 7).  
- **Scope:** Applies to reminders, broadcasts, and publish actions; read-only views remain.  
- **Control:** `settings.maintenance.enabled` (Annexe 4) and Feature Flag `maintenance.enabled`.

---

## A8. Security & Audit
- **Least-privilege** bot role; prefer channel overrides over broad server perms.  
- All privileged operations **logged**: who/what/when/reason (Annexe 8).  
- **Secret rotation** quarterly; scoped tokens per environment.  
- **Backups & restore drills** (Annexe 9).

---

## A9. Reliability & Jobs
- Work queues with **priority lanes**, **idempotency keys**, **dedupe windows**.  
- Retry policy with **bounded exponential backoff**; **DLQ** for non-retryable failures.  
- Scheduling windows and **jitter** to avoid Discord 429 storms.  
- Full policy: **Annexe 7**.

### A9.1 Maintenance Gate
Workers check `settings.maintenance.enabled === true` → **queue only**, do not deliver.  
Critical safety (e.g., privacy deletions) may bypass via `jobs.allowDuringMaintenance=true`.

### A9.2 Optimistic Concurrency & Conflict Handling (**LOCKED**)
**Mechanism**
- Every mutable document includes `version:int` and `updatedAt:ISO`.  
- Compare-and-swap: match `{ _id, version }`; on success apply update and `version++`.  
- Stale write → **409 CONFLICT** with `reason=CONFLICT.WRITE_STALE` + latest snapshot.

**Where applied**
- `events`, `event_templates`, `event_attendance_batches`  
- `cbsp_members`, `cbsp_depot`, `cbsp_requests`  
- `shields_posts`, `shields_subscriptions`  
- `mentor_pairs`, `mentor_spaces`  
- `users` (profile & availability), `culture_posts`, `kudos`, `badges`

**API / UI**
- HTTP: **ETag/If-Match** (responses `ETag: W/"<version>"`; clients send **If-Match**).  
- Discord modals & PWA forms include `version`; conflicts show **Refresh & Reapply** (Annexe 3) with friendly diffs.

**Jobs**
- Treat **409** as retryable with short jitter; re-read latest; re-apply if applicable.

**Observability**
- Log conflicts: `result=deny`, `reason=CONFLICT.WRITE_STALE`, include `{ previousVersion, attemptedVersion }`.  
- Metric: `am_conflicts_total{module,type}`; dashboard of top entities by conflict rate (24h).  
- See **Annexe 8**.

---

## A10. Observability & SLOs
- **Standard JSON logs**; counters/gauges/histograms; **OpenTelemetry** traces.  
- **Key SLOs** (Annexe 8): alert timeliness, API latency, job failure rate, conflict rates.  
- Dashboards **per guild** + global rollups.  
- Feature Flag telemetry: `am_feature_flag_eval_total{flagKey,enabled}`.

---

## A11. CI/CD
- **Trunk-based**; protected `main`.  
- **Staging → smoke → manual approval → Blue-Green prod**.  
- Slash commands registered to **staging guild** first.  
- Full pipeline & rollbacks: **Annexe 9**.  
- **Pre-release check** lists Feature Flags diff per guild (intended on/off state).

---

## A12. Privacy
- UK/EU **GDPR** alignment; **data minimization** (age range, not DOB).  
- Retention schedules & **Data Subject Requests** (Annexe 10).  
- No sensitive personal info beyond **Discord IDs & gameplay metadata**.  
- Feature Flags are configuration, not personal data; **audited** changes include actor/time.

---

## Cross-References
- **Annexe 3** — UX Surface & Components (Discord button-first + Refresh & Reapply)  
- **Annexe 4** — Database Schemas (includes `guildId`, `version`, `settings.featureFlags`, `settings.maintenance`)  
- **Annexe 5** — Tech stack & Discord intents/scopes and bot permissions  
- **Annexe 6** — Policy Guard rules (reads Feature Flags)  
- **Annexe 7** — Jobs, Scheduling & Idempotency (respects Maintenance & Feature Flags)  
- **Annexe 8** — Observability taxonomy (logs/metrics/traces; conflict & flag metrics)  
- **Annexe 9** — CI/CD & Release (pre-release flags check)  
- **Annexe 10** — Data Protection & Privacy  
- **Annexe 14** — API Contracts (endpoints to get/update Feature Flags)  
- **Module D** — i18n & Localization platform  
- **Module B** — Events engine (templates, lifecycle, attendance; may be flag-gated)

> ✅ **Locked** as of **2025-08-15 (Europe/London)**.