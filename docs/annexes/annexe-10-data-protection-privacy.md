# Annexe 10 — Data Protection & Privacy (DPA / Retention / Subject Access) — ✅ LOCKED
_Last Updated: 2025-08-15 (Europe/London)_

Engineering spec for privacy-by-design, lawful bases, retention, and Data Subject Requests (DSR) for the Alliance Management System. Targets UK/EU GDPR alignment in a volunteer context (**not legal advice**).

---

## 10.1 Scope & Roles
- **Controller:** Alliance leadership (R5 accountable owner).
- **Processor(s):** Hosting and tooling per Annexe 5 (e.g., Vercel, Fly/Railway, MongoDB Atlas, Upstash, Sentry\*).
- **Data Subjects:** Members, mentees/mentors, visitors, participants in events/culture.
- **Applicability:** All modules A–H (incl. B1–B7.*), D (i18n), E (Culture); data is always guild-scoped (`guildId`, Annexe 4).  
\* Sentry optional; when enabled use EU project and scrub PII.

---

## 10.2 Data Categories & Minimisation

| Category     | Examples (stored)                           | Notes                         |
|--------------|---------------------------------------------|-------------------------------|
| Identifiers  | Discord `userId`, `guildId`, role IDs       | No real names required        |
| Profile      | In-game name, language, timezone, age range | Age stored as **range** only  |
| Participation| RSVPs, attendance, teams/slots, mentor pair IDs | Operational only          |
| Program      | CBSP farms/coords, mentor capacity, culture badges | Game/community context  |
| Content      | Culture media links/IDs, quiz answers       | No raw EXIF; SFW policy       |
| Telemetry    | Audit logs, policy decisions, job metrics   | See Annexes 7–8               |
| Security     | OAuth scopes, hashed tokens                 | No bot token in DB            |

**Minimise by default:** only store what each feature requires; prefer references/IDs over payload copies.

---

## 10.3 Lawful Bases (illustrative)
- **Legitimate interest:** alliance coordination (events B7.*, CBSP B1, shields B2, mentorship B6).
- **Consent:** culture submissions (E), public leaderboards, push notifications, language contributions (D).
- **Contract-like necessity:** participating in an event/program you opt into.

---

## 10.4 Retention Schedule (defaults)
Retain no longer than necessary; cascade deletes per Module B5 (Profile Edits & Removals).

| Collection / Data               | Default            | Notes                                                   |
|---------------------------------|--------------------|---------------------------------------------------------|
| users profile basics            | Active membership + **90d** | Removed on exit; aggregates anonymised           |
| agreements (CoC/Vows)           | Active + **6y**    | Timestamps & versions only                              |
| events, event_rsvps             | **180d**           | Summaries keep counts, drop IDs                         |
| event_attendance_batches        | **180d**           | Aggregate stats kept                                    |
| cbsp_* membership & farms       | Active + **30d**   | Purge on program exit                                   |
| cbsp_depot snapshots            | **365d**           | Trend analysis                                          |
| shields_* posts/subs            | **90d**            | Auto-archive                                            |
| mentor_pairs/spaces             | Active + **90d**   | Remove channel refs on close                            |
| Culture submissions/kudos       | **180d**           | Remove media links on delete                            |
| pHash (Culture)                 | up to **180d**     | Non-PII; evicted by job (A7)                            |
| audit_logs                      | **365d**           | Privileged actions evidence                             |
| jobs                            | **30d**            | DLQ up to **90d**                                       |
| Metrics (A8)                    | **90d**            | Aggregated beyond 90d                                   |

**Backups:** nightly; older backups may contain deleted records until rotation completes (see §10.12).

---

## 10.5 Data Subject Rights (DSR) & Flows
**Rights:** access, rectification, erasure, restriction, portability (JSON), objection.  
**Identity check:** Discord OAuth + current/last-seen guild membership. For ex-members, verify via mutually known token or R5 approval.

