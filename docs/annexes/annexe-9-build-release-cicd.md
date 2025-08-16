# Annexe 9 — Build, Release & CI/CD (LOCKED)

_Last Updated: 2025-08-15 (Europe/London)_

Defines the authoritative build and deployment process for the Discord bot, API, workers, and Web PWA. Guarded by **Policy Guard (Annexe 6)**, observable per **Annexe 8**, with jobs handled per **Annexe 7**.

---

## 9.1 Objectives & Cadence

- **Small, frequent, reversible releases.** Default weekly cadence; hotfix anytime with guardrails.
- **Safe windows.** Freeze around major alliance events (**B7.1 Elite Wars**, **B7.2 WoF** attack windows).
- **Fast rollback.** MTTR target ≤ **15 minutes** (blue/green flip or prior build restore).
- **Automated post-deploy checks.** Health checks and deploy markers (Annexe 8).

---

## 9.2 Repo & Branching

- **Monorepo:** `apps/bot`, `apps/api`, `apps/web`, `apps/worker`, `packages/shared` (policy, schema, i18n keys).
- **Trunk-based dev:** short-lived feature branches from `main`.
- **Protected `main`:** PR required; checks must pass; **R4/R5 approval** for prod (Annexe 6).
- **Tagging:** **CalVer** for product (`vYYYY.MM.DD[-patchN]`); **SemVer** for packages (e.g., `policy@1.4.0`).

---

## 9.3 Environments

| Env    | Guild Scope   | Infra                                           | DB              | Purpose                                           |
|--------|----------------|--------------------------------------------------|-----------------|---------------------------------------------------|
| local  | dev only       | Node 20 LTS; optional Docker                    | local Mongo     | iteration                                         |
| staging| staging guild  | Fly.io/Render (containers) + Vercel (web)       | Atlas (staging) | pre-prod tests; slash cmds in staging guild       |
| prod   | primary guild  | same as staging                                  | Atlas (prod)    | live                                              |

- **Slash command registration:** stage to **staging guild first**; promote to **prod guild** on release.
- Avoid **global commands** (1h cache delay) unless explicitly needed.

---

## 9.4 CI/CD (GitHub Actions)

- **PR pipeline:** ESLint, TypeScript `--noEmit`, unit tests (Vitest), build, PWA preview.
- **Main pipeline:** PR checks + integration tests (containerised Mongo), Docker build & push (bot/api/worker), **staging deploy**, E2E smoke, **manual approval** for prod.
- **Security:** `npm audit` / CodeQL (optional); secret scan; **SBOM + signing** (see §9.10).

---

## 9.5 Stages & Quality Gates

| Stage             | What Runs                                   | Gate                          |
|-------------------|----------------------------------------------|-------------------------------|
| Lint & Types      | ESLint, `tsc --noEmit`                      | 0 errors                      |
| Unit tests        | Vitest                                       | ≥70% core coverage            |
| Build             | `pnpm build` (Next/bot/api/worker)           | artifacts produced            |
| Dockerize         | `buildx` images                              | images pushed                 |
| Integration       | service containers + tests                   | green                         |
| Deploy: Staging   | bot/api/worker + Vercel                      | health checks pass            |
| E2E smoke         | slash register (staging), basic flows        | green                         |
| Manual approval   | GH Environments                              | R4/R5 approve                 |
| Deploy: Prod      | blue/green or rolling                        | health checks pass            |

---

## 9.6 Deployment Strategies

- **Bot/API/Worker:** **Blue/Green** preferred (one gateway live); zero-downtime flip; coordinated **single active gateway connection**.
- **Web PWA:** atomic deploy (Vercel/CF); instant rollback to previous build.
- **Migrations:** **additive-first**; backward-compatible reads. Run on staging, then prod. Use **feature flags** until backfills complete (A4 & A7).
- **Command sets:** register to prod guild at deploy end; use **versioned command names** only when breaking UX.

---

## 9.7 Feature Flags & Maintenance Gate

- Per-guild flags in **settings** (Annexe 4). Risky features ship **disabled by default**.
- **Maintenance Gate:** when `maintenance.enabled=true`, **deny** event publish/broadcast (Annexe 6) and **pause** non-critical jobs (Annexe 7). Critical privacy/integrity jobs continue.

---

## 9.8 Rollback & Incident Response

- Blue/Green **flip back** within minutes; mark bad release in notes.
- **Workers:** pause queues (A7) when rolling back handler changes.
- **Slash commands:** revert to previous set; prune deprecated next deploy.
- **Runbooks:** DLQ/latency/rate-limit storms per Annexe 8.
- **Audit:** all deploys & rollbacks **logged** (Annexe 8).

---

## 9.9 DB Migrations & Backfills

- **Idempotent** migrations with `migrationId`, `appliedAt`.
- Prefer **backfills via jobs** (A7) with progress metrics; gate features until complete.
- Rollback = app revert; avoid **destructive schema changes**. If unavoidable, require explicit **R5 approval** and a compensating migration plan.

