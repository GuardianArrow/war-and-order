---
module: Module B.7 (Events Core)
version: v2025.08
status: Locked
last_updated: 2025-08-15 (Europe/London)
owners: [GuardianArrow]
annexe_refs:
  - Annexe 3 (UX Surface & Components)
  - Annexe 4 (Database Schemas)
  - Annexe 5 (Discord intents/scopes/permissions)
  - Annexe 6 (Policy Guard)
  - Annexe 7 (Jobs, Scheduling & Idempotency)
  - Annexe 8 (Observability)
  - Annexe 10 (Data Protection & Privacy)
  - Annexe 11 (Accessibility)
  - Annexe 14 (API Contracts)
---

# Module B.7 — Events Core — **LOCKED**

## B7.1 Purpose
Provide one authoritative engine for creating, scheduling, publishing, running, and reporting alliance events and scoped activities. All event types in **B7.x** sub-modules inherit these rules.

**Goals**
- Consistent data model & lifecycle for every event  
- Visibility scoping: **alliance / program / private**  
- Optional mirroring to **Discord Scheduled Events**  
- Robust RSVP, reminders, attendance, reporting  
- Safe ops: **Policy Guard**, feature flags, **maintenance gate**, optimistic concurrency

---

## B7.2 Event Types & Scope (definitions)
- **Alliance-wide:** visible to whole server (Member+). Typically mirrored to Discord Scheduled Events.  
- **Program-scoped:** visible to a program’s roles (e.g., CBSP, Mentors). Not mirrored by default.  
- **Private / participant-scoped:** only selected user IDs (+ R4/R5).  
- **Ad-hoc:** one-off player events not saved to the master template list.

---

## B7.3 Feature Flags (per-guild; see Module A §A5.2, Annexe 4)
- `events.enabled` — master toggle  
- `events.publishToDiscordScheduler` — default policy  
- `events.allowAudiencePreviewBypass` — default **false**  
- Per-type toggles (e.g., `events.eliteWars`, `events.wof`)  
- Global `maintenance.enabled` (Annexe 7) applies to publish & reminder fan-out

---

## B7.4 Permissions (Policy Guard; Annexe 6)
- **R5:** full control  
- **R4:** create/manage; override caps/quotas; publish/cancel/postpone  
- **R3:** create/manage only if a sub-module sets `hostRoleMin = R3`  
- **Owner/Managers:** manage their own events within Policy Guard rules

**Order of checks:** **Feature Flags → Maintenance Gate → Policy Guard (rank/role) → Action**

---

## B7.5 Master Event Template List
**Owner:** R4/R5 only. Ensures consistent naming/descriptions/durations.

**Template fields**
- `name` (unique), `description` (markdown / i18n key), `defaultDuration` (HH:MM)  
- `relatedRolesTeams[]` (role IDs, team IDs with friendly names)  
- `maxCapacity?`  
- `defaultVisibilityScope` ∈ `alliance|program|private`  
- `defaultRSVPOptions` (Yes/Maybe/No or custom)  
- `defaultNotificationPattern` (e.g., 24h/1h/15m/start)  
- `notes?` (admin)  
- `status` ∈ `active|archived`

**Behaviour**
- Editing a template **does not** change already scheduled events  
- Archived templates hidden from new creation; analytics preserved

---

## B7.6 Data Model (authoritative; see Annexe 4 for types/indexes)
_All docs include `{ guildId, version, createdAt, updatedAt }` and use CAS._

**Identity & Admin**
- `eventId`, `type` (Elite Wars, WoF, Meeting, Training, Custom)  
- `templateId?`, `title`, `description` (i18n key; EN fallback)  
- `ownerId`, `managers[]`

**Timing**
- `startUTC`, `endUTC`, `durationMin` (derived)  
- `recurrence?` (RRULE/presets)  
- `timeSlots[]?` (slot-based signups)

**Scope & Publishing**
- `visibilityScope: "alliance"|"program"|"private"`  
- `programKey?` (when scope=program)  
- `participants[]?` (when scope=private)  
- `publishToAppCalendar: true`  
- `publishToDiscordAnnouncement: boolean`  
- `publishToDiscordScheduler: boolean`  
- `announceChannelId?`, `schedulerEventId?`

**Attendance & Signup**
- `capacity?`, `roleQuotas?`  
- `rsvp[]` (Going | Maybe | No; with timestamps & source)  
- `waitlist[]`  
- `teams[]?/squads[]?` (A/B/C… + `autoAssignStrategy?`)

**Status & Audit**
- `status: "Draft"|"Scheduled"|"Live"|"Completed"|"Cancelled"`  
- `audit { createdBy, createdAtUTC, edits[] }`

**Extensions**
- `params { ... }` (event-specific fields used by B7.x sub-modules)

---

## B7.7 Lifecycle & Status
**States:** Draft → Scheduled → Live → Completed | Cancelled

**Create (Draft)**
- Select type/template; set scope; enter basics  
- Fully editable; not visible to audience