**Channels & actions**
| Channel | Command / UI          | Outcome                               |
|--------|------------------------|---------------------------------------|
| Discord| `/privacy request`     | Open DSR ticket (access/export/delete) |
| Discord| `/privacy status`      | Check progress / cancel               |
| Discord| `/privacy delete`      | Triggers B5 exit cascade              |
| Web    | Settings → Privacy     | Export JSON; request deletion         |

**Targets:** acknowledge ≤ **7 days**, fulfil ≤ **30 days**. All DSR actions **audited** (Annexe 8). Privacy jobs run **high-priority** (Annexe 7).

**Export bundle (JSON) includes:**
- `users`, `agreements`, events (attended/RSVP), `event_attendance_batches` (subject rows),
- `cbsp_*` (self), `shields_*` (hosted/subscribed), `mentor_pairs` (self),
- Culture submissions/kudos/badges,
- Audit entries where subject is actor or target (**redacted** where 3rd‑party privacy applies).

---

## 10.6 International Transfers
- Prefer **EU/UK regions** for Atlas; Vercel/Fly configured EU where feasible.
- If a sub-processor is outside UK/EU, use **SCCs** or equivalent; track in **RoPA** (§10.10).

---

## 10.7 Security Controls
- **TLS** everywhere; **Atlas at-rest encryption**.
- **Policy Guard** (Annexe 6): least privilege; guild scoping enforced.
- Rotate tokens **quarterly** (Annexe 9); disable **Message Content** intent.
- **Audit** all privileged actions & privacy ops.
- Narrow payloads in jobs (Annexe 7); use **IDs not blobs**.

---

## 10.8 Incident Response & Breach
1. **Detect:** A8 alerts (DLQ spikes, abnormal access).  
2. **Contain:** revoke tokens, enable maintenance gate, pause non-critical jobs.  
3. **Assess:** data types/volume, likely harm.  
4. **Notify:** R5 within **24h**; regulators & subjects ≤ **72h** if required.  
5. **Recover:** rotate creds; verify backups; hotfix.  
6. **Learn:** post-mortem, runbook updates.

---

## 10.9 Processors & Subprocessors (summary)
See Annexe 5 for full registry and regions. Minimum set: **Discord** (auth/messaging), **MongoDB Atlas** (DB), **Vercel/Fly/Railway** (hosting), **Upstash** (Redis/jobs), optional **Sentry (EU)**.

---

## 10.10 DPIA & RoPA
- Maintain lightweight **RoPA** (categories, purpose, retention, recipients, safeguards).
- Run **DPIA** when introducing sensitive processing (voice, exact location, biometrics).
- Keep docs in `/docs/privacy`; reference in **Annexe 5**.

---

## 10.11 Operational Runbooks
- **Access/Export:** assemble bundle by `userId`; filter by `guildId`.
- **Deletion:** execute **B5 cascade**; anonymise aggregates; sever external mirrors when possible; log per-collection results.
- **Third-party limits:** document where erasure is not feasible (e.g., Discord messages in other users’ threads).

---

## 10.12 Backups & Deletion Semantics
- **Primary delete:** immediate in live DB (CAS protected).
- **Backups:** retained per Annexe 9; not retroactively edited. On restore, **re-apply tombstones/DSR queue** before going live. Note this in privacy notice.

---

## 10.13 Children & Safeguarding
- **Age range** gates: under‑18 users excluded from adult‑themed culture prompts; stricter moderation.
- No parental consent collection; avoid extra personal data.
- **DM safety:** prefer channel posts; minimise unsolicited DMs.

---

## 10.14 Privacy Notices & Consent Records
- Short privacy notice during **onboarding (B4)**, link to full PWA page.
- **Consent events** recorded with timestamp/version for optional features (push, culture submissions, public leaderboards).
- **Revoke paths:** `/privacy consent revoke <feature>` or **Settings → Privacy**.

---

