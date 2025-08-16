# Annexe 5 — Technology & External Services Registry ✅
**Status:** LOCKED  
**Last Updated:** 2025-08-15 (Europe/London)

This annexe locks down languages, frameworks, libraries, services, accounts, and versions; plus setup notes, env layout, CI/CD, monitoring, and cost expectations to stay within the **£20/month** target.

---

## 5.1 Languages & Runtimes

| Area            | Choice                         | Version (locked)         | Notes / Where used                                  |
|-----------------|--------------------------------|---------------------------|-----------------------------------------------------|
| Bot + API       | Node.js (LTS) + TypeScript     | Node **20.x** LTS, TS **5.x** | Discord bot, REST API, workers/jobs                  |
| Web App (PWA)   | Next.js + React + TS           | Next.js **14.x**, React **18.x** | SSR/ISR PWA, auth, dashboards                        |
| Styling         | Tailwind CSS                   | **3.x**                   | PWA styling, tokens                                 |
| UI kit          | shadcn/ui + Radix UI           | latest                    | Accessible components                               |
| Icons           | lucide-react                   | latest                    | Icon set                                            |
| Charts          | Recharts                       | **2.x**                   | Analytics                                           |
| Dates/TZ        | date-fns + date-fns-tz         | **3.x**                   | Formatting & TZ handling                            |
| Validation      | zod                            | **3.x**                   | Runtime validation                                  |
| Testing         | Vitest + @testing-library      | latest                    | Unit/component tests                                |
| E2E             | Playwright                     | latest                    | End-to-end flows                                    |
| Jobs            | BullMQ (Redis)                 | **4.x**                   | Reminders, alerts, rollups                          |
| DB              | MongoDB                        | Server **7.x**            | Atlas Free tier; official Node driver               |
| Cache / RL      | Upstash Redis (serverless)     | managed                   | Cache, rate limits, jobs                            |
| i18n runtime    | i18next + ICU                  | **22.x**                  | Module D pipeline & runtime                         |
| Push            | Web Push (VAPID)               | latest                    | PWA push notifications                              |
| Calendar export | ics                             | **2.x**                  | ICS links                                           |

---

## 5.2 Discord Application & Permissions

- **Library:** `discord.js` **v14.x** (Gateway v10)  
- **Privileged intents:** **Guild Members ON** (Message Content **OFF**)  
- **Other intents:** Guilds, Guild Messages, Message Reactions, Direct Messages, Guild Scheduled Events  
- **Interactions:** Slash, buttons, selects, modals (patterns in Annexe 3)  
- **OAuth2 scopes:** `bot`, `applications.commands`, `identify`, `guilds` (PWA login via Discord)

> Configure per the **Addendum** at the end (intents, scopes, least-privilege role perms, per-feature permission matrix).

---

## 5.3 External Services & Accounts

### Services

| Service             | Purpose            | Usage                                     |
|---------------------|--------------------|-------------------------------------------|
| MongoDB Atlas (M0)  | Database           | All entities (see Annexe 4)               |
| Vercel              | PWA hosting        | Next.js app (SSR/ISR), domains, TLS       |
| Fly.io / Railway    | Bot + API hosting  | 1 small container/VM; free credits        |
| Upstash Redis       | Serverless Redis   | BullMQ, cache, rate-limits                |
| Cloudflare R2 (opt) | Object storage     | Culture media, backups                    |
| Sentry              | Monitoring & errors| Frontend + backend SDKs                   |
| Healthchecks.io     | Job heartbeats     | Cron/worker success pings                 |
| GitHub              | Repo + CI/CD       | Actions pipelines                         |
| Cloudflare DNS      | DNS + TLS          | Custom domain, proxy/WAF                  |

### Account checklist
- Discord App (bot token, public key, OAuth redirects)  
- Atlas project/user/IP allowlist  
- Vercel project → env vars + domains  
- Fly/Railway app → env vars + scale to free  
- Upstash DB (REST URL/token)  
- Sentry org (DSNs)  
- R2 bucket/keys (if used)  
- Healthchecks endpoints  
- GitHub repo secrets (see §5.4)

---

## 5.4 Environments & Configuration

