---
module: Module B.7.1 (Elite Wars — Events Sub-module)
version: v2025.08
status: Locked
last_updated: 2025-08-15 (Europe/London)
owners: [GuardianArrow]
annexe_refs:
  - B7.0 (Events Core)
  - Annexe 3 (UX Surface & Components)
  - Annexe 4 (Database Schemas)
  - Annexe 5 (Discord intents/scopes/permissions)
  - Annexe 6 (Policy Guard)
  - Annexe 7 (Jobs, Scheduling & Idempotency)
  - Annexe 8 (Observability)
  - Annexe 10 (Data Protection & Privacy)
  - Annexe 11 (Accessibility)
  - Annexe 14 (API Contracts)
  - Annexe 16 (Server layout & permission templates)
---

# Module B.7.1 — Elite Wars (Sub-module of Events Core) — ✅ **LOCKED**

## B7.1.1 Purpose & Context
**Elite Wars** is a **45-minute**, cross-realm **no-loss** combat event. Losses are treated as **wounded** (healable in-event); all troops return at the end.

**Primary objective:** capture the enemy Main Castle before time expires; otherwise, win by holding more small castles at **T+45m**.

**Map & flow**
- Players may enter the event map **~5 minutes before start**.  
- Our Main Castle on the left, enemy on the right; multiple paths with towers/castles in between.  
- Success depends on tight **group coordination** and real-time leadership.

---

## B7.1.2 Default Template (inherits B7 Core)
**Template name:** `Elite Wars`

**Defaults**
- `defaultDuration`: **00:45**
- `defaultVisibilityScope`: **alliance**
- `publishToDiscordScheduler`: **true**
- `defaultRSVPOptions`: **Going / Maybe / No**
- `defaultNotificationPattern`: **24h, 1h, 10m, start**
- **params (Elite-Wars specific):**
  - `groupsEnabled: true`
  - `groupLabels: A,B,C,D,E`
  - `groupRoles`:
    - **A – Free Rollers (Speeders):** strongest castles; opportunistic strikes/caps
    - **B – Attackers:** coordinated offensive group
    - **C – Main Force:** engages enemy main force frontally
    - **D – Reinforcers:** close-support, plugs gaps, rapid reinforcements
    - **E – Base/Defenders:** defend our Main Castle; suitable for limited availability
  - `allowSpeedersList: true`
  - `allowDefendOnly: true` → maps to **Group E** (Base/Defenders)
  - `allowGroupLeads: true`

---

## B7.1.3 Signup & Grouping Workflow
**Inputs collected at RSVP time** (button-first per Annexe 3):
- **RSVP:** Going / Maybe / No  
- **Role choice:**
  - *Use my default group (A–E)* (stored on profile; Module **B4**)  
  - *Defend-only* → **Group E** (event-only override)
- **Speeder declaration:** “I can speed” (Yes/No) → adds to **Speeders Waitlist** for leader review

**Assignment rules**
- If **Going** and no override → use profile default group (A–E).  
- If **Defend-only** → force **Group E** for **this event only** (profile default unaffected).  
- If **Speeder** declared → placed on **Speeders Waitlist**; leader may approve to move to **Group A** for this event only.

---

## B7.1.4 Group Leadership
Each group **A–E** can have a **Group Leader** (appointed pre-event).

**Leaders get:**
- Live roster of their group with RSVP & presence.  
- Quick actions to pin instructions, call targets, and request reinforcements.  
- *(Pre-event)* Ability to propose re-balancing; **final approval** by Event Owner / **R4/R5**.

> Unlike WoF, Elite Wars allows **mid-event reassignment** if needed (short & tactical), but changes **do not** alter player profile defaults.

---

## B7.1.5 Speeders Management (Group A)
- **Waitlist view** for Event Owner/R4/R5 shows candidates who declared speed capability.  
- **Approve** → move to **Group A** (event-only); notify player & relevant leaders.  
- **Decline** → remain in original group; private DM to player.

---

## B7.1.6 Pre-Event Checklist (owner/leads)
- **T-24h:** confirm group leaders; sanity-check counts per group.  
- **T-1h:** verify Speeders and chain-of-command; share rally & fallback plans.  
- **T-10m:** ensure Group **E** defenders are in place; **A–D** staged on pathheads.  
- Attach any **strategy assets** (maps, target priority) to the event **Assets** tab (B7.13).

---

## B7.1.7 Event Day Ops (T-5m to T+45m)
- **T-5m:** players enter map; leaders verify presence.  
- **T0:** event starts; core call-outs posted; Groups execute roles:
  - **A** roams for openings, fast caps/opportunistic strikes.  
  - **B** advances with directed assaults on towers.  
  - **C** meets enemy main force; advances or regroups on command.  
  - **D** floats behind lines; plugs gaps, reinforces pressured towers.  
  - **E** maintains base defense; swaps in/out as instructed.
- **Mid-event changes:** owner/R4/R5 can **reassign members across groups** as conditions change (event-only effect).  
- **T+45m:** engine marks event **Completed** automatically (alliance-wide default; B7.17).

