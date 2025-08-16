# Annexe 8 — Observability & Telemetry Taxonomy (LOCKED)

**Last Updated:** 2025-08-15 (Europe/London)

All modules (A core; B1 CBSP, B2 Shields, B3 Formation, B4 Onboarding, B5 Profile, B6 Mentor, B7 Events + submodules; C Comms; D i18n; E Culture) and all background jobs (Annexe 7) **MUST** emit telemetry per this taxonomy.

---

## A8.1 Objectives & Principles

- **Actionable:** every alert links to a runbook.
- **Low-cost:** sample noisy streams; keep storage lean.
- **Privacy-first:** no PII beyond Discord IDs; no raw message bodies by default.
- **Consistent:** same envelopes/labels across bot, API, workers.
- **Traceable:** OpenTelemetry `traceId`/`spanId` across requests and jobs.

---

## A8.2 Stack & Formats

- **Logs:** JSON lines; UTC timestamps; one event per line.
- **Metrics:** counters/gauges/histograms with labels (`guildId`, `module`, `type`, `action`, `status`).
- **Tracing:** OpenTelemetry (OTLP); child spans for DB/Discord/Job calls.  
  _Resource attrs:_ `service.name`, `service.version`, `deployment.environment`, `guildId`.
- **Dashboards:** per-guild + global rollups.
- **Retention:** Logs **30d** (high-volume), Metrics **90d**, Key audits **365d**.

---

## A8.3 Canonical Log Envelope

```json
{
  "ts": "2025-08-15T12:34:56Z",
  "level": "INFO|WARN|ERROR",
  "msg": "short summary",
  "module": "B7.events|B1.cbsp|C.comms|D.i18n|E.culture|A.core|A6.policy|A7.jobs",
  "action": "EVENT.PUBLISH|CBSP.REQUEST.APPROVE|SHIELD.ALERT|...",
  "guildId": "123",
  "userId": "456?",
  "targetId": "eventId/shieldId/...",
  "status": "ok|retry|dlq|deny|...",
  "traceId": "...", "spanId": "...", "parentSpanId": "...?",
  "latencyMs": 123,
  "retry": 0,
  "rateLimit": { "route": "/channels/...", "remaining": 1, "resetMs": 5000 },
  "result": { "...": "summaries only" },
  "reason": "DENY.MIN_RANK_R4|MAINTENANCE_MODE|...",
  "err": { "code": "...", "message": "..." },
  "sample": true
}
```

---

## A8.4 Redaction & Privacy

- Don’t store raw content bodies; store hashes for dedupe.
- Keep IDs only; resolve display names in UI on demand.
- Policy logs capture reason codes, not payloads.
- `pHash` for Culture media is non-PII (see Annexe 10).

---

## A8.5 Canonical Events (by area)

- **B7 Events:** `EVENT.CREATE` · `EVENT.PUBLISH` · `EVENT.EDIT` · `EVENT.CANCEL` · `EVENT.MARK_ATTENDANCE` · `EVENT.SCHEDULER_DRIFT`
- **B7.1 Elite Wars:** `EVENT.EW.GROUP_ASSIGN` · `EVENT.EW.SUMMARY`
- **B7.2 WoF:** `EVENT.WOF.DEFENCE_DEADLINE` · `EVENT.WOF.SLOT_REMINDER` · `EVENT.WOF.PHASE_SUMMARY`
- **B1 CBSP:** `CBSP.REQUEST.APPROVE` · `CBSP.DEPOT.SNAPSHOT` · `CBSP.MEMBER.FLAG`
- **B2 Shields:** `SHIELD.POST` · `SHIELD.ALERT` · `SHIELD.EXTEND_INTENT` · `SHIELD.EXPIRE`
- **B6 Mentor:** `MENTOR.SIGNUP` · `MENTOR.APPROVE` · `MENTOR.CLOSE`
- **C Comms:** `BROADCAST.PREVIEW` · `BROADCAST.SEND` · `DM.FALLBACK`
- **D i18n:** `I18N.KEY.ADD` · `I18N.KEY.UPDATE` · `I18N.KEY.DELETE` · `I18N.MISSING_KEYS.DIGEST`
- **E Culture:** `CULTURE.ACTIVITY.CREATE` · `CULTURE.SUBMIT` · `CULTURE.VOTE` · `CULTURE.BADGE.AWARD`
- **A6 Policy:** `POLICY.ALLOW` · `POLICY.DENY` · `POLICY.SOFT_ALLOW`
- **A7 Jobs:** `JOB.ENQUEUE` · `JOB.EXEC` · `JOB.RETRY` · `JOB.DLQ`
- **Conflicts:** `CONFLICT.WRITE_STALE` (include `{ previousVersion, attemptedVersion, entityId }`)

---

## A8.6 Metrics — Core Taxonomy

_All prefixed `am_*` unless noted._

### Core

- **Events:**  
  `am_events_created_total{type}` · `am_events_publish_total{type}` · `am_events_live_gauge{type}` · `am_events_attendance_total{type,status}` · `am_event_scheduler_drift_total`
- **CBSP:**  
  `am_cbsp_requests_total{decision}` · `am_cbsp_depot_level{resource}` (gauge)
- **Shields:**  
  `am_shield_alerts_sent_total{stage}` (2h|1h|30m|15m|5m|expiry)
- **Mentor:**  
  `am_mentor_active_pairs_gauge`
- **Jobs (A7):**  
  `am_jobs_queued_total{jobType}` · `am_jobs_processing_gauge{jobType}` · `am_jobs_latency_ms{jobType}` (histogram) · `am_jobs_retry_total{jobType,reason}` · `am_jobs_dlq_total{jobType}` · `am_jobs_paused_total{reason}`
- **Rate limits:**  
  `am_rate_limit_hits_total{route}`
