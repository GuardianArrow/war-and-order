annexe: Annexe 1 (Surface Ownership: Discord vs PWA)
version: v2025.08
status: Locked
last_updated: 2025-08-15 (Europe/London)
owners: [GuardianArrow]
refs:
  - Module A (Core)
  - Module B1–B7 (Alliance Ops & Events)
  - Module C (Alliance Communication & Alerts)
  - Module D (Localization & i18n)
  - Module E (Culture & Community)
  - Annexe 3 (UX Surface & Components)
  - Annexe 4 (Database Schemas)
  - Annexe 5 (Discord intents/scopes/permissions)
  - Annexe 6 (Policy Guard)
  - Annexe 7 (Jobs, Scheduling & Idempotency)
  - Annexe 8 (Observability & SLOs)
  - Annexe 11 (Accessibility)
  - Annexe 16 (Server layout & permission templates)

---

# Annexe 1 — Surface Ownership: Discord vs PWA (App) — ✅ **LOCKED**

## 1. Purpose & Principles
Defines which surface (Discord vs PWA) owns each interaction for **speed, safety, and clarity**. Backend is **source of truth**; both clients are thin.

### 1.1 Design principles
1) **Speed & friction**  
- **Discord:** quick actions (buttons), short modals (≤3 inputs), reminders/alerts, RSVP taps, simple approvals.  
- **PWA:** anything with >3 inputs, bulk edits, rich tables/analytics, multi-step forms.

2) **Audience & discoverability**  
- **Discord:** visible moments in chat, threaded discussion.  
- **PWA:** dashboards, archives, filters, search.

3) **Precision & safety**  
- **Discord:** ephemeral prompts, simple moderation, role-gated buttons.  
- **PWA:** high-stakes edits (quotas/caps), bulk attendance, profile deletion; previews/confirmations.

4) **Language & timezones**  
- Both use **Module D (i18n)**. Long copy lives in PWA; Discord uses concise localized templates.

5) **Source of truth**  
- Data lives in backend (Annexe 4). Clients display/submit; backend wins on conflict.

See also: **Annexe 3** (button-first UX), **Annexe 5** (Discord intents/scopes), **Annexe 6** (Policy Guard).

---

## 2. Deep Links & Cross-Navigation
- **Discord → PWA:** “Open in Dashboard” buttons use short-lived, signed URLs (e.g., `/cbsp/requests/123?src=discord`).  
- **PWA → Discord:** “Open thread” links to event threads, mentor channels, announcement posts.  
- **Permissions preserved:** backend issues tokens & validates authorization; friendly error on denial.

---

## 3. Discord Limits & Guardrails
- Max **5 action rows** per message; **5 buttons/row** or **1 select/row**.  
- Select menus: **≤25 options** → otherwise open in PWA (autocomplete, pagination).  
- Modals: **≤5 inputs**.  
- Keep `custom_id` short & structured: `mod:feature:action[:id]`.  
- Private/sensitive flows (deletion, bulk edits) → **PWA**.  
- Image/file uploads: prefer **Discord attachments**; **PWA strips EXIF/geo**.  
- Scheduled visibility & thread perms enforced via **Policy Guard** (Annexe 6).

---

## 4. Capability Matrix — Primary vs Secondary surface
Legend: **P** Primary · **S** Secondary/quick · **—** Not used

| Area / Feature                         | Discord | PWA (App) |
|---|:---:|:---:|
| Auth & session                         | **P** (Discord OAuth) | **S** (uses Discord login) |
| Language (i18n)                        | **S** `/setlanguage` | **P** profile settings |
| Timezone                               | **S** `/settimezone` | **P** profile settings (auto-suggest) |
| Quiet Hours                            | **S** quick toggle | **P** detailed schedule |
| Broadcasts & announcements             | **P** posts/pings/threads | **P** compose + schedule UI |
| Onboarding gatekeeper                  | **P** flow & roles | **S** long-form profile |
| Profiles (view)                        | **S** mini card | **P** full profile |
| Profiles (edit)                        | **S** quick changes | **P** full sections & exports |
| Profile exit/deletion                  | — | **P** (confirmations) |
| Events: create/publish                 | **P** quick create | **P** templates/quotas |
| Events: RSVP                           | **P** | **S** (calendar tile) |
| Events: calendar                       | **S** list | **P** month/week/list, filters |
| Events: attendance                     | **S** quick mark few | **P** bulk mark (100), CSV |
| Discord Scheduled Events               | **P** mirror/sync | — |
| CBSP join/exit                         | **P** | **S** review |
| CBSP requests/approvals                | **P** buttons/forms | **P** dashboard + audit |
| CBSP depot & reports                   | — | **P** |
| Shield hosting                         | **P** announce/subscribe/extend | **S** prefs & overview |
| Formation builder                      | **P** calc | **P** save/edit/share |
| Mentor signup/assign                   | **P** | **S** rosters & stats |
| Mentor private spaces                  | **P** channels/threads | **S** roster view |
| WoF slot pick                          | **S** quick select | **P** slot mgmt & reminders |
| Culture themes/quizzes                 | **P** threads, polls | **P** galleries, leaderboards |
| Kudos & badges                         | **P** `/kudos`, shoutouts | **P** badge library & profile |
| Communications Hub                     | **S** quick sends | **P** campaign builder & targeting |

