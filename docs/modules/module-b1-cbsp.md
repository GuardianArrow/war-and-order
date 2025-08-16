---
module: Module B.1 (Central Build Support Program - CBSP)
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
  - Annexe 14 (API Contracts)
  - Annexe 16 (Server layout & permission templates)
---

# Module B.1 — Central Build Support Program (CBSP) — **LOCKED**

## B1.1 Purpose
Centralised resource collection and distribution program to accelerate member castle upgrades by pooling farm resources into a depot castle. Standardises enrollment, assignments, requests, depot tracking, approvals, and reporting.

**In scope:** membership, assignments, requests (resources/cleaning), depot state, approvals, notifications, reports, Discord/PWA UX.  
**Out of scope:** pricing/real-money trading; game automation.

---

## B1.2 Roles & Permissions (Policy Guard)
**CBSP Manager** (program role; typically 2–3):
- Approve/deny join; remove members
- Assign primary/secondary resource types
- Approve/deny resource requests; process cleaning requests
- Set depot availability & cleaning windows
- Broadcast to CBSP Members
- Notes; flag/unflag underperforming farms
- Update depot levels (post-clean / post-request completion)
- View all open requests; view program reports

**CBSP Member**
- Join/Leave program; provide farm profile (count, names, coords `xxxx:xxxx`)
- Receive assignment; submit **resource** and **cleaning** requests
- Edit farm details; receive completion acknowledgements; exit (role removed; farm data deleted)

**Guardrails (Annexe 6):**
- Manager actions = **R4+** or **CBSP Manager** role
- Member self-service = **Member+**
- All decisions **ALLOW/DENY/SOFT_ALLOW** logged
- **Feature Flag gate:** `cbsp.enabled` (Annexe 4 / A5.2)

---

## B1.3 Feature Flags (per-guild)
- `cbsp.enabled` — master switch (UI hides; commands reply “feature unavailable” if off)
- `cbsp.depotEditing` — managers can edit depot min levels & per-request caps in PWA
- `events.enabled` — governs CBSP’s ability to create **CBSP Clean Window** events (B.7)
- `maintenance.enabled` — global pause (A7.1/A9.1)

---

## B1.4 Data Model (authoritative)
_All docs also include `guildId`, `version`, `createdAt`, `updatedAt`, optional soft-delete. Indices per Annexe 4._

### B1.4.1 `cbsp_members`
- `guildId`, `userId` **(unique pair index)**
- `status`: `active` | `pending` | `removed` | `left`
- `inGameName`: string
- `farms`: `[{ name, coords: "dddd:dddd" }]` (max lengths in Annexe 4)
- `primaryResource`: `food|wood|stone|iron`
- `secondaryResource`: `food|wood|stone|iron`
- `underperforming`: boolean (manager-controlled)
- `notes?`: string (short)
- `joinedAt`, `leftAt?`

### B1.4.2 `cbsp_requests`
- `guildId`, `requestId` (ULID), `type`: `join|resource|cleaning`
- `actorId` (requesting user)
- `payload` (typed by `type`)
  - `resource`: `{ food?, wood?, stone?, iron?, purpose }`
  - `cleaning`: `{ farms?: string[] | "all" }`
  - `join`: `{ farms: [...], inGameName }`
- `status`: `open|approved|denied|completed|cancelled`
- `decision?`: `{ by, at, reason? }`
- `completion?`: `{ by, at, depotAfter: { food, wood, stone, iron } }`
- **Index:** `(guildId, type, status)`

### B1.4.3 `cbsp_depot`
- `guildId` **(unique)**
- `levels`: `{ food, wood, stone, iron }` (0 → 999,999,999,999)
- `minLevels`: `{ ... }`
- `maxPerRequest`: `{ ... }` (defaults below)
- `lastUpdatedBy`, `lastUpdatedAt`

**Default max per request** (configurable if `cbsp.depotEditing`):  
Food **200,000,000**; Wood **200,000,000**; Stone **50,000,000**; Iron **25,000,000**

### B1.4.4 `cbsp_notes` (optional)
- `guildId`, `userId`, `noteId`
- `kind`: `performance|collection|general`
- `text?`: string
- `collection?`: `{ date, food?, wood?, stone?, iron? }`

> If logging quantities over time, a separate `cbsp_notes` scales better than a single `notes` field on `cbsp_members`.

---

