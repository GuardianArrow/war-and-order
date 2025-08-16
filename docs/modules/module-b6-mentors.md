---
module: Module B.6 (Player Mentor Program)
version: v2025.08
status: Locked
last_updated: 2025-08-15 (Europe/London)
owners: [GuardianArrow]
annexe_refs:
  - Annexe 3 (UX Surface & Components)
  - Annexe 4 (Database Schemas)
  - Annexe 5 (Tech stack, Discord intents/scopes/permissions)
  - Annexe 6 (Policy Guard)
  - Annexe 7 (Jobs, Scheduling & Idempotency)
  - Annexe 8 (Observability)
  - Annexe 10 (Data Protection & Privacy)
  - Annexe 11 (Accessibility)
  - Annexe 13 (Risk & Future-Proofing)
  - Annexe 14 (API Contracts)
  - Annexe 15 (Migrations & Seeds)
  - Annexe 16 (Server layout & permission templates)
---

# Module B.6 — Player Mentor Program — **LOCKED**

## B6.1 Purpose
Facilitate skill-sharing by pairing experienced players (**mentors**) with learners (**mentees**), with controlled capacity, profile-driven discovery, approvals, and **private, auditable communication spaces**.

---

## B6.2 Scope & Principles
- **Two-sided workflow:** mentors enlist; mentees request pairing  
- **Capacity-limited:** default **3 mentees/mentor** (configurable; hard-enforced unless overridden by R4/R5)  
- **Profile-driven discovery:** uses Module **B.4** data (language, timezone, Guru skills, availability)  
- **Privacy-first comms:** per-mentor private channel + per-mentee private threads; visible only to mentor, assigned mentees, R4/R5, and bot  
- **Self-service + assisted:** users self-serve; R4/R5 can assign when no mentor available

---

## B6.3 Roles & Permissions (Policy Guard; Annexe 6)
**Member/Elite**
- Become/leave mentor (if Guru Skills complete)  
- Request/withdraw mentorship; view own pairing; use mentor thread

**Mentor (role)**
- Accept/reject requests up to capacity  
- Manage own mentor channel; archive/rename own mentee threads; remove mentee access

**R3**
- Read mentor directory; nudge/remind (no pair edits)

**R4/R5**
- Assign/reassign mentees; override capacity; create/archive mentor channels; purge spaces; run bulk exports

_All decisions pass Policy Guard (ALLOW/DENY/SOFT_ALLOW) with reason logging (Annexe 8)._

---

## B6.4 Feature Flags (per-guild; Module A §A5.2, Annexe 4)
- `mentors.enabled` — master toggle  
- `mentors.defaultCapacity` — default **3**  
- `mentors.allowAdminOverride` — R4/R5 may exceed capacity (default **true**)  
- `mentors.autoCreateChannel` — create mentor channel on sign-up (default **true**)  
- `maintenance.enabled` — global pause (Annexe 7). Enrollment/pairing blocked when enabled (except admin reassign if `jobs.allowDuringMaintenance=true`)

---

## B6.5 Data Model (Annexe 4 alignment)
_All docs include `{ guildId, version, createdAt, updatedAt }` and use CAS (A9.2)._
- **users** (extends B.4):  
  `profile.isMentor:boolean`, `profile.mentorCapacity:int`, `profile.mentorId?:snowflake` (for mentees), `profile.guruSkills:string[]`
- **mentor_profiles**: `{ mentorId, capacity, currentMenteeIds:snowflake[], open:boolean, notes? }`
- **mentor_requests**: `{ requestId, menteeId, mentorId, status:PENDING|ACCEPTED|REJECTED|WITHDRAWN, reason?, timestamps }`
- **mentor_pairs**: `{ pairId, mentorId, menteeId, since, endedAt? }` (historical integrity)
- **mentor_spaces**: `{ mentorId, channelId, threadIds:{ [menteeId]: threadId }, archived:boolean }`

_Retention:_ `mentor_requests/pairs` per Annexe 10; personally identifying links anonymised on DSR delete (B5).

---

## B6.6 Flows
### B6.6.1 Mentor Sign-up
`/mentor join` → validate Guru Skills (B.4) → guidelines → confirm →  
set `profile.isMentor=true`, assign **Player Mentor** role, `capacity=defaultCapacity`, create **private channel** if enabled, register in directory. (Same via PWA.)

