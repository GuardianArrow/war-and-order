# Annexe 7 — Jobs, Scheduling & Idempotency ✅
**Status:** LOCKED  
**Last Updated:** 2025-08-15 (Europe/London)

Standard for all background work (reminders, alerts, digests, cleanups) used by the bot, API, and PWA.

---

## 7.1 Purpose
- Run time-based / async tasks reliably within the budget (≤ **£20/mo**).
- **At-least-once** execution with **idempotent handlers** → effectively-once outcomes.
- **Per-guild isolation**, Discord rate-limit safety, full auditability & observability.

**Cross-refs:** Annexe 4 (DB), Annexe 5 (tech hosting), Annexe 6 (Policy Guard), Annexe 8 (telemetry), Annexe 14 (API), Annexe 15 (change control).

---

## 7.2 Architecture
- **Queue store:** MongoDB `jobs` (A4.18).
- **Scheduler:** scans `runAt ≤ now && status=queued`, partitions by `guildId`, enqueues in-memory.
- **Workers:** pull due jobs, take short **lease** (e.g., 60s), execute, update state.
- **Change Streams** (if available) reduce polling; otherwise **1–5s** poll.
- **Priority:** `priority 1..5` (high..low); sort **priority desc**, **runAt asc**.
- **Per-guild fairness:** round-robin between guilds before taking a second job per guild.

### Maintenance Gate (global)
On start of every job: read `settings.maintenance.enabled` (A4.3).
- **Non-critical jobs:** pause → requeue with jitter (**60–300s**); metric `am_jobs_paused_total{reason="maintenance"}`.
- **Critical** (privacy delete, data integrity): **run anyway**.
- Log **one “paused” audit per 10m** max to avoid noise.

---

## 7.3 Lifecycle
`queued → processing → done | failed (→ dlq if attempts exceeded)`

1. **Enqueue** doc with `status=queued`, `runAt`, `attempts=0`, `idempotencyKey`.
2. **Pick & Lock** atomically: set `processing`, `lockedBy`, `lockedAt`. Lease expiry protects against dead workers.
3. **Execute** idempotent handler; call **Policy Guard (A6)** before side-effects.
4. **Complete:** `done`, `finishedAt`, `resultSummary`.
5. **Retry:** classify error → set new `runAt` with **backoff + jitter**; `attempts++`.
6. **DLQ:** non-retryable or attempts exceeded → `failed`, `dlq=true`, `lastError`.

---

## 7.4 Idempotency & De-dup
- **Required** for all handlers.
- `idempotencyKey` = stable business key, e.g.
  - `event:{eventId}:user:{userId}:reminder:{offset}`
  - `shield:{shieldId}:subscriber:{userId}:t-15m`
- **RunAt bucketing:** floor to 60s → `runAtBucket` to prevent duplicates landing in same minute.
- **Enqueue de-dup:** upsert **unique** on **(guildId, type, idempotencyKey, runAtBucket)** (A4.18 recommended index).
- **Result hash:** store `lastResultHash` to early-exit if re-run produces no changes.

---

## 7.5 Retry & Backoff
Default: `maxAttempts=5`, backoff `2^n * baseDelay ± 20–40% jitter`. **Non-retryable** skips retries.

| Job Type                     | Priority | Max | Backoff seed | Retryable                 | Non-retryable                                   |
|-----------------------------|:--------:|:---:|:------------:|---------------------------|-------------------------------------------------|
| **B7 core** Event reminder  | high     |  5  | 30s          | 5xx/429/network           | 403 DM closed, invalid channel, policy deny     |
| **B2** Shield alert ladder  | high     |  6  | 20s          | 5xx/429                   | host deleted, unsubscribed                      |
| **C** Broadcast batch       | normal   |  4  | 60s          | 5xx/429                   | content validation                               |
| **B7.2** WoF slot reminder  | normal   |  4  | 45s          | 5xx/429                   | user not registered                              |
| **B1** CBSP depot snapshot  | low      |  3  | 120s         | DB transient              | validation fail                                  |
| **E** Culture activity close| low      |  3  | 60s          | DB transient              | owner cancelled                                  |
| **E** Leaderboard rollup    | low      |  3  | 120s         | DB transient              | config missing                                   |

---

## 7.6 Discord API rate limits
- Respect **bucket/global headers**; queue **per-route** when near limits.
- **Batch broadcasts** (e.g., 50 DMs/chunk) with **inter-batch delay & jitter**.
- **Localize** content (Module D i18n) **before** send.
- On **429**: classify → retry with backoff; log 429 counters.

---

## 7.7 Cron & Recurrence
- RRULE expander creates **concrete reminder jobs** within a rolling horizon (e.g., **48h**).
- **Idempotent** by `templateId:windowStart`.
- **Missed windows** (restart) covered by a **grace scan (last 5m)**.

---

## 7.8 Cancellation, Pause & Reschedule
- **Cancel** by id, by `idempotencyKey`, or by **entity** (e.g., all `eventId` reminders).
- **Pause** per-guild/per-type (maintenance).
- **Reschedule** by `runAt` update; **keep same `idempotencyKey`**.

---

## 7.9 Observability & SLOs
**Metrics**
- `am_jobs_queued/processing/done/failed_total{type,guild}`
- `am_jobs_exec_ms{type}` (**p95**)
- `am_jobs_retry_total{type,reason}`, `am_jobs_dlq_total{type}`
- `am_jobs_paused_total{reason="maintenance"}`

**SLO:** **99%** of **high priority** jobs within **±60s** of `runAt` under normal load.

**Dashboards:** per-guild views, **429 hot-spots**, reminder **latency heatmaps**.  
**Alerts:** **DLQ growth**, **429 streaks**, **latency > SLO** for 5 min.

