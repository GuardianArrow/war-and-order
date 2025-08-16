annexe: Annexe 2 (Discord Executable Commands & UI Interactions)
version: v2025.08
status: Locked
last_updated: 2025-08-15 (Europe/London)
owners: [GuardianArrow]
refs:
  - Annexe 1 (Surface Ownership)
  - Annexe 3 (UX Surface & Components)
  - Annexe 5 (Discord intents/scopes/permissions)
  - Annexe 6 (Policy Guard)
  - Annexe 7 (Jobs, Scheduling & Idempotency)
  - Annexe 8 (Observability & SLOs)
  - Module A (Core: audit, CAS, maintenance)
  - Module B1–B7 (Alliance Ops & Events)
  - Module C (Comms & Alerts)
  - Module D (Localization & i18n)
  - Module E (Culture & Community)

---

# Annexe 2 — Discord Executable Commands & UI Interactions — ✅ **LOCKED**

This annexe enumerates all executable surfaces in Discord—**slash commands, context menus, buttons, selects, and modals**—mapped to their owning module and primary function. It also defines **ID naming conventions**, **permission guards**, **feature-flag/maintenance** behaviour, and **audit/telemetry** expectations.

**Notes**
- All user-facing strings localize via **Module D — i18n**.
- Permissions enforced via **Policy Guard** (Annexe 6) + Discord role checks.
- Every action logs to **Security & Audit** (Module A · A8) and emits telemetry per **Annexe 8**.
- Button/select/modal IDs follow stable machine-readable patterns (§2.3).
- Optimistic concurrency: modals include a hidden **version** field; conflicts follow **“Refresh & Reapply”** (Annexe 3).

---

## 2.1 Taxonomy & Conventions

### 2.1.1 Slash commands
- Naming: **/noun verb** or **/module action**.
- Required args first; localized option help.
- Sensitive actions return **ephemeral** confirmations.

### 2.1.2 Buttons
- Short, localized labels; optional emoji; **danger** buttons always confirm.
- **Custom ID:** `mod:feature:action[:id]` (e.g., `cbsp:req:approve:REQ123`).

### 2.1.3 Selects
- Use when **≤25 options**; otherwise deep-link to PWA.
- **Custom ID:** `mod:feature:select[:context]` (e.g., `events:teams:select:EVT1`).

### 2.1.4 Modals
- Max **5 inputs**; long forms → PWA.
- **Custom ID:** `mod:feature:modal[:id]`.
- Include hidden **version** for CAS (Module A · A9.2).

### 2.1.5 Context menus (user/message)
- Minimal set for lookups (e.g., **“View Profile”**, **“Open Attendance”**).

---

## 2.2 Slash Commands Registry (by module)

### Module A — Core / Settings
- `/help` — Help categories & deep links.
- `/whoami` — Roles, timezone, language, quick profile card.
- `/setlanguage <locale>` — Set UI language.
- `/settimezone <tz>` — Set timezone (IANA).
- `/quiet-hours set <schedule>` — Quick toggle or preset.
- `/translate missing [module]` — R4/R5: missing i18n keys summary.

### Module B1 — CBSP (Central Build Support Program)
- `/cbsp join` — Enrol; grants CBSP Member role.
- `/cbsp leave` — Exit; revokes role; cascades profile flag.
- `/cbsp request` — Resource request (modal).
- `/cbsp clean-request` — Cleaning request (modal).
- `/cbsp my` — View my requests & status.
- `/cbsp assign <user> <primary> [secondary]` — Set assignments (Manager).
- `/cbsp approve <requestId>` — Approve request.
- `/cbsp deny <requestId> [reason]` — Deny request.
- `/cbsp complete <requestId>` — Mark fulfilled; prompt depot update.
- `/cbsp depot set <food|wood|stone|iron> <amount>` — Update depot.
- `/cbsp depot min <resource> <amount>` — Set min cap.
- `/cbsp report [range]` — Counts/flags/depot history (CSV via PWA).

### Module B2 — Shield Hosting
- `/shield host` — Create shield post (modal: coords, length, start).
- `/shield extend <postId>` — Log extension intention.
- `/shield confirm <postId> [length]` — Confirm new shield live.
- `/shield cancel <postId>` — Close post.
- `/shield subscribe <postId>` — Track your troops in host’s shield.
- `/shield unsubscribe <postId>` — Stop alerts.
- `/shield my` — List subscriptions, edit alert prefs.

### Module B3 — Formation Builder
- `/formation build` — Wizard: castle range, front/back, march size, type → numbers.
- `/formation save <name>` — Save last output.
- `/formation list` — Saved formations.
- `/formation set-default <name>` — Set profile defaults.
- `/formation share <name> [channel]` — Post embed to a channel.

