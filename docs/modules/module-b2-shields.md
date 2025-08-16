---
module: Module B.2 (Shield Hosting Service)
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

# Module B.2 — Shield Hosting Service — **LOCKED**

## B2.1 Purpose
Allow members to publish shield availability (“host a shield”), let others subscribe when hiding troops, and deliver robust, time-based expiry alerts — including planned re-shield intentions and confirmations. Button-first in Discord with a lightweight PWA dashboard.

**In scope:** create posts, subscribe/unsubscribe (max **5** concurrent), alert ladder, snooze/next-alert, extension planning & confirmation, auto-archive, reporting.  
**Out of scope:** in-game automation or direct troop state detection (self-report UI instead).

---

## B2.2 Roles & Permissions (Policy Guard; Annexe 6)
**Member+ (host or subscriber)**
- Create shield post (host)
- Subscribe/unsubscribe (≤ **5** concurrent)
- Acknowledge alerts; set next alert (“snooze to”)
- Plan extension (host) and confirm new shield

**R3 / R4 / R5 (leadership)**
- All the above, **plus** close/delete posts, broadcast urgent notices

**Guards**
- Min rank to delete/force-close: **R3+**
- Feature Flag: `shields.enabled` must be **true**
- Maintenance Mode may pause alert fan-out (see **B2.11**)

---

## B2.3 Feature Flags (per-guild; Annexe 4 / A5.2)
- `shields.enabled` — master switch (UI hidden; commands reply localized “feature unavailable”)  
- `shields.extensions` — enable extension plan/confirm flow  
- `maintenance.enabled` — global pause (no alert deliveries)

---

## B2.4 Data Model (authoritative; mirrors Annexe 4)
_All docs include `guildId`, `version:int`, `createdAt`, `updatedAt` (CAS/ETag)._

### B2.4.1 `shields_posts`
- `postId` (ULID), `guildId` (index)  
- `hostId`, `hostName?`  
- `location`: `"dddd:dddd"` (validate `0:0 → 1200:1200`)
- **Current cycle**
  - `startUTC`, `endUTC`, `length`: `2h|8h|1d|3d`
  - `status`: `active|expired|closed`
- **Extension** (optional; when `shields.extensions`)
  - `extensionPlan?`: `{ length, startMode: "uponExpiry"|"atTime", plannedStartUTC }`
  - `extensionConfirmed?`: `{ length, confirmedStartUTC, confirmedBy }`
- `subscribersCount` (denormalized)
- `archiveAtUTC?` (for auto-archive)

### B2.4.2 `shields_subscriptions`
- `guildId`, `postId`, `userId` (**unique compound index**)  
- `state`: `active|unsubscribed`  
- `lastAlertSentAt?`, `nextAlertUTC?` (snooze/next-alert)  
- `quitReason?`: `manual|hostRemoved`

### B2.4.3 `shields_alerts` (optional audit/analytics)
- `guildId`, `postId`, `userId`, `alertKind`: `2h|1h|30m|15m|5m|expiry`  
- `deliveredAt`, `channel`: `dm|thread`, `result`: `ok|dm_closed|rate_limited|maintenance`

> “Auto-unsubscribe if troops withdrawn” cannot be detected in-game. We implement self-report (“I’ve withdrawn”) and **host remove** (R3+/host can remove a subscriber).

---

## B2.5 Workflows
### B2.5.1 Create Shield Post (host)
1) Host opens panel → **Create Shield** modal: location, length, startUTC (future)  
2) System calculates `endUTC`  
3) Bot posts an embed in **#shield-hosting** (Annexe 16): host, location, start/end, **Subscribe** button  
4) `status="active"`; optional per-post thread for comms

### B2.5.2 Subscribe / Unsubscribe (troop hider)
- **Subscribe:** Button or PWA; enforce **max 5 active subscriptions across all posts**  
- **Unsubscribe:** Button (“Unsubscribe” / “I’ve withdrawn”) → stops future alerts  
- **Host remove:** Host or **R3+** can remove a subscriber (button in post panel)

### B2.5.3 Alert Acknowledge & “Next Alert”
At any alert, recipient can:
- Acknowledge this alert
- Choose **next alert** from remaining ladder (e.g., 30m → 15m → 5m → expiry)  
We record `nextAlertUTC` and suppress intermediate alerts.