---

## 5. Per-Module Split (implementation-ready)
- **Module A — Core**  
  - **Discord:** quick settings (`/setlanguage`, `/settimezone`, Quiet Hours toggle)  
  - **PWA:** full settings, audits, cache/status page
- **Module B1 — CBSP**  
  - **Discord (P):** join/leave; submit resource/clean requests; manager approve/deny; quick assignments; short notes; alerts  
  - **PWA (P):** manager dashboard; depot levels & limits; reports & CSV; full note history
- **Module B2 — Shield Hosting**  
  - **Discord (P):** host post; subscribe/unsubscribe; alert ladder; extension intent & confirm; auto-archive; cap 5 subs/user  
  - **PWA (S):** subscriptions view; prefs; bulk unsubscribe; host schedule overview
- **Module B3 — Formation Builder**  
  - **Discord (P):** `/formation` guided calc; quick “save default”  
  - **PWA (P):** saved formations, overrides, compare, share
- **Module B4 — Onboarding & Profile Builder**  
  - **Discord (P):** Gatekeeper → rules → Visitor/Member → Vows; role assignment  
  - **PWA (P):** profile sections (personal, farming, groups, availability); Guru builder
- **Module B5 — Profile Edits & Removal**  
  - **Discord (S):** quick edits; Guru toggles  
  - **PWA (P):** full edit; availability; Exit Server flow; auto-cleanup on leave
- **Module B6 — Mentor Program**  
  - **Discord (P):** mentor join/leave; mentee requests; accept/reject; channel + private threads  
  - **PWA (S):** roster/capacity; progress notes; quick stats
- **Module B7 — Events (Core)**  
  - **Discord (P):** create/edit/publish/cancel/postpone; RSVP; waitlist; Scheduled Events mirror; lifecycle auto-transitions  
  - **PWA (P):** calendars; templates/quotas/slots; availability hints; bulk attendance; reports/exports  
  - **B7.1 Elite Wars:** RSVP; group assignment; group leader comms (**Discord**) · roster/groups & post-event summary (**PWA**)  
  - **B7.2 War of Frontiers:** slot pick; defence confirm; phase alerts (**Discord**) · slots dashboard & phase reports (**PWA**)
- **Module D — Localization & i18n Core**  
  - **Both:** keys everywhere; ICU; fallbacks; pseudo-loc in staging; missing-key report in PWA; `/translate missing` (R4/R5)
- **Module E — Culture & Community**  
  - **Discord (P):** themes (forum), submit, vote, quizzes live/async, kudos, shoutouts  
  - **PWA (P):** galleries, leaderboards, badges on profiles, quiz archives; admin point weights & badge catalog
- **Module C — Alliance Communication & Alerts**  
  - **Discord (P):** quick sends, announcements, event notices  
  - **PWA (P):** campaign builder, targeting/filters, scheduling, delivery reports, Audience Preview

---

## 6. Operational Notes
- **Maintenance Mode** (Module A / Annexe 7): pauses reminder/broadcast fan-out and blocks new publishes; leader panels show banner.  
- **DM fallback** (Annexe 5/7): if DMs fail, send a **scoped thread ping once**; log reason.  
- **Discord down:** PWA remains functional (calendar, dashboards, attendance, CBSP); show status banner; queue broadcasts.  
- **PWA down:** Discord keeps quick actions; heavy flows show guidance.  
- **Auditing & Telemetry:** both surfaces log to same audit trail; track surface usage to refine ownership (Annexe 8).

---

## 7. Build Phases
**MVP**  
- **Discord:** Gatekeeper onboarding; Events core + RSVP + lifecycle; CBSP requests/approvals; Shield hosting + alerts; Formation calc; Mentor signup/assign; Culture themes basic; WoF slot pick + reminders.  
- **PWA:** Calendar; CBSP manager dashboard + depot; bulk attendance; profile edit & exit; WoF slot dashboard & phase reports; culture gallery & leaderboards.

**Phase-2**  
- **PWA:** advanced comms campaign builder; badge catalog mgmt; mentor analytics; deeper events analytics; quiz builder UI.  
- **Discord:** enriched `/quiz` modes; ranked voting flows.

---

## 8. Cross-References
Module **A**, Modules **B1–B7**, Module **C**, Module **D**, Module **E**; Annexes **3/4/5/6/7/8/11/16**.

---

## 9. Revision Notes (what changed)
- Replaced references to Module **I** with **Module D (i18n)**.  
- Updated Events references to **Module B7** (Events Core) and added **B7.1/B7.2**.  
- Added **Maintenance Mode** behaviour and **DM fallback** delivery rule.  
- Added **Audience Preview** note under **Module C**.  
- Tightened Discord guardrails and cross-links to Annexes 3/5/6/7/8.  
- Confirmed button-first ownership aligns with latest UX plan.
