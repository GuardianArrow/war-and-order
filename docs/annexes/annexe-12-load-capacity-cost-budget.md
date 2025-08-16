# Annexe 12 — Load, Capacity & Cost Budget (LOCKED)

_Last Updated: 2025-08-15 (Europe/London)_

Quantifies expected traffic, sets rate‑limit budgets, and keeps infra under **£20/month** with safe headroom.

---

## 12.1 Assumptions (Baseline)

- **Guild size:** ~100 members; **DAU:** 40–60.
- **Events:** 3–5 active/week; reminder ladder **24h / 1h / 15m / start**.
- **Shields:** 2–6 concurrent; 10–20 subscribers each.
- **CBSP requests:** 5–15/week.
- **Culture:** 1 weekly theme + 1 quiz; ~30 participants.
- **Mentor pairs:** 5–10 active.

_Growth scenarios covered in §12.12._

---

## 12.2 Discord Throughput Budgets

- **Sustained send:** ≤ **6 req/s**; **burst:** ≤ **10 req/s** (short spikes).
- **Fan‑out strategy:** queue + jitter; batch DMs into chunks of ≤ **50** with **inter‑batch delay 750–1500 ms** (Annexe 7).
- **Mirroring:** Prefer Discord Scheduled Events for discoverability; keep RSVP/logic in‑app to reduce write volume.
- **Webhooks:** Use for broadcast posts where possible (simpler perms, consistent rate handling).

---

## 12.3 Job Queues & Workers

**Queues**

- `alerts.high` (critical/live ≤60s)
- `alerts.normal` (reminders)
- `ops.low` (reports/rollups/cleanups)

**Workers (baseline)**

- **2 processes × concurrency 4 = 8 in‑flight.**
- Scale to **3 processes** if p95 delay > target (see §12.6 SLOs).

**Maintenance Gate**

- When enabled (`settings.maintenance`), **pause non‑critical jobs**; let privacy/integrity jobs run (Annexe 7).

---

## 12.4 SLOs (Delivery & Latency)

- **High‑priority alerts** p95 ≤ **60s** of scheduled time.
- **Normal reminders** p95 ≤ **120s**.
- **API latency** p95 < **800 ms** (≤200 members).
- **Job failure rate** < **1% / hour** (excl. non‑retryables).
- **DM fallback** executed within **2 min** of failure (Annexe 5 addendum).

---

## 12.5 Rate‑Limit Handling

- Per‑route buckets respected; **exponential backoff** `2^n` with **20–40% jitter**.
- Spread reminder fan‑out over **±3 min** window.
- **Idempotency keys** suppress duplicates (Annexe 7).
- **Audience Preview** shows recipient counts; large sends chunked (Annexe 3 & 6).

---

## 12.6 Storage, Indexing & Size Envelope

- **MongoDB Atlas M0 (Free)** sufficient **< 1M docs / < 512 MB** data.
- Ensure all indexes from **Annexe 4** exist; alert on slow queries **> 200 ms**.
- **Estimated hot data (baseline 100 users):**
  - `users` ~100 docs; `events` ~60/quarter; `event_rsvps` ~1k/quarter;
  - `jobs` (rolling 30d) ~5–20k; `audit_logs` (365d) ~10–30k;
  - Culture submissions ≤ 300 / 180d; `pHash` sparse index minimal.

_If storage > 60% of M0 or frequent scan > 50k docs, add/optimize indexes or prune (see §12.9)._

---

## 12.7 Cost Budget (≤ £20/mo)

| Service                          | Est. Monthly | Notes                                     |
|----------------------------------|--------------|-------------------------------------------|
| Bot/API/Workers (Fly/Railway)    | £0–£8        | Single small VM; autosleep off‑peak OK    |
| MongoDB Atlas M0                 | £0           | Free tier                                 |
| PWA hosting (Vercel/CF Pages)    | £0–£2        | Static + SSR light                         |
| Upstash Redis                    | £0           | Free quotas                               |
| Cloudflare R2                    | £0–£2        | Media/backups (~≤10 GB)                   |
| Sentry                           | £0           | Free plan                                 |
| Healthchecks.io                  | £0           | Free plan                                 |
| **Total**                        | **~£0–£12**  | **Headroom ≥ £8**                          |

---

## 12.8 “Savings Mode” (Feature Flags & Knobs)

When nearing budgets or during low‑activity windows:

