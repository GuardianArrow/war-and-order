# Annexe 13 — Risk Register & Threat Model (STRIDE-lite) ✅ LOCKED

**Last Updated:** 2025-08-15 (Europe/London)

Defines the authoritative risk catalogue, mitigations, owners, monitoring hooks, and response playbooks for the Alliance Management System.

---

## 13.0 Method & Scoring

- **Model:** STRIDE-lite + supply-chain & operational risks.  
- **Scales:** Likelihood (L/M/H), Impact (L/M/H/**Critical**).  
- **Severity:** derived matrix (H+Critical = **P0**, H/H = **P1**, else **P2/P3**).  
- **PDRR framing:** **Prevent → Detect → Respond → Recover**.

**Cross-refs:** Annexe 4 (DB), Annexe 5 (Tech/Discord), Annexe 6 (Policy Guard), Annexe 7 (Jobs), Annexe 8 (Observability), Annexe 9 (CI/CD), Annexe 10 (Privacy), Annexe 14 (API contracts).

---

## 13.1 Roles & Ownership

- **Accountable (Product/Security):** R5.  
- **Technical Owner:** R4 (Tech Lead).  
- **Operators:** Maintainers (bot/API/PWA), module owners (A–E, B1–B7.*), Culture Lead (E), CBSP Managers (B1).  
- **Review cadence:** monthly quick review; **quarterly** deep review & tabletop (see §13.9).

---

## 13.2 Top Risks (Register)

| STRIDE | Risk | Likelihood | Impact | Severity | Key Mitigations | Detection & Telemetry |
|---|---|---:|---:|---:|---|---|
| Spoofing | Bot token / OAuth compromise | Low | High | **P1** | Rotate tokens (A9 §8); restrict Dev Portal; env-scoped secrets; PKCE for OAuth; least-privilege bot perms (A5 Addendum) | SSO failures; abnormal OAuth; **am_policy_denies_total** spikes; Sentry alerts |
| Spoofing | Phishing of R4/R5 leading to misuse | Med | High | **P1** | 2FA on Discord; Audience Preview (A6 / Annexe 3); break-glass logging | **BROADCAST.PREVIEW** logs; unusual **am_broadcast_recipients_total** |
| Tampering | Concurrent edits overwrite data | Med | Med | **P2** | Optimistic concurrency (A4.20); Refresh & Reapply UX (Annexe 3) | **am_conflicts_total**; HTTP 409 rates |
| Tampering | DB config/index change causing data corruption | Low | High | **P1** | Migrations package (A9 §9); backups (A5 §8); PR review; staging-first | Migration logs; restore drill KPIs |
| Repudiation | Disputed moderation/admin actions | Low | Med | **P3** | **audit_logs** (A4.19) with actorId, reason, ts; 365d retention | Audit dashboards |
| Info Disclosure | Mis-targeted DM/broadcast or private event leak | Med | High | **P1** | Policy Guard scopes (A6); Audience Preview; DM fallback rules (A5 Addendum) | **am_policy_denies_total**; **am_broadcast_recipients_total** anomalies |
| Info Disclosure | Public R2 bucket/asset leakage | Low | High | **P1** | Private buckets; signed URLs; no PII in assets; EXIF strip (E) | Access logs; R2 policy audits |
| DoS | Discord rate-limit storms / job pile-ups | Med | Med | **P2** | Backoff + jitter; per-route queues; ≤50 batch; DLQ (A7) | **am_rate_limit_hits_total**; DLQ size |
| Elevation of Privilege | Excess bot permissions / role misconfig | Low | High | **P1** | Least-priv baseline (A5 Addendum §C); channel overrides; permission reviews per release | Policy drift checks; audit diffs |
| Privacy | DSR mishandled / retention miss | Low | High | **P1** | Module B5 deletes; Annexe 10 retention & DSR flows; high-priority privacy jobs | DSR SLA metrics; deletion audits |
| Integrity | Scheduler drift (Discord vs core) | Med | Med | **P2** | Drift job & soft alerts (B7/A5); no auto-overwrite by default | **am_event_scheduler_drift_total** |
| Availability | Third-party outage (Discord/Atlas/Redis) | Med | Med | **P2** | Degraded modes (Annexe 1 §6); queue pause; retries; status banners | Healthchecks; error spikes |
| Abuse | Culture spam/duplicates | Med | Low | **P3** | pHash de-dup; rate limits; AutoMod keywords; mod queue | **e_culture_phash_collisions_total** |
| Compliance | Under-18 exposure to adult prompts | Low | High | **P1** | Age-range gates (Annexe 10 §13); culture prompt filters; stricter moderation | Moderation logs; rules hits |
| Data Loss | Backup failure / restore gaps | Low | High | **P1** | Nightly dumps; 7/4/3 retention; quarterly restore drill | Backup success metrics |
| Config | Maintenance gate misused (silent block) | Low | Med | **P3** | Allowlist actions; banner; audit when toggled; jobs paused not dropped | **am_jobs_paused_total**; audit entries |

> Residual risk after controls is reviewed quarterly; **P0/P1** items must have a current playbook link (Annexe 8 runbooks + §13.8).

---

## 13.3 Controls Library (PDRR mapping)

- **Prevent:** Least-privileges (A5); Policy Guard (A6); feature flags (A9 §7/§10); Audience Preview; i18n key discipline (D); EXIF stripping; content caps; rate limits.  
- **Detect:** Unified metrics/logs (A8); scheduler drift; conflict counters; DLQ monitors; DM-fallback telemetry; privacy job SLA.  
- **Respond:** Blue/Green rollback (A9 §6/§8); pause queues (A7); revoke tokens; disable new publishes; notify admins.  
- **Recover:** Backups (A5 §8); restore runbook; compensating migrations; re-enqueue idempotent jobs.

---

## 13.4 Abuse & Social Risks

- Harassment/toxic content → report → mod queue → timed mutes (Policy Guard); audited.  
- Brute-force requests → per-user/route throttles; command debounce (Annexe 2 §2.5).  
- Fraudulent kudos/badges → anti-gaming caps (E §E8); leader approval; audit badge awards.

---

## 13.5 Supply-Chain & CI/CD Risks

- **Risk:** Malicious dependency / compromised Action.  
- **Mitigations:** Lockfile; Dependabot weekly; CodeQL optional; pin GH Actions SHAs; least-priv GH tokens; separate staging/prod secrets; release freeze around major events (A9 §13).  
- **Detect:** SCA alerts; unusual outbound in Sentry.  
- **Respond:** Rollback image tag; revoke tokens; freeze deploy.

---

## 13.6 Data & Privacy Hotspots (Annexe 10 alignment)

- **pHash:** non-PII; 180d retention; delete with submission/DSR.  
- **Badges/Awards:** remove user links on delete; keep catalog.  
- **Machine translation assist (optional):** OFF by default; if ON, provider approved (A5); no raw UGC persistence; human review required; metric **e_culture_auto_translate_drafts_total**.

---

## 13.7 Discord-Specific Threats

- Component spam → debounce **1–2s**; server-side rate limit hook.  
- **@everyone** misuse → guarded by Policy; disabled by default; audit when overridden.  
- Channel ACL drift → reconcile mentor/private channels vs Policy outcomes periodically.

---

## 13.8 Incident Response (playbook summary)

- **P0 (token leak, data leak, mass mis-send):** revoke tokens; disable bot; enable maintenance gate (allowlist privacy ops); post #admin update; rotate secrets; assess blast radius; start DPIA (Annexe 10 §8).  
- **P1 (rate-limit storm, reminder failures):** scale workers; widen fan-out; throttle; inspect DLQ & last release; potential rollback.  
- **Comms:** #admin thread; end-of-incident summary; post-mortem within 72h with corrective actions & owners.

---

## 13.9 Review Cadence & Tabletop

- **Monthly:** risk metrics review (A8 dashboards).  
- **Quarterly:** tabletop covering (a) mis-targeted broadcast, (b) Discord outage during Elite Wars, (c) DSR export surge. Outcomes recorded in Annexe 15.

---

## 13.10 Risk Exceptions & Temporary Elevations

Any deviation (e.g., granting **@everyone** mention for an emergency) must be:  
1) **Time-boxed** with expiry,  
2) **Logged** in audit with reason,  
3) **Recorded** in Annexe 15 – Revision History,  
4) **Reviewed** at the next monthly check.

---

## 13.11 Monitoring Hooks (binds to Annexe 8)

- **Metrics:** `am_policy_denies_total{reason}`, `am_rate_limit_hits_total{route}`, `am_event_scheduler_drift_total`, `am_conflicts_total{module}`, `am_jobs_latency_ms{jobType}`, `am_broadcast_recipients_total{channel}`, culture metrics (`e_culture_*`).  
- **Alerts (examples):**  
  - **P0:** broadcast spike to > 2× baseline in 5m; DM failures > 200 / 15m.  
  - **P1:** reminder p95 > 120s for 15m; 429s > 50/5m; DLQ > 25.  
  - **P2:** conflicts rising > 3σ; drifted events > 5/h.

---

## 13.12 Compatibility Matrix

- **Annexe 4:** schemas include audit, version, guildId.  
- **Annexe 6:** every privileged ALLOW/DENY logged with reason.  
- **Annexe 7:** jobs idempotent; maintenance gate honored.  
- **Annexe 8:** dashboards & alerts power detection.  
- **Annexe 9:** rollback/restore playbooks referenced.  
- **Module D (i18n):** no raw strings → reduces translation spoofing/mis-send risk.

---

**Status:** LOCKED — changes require R5 approval and an entry in **Annexe 15 – Revision History** (include risk ID, changed controls, new residual rating).