### B6.6.2 Mentor Exit
`/mentor leave` → confirm → set `isMentor=false`, remove role, **archive mentor channel** and lock, remove mentee overwrites, clear mentee `mentorId`, notify mentees, close open requests.

### B6.6.3 Mentee Discovery & Request
Directory filters: skills, language, country, timezone, availability summary, capacity remaining.  
Mentor card: age range, language(s), bio, availability, skills matrix, mentee count/capacity.  
“**Request Mentorship**” → `mentor_request(PENDING)` → mentor DM + inbox.

### B6.6.4 Mentor Decision
- **Accept** (under capacity or admin override): add mentee to `currentMenteeIds`, set mentee `mentorId`, create/attach **private thread** under mentor channel, grant access overwrite, DM both.  
- **Reject:** choose reason + optional note → DM mentee → `REJECTED`.  
- **Withdraw (mentee):** `WITHDRAWN`; notify mentor.

### B6.6.5 No Mentor Available (Assisted)
Mentee files **General Mentor Request** → R4/R5 queue. R4/R5 picks eligible mentor → ensure role → **force-accept** (capacity override via Policy Guard).

### B6.6.6 Mentee Exit / Unpair
`/mentorship leave` → remove overwrite, close their thread, set mentee `mentorId=null`, remove from mentor’s list, DM mentor.

---

## B6.7 Discord Communication Spaces (privacy-first)
**Category:** _Mentorship_ (Annexe 16).  
**Per-mentor channel:** `mentor-{name}`

| Principal     | View | Read | Send | Manage Threads | Manage Channel |
|---|---:|---:|---:|---:|---:|
| Mentor        | ✅ | ✅ | ✅ | ✅ (own) | ✅ (own) |
| Paired Mentee | ✅ | ✅ | ✅ | ❌ | ❌ |
| R4/R5         | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bot           | ✅ | ✅ | ✅ | ✅ | ✅ |
| @everyone     | ❌ | ❌ | ❌ | ❌ | ❌ |

- Thread-per-mentee: `[{Mentee}] Mentorship`, participants = mentor, mentee, R4/R5, bot  
- On accept: create thread + welcome; on unpair: archive/lock thread  
- On mentor exit: archive channel; remove all mentee overwrites  
- **Audit:** optional message deletion log to `#mentorship-audit` (R4/R5 only)

---

## B6.8 Web/PWA Spaces
Mirror Discord privacy: mentor + their mentees + R4/R5 + system only.  
Areas: **Group space** (broadcasts to current mentees) + **1:1 subspaces** per mentee.  
Removing a mentee **revokes access tokens immediately**.

---

## B6.9 API Contracts (Annexe 14)
_Headers: `X-Guild-ID` (required), **If-Match** (updates), **Idempotency-Key** (POST/DELETE)._
- `POST /mentors/enroll` — join (validates guru skills)  
- `DELETE /mentors/enroll` — leave (archives channel, cascades)  
- `GET /mentors` — directory (filters: skills, locale, `capacity>0`)  
- `POST /mentors/{mentorId}/requests` — create request  
- `POST /mentors/requests/{requestId}:accept` — accept (capacity/CAS)  
- `POST /mentors/requests/{requestId}:reject` — reject (reason)  
- `POST /mentors/requests/general` — general assistance (R4/R5 queue)  
- `POST /mentors/reassign` — R4/R5 reassign mentee `{ menteeId, newMentorId }`  
- `POST /mentors/unpair` — mentee leaves  
- `GET /mentors/spaces/{mentorId}` — channel/thread ids (admin)

**Errors:** `400 VALIDATION_INVALID_INPUT` • `401 UNAUTHENTICATED` • `403 POLICY_GUARD_DENY` • `404 NOT_FOUND` • `409 CONFLICT.WRITE_STALE` • `409 CAPACITY_EXCEEDED` • `409 MENTOR_SKILLS_INCOMPLETE` • `429 RATE_LIMIT` • `503 MAINTENANCE_MODE`

---

## B6.10 Jobs & Reliability (Annexe 7)
- **ChannelManager:** create/archive mentor channels & threads; **idempotent**  
- **PairOrchestrator:** transactional pair/unpair (CAS) + grant/revoke access; retries w/ bounded backoff; **DLQ** on repeated failures  
- **DM Fallbacks:** when DMs closed, fall back to scoped thread mention; log reason  
- **Maintenance Mode:** blocks enroll/pair unless `jobs.allowDuringMaintenance=true` for admin emergency reassigns  
- **Optimistic Concurrency:** every update uses CAS; conflicts show **Refresh & Reapply** (Annexe 3)

