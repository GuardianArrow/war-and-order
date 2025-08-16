# Annexe 6 — Policy Guard & Permission Rules ✅ (LOCKED)

_Last Updated: 2025-08-15 (Europe/London)_

Authoritative authorization model for bot, API, and PWA. **Every command, button, job, and API route must pass Policy Guard** before any privileged read/write.

---

## 6.1 Purpose & Scope

- Consistent, auditable **ALLOW / DENY / SOFT_ALLOW** decisions across Discord & PWA.
- Centralize rank checks, program role checks, visibility/privacy rules, Quiet Hours, rate-limit gates, feature flags, and guild scoping.
- Eliminate ad-hoc checks; all modules **A / B. / C / D / E*** integrate this annexe.  
  _Cross-refs: Annexe 4 (DB), Annexe 7 (Jobs), Annexe 8 (Observability), Annexe 14 (API)._

---

## 6.2 Role Model & Concepts

- **Rank roles (hierarchical):** `R5 > R4 > R3 > Elite > Member > Visitor`
- **Program roles (non-hierarchical):** e.g., `CBSP_MANAGER`, `CBSP_MEMBER`, `MENTOR`.
- **Guru roles:** skill tags (capabilities, not authority).
- **Computed flags:** `isOwner`, `isManager`, `isParticipant`, `isProgramMember(programKey)`.
- **Scope:** Each entity is bound to `guildId` (multi-guild safety).

---

## 6.3 Decision Pipeline (evaluation order)

1. **Guild boundary:** `actor.guildId` must match `target.guildId` → else **DENY.GUILD_MISMATCH**.
2. **Maintenance gate:** if `settings.maintenance.enabled=true` → **DENY.MAINTENANCE_MODE** for publish/broadcast/send; allow if action in `settings.maintenance.allowlistActions` **or** actor is **R5** and explicitly overrides (audited).
3. **Feature flags:** if `featureFlags[action]` (or module toggle) is false → **DENY.FEATURE_DISABLED**.
4. **Rate-limit/abuse:** bucket checks may yield **DENY.RATE_LIMITED**.
5. **Visibility/privacy:** private & program records enforce participant/program boundaries.
6. **Policy rule:** rank, owner/manager, program role, state locks → **ALLOW / SOFT_ALLOW / DENY**.
7. **Domain rules:** e.g., “cannot drop depot below minimum,” “Live cancel requires R4+” → **DENY.STATE_LOCKED**.

> **Fail-closed:** unknown actions or missing context → **DENY.UNKNOWN_ACTION**.  
> **Audit:** all **DENY** and all privileged **ALLOW/SOFT_ALLOW** write to `audit_logs`.

---

## 6.4 Policy Context (inputs)

```ts
type PolicyContext = {
  actor: {
    userId: string; guildId: string;
    ranks: ("R5"|"R4"|"R3"|"Elite"|"Member"|"Visitor")[];
    discordRoleIds: string[];            // raw Discord role IDs
    programRoles: string[];              // semantic program roles
  };
  target?: {
    type: string; guildId: string; ownerId?: string; managers?: string[];
    visibilityScope?: "alliance"|"program"|"private"; programKey?: string;
    participants?: string[]; status?: string; /* plus domain fields */
  };
  env: {
    nowUTC: Date; channelId?: string; isDM?: boolean; quietHoursBypass?: boolean;
  };
  settings?: { featureFlags: Record<string, boolean>; maintenance?: any };
  rate?: { key: string; remaining: number; resetAt: Date };
}
```

---

## 6.5 Global Invariants

1. **Guild boundary** (see §6.3).
2. **Privacy boundary:** program/private visibility limited to participants/program roles + R4/R5.
3. **Visibility ≠ action:** seeing ≠ editing/cancelling.
4. **State locks:** after **Live**, time/title/visibility edits need **R4 override**; destructive actions require reasons.
5. **Quiet Hours:** non-critical deliveries respect user Quiet Hours; critical (e.g., T-15m/start for major alliance events) require template flag + R4+ action → **SOFT_ALLOW** prompt.
6. **Least privilege:** prefer narrow program roles to broad ranks.
7. **Audience preview (mandatory):** broadcasts & event publish must run dry-run audience resolution and require confirm (see §6.9 & Module C).
8. **Discord ACL alignment:** channel/thread permissions must match decisions (see §6.15).

---

## 6.6 Error Families (Annexe 14 mapping)

- `POLICY.DENY.GUILD_MISMATCH`
- `POLICY.DENY.MAINTENANCE_MODE`
- `POLICY.DENY.FEATURE_DISABLED`
- `POLICY.DENY.MIN_RANK_R4` / `_R3` / `_MEMBER`
- `POLICY.DENY.PRIVACY_BOUNDARY`
- `POLICY.DENY.NEEDS_PROGRAM_ROLE_<KEY>`
- `POLICY.DENY.RATE_LIMITED`
- `POLICY.DENY.STATE_LOCKED`
- `POLICY.DENY.UNKNOWN_ACTION`
- `POLICY.SOFT.ALLOW_OWNER_PUBLISH` / `.REQUIRES_CONFIRMATION`