### Module B4 — Onboarding & Profile Builder
- `/onboard start` — Re-run onboarding (Gatekeeper; respects role).
- `/rules` — Show Code of Conduct (localized) + accept.
- `/vows` — Alliance VOWs (Members).
- `/upgrade visitor-to-member` — Begin upgrade path.
- `/profile set <field> <value>` — Quick edit.
- `/availability set` — Opens quiet-hours/availability modal.

### Module B5 — Profile Edits & Removal
- `/profile view [@user]` — Profile card (permissions apply).
- `/profile edit` — Short modal (full edits in PWA).
- `/profile export` — DM profile JSON (consent).
- `/profile delete` — Start Exit Server flow (final confirm in PWA).

### Module B6 — Mentor Program
- `/mentor signup` — Become mentor (role toggled; capacity default=3).
- `/mentor exit` — Stop mentoring; closes threads (confirm).
- `/mentor list [skill|locale]` — Find mentors.
- `/mentor request @mentor [note]` — Ask for mentorship.
- `/mentor approve <reqId>` — Accept; create private thread.
- `/mentor reject <reqId> [reason]` — Reject.
- `/mentor assign @mentee @mentor` — R4 fallback assignment.
- `/mentor channel create @mentor` — Create mentor home channel (R4).
- `/mentor note @mentee` — Private note (short; PWA for long).
- `/mentor roster` — Summary (links to PWA roster).

### Module B7 — Events (Core)
- `/event create` — Quick create (type, time, scope).
- `/event edit <id>` — Edit (modal or structured).
- `/event publish <id>` — Publish; Audience Preview and optional native mirror.
- `/event cancel <id> [reason]` — Cancel with notices.
- `/event postpone <id> <new time>` — Shift schedule.
- `/event reschedule <id> <new time>` — Full reschedule.
- `/event view <id>` — Details.
- `/event list [type|scope|range]` — Filtered list.
- `/event rsvp <id> going|maybe|no` — RSVP inline.
- `/event slot <id> <slot>` — Join a time slot (slot-based types).
- `/event team <id> join <team>` — Join team/squad (team events).
- `/event attendance <id>` — Quick attendance panel (small groups).
- `/event report [range|type|scope]` — CSV/report link.

**B7.1 — Elite Wars (additions)**
- `/ew group set @user <A|B|C|D|E>` — Assign group for event.
- `/ew group leader @user <A|B|C|D|E>` — Set group leader.
- `/ew summary <id>` — Post match wrap-up.

**B7.2 — War of Frontiers (additions)**
- `/wof slot pick <slot>` — Player chooses attack slot (stored to profile).
- `/wof defend confirm` — Confirm defence march sent (stops T-6h/T-1h alerts).
- `/wof report <round>` — Phase summary (towers taken, tiles cleared, attendance by slot).

### Module D — Localization & i18n Core
- `/i18n locales` — List supported locales.
- `/i18n test pseudo` — Toggle pseudo-loc (staging/dev; R4+).

### Module E — Culture & Community
- `/culture theme create|publish|close` — Manage photo themes.
- `/culture submit` — Submission modal (PWA for upload as needed).
- `/culture vote <submissionId>` — Quick like/vote (or reactions).
- `/quiz create|publish|start|close` — Quiz lifecycle.
- `/quiz join` — Join live/async quiz.
- `/quiz leaderboard [period]` — Standings.
- `/kudos @user [badge] [reason]` — Kudos (rate-limited).
- `/badge grant @user <badge>` / `/badge revoke` — Culture Lead/R5.
- `/spotlight schedule @user` — Interview flow.
- `/birthday set <DD-MMM>` / `/birthday remove` — Birthday opt-in/out.
- `/club request <name> <purpose>` — Request new club (approval flow).
- `/poll create` — Quick culture poll (PWA for long).

### Module H — Alliance Communication & Alerts
- `/broadcast compose` — Open composer (channel(s)/audience, content).
- `/broadcast preview` — **Audience Preview** (count + sample).
- `/broadcast send <draftId>` — Send now (honours Quiet Hours unless Emergency).
- `/broadcast schedule <draftId> <time>` — Schedule send.
- `/broadcast cancel <sendId>` — Cancel scheduled job.
- `/broadcast report [range]` — Delivery/report view (links to PWA).

> **Maintenance Mode (Module A):** publish/broadcast commands are gated; users see a banner and a friendly denial.

---

## 2.3 Component ID Patterns (Buttons/Selects/Modals)

**CBSP**
- Approve/Deny: `cbsp:req:approve:<REQ>` / `cbsp:req:deny:<REQ>`
- Complete → Depot modal: `cbsp:req:complete:<REQ>` → modal `cbsp:depot:modal:<REQ>`
- Assign resources (select): `cbsp:assign:select:<USER>`