**Publish (→ Scheduled)**
- **Audience Preview (mandatory):** show recipient count + first **N** samples; confirm  
- Post announcement to scoped channel/thread; create **Discord Scheduled Event** if enabled  
- Generate RSVP controls (buttons/web form); optionally auto-create discussion thread

**Start (→ Live)**
- Auto at `startUTC`  
- Post “Live now”; lock time/title unless R4/R5 override (logged)

**End & Closure**
- Alliance-wide → auto **Completed**  
- Program/Private → prompt host: “Did this event take place?”
  - **Yes** → Completed  
  - **No** → Reschedule (collect new times, keep RSVPs) **or** Cancelled  
  - **No response** → nag after 10 min; then **soft-cancel** with “Reschedule?” quick action

**Manual Cancel**
- Any pre-Completed state (Live cancel requires reason; audit log)

---

## B7.8 Rescheduling Flow (Program/Private)
- Prompt → new `startUTC/endUTC` (or duration) → keep RSVPs & waitlist  
- Sync announcements & **native scheduler** (if mirrored)  
- DM attendees about change (**Quiet Hours** aware)

---

## B7.9 Visibility & Publishing Rules
**Visibility**
- **Alliance-wide** → public announcements channel(s); appears in **Alliance calendar**  
- **Program** → program channels only; **Program calendar**  
- **Private** → private channel/thread; visible only to participants (+ R4/R5); **My Events**

**Publishing Targets**
- App calendar (always)  
- Discord announcement (scoped channel)  
- Discord **Scheduled Event** (toggle; defaults in B7.17)

**Calendar Views (PWA)**
- **My Events**, **Alliance**, **Program**, **Team/Squad**, **Admin All** (with scope badges)

---

## B7.10 RSVP & Signups
- Options: **Going / Maybe / No** (sub-modules may add quotas, teams, or slot pickers)  
- Waitlist **auto-promotion** → DM notice  
- Track RSVP **source** (bot/web) & **timestamps**  
- Enforce **scope visibility** in bot & PWA

---

## B7.11 Notifications & Reminders
Default ladder: **24h, 1h, 15m, start** (sub-modules may override).
- **Quiet Hours** respected (critical alerts can bypass per type)  
- **DM fallback:** if DM fails, ping once in the scoped thread; log failure reason (Annexe 5/8)  
- **ICS export** per user (local TZ)  
- **Maintenance Mode:** reminder fan-out paused; leaders see banner; **publish blocked**

---

## B7.12 Discord Scheduled Events (native) Integration
- When `publishToDiscordScheduler=true`, bot creates/updates native Scheduled Event with **title/desc/start/end/location**  
- Our engine is the **source of truth** for RSVP/teams/slots  
- **Drift detection:** job compares native vs core; if mismatch → log **SOFT_ALERT**, DM owners; we do **not** auto-overwrite by default  
- Cancel/reschedule **syncs** to native event

---

## B7.13 Event Assets & Resources
Attach relevant docs/images/links to each event.

**Fields per asset**
- `assetName`, `assetType` (Image, PDF, Doc, Sheet, Link)  
- `storageRef` (Discord attachment / external URL / internal PWA object)  
- `visibility` (matches event scope)  
- `versionHistory[]` (optional)

**Permissions**
- Owner/Managers manage own event assets; R4/R5 may edit/remove any  
- Participants can view/download within scope

**UX**
- PWA: **Assets** tab on event  
- Discord: bot posts asset summary in event thread on publish/edit

---

## B7.14 Attendance (hooks to Attendance Core)
**States:** Present, Late, No-show, Left Early, Excused

**Interfaces**
- “Open Attendance” (during/post)  
- **Bulk grid** in PWA with keyboard shortcuts (**A**=Present, **L**=Late, **X**=No-show, **I**=Excused), range select, undo  
- Slot-aware marking for slot-based events

_Pre-declines → pre-set to **Excused** (editable post-event). Profiles store attendance history (retention per Annexe 10)._

---

## B7.15 Reporting & Analytics
- Participation by type/date/scope; **RSVP vs actual**  
- **Slot utilisation** (for slot events)  
- **No-shows & late cancels**  
- **Per-template usage** (e.g., “Elite Wars scheduled N times last month”)  
- Export **CSV** for R4/R5

---

## B7.16 API Contracts (Annexe 14)
_Headers: `X-Guild-ID` (required), **If-Match** (updates), **Idempotency-Key** (POST/DELETE)._

Examples
- `POST /events` (from template or ad-hoc)  
- `PATCH /events/{id}` (If-Match CAS)  
- `POST /events/{id}:publish` (audience preview required)  
- `POST /events/{id}:cancel` / `:postpone` / `:reschedule`  
- `POST /events/{id}/rsvp`  
- `POST /events/{id}/assets`  
- `POST /events/{id}/attendance:open|bulkMark|close`

**Errors:** `400 VALIDATION` • `401 UNAUTH` • `403 POLICY_GUARD_DENY` • `404 NOT_FOUND` • `409 CONFLICT.WRITE_STALE` • `429 RATE_LIMIT` • `503 MAINTENANCE_MODE`