| Env     | Host                          | Purpose      | Notes                           |
|---------|-------------------------------|--------------|---------------------------------|
| local   | Dev machine (+ Docker opt.)   | Dev          | Node 20, PNPM, optional Mongo/Redis |
| preview | Vercel + Fly/Railway preview  | PR previews  | Auto via GitHub Actions         |
| prod    | Vercel + Fly/Railway + Atlas + Upstash | Live | Single region; UTC server time  |

**Core env vars** *(redact in docs)*

```
DISCORD_TOKEN
DISCORD_APP_ID
DISCORD_APP_SECRET
DISCORD_PUBLIC_KEY
MONGODB_URI
REDIS_URL / UPSTASH_REST_URL
UPSTASH_REST_TOKEN
NEXTAUTH_URL
NEXTAUTH_SECRET
WEB_PUSH_PUBLIC
WEB_PUSH_PRIVATE
SENTRY_DSN
R2_ENDPOINT
R2_KEY
R2_SECRET
R2_BUCKET
HEALTHCHECKS_URLS
```

**Maintenance Mode (ops hook)**  
- Controlled via `settings.featureFlags.maintenance.enabled` and `settings.maintenance` (see Annexe 4).  
- API/Worker gate publishes & fan-out while enabled (ties to Annexe 7).  
- PWA shows banner if `maintenance.message` present.

---

## 5.5 CI/CD & Tooling

**Monorepo:** `apps/bot`, `apps/web`, `packages/shared` (types, i18n, schemas).

| Step       | Tool                       | Purpose                |
|------------|----------------------------|------------------------|
| Lint       | ESLint + Prettier          | Static checks          |
| Type check | `tsc --noEmit`             | Compile safety         |
| Unit       | Vitest                     | Logic coverage         |
| Component  | Testing Library            | UI                     |
| E2E        | Playwright                 | Critical flows         |
| Build      | `next build` / `pnpm build`| Artifacts              |
| Deploy Web | Vercel                     | From main/tag          |
| Deploy Bot/API | Fly/Railway            | From tag (manual fallback) |

---

## 5.6 Security & Privacy

- Discord OAuth only; **no passwords**.  
- Role-based access from Discord; re-validate on sensitive ops.  
- **No Message Content** intent.  
- Secrets in platform vaults; **rotate quarterly**.  
- Mongo user **least-privilege**.  
- Upstash **rate-limits** for bot/API.  
- Audit admin actions (see Annexe 4 — `audit_logs`).  
- **HTTPS only**; CSRF + `SameSite` cookies.  
- Retention: culture submissions/votes **TTL 180d**; profile deletions cascade (Module B5 & Annexe 10).  
- Concurrency safety: **ETag/If-Match** and **idempotency keys** (see Module A / Annexe 14).

---

## 5.7 Monitoring, SLOs & Drift Checks

| Area              | SLO                       | Monitor                          |
|-------------------|---------------------------|----------------------------------|
| Event reminders   | ≥ 99% within ±2 min       | Job success + Healthchecks beats |
| Shield alerts     | ≥ 99% within ±1 min       | Job latency + Sentry alerts      |
| Bot availability  | ≥ 99.5% uptime            | Host uptime + gateway reconnects |
| Web app           | TTFB < 500ms (cached)     | Vercel analytics + Sentry perf   |

**Discord Scheduled Events drift**  
- Job scans every **10 min** for the next **48h** window; compare title/time/location with tolerance (**±60s** time, normalized title).  
- Rate-limit API calls (jitter + bucketed per-guild budget).  
- On drift: log **SOFT_ALERT**, DM owners with “Update scheduler?” quick action. *(See Module B7 & Annexe 8.)*

---

## 5.8 Backups & Disaster Recovery

- Nightly `mongodump` → **Cloudflare R2** (retain **7 daily / 4 weekly / 3 monthly**).  
- Config & i18n JSON in **Git** (tagged releases).  
- **Restore runbook:** download latest dump → `mongorestore` → rotate tokens.

---

## 5.9 Cost Envelope (≤ **£20/month**)

| Service        | Est.     | Notes                     |
|----------------|----------|---------------------------|
| Atlas M0       | £0       | Free tier                 |
| Vercel Hobby   | £0       | Free                      |
| Fly/Railway    | £0–£5    | Free credits              |
| Upstash        | £0       | Free quotas               |
| Cloudflare R2  | £0–£2    | 10GB free tier            |
| Sentry         | £0       | Free plan                 |
| Healthchecks   | £0       | Free                      |
| Domain         | £0–£1/mo | ~£12/y                    |

