# Annexe 18 — Global Scheduler & Job Processing (PROPOSED)
_Last Updated: 2025-08-19 (Europe/London)_

**Status:** PROPOSED (Draft) · **Scope:** Cross-cutting service (PWA + Bot + Workers) · **Owner:** Platform Lead (R4) · **Approvals:** R5 to lock

This annexe defines the **generic scheduler and job processing model** used across the platform. It enables **one place** to schedule future or recurring work (reminders, digests, clean-ups), with **multi-tenant safety**, **idempotency**, and **quiet-hours/maintenance** gates.

**Cross-refs:** Annexe 1 (surface split), Annexe 3 (UX rules), **Annexe 4 (DB Schemas, §4.18 Jobs)**, Annexe 6 (Policy Guard), Annexe 7 (Jobs & Idempotency), Annexe 8 (Observability), Annexe 9 (CI/CD), Annexe 10 (Privacy), Annexe 11 (A11y), Annexe 14 (API).

---

## 18.1 Goals & Non-Goals
**Goals**
- Provide a **single, reusable** scheduling & delivery rail for *any* module.
- Guarantee **at-least-once → effectively-once** execution using idempotency.
- Respect **Maintenance Mode** and **Quiet Hours** automatically.
- Support **recurrence** (RRULE) with **timezone/DST correctness**.
- Be **cheap and simple** to operate (single worker process, Mongo-backed).

**Non-Goals**
- Not a full cron orchestration platform.
- No hard real-time guarantees; target wakeup jitter **≤ 5–30s**.
- No per-user rate limiting here (that lives in feature logic if needed).

---

## 18.2 Architecture (high level)
- **jobs collection** (Annexe 4, §4.18) — canonical queue store per guild.
- **Worker** (`apps/worker`) — polls due jobs, leases, dispatches handlers, retries/backoff.
- **Scheduler helper** (`packages/scheduler`) — `scheduleOnce` + `scheduleRecurring` utilities.
- **Handlers registry** (`apps/worker/handlers`) — pure functions keyed by `type`.
- **Policy gates** — maintenance + quiet-hours evaluated right before side-effects.
- **Observability** — counters, structured logs; optional PWA admin reader `/admin/schedules` (read-only v1).

---

## 18.3 Data Model (recap)
We use **`jobs`** (see Annexe 4). Required fields (minimum viable set):