- **Reminders:** disable non‑critical “Maybe” DMs; keep **15m + start** only for alliance‑wide (_flags: `events.reminders.slim`_).
- **Culture:** reduce roundup frequency to weekly; pause **auto‑translate drafts** (Module E flag).
- **Mentor:** digest weekly not daily.
- **Jobs:** widen fan‑out windows (**±5–7 min**) for non‑critical batches.
- **Scheduler drift job:** run every **15m** instead of **10m** (Annexe 5 addendum).

---

## 12.9 Pruning, TTLs & Backups

- TTL / cleanup per **Annexe 4 & 10** (e.g., culture **180d**, jobs **30d**, DLQ **90d**).
- Nightly **mongodump → R2** (7 daily / 4 weekly / 3 monthly); **target data size < 5 GB** to keep R2 ~£0–£2.
- **Quarterly restore drill** (Annexe 9).

---

## 12.10 Load Test Plan (pre‑prod)

**Tools:** k6 or Artillery + mocked Discord REST.

**Scenarios (pass/fail):**

- **Event fan‑out:** 100 recipients × 3 reminders → p95 send under **120s** window.
- **Shield expiry spike:** 5 posts × 20 subs each → ladder hits without 429 storms.
- **Attendance bulk:** 100 marks within **90s**; no **409** loops (Annexe 3 “Refresh & Reapply”).
- **Culture roundup:** 300 recipients DM + channel post within **3 min**.

**Success criteria:** zero lost jobs (idempotent replays OK), 429s contained (**<50/5m**), SLOs met.

---

## 12.11 Capacity Formulas (quick ref)

**Fan‑out wall‑clock (per batch):**

```text
T ≈ ceil(N / 50) × (send_time_per_msg × 50 + inter_batch_delay)
```

With `send_time_per_msg ≈ 50–80 ms` and `inter_batch_delay ≈ 0.75–1.5 s`.

**Job throughput (worker):**

```text
TPS ≈ concurrency / (avg_exec_ms / 1000)
```

_Scale processes when p95 delay breaches SLO._

---

## 12.12 Growth Scenarios & Triggers

**Scenario A — 250 members / DAU 120**

- Events **6–8/week**; culture ×2; shields **8–12**.
- **Action:** +1 worker process (total **3**); widen normal reminder fan‑out to **±4–5 min**; verify indexes; keep Atlas **M0** (likely OK).

**Scenario B — 500 members / DAU 220**

- Events **10–12/week**; culture ×3; shields **12–20**.
- **Action:** +2 workers (total **4–5**); split `alerts.high` and `alerts.normal` onto separate processes; consider Atlas **M2** if slow queries persist; move culture media to **R2** aggressively; enforce **“Savings Mode”** defaults.

---

## 12.13 Monitoring & Alerts (Annexe 8 hooks)

**Metrics to watch:** `am_jobs_latency_ms{jobType}`, `am_jobs_processing_gauge`, `am_rate_limit_hits_total{route}`, `am_broadcast_recipients_total{channel}`, `am_conflicts_total{module}`.

**Alert thresholds:**

- Reminder **p95 > 120s** (High)
- **429s > 50/5m** (Medium)
- **DLQ > 25** or **+10/hour** (High)
- **DB p95 > 300 ms** (High)

---

## 12.14 Cold‑Start & Autosleep

- If the VM/platform autosleeps, first job burst may spike latency.
- **Mitigation:** keep‑alive ping every **5 minutes** or schedule staggered warmers **2 minutes** before heavy windows (Elite Wars, WoF, alliance meetings).

---

## 12.15 Data & Index Budgets (practical caps)

- Keep **compound indexes ≤ 2–3** per hot collection to avoid write penalties.
- Ensure covering indexes for:
  - `jobs` by `{ guildId, status, runAt }`
  - `events` by `{ guildId, type, startUTC }` and `{ guildId, status }`
  - `event_rsvps` by `{ guildId, eventId, status }`
- Reassess monthly with `db.currentOp()` / profiler samples.

---

## 12.16 Cost Guardrails (Ops Playbook)

If monthly forecast **> £18**, automatically:

1. Enable **“Savings Mode”** (§12.8).
2. Reduce culture media retention to **120d** (config).
3. Batch announcements to **channels** over **DMs** where viable.
4. Post cost report to **#bot-log** for R4 review.

---

## 12.17 Compatibility Matrix

- **Annexe 7:** idempotent jobs, maintenance gate, dedupe.
- **Annexe 8:** metrics/alerts used above.
- **Annexe 5:** hosting/services locked; secrets in CI.
- **Module H/C/E/B7:** high-volume producers (reminders, shield alerts, onboarding DMs).

---

**Status:** **LOCKED** — Changes require **R5** approval and an entry in **Annexe 15 – Revision History**.