### B2.5.4 Extension Plan (host; if `shields.extensions`)
- At first host alert (2h before, if applicable), ask **“Will you extend?”**  
  - If **Yes**: choose `length` and `startMode` (`uponExpiry` or `atTime`) → record `extensionPlan`  
- Subsequent subscriber alerts include: “Host intends to place a new shield [length] [upon expiry/at time].”

### B2.5.5 Extension Confirmation (host)
- At `plannedStartUTC`, prompt: **Confirm [length] is now in place** (allow change of length)  
- On confirm: update post (new cycle), regenerate ladder, notify subscribers  
- If not confirmed at expiry: subscribers’ expiry alert says **“Check host has placed the new shield as intended.”**

### B2.5.6 Post Closure & Archive
- On expiry with no extension → `status="expired"`  
- Leadership/host can **Close** at any time (`status="closed"`)  
- **Auto-archive** after **14 days** (default; configurable). Archived posts hidden from dashboards.

---

## B2.6 Notifications & Alert Ladder
Default ladder (before expiry)  
**Subscribers:** 2h* → 1h → 30m → 15m → 5m → expiry  
**Host:** 2h* → 1h → 30m → 15m → 5m → expiry  
(*2h only when shield length > 2h*)

- Each alert is localized (Module D); can be acknowledged with **next-alert** selection  
- **Quiet Hours:** only 15m, 5m, expiry are delivered  
- **DM fallback:** if DM fails, ping once in post thread; log result

Modified ladder (when extension planned)  
- Subscriber alerts incorporate plan text (length + timing).  
- Expiry alert asks to confirm new shield exists.

**Maintenance Mode:** alert jobs enqueue but do not deliver until maintenance is cleared (A7.1/A9.1).

---

## B2.7 Validation & Logic Rules
- `startUTC` must be in the future; `endUTC = startUTC + length`  
- Prevent duplicate subscription (`postId`,`userId`)  
- Max concurrent subscriptions = **5** per user (across all `status="active"` posts)  
- Extension plan `plannedStartUTC` must **not** overlap current cycle (`startMode="atTime"` ⇒ `plannedStartUTC ≥ endUTC`)  
- If expiry passes with no confirmation → post `expired`; keep history; stop alerts  
- Auto-archive after **14 days** (configurable)

---

## B2.8 Reports (PWA + CSV)
- Active shields count  
- Subscribers per shield (average, max)  
- Extended vs not extended (rate)  
- Average subscription duration & **alert delivery success rate**

---

## B2.9 UX Surfaces (Annexe 3 compliant)
**Discord (button-first)**
- Post embed: **Subscribe / Unsubscribe**, **Extend Intent** (host), **Confirm Shield** (host), **Snooze/Next Alert**, **Close Post** (R3+)  
- Host control panel (ephemeral): edit length/time (pre-start), view/remove subscribers, delete/close

**Web/PWA**
- Shield dashboard: list active posts with countdowns; filters (host/time remaining); quick subscribe/unsubscribe  
- Alert preferences (Quiet Hours); next-alert management  
- Admin view: close/archive controls; CSV export

---

## B2.10 Integrations
- **Alliance Ops Core (B0):** visibility scopes & program patterns  
- **Events (B.7):** generally **not mirrored** as events; optional private activity  
- **Announcements (A7):** urgent broadcast (R3+) with **Audience Preview** (count + samples)  
- **i18n (Module D):** all strings via translation keys; EN fallback  
- **Server Layout (Annexe 16):** `#shield-hosting` channel + per-post thread template

---

## B2.11 Jobs, Reliability & Maintenance (Annexe 7)
- **Schedulers:** per-post alert jobs (2h/1h/30m/15m/5m/expiry) generated at creation/confirmation; **dedupe keys** prevent re-send  
- **Idempotency:** Idempotency-Key on subscription and confirm actions; alert jobs key by `{ postId, userId, alertKind }`  
- **Retries:** bounded backoff with jitter; **DLQ** on persistent failure  
- **Maintenance:** when `maintenance.enabled=true`, alert deliveries are skipped (logged `result="maintenance"`)

---

