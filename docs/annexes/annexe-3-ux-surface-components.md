annexe: Annexe 3 (UX Surface & Components)
version: v2025.08
status: Locked
last_updated: 2025-08-15 (Europe/London)
owners: [GuardianArrow]
refs:
  - Annexe 1 (Surface Ownership)
  - Annexe 2 (Discord Commands & UI Interactions)
  - Annexe 5 (Discord intents/scopes/permissions)
  - Annexe 6 (Policy Guard)
  - Annexe 7 (Jobs, Scheduling & Idempotency)
  - Annexe 8 (Observability & SLOs)
  - Annexe 11 (Accessibility & Localization QA)
  - Module A (Core: feature flags, maintenance, CAS)
  - Module B7 (Events Core + B7.1/B7.2/B7.14)
  - Module D (Localization & i18n)
  - Module H (Alliance Communication & Alerts)

---

# Annexe 3 — UX Surface & Components — ✅ **LOCKED**

Defines the Discord-first interaction model, component patterns, when to switch to the PWA, accessibility guidance, and the standard **Refresh & Reapply** pattern for optimistic concurrency (Module A · A9.2). All strings localize via **Module D — i18n**.

---

## 3.1 Interaction Model (Discord-first, Button-first)

**Core patterns**
- **Launcher message → Panel.** A pinned bot message per feature/channel with an **Open Panel** button that opens an **ephemeral** control panel (tabs simulated with buttons).
- **Buttons for actions, selects for choices, modals for input.**  
  Buttons: approve/deny, subscribe/unsubscribe, publish/cancel, mark attendance, etc.  
  Selects: pick event/time-slot/team/role (**≤ 25 options**).  
  Modals: multi-field input (**≤ 5 inputs**).
- **Deep-link to PWA when needed.** If you hit Discord limits (long forms, >25 items, bulk edits), show **Open in Dashboard**.

**Component ID convention**  
Keep `custom_id` short and structured: `mod:feature:action[:id]`.  
(See **Annexe 2** for the global registry and examples.)

---

## 3.2 Platform Limits & Conventions (so nothing breaks)

- Up to **5 action rows** per message.  
  - A row may contain **up to 5 buttons** or **1 select**.
- **Select menus:** max **25 options** (else PWA).
- **Modals:** max **5 inputs**; include **hidden version** for CAS.
- Use **ephemeral** replies for private confirmations/sensitive data.
- Prefer **concise embeds**; move long text to the PWA.

---

## 3.3 Minimal Slash Command Set (everything else via buttons)

**“Open Panel” launchers:**  
`/menu`, `/cbsp`, `/shield`, `/events`, `/mentor`, `/culture` → open that module’s ephemeral panel.

**Power admin & DM-only (rare):**  
e.g., `/event create` (when no panel exists), `/profile delete` (hands off to PWA), `/badge grant`.

**Diagnostics:** `/whoami`, `/help`, `/translate missing`.

---

## 3.4 Module-by-Module: what becomes button/select-driven

**B1 · CBSP**  
Panel buttons: Join/Leave, New Resource Request, New Cleaning Request, My Requests, Depot Update (Manager), Assignments.  
Approvals: Approve / Deny / Complete per request card → optional **Depot Update** modal.  
Selects: assignment (primary/secondary), member pickers (small lists).

**B2 · Shield Hosting**  
Post buttons: Subscribe/Unsubscribe, Extend Intent, Confirm New Shield, Snooze/Next Alert.  
Modal for Host Shield and Extend details.

**B3 · Formation Builder**  
Build panel: selects (castle range, front/back/mixed), modal for march size; Save, Set Default, Share.

**B4 · Onboarding (Gatekeeper)**  
Start Onboarding → modals for name/locale/timezone; Accept Rules / VOWs; **Upgrade to Member** (visible to Visitors).

**B6 · Mentor Program**  
Panel: Become a Mentor / Stop Mentoring, Find Mentor, My Requests, Approve/Reject on incoming cards, Create Mentor Channel (R4).

**B7 · Events (Core)**  
Panel: Create Draft, My Events, Publish/Cancel/Postpone, RSVP buttons; **Select Time-Slot** (slot events); **Open Attendance** (quick mark).  
Native **Discord Scheduled Events** are mirrored on Publish where enabled.

**B7.1 · Elite Wars**  
Group assignment with **A/B/C/D/E** buttons; **Set Group Leader** per group.

**B7.2 · War of Frontiers**  
Pick **Slot** select; **Confirm Defence Sent** button; attendance quick marks per slot; **Post Phase Summary** button for leaders.

**B7.14 · Attendance (Core for all events)**  
Quick marks via button cycle (✅ Attended / ● Late / ✖ No-show / ⓘ Excused) on each attendee card (small groups).  
**Open in Dashboard** for bulk (100-player) marking.

**E · Culture & Community**  
Post Photo → modal; Vote button or reactions; Join Quiz → DM flow; Give Kudos; View Leaderboard link.

**H · Alliance Communication & Alerts**  
Compose / Preview / Send / Schedule from a single panel with **Audience Preview** (see §3.9).

---

## 3.5 Ephemeral “Dashboards”

- **My Stuff** panel: upcoming events, my RSVPs, my WoF slot, my shields, my CBSP requests—one place to act fast.
- **Leader panels** (role-gated): pending approvals, today’s events, attendance not done, CBSP queue, mentor requests.

---

## 3.6 When we switch to the PWA