## 10.15 Governance & Audits
- **Quarterly privacy review** (retention, processors, permissions drift).
- Spot-check **SOFT_ALLOW** usage (Annexe 6).
- Update **Annexe 15 (Revision History)** on any change.

---

## 10.16 Module-Specific Addenda

### 10.16.1 Events (B7.*)
- RSVPs/attendance stored **180d**; ICS exports contain event title/time only, **no private notes**.
- Private/program events visible only to participants/program roles/R4+ (Annexe 6).
- **Discord Scheduled Event** mirror is discoverability only; our system remains **source of truth**.

### 10.16.2 Mentor Program (B6)
- Private mentor spaces restricted to mentor, mentees, R4/R5, bot; membership changes **audited**.
- On mentor or mentee deletion/exit: unlink channels/threads; **anonymise** historical mentions.

### 10.16.3 CBSP (B1) & Shields (B2)
- CBSP farms/coords retained **30d** after exit; manager notes trimmed to operational minimum.
- Shield posts/subscriptions auto-archive **90d**; alerts logs not retained beyond job telemetry.

### 10.16.4 Culture & Community (E)
- **pHash:** store short perceptual hash for media de‑dup (non‑reversible). Retention up to **180d**; evicted by `phash_index_maintenance` (Annexe 7).
- **Badges:** split **catalog** (non‑personal) vs **awards** (personal). On DSR delete, remove awards; leaderboard snapshots anonymise (“Deleted User #\<hash>”) or remove if re‑identification risk.
- **Quiz Bank:** quiz content is system text; author/reviewer IDs kept minimal for audit; on DSR delete, **anonymise** those IDs in history.
- **Auto-translation assist** (optional/flagged): **off by default**. If enabled, use approved processor; send minimal text; do not store raw UGC externally; log counts only (`e_culture_auto_translate_drafts_total`). **Human review required** before publish.

### 10.16.5 i18n (D)
- Translation files contain system strings; contributor attributions (if any) minimal and removable. Missing‑key logs contain only **keys**, not content.

### 10.16.6 Communications & Alerts (H/C)
- Respect **Quiet Hours** except critical alerts explicitly flagged by policy.
- **DM fallback:** if DMs blocked, mention in scoped thread once; store delivery **outcome only** (Annexe 8). No content bodies in logs.

---

## 10.17 Telemetry & Privacy (Annexe 8 alignment)
- Use **IDs/hashes**; avoid payload bodies.
- Policy decisions log **reason codes** only.
- DSR ops emit structured **audit** + minimal operational logs (no content).

---

## 10.18 Subject Access — Portability Formats
- **JSON** primary; provide **CSV** (attendance summary) and **ICS** (personal event calendar) on request.
- Time values stored in **UTC**; formatted per profile TZ in exports.

---

## 10.19 Maintenance Gate & Privacy Jobs
- When `maintenance.enabled=true` (Annexe 9), **pause non‑critical jobs**. Privacy jobs (exports/deletes) remain **critical** and run regardless (Annexe 7).

---

## 10.20 Compatibility Matrix
- **Annexe 4:** `guildId` mandatory; age as **range**; schemas for culture **pHash** & **badge** split.
- **Annexe 6:** all privacy actions **audited**; emergency overrides recorded.
- **Annexe 7:** privacy jobs **high‑priority**, **idempotent**, **resumable**.
- **Annexe 8:** avoid PII in telemetry; use counters/histograms; subject‑scoped export supported.

---

### Delta (2025-08-15) vs prior
- Clarified DSR export bundle contents and portability formats.
- Added backup deletion semantics and restore tombstone re‑apply.
- Tightened Events, Mentor, CBSP/Shields privacy notes.
- Locked Culture specifics: **pHash** retention, badge catalog vs awards, quiz bank author/reviewer anonymisation, optional auto‑translate safeguards.
- Reinforced Maintenance Gate treatment of privacy jobs.

**Status:** LOCKED — changes require **R5 approval** and entry in **Annexe 15 (Revision History)**.