## B2.12 Observability (Annexe 8)
**Logs**
module=B.2 action=post.create|subscribe|unsubscribe|extend.plan|extend.confirm|alert.send|post.close result=allow|deny reason=… actorId entityId guildId
**Metrics**
- `shields_posts_active{guild}`
- `shields_subscriptions_active{guild}`
- `shields_alerts_sent_total{alertKind,channel,result}`
- `shields_extensions_planned_total` / `..._confirmed_total`
- `shields_dm_fallback_total{reason}`

**Alerts (soft)**
- DM failure rate **> 20%** in 1h window  
- Posts expiring without confirmations (trend)

---

## B2.13 Privacy & Retention (Annexe 10)
- Store only **Discord IDs** and gameplay meta (location coords)  
- Archive expired posts after **14 days**; keep alert audit up to **180 days** (configurable)  
- DSR: by Discord ID; delete subscriptions/links; optionally anonymise historical alert records

---

## B2.14 API Contracts (Annexe 14)
_Headers: `X-Guild-ID`, `If-Match` (CAS), optional `Idempotency-Key`._

- `POST /shields` — create post  
- `GET /shields?status=active` — list active posts  
- `POST /shields/{postId}/subscribe` — subscribe (enforce cap)  
- `POST /shields/{postId}/unsubscribe` — unsubscribe (`quitReason`)  
- `POST /shields/{postId}/extend` — set extension plan  
- `POST /shields/{postId}/confirm` — confirm new shield cycle  
- `POST /shields/{postId}/close` — close (R3+)  
- `PUT /shields/{postId}` — edit pre-start details (host/R3+; **If-Match**)  
- `GET /shields/reports/summary` — aggregates

**Error families**
- `400` `VALIDATION_INVALID_COORDS` / `INVALID_TIME`  
- `403` `POLICY_GUARD_DENY` / `FEATURE_DISABLED`  
- `404` `NOT_FOUND`  
- `409` `CONFLICT.WRITE_STALE`  
- `429` `RATE_LIMIT`  
- `503` `MAINTENANCE_MODE`

---

## B2.15 Discord Integration (Annexe 5 & 16)
- **Intents:** Guilds; Guild Members (for role checks); Guild Messages  
- **Permissions:** Send Messages; Manage Threads (post threads); Manage Webhooks (announcements)  
- **Component limits:** 5 rows; 5 buttons per row; select ≤ 25 options (Annexe 3)  
- Use **ephemeral** confirmations; DM fallback to post thread

---

## B2.16 Risks & Future-Proofing
- In-game state unknown → rely on self-report (“I’ve withdrawn”) and host remove  
- Alert fatigue → snooze/next-alert + Quiet Hours  
- Spam risk → rate-limit post creation; consider per-user cooldown  
- Scaling → pagination, per-host filters; shard alert jobs by `postId` to distribute load

---

## B2.17 Revision
- **2025-08-15:** Migrated to Module B.2; aligned with Annexes 3/4/5/6/7/8/10/14/16; added feature flags, maintenance gate, CAS, DM fallback, and explicit reports. (**LOCKED**)

---

## Δ Delta Notes
- Added feature flags, maintenance behavior, optimistic concurrency fields, and DM fallback routes  
- Clarified max **5** subscriptions enforcement across all active posts  
- Formalized extension plan/confirm and alert ladders; added snooze/next-alert  
- Introduced explicit API endpoints + error families, job idempotency, and observability metrics

## ⚠️ Gaps & Recommendations
- Optional per-user cooldown on creating posts (e.g., one every 30 min)  
- Leader override to broadcast critical expiry warnings  
- Bulk unsubscribe for host at close (with a reason sent to subs)

## Annexe Deltas
- **Annexe 4 (DB):** add `shields_posts`, `shields_subscriptions`, `shields_alerts` schemas; compound index `(guildId, postId, userId)` on subscriptions  
- **Annexe 14 (API):** add endpoints under `/shields*`  
- **Annexe 6 (Policy):** confirm **R3+** close/delete rule; member self-service rules  
- **Annexe 7 (Jobs):** add per-post scheduler, idempotency keys, maintenance handling  
- **Annexe 8 (Obs):** add metrics/logs listed in **B2.12**