## B1.5 Workflows
### B1.5.1 Join / Onboarding
1. Member submits join request (Discord panel → modal; or PWA form)  
2. Manager approves/denies (buttons)  
3. On approve:
   - Assign **CBSP Member** role
   - Save farms; set primary/secondary resource
   - DM confirmation with quick links (Edit farms / Resource request / Cleaning request)

### B1.5.2 Assignments
- Manager sets/changes primary/secondary → Member DM + in-panel update  
- Changes audited (who/when/old→new)

### B1.5.3 Resource Request
1. Member submits type/amounts + purpose  
2. **Validation (B1.7):**
   - Deny if any amount > `maxPerRequest`
   - Deny if depot level insufficient
   - Deny if result would drop below `minLevels`
3. Manager approve/deny  
4. On approve:
   - Member collects from depot
   - On completion, member enters new depot levels (from in-game scout)
   - System updates `cbsp_depot.levels` (**CAS; optimistic concurrency**)

### B1.5.4 Cleaning Request
- Member flags ready for cleaning  
- Manager processes now or schedules **CBSP Clean Window** (B.7)  
- After cleaning: manager updates depot levels

### B1.5.5 Exit
- Member leaves CBSP (button/form)  
- Remove role & delete farm details (soft/hard per Annexe 10)  
- Anonymise historical logs (hash userId) if retained

---

## B1.6 Depot Resource Tracking
**Stored:** `levels`, `minLevels`, `maxPerRequest`  
**Update triggers:** after cleaning (manager) or request completion (member)  
**Writes:** use **ETag/If-Match (CAS)**  
**Audit:** who/when/old→new; reason (cleaning/resource)

**Validation (pre-approval):**
- Request ≤ current level  
- Result ≥ `minLevels`  
- Respect `maxPerRequest` per resource

---

## B1.7 Validation Rules (server-side)
- Numbers: `0 ≤ value ≤ 999,999,999,999` (64-bit safe)  
- Coordinates: regex `^\d{1,4}:\d{1,4}$` (`0:0` → `1200:1200`)  
- Farms: max **N** (configurable; default **20**)  
- Purpose text: length ≤ **200** chars  
- Assignments: `primary !== secondary` (warn if same; allow if intended)

---

## B1.8 Reporting (PWA + CSV export)
**Visibility:** CBSP Managers, R5/R4; R3 read-only; Members limited (self + aggregates)

**Defaults**
- Program size (members, farms count)  
- Underperforming farms (flag count; list)  
- Depot history snapshot (levels over time; simple chart)  
- Requests funnel open/approved/denied/completed (last 30/90 days)

**Extensibility:** additive report definitions

---

## B1.9 UX Surfaces (Annexe 3 compliance)
**Discord (button-first):**
- **Member Panel:** Join/Leave, My Assignments, New Resource Request, Cleaning Request, Edit Farms, My Requests  
- **Manager Panel:** Member Approvals, Open Requests, Assignments, Depot Update, Broadcast, Reports  
- **Approvals:** Approve / Deny / Complete on request cards → **Depot Update** modal (if completion)  
- **Modals:** Join, Resource Request, Cleaning Request, Depot Update  
- Ephemeral confirmations; **DM fallback to scoped thread** on DM failure

**Web/PWA:**
- **CBSP Dashboard:** members, assignments, depot levels, open requests, flags  
- **Depot editor** (min/max per request) if `cbsp.depotEditing`  
- Reports (CSV export)  
- Bulk approve/deny

---

## B1.10 Integrations
- **Events (B.7):** create **CBSP Clean Window** (program/private scope; native scheduler OFF by default)  
- **Onboarding (B.4):** Join/Exit toggles CBSP flag in profile (does not auto-toggle profile module)  
- **Announcements (A7):** broadcasts to CBSP role; **Audience Preview** (count + samples) before send  
- **i18n (Module D):** all strings via translation keys; EN fallback

---

## B1.11 Jobs & Reliability (Annexe 7)
- **Reminders (optional):**
  - Cleaning windows: 24h / 1h / 15m (if event created)
  - Pending requests stale >48h → notify managers
- **Idempotency:** depot updates keyed by `{ guildId, requestId, completion.at }`  
- **Retries:** 5 attempts, backoff with jitter; **DLQ** on persistent failure  
- **Maintenance Mode:** if enabled, queue but do not deliver broadcasts/reminders

---

## B1.12 Observability (Annexe 8)
**Logs**