- **Policy:**  
  `am_policy_denies_total{reason}`
- **Comms:**  
  `am_broadcast_recipients_total{channel}` · `am_dm_failures_total{reason}` · `am_alert_fallback_total{surface}`
- **i18n:**  
  `am_i18n_keys_total{locale}`
- **Conflicts:**  
  `am_conflicts_total{module,type}`

### Culture (E) extensions

- **Activity & content:**  
  `e_culture_activities_total{type,status}` · `e_culture_submissions_total{type}` · `e_culture_votes_total` · `e_culture_kudos_total`
- **Badges & LBs:**  
  `e_culture_badges_awarded_total{badgeId,mode}` · `e_culture_leaderboard_rollup_seconds` (histogram)
- **Quiz bank:**  
  `e_culture_quizbank_quizzes_total{reviewStatus}` (gauge) · `e_culture_quizbank_questions_total` (gauge) · `e_culture_quizbank_review_digest_sent_total`
- **pHash & automation:**  
  `e_culture_phash_collisions_total` · `e_culture_phash_compute_failed_total` · `e_culture_phash_cache_size` (gauge)
- **Clubs:**  
  `e_culture_clubs_archived_total`

---

## A8.7 SLOs

- **Reminders/alerts:** 99% within ±60s of scheduled time.
- **API command latency:** p95 < 800ms (≤ 200 members).
- **Job failure rate:** < 1%/h (excl. non-retryables).
- **Policy Guard decision time:** p99 < 5ms (warm) / < 20ms (cold).

---

## A8.8 Alerts & Thresholds (examples)

- **High DLQ:** `am_jobs_dlq_total` derivative or queue size > 25, or > 10/hour growth → **High**.
- **Reminder latency:** `am_jobs_latency_ms{jobType=high}` p95 > 120s → **High**.
- **429 storm:** `am_rate_limit_hits_total > 50/5m` → **Medium**.
- **Policy deny spike:** `am_policy_denies_total` > baseline + 3σ → **Medium**.
- **Attendance mark errors:** > 5/15m → **Medium**.
- **DB transient errors:** > 20/10m → **High**.
- **Event drift:** `am_event_scheduler_drift_total > 5/hour` → warn `#bot-log`.

---

## A8.9 Dashboards (minimum)

- **Jobs:** queued/processing/done/failed + latency histograms; DLQ trend.
- **Events:** created/published/live; attendance by status; drift trend.
- **CBSP:** depot gauges; approvals vs denials.
- **Shields:** alert count by stage; active posts.
- **Mentor:** active pairs; accept/decline rate.
- **Culture:** submissions/votes; badges awarded; clubs archived; quizbank backlog.
- **Comms:** broadcast recipients, DM failures, fallback invocations.
- **Policy:** denies by reason; SOFT_ALLOW usage.
- **Rate limits:** 429s by route; retries.
- **Conflicts:** `am_conflicts_total` sparkline by entity type.

---

## A8.10 Tracing Conventions

- Root span per user action; child spans for DB ops, Discord REST, enqueue/execute.
- Propagate `traceId` into job payloads (Annexe 7).
- Span names: `module.action` (e.g., `B7.EVENT.PUBLISH`); attrs: `guildId`, `eventId`, etc.

---

## A8.11 Sampling Strategy

- **Logs:** INFO sampled (~10%) for high-volume; WARN/ERROR 100%.
- **Traces:** parent-based ~20%; 100% for errors.
- **Metrics:** non-sampled (aggregation handles volume).

---

## A8.12 Runbooks (link from alerts)

- **High DLQ:** inspect types & `lastError`; check recent deploys; consider rollback; drain DLQ.
- **Reminder latency:** scale workers; tune poll pace; index jobs; reduce batch sizes.
- **429 storm:** throttle fan-out; increase backoff; stagger jobs.
- **Policy deny spike:** review recent role/template changes.
- **DB errors:** check pool/replica; failover; backoff writes.
- **Event drift:** compare core vs Discord; use “Update scheduler?” action.

---

## A8.13 Access & Privacy

- Dashboards read-only to R4/R5; raw logs restricted to maintainers.
- Per-guild filtering enforced.
- DSR exports by `userId` on request (Annexe 10).

---

## A8.14 Time & Clock Sync

- All telemetry in UTC; UI localizes display only.
- Alert if host clock drift > 250ms (NTP check).

---

## A8.15 Compatibility Matrix

- **Annexe 6:** every ALLOW/DENY logs `POLICY.*` with reason.
- **Annexe 7:** job lifecycle emits logs + metrics; maintenance gate pauses counted.
- **Annexe 4:** `guildId` is mandatory & used as label; entity `version` supplied for conflict metrics.

---

## A8.16 Event-Specific Additions

- **Broadcast Preview (C Comms):** log `BROADCAST.PREVIEW` with `{ count, scope, localeBreakdown, quietHoursDeferred }`.
- **Discord Scheduled Events Drift (B7):** increment `am_event_scheduler_drift_total`; also log `EVENT.SCHEDULER_DRIFT` diff payload (normalized title/time).
- **DM Fallback:** on 403/50013/timeout, log `C.DM.FALLBACK` with `{ alertKey, threadId, reason }`; count `am_dm_failures_total` and `am_alert_fallback_total`.

---

## Delta summary (vs prior draft)

- Aligned module codes to A, B1–B7, C, D, E.
- Added explicit drift metric and warning rule.
- Folded DM fallback metrics + logs standard.
- Clarified OpenTelemetry resource attrs and job trace propagation.
- Extended Culture metric set per quizbank/pHash/clubs.
- Added maintenance-pause metric from Annexe 7.
- Formalized Broadcast Preview logging fields.

**Status:** LOCKED (changes require R5 approval; record in Annexe 15).