---

## 7.10 Security & Privacy
- Each job carries **guildId**; **Policy Guard** executes **before** hitting external APIs or writes.
- Payloads include **minimum data**; prefer **stable IDs** to PII.
- **Never** embed secrets in payloads; use env/secret store.
- Respect **Quiet Hours** & “critical bypass” flags (set by policy/copy, not per-job ad-hoc).

---

## 7.11 Parent/Child & Fan-out
- **Broadcasts:** parent batch → **child chunks** (idempotency keys include `batchId:chunkIndex`).
- Parent completes when **all children done**; collects failures for **delivery report**.

---

## 7.12 Example (concise) enqueue & worker

```ts
// enqueue (idempotent)
function enqueue({ guildId, type, runAt, payload, idempotencyKey }) {
  const runAtBucket = Math.floor(runAt.getTime() / 60000) * 60000;
  return jobs.updateOne(
    { guildId, type, "payload.idempotencyKey": idempotencyKey, "payload.runAtBucket": runAtBucket },
    { $setOnInsert: {
        id: ulid(),
        guildId, type,
        payload: { ...payload, runAtBucket },
        runAt, status: "queued", attempts: 0,
        createdAt: now(), updatedAt: now()
      }},
    { upsert: true }
  );
}

// Worker loop & retry policy follow the same pattern as previous Annexe versions (see repo code sample).
```

---

## 7.13 Schema & Indexes (A4 alignment)
- Use **A4.18** `jobs` collection.
- **Recommended unique index:** `(guildId, type, payload.idempotencyKey, payload.runAtBucket)`.
- **Ops indexes:** `(guildId, status, runAt)`, `(guildId, type, status)`.

---

## 7.14 Module Job Catalog (what we run)

### B7 — Events Core & Subs
- `events.reminder.enqueue` → 24h/1h/15m/start per template.
- `events.status.transition` → Live/Complete confirmations, program/private reschedule nag.
- `events.scheduler_drift_check` → compare core vs Discord Scheduled Event for the next **48h** (every **10m**), tolerance **±60s** & normalized title; **on drift:** SOFT_ALERT to bot-log + DM owners (no auto-overwrite).
- `events.post_change_broadcast` → reschedule/cancel notices.
- `attendance.digest` → organizer summary after event end.

### B1 — CBSP
- `cbsp.threshold_alert` → low depot levels to CBSP Managers.
- `cbsp.request.followup` → nudges on stale requests.
- `cbsp.depot.snapshot` → periodic level snapshot (if enabled).

### B2 — Shield Hosting
- `shield.alert.subscriber` → 2h/1h/30m/15m/5m/expiry; quiet-hours aware; **critical** last two may bypass if user opted in.
- `shield.host.prompt_extend` → host intent at **T-2h** when applicable.
- `shield.post.auto_archive` → close & archive expired posts.

### B6 — Mentor Program
- `mentor.session.reminder` → session DM/mention.
- `mentor.inactive_nudge` → optional “no activity in X days”.

### B7.2 — War of Frontiers
- `wof.defence.check` → **T-6h/T-1h** defence-march confirmation alerts; **stop ladder on confirm**.
- `wof.slot.reminder` → **1h/30m/15m** slot alerts.
- `wof.phase.summary` → end-of-phase report to leaders.

### C — Alliance Comms & Alerts
- `comms.broadcast.batch` → scheduled sends; locale fan-out; **audience preview must have been confirmed** (Policy Guard).
- `comms.dm_fallback` → if DM fails (403/50013/timeout), mention in scoped thread **once per alertKey within 60m**.

### D — Localization (i18n)
- `i18n.missing_keys.digest` (optional) → weekly summary to i18n admins.

### E — Culture & Community
- `culture.activity.open/close` → theme start/close posts.
- `culture.leaderboard.rollup` → weekly/monthly/seasonal aggregates.
- `culture.roundup.weekly` → shoutouts & highlights (Module E).
- `clubs_auto_archive` (**NEW**) → archive inactive clubs (see below).
- `phash_index_maintenance` (**NEW**) → perceptual-hash dedupe checks & cache prune.
- `quizbank_review_digest` (**OPTIONAL NEW**) → pending quiz review reminder.

---

## 7.15 DM Fallback Handler (standard)
- **Path:** DM → if fails, single **scoped thread mention** (per alert key, **≥60m** apart).
- **Log:** `deliveryLog { userId, alertKey, ts, channelId/threadId, reason }`.
- Respect **Quiet Hours**; if both DM & thread disallowed by policy, **requeue** to next allowed window.

---

## 7.16 Healthchecks & Ops (Annexe 5)
- **Critical job groups** send success pings to **Healthchecks.io**.
- On repeated failures (≥3 attempts) or **DLQ growth**, raise **Sentry** alert with job metadata snapshot.

---

### Deltas vs previous draft (what changed)
- **Aligned modules:** replaced legacy “H / I / J” with **B7 (Events)**, **C (Comms)**, **D (i18n)**, **E (Culture)** everywhere.
- **Maintenance Gate:** standardized pause rules + metrics.
- **Discord Drift Job:** formalized `events.scheduler_drift_check` (**10-minute** cadence, **48h** window).
- **DM Fallback:** codified handler & metrics.
- **Culture jobs:** added `clubs_auto_archive`, `phash_index_maintenance`, `quizbank_review_digest`.
- **Indexes:** documented **unique (guildId,type,idempotencyKey,runAtBucket)** and ops indexes.
- **Observability:** clarified metric names & SLO.

**Status:** **LOCKED** (R5 approval required for changes; record in Annexe 15).