**Expected total:** ~**£0–£8** typical; cap **< £20**.

---

## 5.10 Versioning & Updates

- **SemVer**; deps pinned (**caret within same major**).  
- **Quarterly** dependency/security review.  
- **Annual** Node LTS bump (test in preview).  
- **Lockfile committed**.

---

## 5.11 Module Mapping (where each tool is used)

| Module                                   | Primary tech                                                                  |
|------------------------------------------|-------------------------------------------------------------------------------|
| Module A — Core Architecture             | Next.js, Tailwind, i18next, Mongo, Web Push                                   |
| Module B.1 — CBSP                        | `discord.js` bot, Node API, Mongo, announcements, buttons/modals              |
| Module B.2 — Shield Hosting              | Bot components, BullMQ + Upstash, reminders                                   |
| Module B.3 — Formation Builder           | PWA calculators, saved presets in Mongo                                       |
| Module B.4 — Onboarding                  | Discord OAuth, Gatekeeper flow, i18n, role sync                               |
| Module B.5 — Profile Edits & Removals    | PWA forms, GDPR-style delete, audit                                           |
| Module B.6 — Mentor Program              | Private channels/threads, mentor lists, approvals                             |
| Module B.7 — Events Core (+ B7.1/B7.2/B7.14) | Event engine, Discord scheduler mirror, ICS, Attendance                   |
| Module C — Alliance Communication & Alerts | Comms composer, targeting, DM/threads, app push                            |
| Module D — Localization & i18n Core      | i18next pipeline, key registry, fallback                                      |
| Module E — Culture & Community           | Galleries (R2 opt), votes, quizzes, leaderboards, badges                      |

---

## 5.12 Change Control

- **Owner:** Tech Lead (as designated).  
- **Cadence:** **Quarterly** or upon major/runtime changes.  
- **Deviations** require PR review + entry in **Revision History**.

---

## Addendum — Discord Intents, OAuth Scopes & Permissions ✅
**Last Updated:** 2025-08-15 (Europe/London)

### A5.A Gateway intents (Bot → Settings → Privileged Gateway Intents)
- **Required:** `GUILDS`, **`GUILD_MEMBERS` (Privileged)**, `GUILD_MESSAGES`, `GUILD_MESSAGE_REACTIONS`, `DIRECT_MESSAGES`, `GUILD_SCHEDULED_EVENTS`  
- **Disable:** `MESSAGE_CONTENT`, `GUILD_PRESENCES`, VOICE, `AUTO_MODERATION_*` (not needed)

### A5.B OAuth2 scopes
- **Install bot to guild:** `bot`, `applications.commands`  
- **Web login (PWA):** `identify`, `guilds`

### A5.C Bot role permissions (least-privilege baseline)
View/Send/Embed/Attach/React/Read History, Use External Emojis (opt), Create/Manage Threads, Manage Events, Manage Webhooks, Mention everyone/here (Policy Guard restricted), Manage Roles/Channels (only if required for private spaces), Kick/Ban/Timeout (moderation flows).

### A5.D Per-feature permission matrix  
*(bot must have channel perms; users gated by Annexe 6)*

- `/event *`, RSVP buttons, attendance quick mark → **Send + Read History**  
- CBSP/Shield/Mentor actions → **Send + Read** (plus **Manage Threads** for mentor spaces)  
- Broadcasts → **Send**, **Embed**, (optional) **Manage Webhooks**, mention controls via Policy Guard  
- Onboarding promotions → **Manage Roles**  
- Privacy & policy diagnostics → **Send**

### A5.E DM delivery fallback — **NEW (implemented)**
- **Path:** DM → if fails (403/50013/timeout) → **scoped thread mention**.  
- **Targets:** event reminders → event thread; shield alerts → shield thread.  
- **Rules:** single fallback ping per alert key per **60 min**; localized compact summary.  
- **Telemetry:** `am_dm_failures_total{reason}`, `am_alert_fallback_total`.  
- **Cross-refs:** Annexe 7 (handlers), Module C (comms), Module B7 (events).

---

## Revision Notes (what changed)

- Updated module mapping to **A / B. / C / D / E*** scheme.  
- Added explicit **Maintenance Mode** ops hook references to env/config and CI/Jobs gate.  
- Clarified **drift job cadence** & **rate-limit** behavior.  
- Retained and formalized **DM fallback** section with telemetry.