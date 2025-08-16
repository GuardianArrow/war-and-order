---
module: Module A (Core System Architecture & Layers)
version: v2025.08
status: Locked
last_updated: 2025-08-14
owners: [GuardianArrow]
annexe_refs: ["Annexe 4 (Database Schemas)", "Annexe 6 (Policy Guard)", "Annexe 16 (Folder Structure)"]
---

# Module A — Core System Architecture & Layers

## Purpose & Scope
Module A defines the system-wide architecture, constants, standards, and cross-cutting services that every other feature module must adhere to.

It governs:
- Authentication & Access Control
- Roles & Permissions
- Internationalisation (i18n)
- Timezone Handling
- Data Storage
- Notification & Messaging Infrastructure
- Security & Audit Logging

All sub-modules must reference Module A for consistency and integration.

---

## A1. Project Overview

### Goals
1. Create a single hub for alliance coordination, onboarding, event scheduling, and role management.
2. Offer **chat-first** flows in Discord, paired with **mobile-first** web dashboards for oversight and analytics.
3. Reduce R5/R4 manual administration with automation, templating, and pre-configured flows.
4. Operate within a monthly budget of **≤ £20** (hosting + API costs).

### Targets
- Player Base: ~100 active players across global time zones  
- Primary UX: **Discord Bot**  
- Secondary UX: **Web PWA**  
- Data Storage: **MongoDB Atlas** (free tier)  
- Performance: Low-latency responses; in-memory caching for high-traffic lookups

### Core Integrations
- **Discord** = authentication layer for all user access
- PWA communicates via a **bot-owned backend API**
- All times stored in **UTC** and displayed according to user’s **timezone**
- **Localisation** files for all bot & PWA text (JSON, modular)

---

## A2. Users & Roles

### User Personas (Game-aligned)
- **R5 – Alliance Leader**: Full system control; ultimate permissions  
- **R4 – Deputies**: Operational control; event creation & member management  
- **R3 – Assist Leaders**: Group-level leadership; moderate permissions  
- **Elite**: Recognised veteran members  
- **Member**: Standard players  
- **Visitor**: Temporary or trial members

### Specialist Roles (Functional)
- CBSP Manager / CBSP Member  
- Player Mentor  
- Lottery Manager  
- Resource Seller

### Guru Roles (Skill Profiles)
- Marches & Formations, Farm Builder, Getting to Orange, Titan Pro, Beast Growth, Castle Development, Generating Resources

### Role Assignment Logic
- Guru/Specialist roles earned via **Profile Builder or Quiz**
- Auto-assigned in Discord after verification
- Roles searchable via `/whohas <role>` and on the Web Dashboard

---

## A3. Permissions Matrix

| Role   | Create Events | Manage Roles | Broadcast | Approve Plans | Moderate | Kick/Ban | Mute | RSVP | View Schedules | Set Availability |
|--------|----------------|--------------|-----------|---------------|----------|----------|------|------|----------------|------------------|
| **R5** | ✅              | ✅            | ✅         | ✅             | ✅        | ✅        | ✅    | ✅    | ✅              | ✅                |
| **R4** | ✅ Promote      | ✅            | ✅         | ✅             | ✅        | ✅        | ✅    | ✅    | ✅              | ✅                |
| **R3** | ❌              | ❌            | ✅         | ❌             | ✅        | ❌        | ✅    | ✅    | ✅              | ✅                |
| **Elite** | ❌           | ❌            | ❌         | ❌             | ❌        | ❌        | ❌    | ✅    | ✅              | ✅                |
| **Member** | ❌          | ❌            | ❌         | ❌             | ❌        | ❌        | ❌    | ✅    | ✅              | ✅                |
| **Visitor** | ❌         | ❌            | ❌         | ❌             | ❌        | ❌        | ❌    | ❌    | ✅ (limited)    | ❌                |

Final, enforceable rules live in **Annexe 6 – Policy Guard**.

---

## A4. Locales & Time Zones

### Supported Languages (Phase 1)
EN, Arabic, German, Lithuanian, Serbian, French, Portuguese, Spanish, Vietnamese, Chinese, Korean, Russian, Polish, Ukrainian, Brazilian Portuguese, Venezuelan Spanish, Romanian, Swedish