---

## 9.10 Supply Chain Security (NEW)

- **SBOM:** generate via **Syft** per image/artifact; store as CI artifact.
- **Signing:** sign container images with **Cosign**; attach SLSA-style **provenance attestation**.
- **Dependency policy:** weekly Dependabot; auto-merge patch/minor when green; majors gated behind flags/canaries.
- **Secrets:** prefer **OIDC workload identity** from GitHub to Vercel/Fly/Cloud providers; minimise long-lived tokens.

---

## 9.11 Secrets & Config

- **Secrets in GitHub Environments** (staging/prod): `DISCORD_TOKEN`, `DISCORD_APP_ID/SECRET`, `DISCORD_PUBLIC_KEY`, `MONGODB_URI`, `UPSTASH_*`, `SENTRY_DSN`, `VERCEL_TOKEN`, `FLY_API_TOKEN`, web push keys, etc.
- **Rotate** quarterly or on incident. Separate **staging vs prod** credentials.
- **Never commit secrets;** redact in logs (Annexe 8).

---

## 9.12 Observability Hooks (deploy-time)

- Emit **deploy marker** log & metric; include `service.version`, **git SHA**, build time.
- Post-deploy smoke: `/health` command in staging & prod guilds; **event create→publish** cycle; **reminder enqueue & execute** (Annexe 7).
- Check job **latency & error rates** (Annexe 8) before marking release “done”.

---

## 9.13 Release Freeze Policy

- No prod deploys **within 2h before** or **during** **Elite Wars** or **WoF attack** windows.
- **Emergencies:** R5 approval + documented rollback plan.

---

## 9.14 Access & Approvals

- Only **maintainers** can edit pipelines.
- **R4/R5 approval** required for prod deploys.
- CI environments **restrict secret access**; staging/prod split.
- **All actions audited** (Annexe 8).

---

## 9.15 Dependency Hygiene

- **Weekly** dependency PRs; majors **quarterly** behind flags/canary.
- Pin **Node 20 LTS** and **pnpm** per **Annexe 5**; lockfile committed.

---

## 9.16 Disaster Recovery & Backups

- Atlas backups on; **mongodump to R2 nightly** (Annexe 5/8); retain **7 daily / 4 weekly / 3 monthly**.
- **Quarterly restore drill**; **RTO ≤ 2h**, **RPO ≤ 24h**.
- **Token compromise** playbook: revoke Discord token; rotate secrets; invalidate sessions.

---

## 9.17 Artifacts & Naming

| Artifact          | Pattern                                       | Where    |
|-------------------|-----------------------------------------------|----------|
| Docker image      | `ghcr.io/<org>/ams-<app>:vYYYY.MM.DD[-patchN]`| GHCR     |
| Web build         | `ams-web_vYYYY.MM.DD.zip`                     | CI + Vercel/CF |
| Source tag        | `vYYYY.MM.DD[-patchN]`                        | Git tag  |
| Packages          | `<name>@MAJOR.MINOR.PATCH`                    | private registry |
| SBOM              | `sbom-<app>-vYYYY.MM.DD.spdx.json`            | CI artifact |
| Cosign attestation| `provenance-<app>-vYYYY.MM.DD.intoto.jsonl`   | registry/CI |

---

## 9.18 Post-Deploy Verification (15-minute rule)

- **Automated:** smoke tests + telemetry check (errors, job latency, drift).
- **Manual:** an **R4** runs one real workflow (e.g., publish alliance event) **within 15 minutes**.
- If red flags: **flip back** and file incident.

---

## 9.19 Pre-Deploy Checklist (operator quick list)

- Maintenance gate **OFF** (unless planned).
- No active/near-term **freeze windows** (B7.1/B7.2 schedules).
- **Migrations applied** to staging and green.
- Jobs healthy; **DLQ not growing**; rate-limit normal (Annexe 8).
- **Secrets valid;** tokens not expiring.
- **Audience Preview** enabled for broadcasts/events (Annexe 3 & 6).

---

## 9.20 Cross-References

- **Annexe 4:** schemas & migrations.  
- **Annexe 5:** tech stack & hosting.  
- **Annexe 6:** Policy Guard (deploy approvals, maintenance deny rules).  
- **Annexe 7:** jobs pause/resume & idempotency during deploy/rollback.  
- **Annexe 8:** deploy markers, metrics, alerts.  
- **Annexe 15:** revision history (record changes to this annexe).

---

### Delta summary (vs previous)

- Added **supply chain** (SBOM, Cosign, provenance).
- Clarified **guild-scoped slash registration** & avoidance of **global-cmd delays**.
- Strengthened **maintenance gate** and **feature flag** usage across deploys.
- Added **deploy markers**, **post-deploy smoke**, and **pre-deploy checklist**.
- Tightened **blue/green** guidance for **single active gateway connection**.
- Introduced **OIDC** for secretless CI wherever supported.

**Status:** **LOCKED** (changes require R5 approval; log in Annexe 15).