**Shield Hosting**
- Subscribe/Unsub: `shield:sub:join:<POST>` / `shield:sub:leave:<POST>`
- Extend intent → modal: `shield:extend:intent:<POST>` → `shield:extend:modal:<POST>`
- Confirm new shield: `shield:extend:confirm:<POST>`
- Snooze next alert: `shield:alert:snooze:<POST>:<mins>`

**Formation Builder**
- Save formation: `form:save:last`
- Set default: `form:default:set:<NAME>`

**Onboarding / VOWs**
- Accept/Decline rules: `onb:rules:accept` / `onb:rules:decline`
- Upgrade path: `onb:upgrade:member`
- Guru toggle: `onb:guru:toggle:<ROLE>`

**Mentor**
- Approve/Reject: `mentor:req:approve:<REQ>` / `mentor:req:reject:<REQ>`
- Create mentor channel: `mentor:ch:create:<USER>`
- Add mentee to thread: `mentor:thread:add:<MENTEE>`

**Events (Core)**
- RSVP: `evt:rsvp:going:<ID>` / `evt:rsvp:maybe:<ID>` / `evt:rsvp:no:<ID>`
- Publish/Cancel/Postpone: `evt:pub:<ID>` / `evt:cancel:<ID>` / `evt:postpone:<ID>`
- Attendance quick mark: `evt:att:mark:<ID>:<USER>:<A|L|N|E>`
- Team join: `evt:team:join:<ID>:<TEAM>`
- Slot pick (select): `evt:slot:pick:<ID>`

**War of Frontiers (B7.2)**
- Defence confirm: `wof:def:confirm:<ROUND>`
- Slot select: `wof:slot:select:<ROUND>`

**Culture & Community (E)**
- Theme submit → modal: `cul:theme:submit:<ID>` → `cul:theme:modal:<ID>`
- Vote: `cul:vote:like:<SUB>` (or reactions → server tally on close)
- Kudos quick: `cul:kudos:quick:<USER>:<BADGE>`

**Comms (H)**
- Broadcast preview: `comms:broadcast:preview:<DRAFT>`
- Broadcast send: `comms:broadcast:send:<DRAFT>`
- Cancel scheduled: `comms:broadcast:cancel:<SENDID>`

---

## 2.4 Permission Guard (role gates by action)

- **R5:** all actions, overrides.  
- **R4:** create/manage Events/Comms/Culture, Mentor assignment, CBSP approvals.  
- **R3:** moderate (mute/temp), limited broadcast, event ops where allowed.  
- **Elite/Member:** RSVP, submit requests, culture, mentor signup/requests, shield subscribe.  
- **Visitor:** read-only, limited onboarding.

Each command declares **minRole** + optional **roleAllowlist** (e.g., CBSP Manager). **Feature flags** and **Maintenance Mode** (Module A) are evaluated **before** Policy Guard.

---

## 2.5 Rate Limits & Safety

- Button spam: **debounce 1–2s** per user per component.
- `/kudos`: **5/day** per sender (unique recipients).
- Voting: **1/user/submission**; duplicates ignored.
- Dangerous actions (cancel/delete): **confirm modals**; **R4+**.
- Long lists → **PWA deep-link**.
- **DM fallback:** if DMs are closed/fail, send a **scoped thread ping once**; log reason (Annexe 7/8).
- **Maintenance Mode:** blocks publish/broadcast fan-out and shows banner (Module A · A7/A9; Annexe 7).

---

## 2.6 Audit & Telemetry

- **Audit log** (Module A · A8):  
  `{ userId, action, targetId, module, guildId, ts, channelId, old→new }`
- **Telemetry** (Annexe 8): permission denials, missing keys, modal validation failures, DM fallbacks, maintenance-gate denials.
- **Weekly digest (R4+):** top commands, failure rates, suspected abuse.

---

## 2.7 Reserved Prefixes (IDs)

`cbsp:*`, `shield:*`, `form:*`, `onb:*`, `mentor:*`, `evt:*`, `wof:*`, `cul:*`, `badge:*`, `quiz:*`, `profile:*`, `comms:*`.

---

## 2.8 Cross-References

Annexe **1/3/5/6/7/8**, Module **D (i18n)**, Module **B7 (Events Core incl. B7.1/B7.2)**, Module **H (Comms & Alerts)**.

---

## 2.9 Revision Notes (what changed)

- Renamed i18n **Module I → D**; Culture **J → E**; Events **G → B7**; EW/WoF → **B7.1/B7.2**.
- Added Module **H** broadcast commands with **Audience Preview**.
- Added **feature-flag** and **Maintenance Mode** gating; **DM fallback** requirement.
- Tightened **ID patterns** and conflict-safe modal behaviour (version field).
- Fixed cross-refs to **Module A · A8 (Audit)** and **Annexe 8 (Telemetry)**.