_API returns **403** with the code above; privileged write conflicts still return **409 CONFLICT** (optimistic concurrency; see Module A & Annexe 14)._

---

## 6.7 Global Permission Matrix (common actions)

| Action | Min role | Additional rules |
|---|---|---|
| View alliance event | Member | `scope=alliance` |
| View program/private | Program member / participant / R4+ | privacy boundary |
| Create alliance event | R4 (R3 if template `hostRoleMin<=R3`) | template controls |
| Publish event | R4, or Owner if template allows → **SOFT_ALLOW** | Audience preview required |
| Edit scheduled event | Owner/Manager/R4 | after Live → R4 override |
| Cancel event | R4; Live cancel: R4 (reason) / R5 always | audit reason |
| Mark attendance | Owner/Manager/R4 | bulk allowed; see B7.14 |
| Create event template | R4 | R5 may lock/archive |
| Broadcast alliance-wide | R4 | preview, rate gating |
| CBSP approve/deny | CBSP_MANAGER | caps & depot rules enforced |
| CBSP depot update | CBSP_MANAGER | snapshot & audit |
| Shield host/manage | Member for host; R4 may moderate | 5-sub cap per user |
| Mentor approve / assign | Mentor / R4 | capacity checks |
| Profile delete (exit) | Self or R4 | cascade + anonymize |
| i18n edit (Module D) | R4 with i18n-admin flag | versioned & audited |

> **Maintenance:** `event.publish`, `broadcast.send`, `alerts.sendNow` → **DENY.MAINTENANCE_MODE** unless allow-listed or R5 override (audited).

---

## 6.8 Module-Specific Policies

### 6.8.1 Module B.7 — Events Core (+ B7.1 Elite Wars, B7.2 WoF, B7.14 Attendance)

- **Create:** Alliance scope R4+ (or R3 per template). Program/private: owner must be program member or R4+.
- **Publish:** R4; Owner publish if template allows → **SOFT_ALLOW**.
- **Edit:** Owner/Manager/R4 while Draft/Scheduled; after Live → R4 override only (time/title/visibility).
- **Cancel:** Draft/Scheduled Owner/Manager/R4; Live cancel → R4 (reason) or R5.
- **Reschedule prompt (program/private):** Owner/Manager/R4 at end.
- **Scheduler mirror:** publish/edit permissions apply to native Scheduled Events.
- **Drift:** bot posts **SOFT_ALERT** and offers update; no auto-overwrite without R4.
- **Attendance (B7.14):** bulk mark Owner/Manager/R4; self-check-in only if enabled by sub-module; statuses: attended/late/no-show/excused.

### 6.8.2 Module B.1 — CBSP

- Join/leave: Member self-service; Manager approves.
- Assignments, underperforming flag, depot updates: **CBSP_MANAGER**.
- Approve/deny requests: **CBSP_MANAGER** (enforce caps/min levels).
- Notes visible to CBSP staff & R3+; personal data minimization per Annexe 10.

### 6.8.3 Module B.2 — Shield Hosting

- Host: Member. Extend intent/confirm: host.
- Subscribe/unsubscribe: Member; **max 5 active subs** across posts.
- Close/Moderate: host or R4.
- Alerts respect Quiet Hours except critical (15m/5m/expiry) if user opted in.

### 6.8.4 Module B.3 — Formation Builder

- Compute & save personal: Member+ (owner).
- Shared presets (future): R4+.

### 6.8.5 Module B.4 — Onboarding

- Gatekeeper channel limited to Gatekeeper role + R4/R5.
- Accept CoC/VOWs: self; timestamps required.
- Visitor→Member: on VOWs acceptance; bot assigns roles.

### 6.8.6 Module B.5 — Profile Edits & Removals

- Edit own profile; limited others’ edits by R4+.
- Exit server: self or R4; runs cascade deletion & role cleanup.
- Auto-cleanup on leave: system action, audited.

### 6.8.7 Module B.6 — Mentor Program

- Become mentor: Member with Guru skills set.
- Capacity set: mentor (≤ configured max; default 3).
- Approve mentee: mentor; R4 may assign when no mentor available.
- Mentor spaces private to mentor, mentees, R4/R5 (bot enforces overwrites).
- Remove mentee/close mentorship: mentor or R4.

### 6.8.8 Module C — Alliance Communication & Alerts

- Compose/send: R4 for alliance-wide; program-scoped allowed to program managers if configured.
- **Audience preview required** (show count + 10 samples) before send.
- Quiet Hours honored unless message marked **Emergency** by R4/R5; emergency bypass logs **SOFT_ALLOW**.
- DM fallback (Annexe 5/7): Policy Guard ensures fallback pings respect scope & anti-spam (**1/60m** per alert key).

### 6.8.9 Module D — Localization & i18n

- Edit/add keys: R4 with `i18n-admin` feature flag.
- Delete keys: R5 or i18n-admin with review; changes versioned & audited.
- Guild overrides allowed; uniqueness by `(guildId, key, locale)`.

