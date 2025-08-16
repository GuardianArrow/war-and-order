---
module: Module C (Alliance Communication & Alerts)
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

# Module C — Alliance Communication & Alerts  — ✅ **LOCKED**

## C1. Purpose & Scope
A centralized, policy-guarded system for composing, targeting, scheduling, and delivering alliance communications across:
- **Discord** (channels, threads, DMs),
- **In-game mail** (manual send flow, logged in our system),
- **PWA/App push** (web push, deep-links).

**Goals**
- One composer & pipeline for announcements, event notices, ops alerts, and targeted requests.  
- Button-first UX in Discord with audience preview and safe-send guardrails.  
- Quiet Hours, maintenance gate, and idempotent delivery (ties to Annexes 3, 7).  
- Full auditability and observability (Annexe 8); privacy controls (Annexe 10).

---

## C2. Channels & Capabilities

### C2.1 Discord
- **Surfaces:** public/role-scoped channels, private threads, DMs.  
- **Formats:** text, embeds, attachments, buttons/selects/modals (limits per Annexe 3).  
- **Permissions & intents:** see Annexe 5 (required OAuth scopes, guild members intent, bot perms).  
- **DM fallback:** if DM delivery fails (closed DMs / 403), auto-fallback to a **scoped thread ping (once)** and log `DELIVERY_FALLBACK` (Annexe 8).

### C2.2 In-game Mail (manual dispatch)
- **Constraints:** text-only; no programmatic API—sent by authorized R4/R5 (or delegated senders).  
- **Flow:** we render content + audience → human sends in-game → we record “sent by”, timestamp, and audience snapshot (no receipt telemetry available).

### C2.3 PWA/App Push
- Consent-based web push; per-device subscription; deep-links open the relevant module (events, CBSP, shields, etc.).  
- Quiet Hours honored unless **Emergency**.  
- Delivery receipts & failures tracked where supported.

---

## C3. Message Types
1. **Alliance Announcements** — leadership updates, policy changes, high-signal news.  
2. **Event Notices** — tied to B.7 Events lifecycle (Draft→Scheduled, Live, status changes).  
3. **Operational Alerts** — CBSP low stock, Shield expiry, Mentor pairing, etc.  
4. **Targeted Requests** — role/program/team calls (e.g., “Group C rally @ 15:00”).  
5. **Emergency Alerts** — Quiet Hours override (restricted to R4/R5 + feature flag).

---

## C4. Audience Targeting
- **By Role:** ranks (R5/R4/R3/Member/Visitor), program roles (CBSP, Mentor), event teams.  
- **By Profile Attributes:** language, timezone, country, availability windows, skills/guru tags.  
- **By Custom Lists:** saved recipient sets, RSVPs/waitlists for a specific event.  
- **Exclusions:** opt-out flags, Quiet Hours (unless Emergency).

**Mandatory Preview (“Who will receive this?”):**  
Show **count** and first **N sample recipients** (e.g., 10) before send. Requires explicit confirmation; audited (Annexe 6/8).

---

## C5. Scheduling & Recurrence
- **Immediate** — send now (subject to Maintenance Mode).  
- **Scheduled** — send at future time (UTC in DB; TZ localized in UI).  
- **Recurring** — `RRULE` (daily/weekly/monthly); e.g., CBSP reset reminders.  

Jobs use Annexe 7 queues with **idempotency keys** and **rate-limit aware fan-out**.

---

## C6. Composer & Workflow (button-first + PWA)
**Steps:** Compose → Target → Preview → Schedule/Send → Confirm

- **Composer surfaces:**  
  - Discord “Open Panel” button (Annexe 3) for quick sends.  
  - PWA Composer for rich, long, or multilingual messages.
- **Templates:** reusable, versioned; i18n keys (Module D); variable tokens (e.g., `{eventTitle}`, `{startLocal}`).  
- **Linking:** add event deep-links, ICS attachments, or PWA routes.  
- **Test mode:** send to self or R4 sandbox before wide delivery.

---

## C7. Quiet Hours & Overrides
- Quiet Hours are **per-user (profile)**. Messages **queue** until quiet ends.  
- **Emergency override** (R4/R5 + feature flag `alerts.emergency.enabled`) delivers immediately; audit as `OVERRIDE`.

---

## C8. Delivery Pipeline & Safety
- **Feature flags:** `alerts.enabled`, `alerts.discord.enabled`, `alerts.push.enabled`, `alerts.emergency.enabled`.  
- **Maintenance Mode:** if active (Module A / Annexe 7), **blocks new publishes** and **pauses fan-out**; shows leader banner.  
- **Idempotency:** `Idempotency-Key` per message; duplicate requests resolved safely.  
- **Rate limits:** batch by channel/DM, jittered dispatch to avoid 429s.  
- **DM fallback:** scoped thread ping **once**, then stop; log reason (privacy safe).  
- **Cancel/Amend:** scheduled messages can be **edited or cancelled** (`ETag/If-Match`; see Annexe 14).  
- **Safety step:** audience preview confirmation is **required** for `/broadcast` and event publishes.

---

## C9. Data Model (see Annexe 4 for field types/indexes)