```ts
type JobState = 'queued' | 'processing' | 'done' | 'failed' | 'dlq';

interface Job {
  jobId: string;            // ULID/UUID
  guildId: string;
  type: string;             // e.g., 'reminder.send', 'digest.send'
  payload: Record<string, unknown>;
  priority: 1|2|3|4|5;      // 1 high … 5 low (default 3)
  runAt: string;            // ISO date
  attempts: number;         // starts at 0
  state: JobState;
  lastError?: string;
  // Leasing
  leaseUntil?: string;      // ISO; when to consider stalled
  workerId?: string;
  // Idempotency (see §18.6)
  idempotencyKey?: string;  // optional, but recommended
  runAtBucket?: string;     // optional bucketing to avoid dupes in recurrence
}
Indexes (from Annexe 4):

{ guildId:1, state:1, runAt:1 }

{ guildId:1, type:1, "payload.idempotencyKey":1, "payload.runAtBucket":1 } (unique dedupe)

Retention per Annexe 10/4.22 (e.g., TTL for completed jobs optional).

18.4 Leasing & State Machine
States: queued → processing → done | failed | dlq.

Lease acquisition (atomic):

Query: state:'queued' AND runAt <= now (also allow stalled requeues, see below).

Update: set state:'processing', leaseUntil = now + LEASE_MS, workerId.

Return the claimed document.

Stalled job recovery:

If state:'processing' AND leaseUntil < now: treat as stalled; set state:'queued', optionally increment attempts and nudge runAt = now + BACKOFF_MS.

Long jobs: support lease renewal (heartbeat) by extending leaseUntil during processing.

Backoff policy: Exponential with jitter, defaults:

attempts 0→1: +1m

1→2: +5m

2→3: +15m

3→4: +60m

maxAttempts: 5 → dlq

18.5 Recurrence (RRULE, timezone-aware)
Recurring schedules are materialized one occurrence at a time:

The job’s payload carries rrule, tz, and originJobId (or a separate lightweight schedules collection — optional v2).

On completion, compute next runAt with RRULE in the given IANA timezone (DST-safe) and enqueue the next job.

Use runAtBucket to avoid duplicates if multiple workers attempt to materialize concurrently.

Example (every Monday 09:00 Europe/London):

FREQ=WEEKLY;BYDAY=MO;BYHOUR=9;BYMINUTE=0;BYSECOND=0
18.6 Idempotency & Side-effects
To achieve effectively-once semantics on external sends (Discord messages, etc.):

Each job should supply an idempotencyKey in payload (e.g., reminder:{eventId}:{slot}:{runAtBucket}).

Handlers must guard external calls with the key (e.g., upsert a “send log” with unique index on the key, or rely on Discord dedupe when available).

When retrying, check idempotency first; if already done, short-circuit to done.

18.7 Maintenance & Quiet Hours (gates)
Before running the core logic of a handler:

Maintenance Mode (Annexe 3/6): if enabled for guildId, defer: set runAt = nextAllowedWindow, increment a deferred counter, and return.

Quiet Hours: if this job would notify users during quiet hours, defer until the next permitted time and record deferredUntil for observability.

Handlers must be written side-effect last so gating happens before any external send.

18.8 APIs (scheduler helper)
Library: packages/scheduler
// One-shot
scheduleOnce({
  guildId,
  type,                     // 'reminder.send'
  payload,                  // free-form
  runAt,                    // Date | ISO | number
  priority = 3,
  idempotencyKey,           // optional but recommended
}): Promise<string /* jobId */>

// Recurring (materialized)
scheduleRecurring({
  guildId,
  type,
  payload,
  rrule,                    // RFC 5545 string
  tz,                       // IANA tz ('Europe/London')
  startFrom = new Date(),   // first occurrence >= startFrom
  priority = 3,
}): Promise<string /* jobId of first occurrence */>
Both APIs:

Validate inputs (guild scoping, minimal payload size).

Compute runAtBucket = type:rrule:occurrenceISO for dedupe where relevant.

Return the created jobId.

18.9 Worker (apps/worker) — Reference Loop
// pseudo-code
while (true) {
  const due = await leaseDueJobs({ batch: WORKER_BATCH, leaseMs: WORKER_LEASE_MS });

  for (const job of due) {
    try {
      if (await maintenanceGate(job) || await quietHoursGate(job)) {
        await deferJob(job, nextAllowedTime(job));
        continue;
      }

      const handler = handlers[job.type];
      if (!handler) throw new Error('No handler for type=' + job.type);

      await handler({ guildId: job.guildId, payload: job.payload, now: new Date() });
      await completeJob(job);
    } catch (err) {
      await failOrRetry(job, err);  // backoff + dlq on max attempts
    }
  }

  await sleep(WORKER_POLL_MS);
}
Env (defaults):

WORKER_POLL_MS=1000

WORKER_BATCH=10

WORKER_LEASE_MS=60000

WORKER_MAX_ATTEMPTS=5

18.10 Handlers Registry
In apps/worker/handlers/index.ts:
export type Handler = (ctx: { guildId: string; payload: any; now: Date }) => Promise<void>;

export const handlers: Record<string, Handler> = {
  'reminder.send': async (ctx) => { /* … */ },
  'digest.send': async (ctx) => { /* … */ },
  'mentor.checkin.ping': async (ctx) => { /* … */ },
  'comms.send': async (ctx) => { /* … */ },
};
Conventions:

Validate payload shape at the boundary (schema or Zod).

Use idempotency guards before side-effects.

Emit structured logs with guildId, jobId, type, attempts, durationMs.

18.11 Observability & Admin
Counters: jobs.picked, jobs.succeeded, jobs.failed, jobs.deferred, jobs.dlq, jobs.stalled.

Timing: handler.duration_ms, lease.wait_ms.

Logs: single-line JSON; include guildId, jobId, type, state, attempts, errCode.

Admin page (v1, optional): /admin/schedules read-only grid of due/processing/dlq; link to job detail.

18.12 Security & Privacy
Guild isolation: every query filters by guildId.

Least privilege: workers only need Mongo + external APIs for the specific handler (Discord, etc.).

PII minimization: payloads carry IDs, not personal data; fetch details just-in-time.

Auditing: important state changes (e.g., broadcast sent) write to audit logs (Annexe 4.19).

18.13 QA & CI
Unit tests: backoff math, lease recovery, RRULE next occurrence, idempotency upsert behavior.

Integration tests: materialization loop (complete → enqueue next), quiet-hours deferral.

Soak tests: ensure no duplicates under parallel workers (use runAtBucket unique index).

CI jobs: run Vitest for worker & scheduler; run Playwright smoke for PWA admin view.

18.14 Rollout Plan
Land worker skeleton + scheduler helper with tests.

Convert Event reminders to use scheduleOnce.

Add weekly digest via scheduleRecurring (read-only summary initially).

Add PWA /admin/schedules read-only table.

Add alerts for DLQ > 0 and stalled > threshold.

18.15 Risks & Mitigations
Clock skew: rely on server time; add 5–30s poll slack; record now in job.

Thundering herd: use small WORKER_BATCH + leases; exponential backoff.

DST pitfalls: RRULE with IANA tz; never precompute UTC list far in advance.

Duplicate sends: enforce idempotency keys + unique indexes.

18.16 Example End-to-End
Goal: mentor check-in DM every 2 weeks on Monday at 18:00 local guild time.

On pair creation:
scheduleRecurring({
  guildId,
  type: 'mentor.checkin.ping',
  payload: { pairId },
  rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO;BYHOUR=18;BYMINUTE=0;BYSECOND=0',
  tz: 'Europe/London',
});
Handler (mentor.checkin.ping):

Check pair still active; check maintenance/quiet hours; send DM idempotently; completeJob(job).

Worker materializes next occurrence upon completion.

18.17 Versioning & Changes
Minor changes (backoff defaults, lease durations) can be adjusted without schema change.

New job types: add to handlers registry; update tests.

Any schema change to jobs must update Annexe 4 and migration notes in Annexe 15.

18.18 Revision Notes
2025-08-19: Initial proposed version (to be LOCKED after R5 approval).

---

### Save it into your repo (copy-paste to your terminal)
```bash
mkdir -p docs/spec/v2025.08
cat > docs/spec/v2025.08/annexe-18-global-scheduler.md <<'MD'
# Annexe 18 — Global Scheduler & Job Processing (PROPOSED)
_Last Updated: 2025-08-19 (Europe/London)_

**Status:** PROPOSED (Draft) · **Scope:** Cross-cutting service (PWA + Bot + Workers) · **Owner:** Platform Lead (R4) · **Approvals:** R5 to lock

This annexe defines the **generic scheduler and job processing model** used across the platform. It enables **one place** to schedule future or recurring work (reminders, digests, clean-ups), with **multi-tenant safety**, **idempotency**, and **quiet-hours/maintenance** gates.

**Cross-refs:** Annexe 1 (surface split), Annexe 3 (UX rules), **Annexe 4 (DB Schemas, §4.18 Jobs)**, Annexe 6 (Policy Guard), Annexe 7 (Jobs & Idempotency), Annexe 8 (Observability), Annexe 9 (CI/CD), Annexe 10 (Privacy), Annexe 11 (A11y), Annexe 14 (API).

--- 
# (…content exactly as above…)
MD