---

## B7.17 Defaults & Config
- **Scheduler default:** Alliance-wide **ON**; Program/Private **OFF**  
- **Reminder ladder:** 24h / 1h / 15m / start  
- **Auto-close:** Alliance-wide auto-Completed; Program/Private ask for confirmation  
- **Audience Preview:** **mandatory** before publish/broadcast (count + first N samples; confirm)

---

## B7.18 Reliability & Concurrency (Annexe 7)
- **Optimistic Concurrency:** version CAS; **409** returns latest snapshot  
- **Refresh & Reapply** (Annexe 3) on Discord/PWA conflicts  
- **Jobs:** idempotent reminders; **jittered fan-out**; **DLQ** for non-retryable  
- **Maintenance Gate:** workers enqueue but do not deliver while active (except critical jobs if configured)

---

## B7.19 Security, Privacy, i18n, Accessibility
- **Security:** least-privilege bot; role-scoped channels/threads; audit all privileged ops  
- **Privacy:** gameplay metadata only; retention per Annexe 10; DSR flows supported  
- **i18n:** all strings via Module D; ICU plurals; fallback EN  
- **Accessibility:** button-first UX; PWA grid keyboard navigation; ARIA labels; avoid color-only cues

---

## B7.20 UI Surfaces & Commands (Core)
**Discord (button-first, Annexe 3)**
- Event Panel: **Create Draft**, **My Events**, **Publish**, **Cancel/Postpone**, **RSVP**, **Select Time-Slot**, **Open Attendance**, **Assets**  
- **Audience Preview** confirm modal on publish/broadcast  
- Native Scheduled Event mirroring (if enabled) is automatic

**Slash (minimal)**
/event create
/event edit <id>
/event publish <id>
/event cancel|postpone <id>
/event rsvp <id> going|maybe|no
/event list [type|scope|range]
/event report [range|type|scope] (R4+)

**Web/PWA**
- Calendar (month/week/list) with filters; Create/Edit wizard (General, Scope & Publishing, Signup, Teams/Slots, Reminders, Templates)  
- One-click **Copy previous** & **Use template**  
- **Bulk attendance** grid (A/L/X/I shortcuts)  
- **Assets** tab; **ICS export**

---

## B7.21 Observability & SLOs (Annexe 8)
**Logs**
module=B.7 action=create|publish|postpone|cancel|drift_check|reminder_fanout result=allow|deny reason=... eventId ...

**Metrics**
- `events_published_total{scope,type}`
- `events_reminders_sent_total{ladder}`
- `events_scheduler_drift_total`
- `dm_fallback_total{reason}`
- `am_conflicts_total{module="B.7"}`

**Alerts**
- Drift detected for mirrored events  
- Reminder **DLQ growth**  
- High conflict rate (>X/hour)

---

## B7.22 Integrations & Cascades
- **B1 (CBSP):** program/private **CBSP Clean Window** events; scheduler OFF by default  
- **B2 (Shields):** shield ops can spawn private activities (usually not mirrored)  
- **B3 (Formations):** templates may link recommended formations in **Assets**  
- **B4 (Onboarding):** Availability suggests times; conflict hints during creation  
- **B5 (Profile Edits):** profile deletion removes RSVPs/attendance  
- **B6 (Mentor):** mentor sessions as private events; scoped channels/threads  
- **Module D:** localized strings  
- **Annexe 5:** intents/scopes; bot permissions; DM fallback  
- **Annexe 7:** jobs/idempotency/maintenance  
- **Annexe 14:** API contracts & error families

---

## B7.23 Revision
- **2025-08-15:** Initial consolidation into **Module B.7 (Core)**; merged audience preview, DM fallbacks, drift detection, maintenance gate, CAS, attendance hooks, assets, defaults. (**LOCKED**)

---

## Δ Delta Notes (what changed & why)
- Unified previously split “G / 4.0” drafts into a single, numbered module under **B.7**  
- Added **Audience Preview** (recipient count + samples) as mandatory  
- Cemented **DM fallback** behaviour and logging  
- Added **drift detection** for native Discord events  
- Integrated **Maintenance Mode** gate and feature flags  
- Standardized **API contracts & error families**; jobs & observability wiring

## 📎 Annexe Deltas to Apply
- **Annexe 4 (DB):** ensure `events`, `event_templates`, and (if used) `event_assets`, `attendance_batches` include `{ guildId, version, createdAt, updatedAt }`  
- **Annexe 14 (API):** add/confirm endpoints & headers listed in **B7.16**  
- **Annexe 7 (Jobs):** add `events_reminder_fanout`, `scheduler_drift_check`  
- **Annexe 8 (Telemetry):** add metrics/logs/alerts above  
- **Annexe 3 (UX):** ensure publish preview & bulk attendance shortcuts are documented  
- **Annexe 5 (Discord):** note scheduled events mirroring & drift check under “Operational risks”