- Lists **>25** entries (countries, big rosters).
- **Bulk edits** (attendance for 100, depot histories, reports).
- **Sensitive flows** (profile deletion, exporting data).
- **Rich analytics** (calendars, leaderboards, galleries).

---

## 3.7 Mobile-friendliness & Accessibility

- Short labels + clear emojis (e.g., ♻️ refresh, ✅ approve, ✖ cancel).
- **Never rely on color** alone; use text/emoji.
- Long text lives in the **PWA**; Discord embeds stay concise.
- All labels **localized** (Module D).
- Respect **RTL locales**; provide **ARIA** labels where applicable (see **Annexe 11**).
- Respect **reduced motion** user preference.

---

## 3.8 Addendum — Conflict Resolution: “Refresh & Reapply” — ✅ **LOCKED**

**Applies to:** Discord components and the PWA. See **Module A · A9.2** for the data rules.

**Purpose**  
Prevent silent data loss when two editors change the same entity (e.g., event, CBSP depot). Provide a fast path to refresh latest state and reapply user edits. Capture **conflict telemetry** (see Annexe 8).

**Triggers**
- API returns **HTTP 409** with `reason=CONFLICT.WRITE_STALE` and a **latest snapshot**.
- Discord handlers detect **version mismatch** in modal payloads.

**Shared copy (localized via Module D)**
- **Title:** “This changed while you were editing”
- **Body:** “Someone updated this item after you opened it. Review the latest details, then reapply your changes.”
- **Buttons:** **Refresh & Reapply** (primary), **Copy My Inputs** (secondary), **Cancel**.

**Discord spec**
- Ephemeral modal shows:  
  Summary line “Changed by `<displayName>` at `<timeLocal>` (v`<prev>`→v`<curr>`)” when available; list up to **5 changed fields**.
- **Refresh & Reapply:** fetch latest, reopen same modal prefilled with latest state + user’s attempted inputs layered on top (**client-side merge**).
- **Copy My Inputs:** DM a code-block JSON of attempted changes.
- **Cancel:** close modal.
- No **“Force Overwrite”** (CAS only).

**PWA spec**
- Inline **sticky banner** with same copy; minimal inline diffs next to fields (**old → new**).
- Keyboard shortcuts: **R** refresh/reapply, **Esc** cancel.
- **ARIA** live region announcement; focus returns to first changed field.

**Telemetry (Annexe 8)**
- Log `CONFLICT.WRITE_STALE` with `{ previousVersion, attemptedVersion, entityId }`; increment `am_conflicts_total{module,type}`; track **time-to-reapply**.

**Dev notes**  
Round-trip a **hidden version** in all modals/forms. Jobs treat **409** as retryable with short jitter + re-read (Annexe 7).

---

## 3.9 Announcements & Broadcasts → Audience Preview (Module H)

**Where:** the Compose/Preview panel in Discord and the PWA.  
**Why:** prevent mis-sends; set expectations for delivery fan-out.

**Confirm modal (Discord/PWA)**
- **Title:** “Preview recipients”
- **Body:** “About to send to **{count}** recipients.” Show **10 sample names** (localized).
- **Buttons:** **Confirm Send**, **Cancel**, **Open Filters** (refine scope).
- If **count > 100**, display note: “Delivery will be fanned out over ±3 minutes.” (ties to Annexe 7 rate-limit budgets).
- **Maintenance Mode** (Module A · A7/A9): publish/broadcast actions are gated and show a banner; users see a friendly denial.
- **DM fallback:** if a DM fails (closed DMs), send a **scoped thread ping once** and log the reason (Annexe 7/8).

---

## 3.10 Attendance UX (B7.14)

**Discord (small groups)**
- Quick marks via button cycle per attendee card:  
  ✅ Attended → ● Late → ✖ No-show → ⓘ Excused → reset.

**PWA (bulk grid)**
- Keyboard shortcuts: **A**=Attended, **L**=Late, **X**=No-show, **I**=Excused.
- Range select (**Shift+Click**), **Undo** (**Ctrl/Cmd+Z**), **Submit** (**Ctrl/Cmd+S**).
- **Open in Dashboard** deep-link shown in Discord when group size **>25**.
- Legend and tooltips **localized** (Module D).

---

## 3.11 Cross-References

- **Annexe 1** — Surface Ownership Spec (Discord vs PWA)  
- **Annexe 2** — Commands & UI Interactions (IDs, permissions)  
- **Annexe 5** — Tech stack, Discord intents/scopes & bot permissions  
- **Annexe 6** — Policy Guard rules  
- **Annexe 7** — Jobs, Scheduling & Idempotency (rate limits, maintenance gate, DM fallback)  
- **Annexe 8** — Observability & Telemetry taxonomy  
- **Annexe 11** — Accessibility & Localization QA  
- **Module A** — Core (feature flags, maintenance mode, CAS)  
- **Module B7** — Events Core (+ B7.1 Elite Wars, B7.2 War of Frontiers, B7.14 Attendance Core)  
- **Module D** — Localization & i18n  
- **Module H** — Alliance Communication & Alerts

---

## 3.12 Revision Notes (what changed)

- Updated module naming (**i18n → D**, **Events → B7**, **EW/WoF → B7.1/B7.2**, **Attendance Core → B7.14**).
- Added **Audience Preview** confirm flow for broadcasts (Module H).
- Clarified **DM fallback** and **Maintenance Mode** gating ties to Annexes 7/8 and Module A.
- **Locked** Refresh & Reapply pattern with CAS version round-trip.
- Expanded PWA bulk attendance **keyboard shortcuts** and deep-link rule.
