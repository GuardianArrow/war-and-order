---
module: Module B.7.i (Events Sub-module Index / Navigator)
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
  - Annexe 14 (API Contracts)
---

# B.7.i — Sub-module Index (Navigator) — ✅ **LOCKED**

**Purpose:** quick navigator + defaults for all Event sub-modules under **B.7**.  
**Status key:** ✅ **LOCKED** · 🛠️ **WORKING** · 🧭 **PLANNED**.

| Code  | Sub-module                                                                 | Status | Default Scope                 | Discord Scheduler | Signup Structure                                  | Max Cap         | Default Reminders                 | Key Notes |
|:-----:|-----------------------------------------------------------------------------|:------:|-------------------------------|-------------------|---------------------------------------------------|-----------------|-----------------------------------|----------|
| B.7.0 | **Events Core** (lifecycle, templates, visibility, notifications, publishing, drift check, maintenance gate, audience preview) | ✅ | N/A                           | N/A               | N/A                                               | N/A             | **24h / 1h / 15m / Start**        | Source of truth for all events; see **B.7.0.x** sections. |
| B.7.1 | **Elite Wars**                                                              | ✅     | Alliance                       | ON (default)      | RSVP + Groups **A–E**, optional quotas; leader assignment | n/a             | **24h / 1h / 10m / Start**        | 45-minute no-loss arena; group leaders; E-list visible to leaders only. |
| B.7.2 | **War of Frontiers**                                                        | ✅     | Alliance                       | ON (default)      | RSVP + **Attack Slots (hourly)**; Defence confirmation   | **70 (7×10)**   | **1h / 30m / 15m / Start** (+ Defence T-6h/T-1h if not confirmed) | Defence lock after phase end; no slot caps; no-show → next-defence exclusion rule. |
| B.7.3 | **Elite Adventures**                                                        | 🧭     | Alliance / Team                | ON                | Role quotas + squads; **time-slots**                     | TBD             | **24h / 1h / 15m / Start**        | Template placeholder (to be authored). |
| B.7.4 | **Abyss Lord**                                                              | 🧭     | Alliance / Program             | ON (Alliance)     | Simple RSVP; role hints                                 | TBD             | **24h / 1h / 15m / Start**        | Boss window specifics in `params`. |
| B.7.5 | **Anubis**                                                                  | 🧭     | Alliance / Program             | ON (Alliance)     | Simple RSVP; role hints                                 | TBD             | **24h / 1h / 15m / Start**        | Boss window specifics in `params`. |
| B.7.6 | **Alliance Meeting / Briefing**                                             | 🧭     | Alliance                       | ON                | Simple RSVP                                            | n/a             | **24h / 1h / 15m / Start**        | Agenda/notes via **Assets** (B.7.0 G13). |
| B.7.7 | **Training / Scrims**                                                       | 🧭     | Alliance / Team                | OFF (usually)     | RSVP + teams                                           | TBD             | **24h / 1h / 15m / Start**        | Often private/team-scoped. |
| B.7.8 | **CBSP Clean Window**                                                       | 🧭     | Program (CBSP)                 | OFF               | Slots or sign-ups                                     | n/a             | **24h / 1h / 15m / Start**        | Spawns from **Module B.1 (CBSP)**. |
| B.7.9 | **Mentor Session**                                                          | 🧭     | Private (participant)          | OFF               | Direct pairing; no RSVP cap                           | n/a             | **24h / 1h / 15m / Start**        | Created via **Module B.6** flows. |
| B.7.10| **Lottery Draw / Cultural Event**                                           | 🧭     | Alliance / Program             | ON (when public)  | RSVP optional                                          | n/a             | **24h / 1h / 15m / Start**        | Ties to **Module J (Culture)**. |
| B.7.14| **Attendance Core** (states, bulk grid, exports)                            | ✅     | N/A                           | N/A               | Applies to all                                        | n/a             | N/A                               | Keyboard shortcuts (**A/L/X/I**), multi-select, auto-check-in hooks. |

---

## Update Rules for this Index
When you add or revise a sub-module:

1. **Update the row** (Status, Defaults, Notes).  
2. **Increment** the `last_updated` timestamp above.  
3. Ensure cross-refs inside the sub-module point back to **B.7.0.x (core)**, **Annexe 4** (schemas), **Annexe 6** (Policy Guard), **Annexe 7** (jobs), **Annexe 8** (observability), **Annexe 14** (API).