---

## B7.1.8 Notifications (overrides B7 default)
- **24h:** “Elite Wars tomorrow — RSVP & check your group.”  
- **1h:** “Elite Wars in 1 hour — prepare to enter map.”  
- **10m:** “Join the map now; follow leader instructions.”  
- **Start:** “Elite Wars has started — execute your group role.”

*Quiet Hours apply, except 10m and Start may be critical per guild config.*

---

## B7.1.9 Attendance (uses B7.14)
- **Bulk grid** for owner/R4/R5: `A`=Present, `L`=Late, `X`=No-show, `I`=Excused; range-select & undo.  
- Optional **auto-presence** when a player interacts with the Elite Wars event thread during the window.  
- Attendance writes back to **profile history** (retention: Annexe 10).

---

## B7.1.10 Data Model Extensions (Annexe 4 alignment)
**Event params (Elite-Wars)**
- `groupLeads: { A?:UserId, B?:UserId, C?:UserId, D?:UserId, E?:UserId }`
- `groupAssignments: { [userId:string]: 'A'|'B'|'C'|'D'|'E' }`
- `defendOnlyOverrides: UserId[]` (effective **E** this event)
- `speeders: { candidates: UserId[], approved: UserId[] }`
- `briefingNotes?: string` (markdown/i18n)
- `opsLog?: string` (event-local notes captured by owner/leads)

**Profile fields (Module B4)**
- `eliteWarsDefaultGroup: 'A'|'B'|'C'|'D'|'E'` (optional)

> Profile default never changes from event assignments; only explicit profile edits can change it.  
> All event docs include `{ guildId, version, createdAt, updatedAt }`.

---

## B7.1.11 Policy & Permissions (Annexe 6)
- **Create/Edit/Publish** Elite Wars event: **R4/R5**  
  - (Owner can be **R3** if sub-module `hostRoleMin` permits; default = R4.)
- **Group reassignments & Speeder approvals:** Event Owner, **R4/R5**  
- **Group Lead** can **propose** reassignments (requires owner/R4/R5 confirmation)

---

## B7.1.12 UI & Commands
**Discord (button-first; Annexe 3)** — *Elite Wars context panel*
- **Pick/Change My Group (A–E)**  
- **Defend-Only (toggle)** → sets **E** for this event  
- **Declare Speeder** (join/leave waitlist)  
- **Set/Change Group Leader** (owner/R4/R5)  
- **Approve/Decline Speeders** (owner/R4/R5)  
- **View Group Rosters**  
- **Open Attendance**

**Slash (minimal)**
/ew group set <user> <A|B|C|D|E> (R4+ / owner)
/ew lead set <group> <user> (R4+ / owner)
/ew speeder approve|decline <user> (R4+ / owner)
/ew roster <group|all> (leads/owner)

*Internally these map to generic **B7** endpoints with params updates.*

**Web/PWA**
- Event detail with **Group tabs (A–E)**, **Leads**, **Speeders**, **Assets**, **Attendance**  
- **Drag-and-drop** reassignment (owner/R4/R5), with audit

---

## B7.1.13 Observability (Annexe 8)
**Logs**
module=B.7.1 action=speeder_approve|group_assign|lead_assign result=allow|deny eventId=<id> userId=<id>

**Metrics**
- `ew_signups_total{group}`
- `ew_speeders_total{state=candidate|approved}`
- `ew_reassignments_total`
- `am_conflicts_total{module="B.7.1"}`

**Alerts**
- Excessive mid-event reassignments (>N/15m) → possible coordination issue  
- Conflict spikes on `groupAssignments` (CAS retries > threshold)

---

## B7.1.14 Reliability & Concurrency
- **CAS** on `groupAssignments`, `speeders`, and `groupLeads`; UI uses **Refresh & Reapply** (Annexe 3)  
- **Idempotent** reassignment operations (Annexe 7)  
- **Publish & reminders** respect **Maintenance Mode** (Module A)

---

## B7.1.15 Privacy, i18n, Accessibility
- **Privacy:** store only Discord IDs and gameplay metadata; retention per Annexe 10  
- **i18n:** all strings via **Module D** (keys for groups, prompts, notices)  
- **Accessibility:** button labels with icons + text; avoid color-only; keyboardable bulk marking in PWA

---

## B7.1.16 Integrations
- **B3 (Formations):** pre-event link to recommended formation presets in **Assets**  
- **B4 (Onboarding/Profile):** reads `eliteWarsDefaultGroup`; edits only through profile UI  
- **B7 (Core):** uses attendance, notifications, scheduler mirroring, DM fallbacks  
- **Annexe 16 (Discord layout):** Elite Wars announcements & thread templates

---

## B7.1.17 Revision & Δ Notes
- **2025-08-15:** First **LOCKED** version aligned to **B7 Core**; added group leader tooling, mid-event reassignment (event-only), assets hook, audience preview, drift/maintenance compliance.  
- **Fix:** “Defend-only” maps to **Group E (Base/Defenders)** — *not* Group D (Reinforcers).
