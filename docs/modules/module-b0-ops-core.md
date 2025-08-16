---
module: Module B0 (Alliance Ops Core)
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
  - Annexe 16 (Server layout & permission templates)
---

# Module B0 — Alliance Ops Core (LOCKED)

## B0.1 Purpose
Define shared rules and building blocks for all alliance-specific features (CBSP, Shield Hosting, Formation Builder, Onboarding, Profile Admin, Mentor Program, Events). This module standardizes membership models, approvals, visibility, notifications, data invariants, and leader tooling so each B.x submodule stays consistent.

## B0.2 Scope
Applies to Modules **B.1–B.7** and any future alliance ops features. i18n (Module D) and Culture (Module J) remain separate but may integrate with **B.7 Events**.

## B0.3 Roles & Permissions (via Policy Guard)
- **Ranks:** R5, R4, R3, Elite, Member, Visitor (see Module A, Annexe 6).
- **Program roles:** CBSP Manager/Member, Mentor, Shield Host (if used), etc.
- **Default hostRoleMin per feature:**
  - **CBSP:** Manager actions = R4+/CBSP Manager; member self-service = Member+
  - **Shield Hosting:** host = Member+; moderation = R3+
  - **Formations:** everyone can calculate; R3+ can publish presets
  - **Onboarding/Profile:** self-service; escalations = R3+; safety = R4/R5
  - **Mentor:** mentors = Member+; approvals = R4+
  - **Events:** per B.7; owners/managers with R4 overrides
- **Order:** Feature Flags checked **before** permissions (Module A §A5.2; Annexe 4 settings).

## B0.4 Program Membership Pattern
Canonical membership document per program:
- **Fields:** `guildId`, `userId`, `programKey`, `status` (active|pending|left|banned), `joinedAt`, `leftAt?`, `notes?`, `managerIds[]`, `version`, `createdAt`, `updatedAt`.
- **Lifecycle:** request → approve → active → (suspend|leave) → archive.
- **Audit:** all state changes logged (who/when/why).
- **Privacy:** retain for **180 days** unless DSR; then anonymise `userId` to hashed form (Annexe 10).

## B0.5 Request/Approval Pattern
Standardized requests (e.g., CBSP resource, mentor pairing):
- **Request doc:** `guildId`, `requestId`, `type`, `actorId`, `targetId?`, `payload`, `status` (open|approved|denied|completed|cancelled), `version`, `createdAt`, `updatedAt`.
- **Approvals:** Discord buttons + PWA bulk; **Policy Guard** gates; optimistic concurrency on complete/deny.
- **Notifications:** requester DM + manager panel queue; DM fallback to **scoped thread** on failure.

## B0.6 Visibility & Privacy Scopes
- **Alliance-wide (Member+)**, **Program (role-gated)**, **Private/Participants (allowlist)**.
- Threads/channels must mirror the scope. PWA hides content outside scope.
- Exports restricted to **R4/R5**; per-program CSV includes only necessary fields.

## B0.7 Scheduling & Events Integration
- Any program may spawn a **B.7 Event** (e.g., CBSP Clean Window, Mentor Session).
- **Default scheduler:** Program/Private → **not mirrored** to Discord’s native scheduler; Alliance-wide → **mirrored** (toggleable).
- All reminders follow Module A (UTC logic, Quiet Hours, maintenance gate).

## B0.8 Notifications & Quiet Hours
- **Reminder ladder defaults:** 24h / 1h / 15m / start (module may override).
- **DM fallback** to scoped thread; **dedupe window 60 minutes** per alert key.
- **Audience Preview** before broadcasts/publish (count + samples; confirm).

## B0.9 Data Invariants (builds on Module A §A4.1)
All B.x collections MUST include:
- `guildId` (indexed), `version:int`, `createdAt`, `updatedAt`, soft-delete fields where applicable.
- **Idempotent keys** for jobs (`idempotencyKey`) where batch updates occur (Annexe 7).

## B0.10 Observability & SLOs
- **Logs:** action, `module=B.x`, result, reason, `actorId`, `entityId`, `guildId`.
- **Metrics (Annexe 8):** request throughput, approvals latency, DM failure rate, alert fallback rate, conflict rate.
- **Traces:** API routes + Discord handlers for end-to-end latencies.

## B0.11 Maintenance & Flags
- **Maintenance Mode** blocks publish/broadcast; workers pause non-critical deliveries.
- **Feature Flags** (Annexe 4) per guild: `cbsp.enabled`, `shields.enabled`, `formations.enabled`, `onboarding.enabled`, `profile.enabled`, `mentor.enabled`, `events.enabled`, etc.
- UI hides disabled controls; slash replies explain disabled features (localized).

## B0.12 Security & Safety
- **Least-privilege** bot; channel permission templates (Annexe 16).
- **Age range** only (no DOB); no sensitive data; PII minimised.
- **Moderation hooks** available to R4/R5 in all program spaces.
- Content safety in community features handled by **Module J**; ops channels still respect general moderation policies.

## B0.13 Cross-Module Interfaces
- **Annexe 3:** button-first patterns (panels, modals, bulk).  
- **Annexe 4:** schemas for `program_members`, `requests`, `events`, etc.  
- **Annexe 5:** intents/scopes/permissions; native scheduler integration.  
- **Annexe 6:** Policy Guard rules.  
- **Annexe 7:** jobs, retries, idempotency, maintenance.  
- **Annexe 8:** logs/metrics/traces.  
- **Annexe 10:** privacy/retention.  
- **Annexe 16:** server layout & permission templates.

> ✅ **Locked** as of **2025-08-15 (Europe/London)**.