---

## B6.11 Observability (Annexe 8)
**Logs**
module=B.6 action=enroll|leave|request.create|request.accept|request.reject|pair|unpair|reassign result=allow|deny reason=… userId mentorId menteeId
**Metrics**
- `mentors_active_total`
- `mentee_pairs_total{current}`
- `mentor_requests_total{status}`
- `capacity_utilization_ratio`
- `dm_fallback_total{reason}`

**Alerts**
- No mentors available for > X hours while general requests exist  
- Capacity utilization **>95%** for Y days (recruit more mentors)  
- Pair/Unpair job failures in **DLQ** > threshold

---

## B6.12 Privacy & Retention (Annexe 10)
- **Hard delete on user exit (B.5):** mentor enrollment flags, mentee pair link, access tokens; threads/channels archived then cleaned per retention  
- Operational records (`mentor_pairs/mentor_requests`) retained but **anonymised** (“Deleted User #\<hash>”)  
- **DSR:** export active pair data; scrub personal data on delete  
- Channels adhere to **Code of Conduct** (B.4 agreements)

---

## B6.13 i18n & Accessibility
- All strings via Module **D** keys; ICU plurals; EN fallback; RTL-safe  
- Buttons include emoji + text (not color-only)  
- PWA screens keyboard-navigable; **ARIA live** for pairing updates

---

## B6.14 Discord Integration (Annexe 5 & 16)
- **Intents:** Guilds, Guild Members, Guild Messages / Message Content (for moderation where permitted)  
- **Permissions:** Manage Channels, Manage Threads, Send Messages, Read Message History, Manage Roles (scoped)  
- Component limits: **5 rows / 5 buttons**; **≤25 options/select**; multi-step modals for longer inputs  
- Button-first flows (Annexe 3); **Open in Dashboard** for directory filtering & bulk ops

---

## B6.15 Risks & Future-Proofing (Annexe 13)
- **Abandoned channels:** auto-archive when `currentMenteeIds.length == 0` for N days  
- **Capacity contention:** high conflict rate → raise default capacity or recruit; monitor `am_conflicts_total`  
- **Role drift:** periodic audit job verifies channel overwrites vs mentor/mentee lists  
- **Scaling:** large mentor counts → paging & caching for directory  
- **Culture integration:** hooks to Module **J** (kudos/badges for milestones)

---

## B6.16 Integrations & Cascades
- **Module B.4 (Onboarding/Profile):** adds `isMentor`, `mentorCapacity`, read-only `mentorId` for mentees; “Become a Mentor” / “Find a Mentor” entries  
- **Module B.5 (Profile Removals):** on exit/cleanup → mentor spaces archived, pairs dissolved, mentees notified, requests closed  
- **Module J (Culture & Recognition):** badges/points for milestones (first mentee, 3 mentees, graduation)

---

## B6.17 Revision
- **2025-08-15:** Initial consolidation into Module B.6; added feature flags, CAS, channel/thread privacy model, API, jobs, observability, privacy, i18n, Discord constraints, risks. (**LOCKED**)

---

## Δ Delta Notes
- Formalized data model across `mentor_profiles/requests/pairs/spaces`  
- Added **capacity enforcement** with admin override  
- Cemented **privacy model** (mentor-only channels + per-mentee threads) with R4/R5 visibility  
- Standardized API & error families, jobs, and observability

## 📎 Annexe Deltas to Apply
- **Annexe 4 (DB):** add `mentor_profiles`, `mentor_requests`, `mentor_pairs`, `mentor_spaces`; extend `users.profile` with `isMentor`, `mentorCapacity`, `mentorId`; all with `{ guildId, version, createdAt, updatedAt }`  
- **Annexe 14 (API):** add endpoints listed in **B6.9** with headers & error families  
- **Annexe 7 (Jobs):** add `mentor_channel_manager`, `mentor_pair_orchestrator`, `dm_fallback_sender`  
- **Annexe 8 (Telemetry):** add log/metric names above; wire alerts  
- **Annexe 16 (Discord Layout):** Mentorship category, channel naming, permission templates  
- **Annexe 3 (UX):** mentor panel actions (Join/Leave, Find Mentor, Approve/Reject, Reassign, Open Space)