### Localisation Requirements
- Translation keys stored in **modular JSON** files
- Players can set language via `/setlanguage` (Discord) or Web Profile
- Fallback = **English** if string not found

### Time Zone Handling
- All times stored in **UTC** in DB
- Displayed in user’s set timezone (configurable via `/settimezone`)
- Auto-detect timezone on first PWA visit: `Intl.DateTimeFormat().resolvedOptions().timeZone`

---

## A5. Core Features & Modules (Baseline)

1) **Onboarding & Role Assignment**  
   - Guided onboarding flow in Discord DM  
   - Collects language preference & timezone  
   - Assigns default **Visitor** role  
   - Profile Builder collects in-game name, castle level, preferred roles

2) **Role & Permission Management**  
   - Bot enforces permission checks  
   - Role lookup via commands and web filters

3) **Event Scheduling & RSVP**  
   - Event creation (title, time, description, RSVP options)  
   - Recurring event support  
   - RSVP via reaction, slash command, or web form  
   - Auto reminders at **24h** & **1h** before event

4) **Announcements & Broadcasts**  
   - Role-targeted broadcast messages  
   - Scheduled announcements for recurring reminders  
   - Multi-language broadcast support

5) **Member Directory & Profiles**  
   - Search by in-game name, Discord name, roles  
   - Player card with timezone, recent activity, availability  
   - Mentor matching by Guru skillset

6) **Admin & Moderation Tools**  
   - Mute, warn, kick, ban commands  
   - Action logging  
   - Auto-remove inactive visitors after set period

7) **Web Dashboard (PWA)**  
   - Discord login  
   - Member management & event calendar  
   - Profile editing for availability & roles

8) **Data & Storage**  
   - MongoDB Atlas for DB  
   - Collections: **Users, Roles, Events, RSVPs, Settings, Logs**  
   - Store only **game-relevant** data

9) **Notifications & Reminders**  
   - Discord DMs for events, confirmations, and alerts  
   - Optional PWA push notifications

---

## A6. Security & Audit
- All role changes, event edits, and moderation actions **logged**
- **Bot-side permission checks** to prevent bypass
- **No sensitive personal info** stored

---

## Interfaces (provided by Module A)
- **Auth & Identity:** Discord OAuth2 + guild membership checks  
- **Policy Guard:** role/claim evaluation (Annexe 6)  
- **Feature Flags & Maintenance:** per-guild flags; global maintenance gate  
- **i18n:** key resolver + per-user locale  
- **Time:** UTC storage, per-user display, helpers  
- **Storage:** Mongo client + collection access helpers  
- **Comms:** Discord API client wrapper; later: notification bus  
- **Telemetry/Audit:** logger, metrics, audit trail hooks

---

## Data (high-level)
- `settings` (per-guild): channels, roles, featureFlags, maintenance  
- `users` (Discord linkage), `roles_map` (guild role IDs), `events`, `rsvps`, `logs`

---

## Definition of Done (Module A)
- [ ] i18n loader + locale selection available system-wide  
- [ ] UTC/timezone helpers available; `/settimezone` endpoint/command spec’d  
- [ ] Policy Guard primitives implemented (role→capability mapping hook)  
- [ ] Feature flags + maintenance gate available  
- [ ] Mongo client + collection helpers available  
- [ ] Telemetry & audit hooks available  
- [ ] Security posture documented (no PII; audit key actions)  
- [ ] This spec referenced by all feature modules

---

## Test Matrix
| Case | Area | Steps | Expected |
|------|------|-------|----------|
| 1 | i18n fallback | Set unsupported locale, resolve key | English fallback string returned |
| 2 | TZ render | Store UTC, set user TZ to Asia/Seoul | Local time shows correctly |
| 3 | Policy check | R3 runs broadcast | Denied per matrix |
| 4 | Flags | Disable comms_enabled | Broadcast commands blocked |
| 5 | Maintenance | Enable maintenance | All outbound sends paused |
| 6 | Audit | Change role, edit event | Audit entries recorded |

✅ Module A is **Locked** as of **2025-08-14**.