### 6.8.10 Module E — Culture & Community

- Create activities: Culture Lead/Mods or R4+.
- Moderate submissions: Curator or R4+.
- Kudos: Member (rate-limited); badges: auto or manual by Curator/R4+.
- Clubs: create per governance rules (min members), auto-archive via job (Annexe 7).

---

## 6.9 Audience Preview (mandated) — broadcasts & publish

Before `/broadcast send` or `events.publish`:

- Resolve recipients (respect scope, locale, Quiet Hours).
- Show **count + first 10 sample recipients**; let sender refine filters.
- Require **Confirm Send**; log `{count, sampleUserIds[], scope}` to audit.

---

## 6.10 Rate Limits & Anti‑abuse

- **Per-user:** e.g., 10 slash cmds / min; DM alerts 1/30s.
- **Global:** broadcast batch fan-out (e.g., 50 recipients/batch with jitter).
- **Exceed:** **DENY.RATE_LIMITED**; log counters & details (Annexe 8).
- Policy Guard exposes `checkRateLimit(actor, action)`.

---

## 6.11 Observability (Annexe 8 hooks)

- **Metrics:** `pg_allow_total{action}`, `pg_deny_total{reason}`, `pg_soft_total{reason}`, `pg_decision_latency_ms`.
- **Logs:** structured JSON with `{ actorId, action, targetId, decision, reason, module, ts }`.
- **Dashboards:** per-guild decision rates; deny hot-spots; maintenance-mode blocks.

---

## 6.12 Caching & Invalidation

- **Decision cache** (key: `userId + action + targetId`) TTL **60s** for read-heavy UIs.
- Invalidate on: role/program change, template/policy change, event status transition.
- Never cache **break-glass** outcomes.

---

## 6.13 API Integration (Annexe 14)

- Requests include `X-Guild-ID`; writes include `If-Match` (ETag=`version`) and optional `Idempotency-Key`.
- **409 CONFLICT** indicates stale write (optimistic concurrency).
- Policy errors → **403** with code (§6.6).
- **All privileged endpoints must call Policy Guard** by action code.

---

## 6.14 Emergency & Delegation

- **Break-glass:** R5 can override any check; must provide reason → **high-severity audit**.
- **Time-boxed delegation:** R4/R5 may grant temporary capability (e.g., “publish events” for 2h); stored under settings with expiry.
- **Suspension:** R4 can suspend user capabilities (e.g., create/broadcast) via settings; evaluated early in pipeline.

---

## 6.15 Discord ACL Alignment

- **Mentor spaces:** channel/thread overwrites for mentor, mentees, R4/R5, bot.
- **Private events:** discussion threads restricted to participants + R4/R5.
- **Gatekeeper:** only Gatekeeper role + R4/R5.
- **Bot maintains ACLs** on state changes; discrepancies are auto-healed and audited.

---

## 6.16 Testing Strategy

- **Unit:** table-driven for each `canX`.
- **Contract:** Discord → Policy → DB; ensure no write happens without **ALLOW**.
- **Scenario:** “R3 publishes alliance event” → **DENY**; “Owner publish with template allow” → **SOFT_ALLOW**.
- **Audit assertions:** **DENY & privileged ALLOW** paths write audit.

---

## 6.17 Examples (quick reference)

- Member tries to publish alliance event → **DENY.MIN_RANK_R4**.
- Owner (R3) publishes when template allows → **SOFT_ALLOW_OWNER_PUBLISH** (confirm modal).
- CBSP Manager sets depot below min → **DENY.STATE_LOCKED**.
- Host cancels their Live shield → **ALLOW**; R4 may also cancel.
- Mentor approves beyond capacity → **DENY.CAPACITY_EXCEEDED**.
- Maintenance enabled → `broadcast.send` returns **DENY.MAINTENANCE_MODE** (unless allow-listed).

---

## 6.18 Reference: Actions Enum (canonical)

```
EVENT.CREATE | EVENT.PUBLISH | EVENT.EDIT | EVENT.CANCEL | EVENT.MARK_ATTENDANCE
EVENT.TEMPLATE.CREATE | EVENT.TEMPLATE.EDIT
CBSP.REQUEST.APPROVE | CBSP.DEPOT.UPDATE
SHIELD.POST | SHIELD.MANAGE
MENTOR.APPROVE | MENTOR.ASSIGN
PROFILE.EDIT | PROFILE.DELETE
I18N.EDIT
BROADCAST.SEND
```

---

### Revision Notes (what changed)

- Aligned to **A / B. / C / D / E*** module scheme; replaced legacy Module **I** references with **Module D (i18n)**.
- Added **Maintenance Mode** and **feature-flag** gates at the top of the pipeline.
- **Mandated Audience Preview** for broadcasts & publish.
- Clarified **Quiet Hours** & critical overrides (**SOFT_ALLOW** path).
- Expanded **error families** for Annexe 14 mapping.
- Added explicit **observability metrics**, decision caching, and **ACL alignment** rules.