**messages**
- `messageId`, `guildId`, `version`, `createdAt`, `updatedAt`  
- `type` (`announcement` | `event` | `ops` | `request` | `emergency`)  
- `channelsUsed` (`discord_channel` | `discord_dm` | `ingame_mail` | `push`)  
- `content { i18nKey?, markdown?, embed?, attachments[] }`  
- `targeting { roles[], programs[], userIds[], filters{ tz?, lang?, country?, skills[] }, excludeQuietHours?:bool, emergency?:bool }`  
- `schedule { sendAtUTC?, rrule? }`  
- `status` (`draft` | `scheduled` | `sending` | `sent` | `cancelled` | `failed`)  
- `audienceSnapshotId` (FK)  
- `policy { createdBy, approvedBy? }`

**message_templates**
- `templateId`, `name`, `version`, `localeKeys[]`, `variables[]`, `notes`, `status (active|archived)`

**audience_snapshots**
- `snapshotId`, `guildId`, `builtAtUTC`, `recipientIds[]`, `filtersApplied`, `count`

**deliveries**
- `deliveryId`, `messageId`, `targetUserId`, `channel`  
- `attempts`, `lastResult (ok|dm_closed|throttled|error)`, `lastAtUTC`  
- `fallbackUsed (bool)`, `quietDeferred (bool)`

_All documents carry `guildId`, `version`, and SCD timestamps; optimistic concurrency per Module A §A9.2._

---

## C10. API Contracts (Annexe 14)

- `POST /messages` (create draft) — headers: `X-Guild-ID`, `Idempotency-Key`; returns `messageId`, `ETag`.  
- `PUT /messages/{id}` (edit) — header `If-Match: <ETag>`; **409** on stale.  
- `POST /messages/{id}/schedule` — schedule or send now.  
- `POST /messages/{id}/cancel` — cancel if scheduled.  
- `GET /messages/{id}` — view (includes audience snapshot, status).  
- `GET /messages?range=…` — list with filters.

**Error families:** `POLICY.GUARD_DENY`, `MAINTENANCE.ACTIVE`, `DELIVERY.THROTTLE`, `CONFLICT.WRITE_STALE`, `VALIDATION.BAD_TARGETING`, etc.

---

## C11. Permissions (Policy Guard – Annexe 6)
- **Compose Draft:** R3+ (module flag configurable).  
- **Schedule/Send Alliance-wide:** R4/R5.  
- **Emergency Override:** R4/R5 only + feature flag.  
- **Edit/Cancel Scheduled:** owner, R4/R5.  
- **Automation Hooks:** system principals with least-privilege tokens.

Every ALLOW/DENY is logged with rule id and reason.

---

## C12. Observability & Audit (Annexe 8)
**Logs:** structured JSON for compose, preview, schedule, send, cancel, fallback, emergency override.

**Metrics**
- `alerts_messages_sent_total{channel,type}`  
- `alerts_dm_fallback_total`  
- `alerts_quiet_deferred_total`  
- `alerts_delivery_error_total{reason}`  
- `alerts_audience_size{type}`

**Traces:** composer → queue → dispatcher per message.  
**Dashboards:** per-guild delivery success, fallback rates, emergency usage.

---

## C13. Privacy & Retention (Annexe 10)
- Message content retained **180 days**; deliveries **90 days** (counts + non-PII reasons kept).  
- Audience snapshots retain only Discord IDs; purge with user deletion.  
- Subject access: export user’s delivery log (last 90 days).  
- No sensitive personal data stored; localization and tokens resolved at send time.

---

## C14. Commands & UI (Discord + PWA)

**Discord (button-first, Annexe 3)**
- `/broadcast` → opens Composer Panel (compose → target → preview → confirm).  
- Buttons: **Audience Preview**, **Schedule**, **Send Now**, **Cancel**.  
- Modals: per-channel variants (Discord embed fields; push title/body).  
- Diagnostics: `/whoami`, `/help`.

**PWA**
- Message Composer (rich editor, i18n previews).  
- Audience Builder (roles, filters, custom lists; sample recipients).  
- Schedule/Recurring tabs.  
- Delivery Reports with per-channel breakdown.  
- Template Library with versioning & variables.

---

## C15. Automation Hooks & Integrations
- **B.7 Events:** lifecycle hooks (Publish, Live, Postpone, Cancel) → event notices.  
- **B.1 CBSP:** low-stock trigger → notify CBSP Managers/Hosts.  
- **B.2 Shields:** shield expiry ladder to subscribers/host; intention/confirmation messages.  
- **B.6 Mentors:** pairing accepted/reassigned → DM both parties & post in mentor space.  
- **Module J Culture:** quiz prompts, leaderboard shout-outs.

_All automations use the same pipeline and honor Quiet Hours unless defined Emergency._

---

## C16. Risk & Future-Proofing
- **Discord rate limits:** fan-out with jitter; batch per channel; backoff on 429.  
- **DM closures:** handled by thread fallback; **no multi-fallback spam**.  
- **Maintenance Mode:** global pause switch (ties to Annexe 7 & Module A).  
- **Feature flags:** per channel/type for gradual rollout.  
- **Multi-guild readiness:** every record scoped by `guildId`.  
- **Extensibility:** future channels (email/SMS) can mount to the same pipeline with a new dispatcher.

---

## C17. Change Log
- **2025-08-15:** Converted from old “Module H” to **Module C**; added audience preview, DM fallback, maintenance gate, feature flags, API/ETag, and observability wiring. Aligns with Annexes 3/5/6/7/8/10/14.
