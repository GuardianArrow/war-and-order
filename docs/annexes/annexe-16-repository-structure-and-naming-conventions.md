# Annexe 16 — Repository Structure & Naming Conventions (LOCKED)

_Last Updated: 2025-08-16 (Europe/London)_

Defines the canonical monorepo layout, boundaries, naming, and scaffolding for bot/API/workers and the PWA. Optimised for **PNPM workspaces** + **Turborepo (or Nx)** with **TypeScript** across the stack. All modules (A–H) map cleanly into this structure.

---

## 16.1 Goals
- Single source of truth for where things live.
- Enforce clear boundaries (apps consume shared packages; no cross-app imports).
- Keep costs low and dev ergonomics high.
- Make onboarding trivial: “clone → pnpm i → pnpm dev”.

## 16.2 Tooling Baseline
- **Package manager:** PNPM workspaces  
- **Orchestrator:** Turborepo (or Nx; commands identical in practice)  
- **TypeScript:** strict; path aliases via `tsconfig.base.json`  
- **ESLint/Prettier:** unified configs under `/configs/`  
- **Testing:** Vitest (+ Testing Library), Playwright for E2E (web)  
- **Build:** Next.js for PWA; plain TS builds for node apps  
- **CI:** GitHub Actions (see Annexe 9)

## 16.3 Top-Level Layout
```text
/
├─ apps/
│  ├─ bot/                 # Discord bot (gateway + interactions)
│  ├─ worker/              # Background workers (Annexe 7)
│  └─ web/                 # Next.js PWA (dashboards, admin, culture hub)
├─ packages/
│  ├─ shared-policy/       # Annexe 6 Policy Guard library (authoritative)
│  ├─ shared-schema/       # Zod/JSON Schemas + TS types (Annexe 4)
│  ├─ shared-db/           # Mongo client, repositories, CAS helpers
│  ├─ shared-i18n/         # Module D keys, loaders, ICU helpers
│  ├─ shared-telemetry/    # Annexe 8 logger/metrics/tracing
│  ├─ shared-utils/        # Small pure utilities (dates, ids, guards)
│  ├─ shared-comms/        # Renderers for comms messages (H), templating
│  └─ shared-api/          # OpenAPI client types + fetch wrappers (Annexe 14)
├─ configs/                # eslint, prettier, tsconfig.base, tailwind, turbo
├─ scripts/                # CLIs: migration/seed (Annexe 15), indexers, dev-tools
├─ infra/                  # fly.toml, railway.json, vercel.json, CF pages, docker
├─ i18n/                   # Locale folders + module namespaces (Module D)
│  ├─ en/ core.json, events*.json, culture/*.json, ...
│  └─ ... (other locales)
├─ docs/
│  ├─ annexes/             # This spec (A1…A16) as markdown
│  ├─ runbooks/            # Ops runbooks referenced in A8/A9/A10
│  └─ privacy/             # DPIA, RoPA (Annexe 10)
├─ .github/                # workflows, issue/PR templates, CODEOWNERS
└─ package.json / pnpm-workspace.yaml / turbo.json
```

## 16.4 `apps/bot` (Discord)
```text
apps/bot/
├─ src/
│  ├─ bootstrap/          # login, intents, shard config
│  ├─ config/             # env parsing (zod), feature flags fetch
│  ├─ discord/            # SDK wrappers, scheduler mirror, DM fallback
│  ├─ interactions/
│  │  ├─ commands/        # Slash command handlers (module folders inside)
│  │  ├─ buttons/
│  │  ├─ selects/
│  │  └─ modals/
│  ├─ modules/            # Domain orchestration per module:
│  │  ├─ A_core/
│  │  ├─ B_cbsp/
│  │  ├─ C_shields/
│  │  ├─ D_i18n/          # i18n admin commands & summaries
│  │  ├─ E_culture/
│  │  ├─ F_profile/
│  │  ├─ G_mentor/
│  │  └─ H_events/        # + H1 Elite Wars, H2 WoF, H14 Attendance
│  ├─ jobs/               # Handlers that bot may trigger (lightweight)
│  ├─ policy/             # thin re-exports from shared-policy
│  ├─ telemetry/          # spans/logs glue to shared-telemetry
│  └─ index.ts
└─ test/                  # command/interaction unit tests
```
**Rules**
- Only import DB via **shared-db** repositories.
- All outward decisions route through **shared-policy**.
- Component IDs & slash registries mirror **Annexe 2**.

## 16.5 `apps/worker` (Jobs)
```text
apps/worker/
├─ src/
│  ├─ bootstrap/          # queue init, schedulers, maintenance gate
│  ├─ handlers/
│  │  ├─ events/          # reminders, drift checks
│  │  ├─ shields/         # alert ladders
│  │  ├─ culture/         # roundup, pHash, quizbank digest, clubs archive
│  │  ├─ mentor/          # nudges
│  │  └─ comms/           # fan-out batches, DM fallback
│  ├─ policy/             # use shared-policy for every mutation
│  └─ telemetry/          # job lifecycle metrics/logs
└─ test/
```
**Rules**
- Every job **idempotent** (Annexe 7), must accept `guildId` and `idempotencyKey`.

## 16.6 `apps/web` (Next.js PWA)
```text
apps/web/
├─ app/                   # App Router
│  ├─ (public)/           # login, docs, privacy
│  ├─ (authed)/[guildId]/
│  │  ├─ dashboard/
│  │  ├─ events/          # calendars, editor, attendance bulk (H/H14)
│  │  ├─ cbsp/            # manager boards
│  │  ├─ shields/
│  │  ├─ mentor/
│  │  ├─ culture/         # galleries, leaderboards, quiz bank
│  │  ├─ comms/           # campaign builder & delivery reports (H)
│  │  └─ settings/        # feature flags, maintenance, i18n, privacy
├─ features/              # UI state + hooks grouped by module
├─ components/            # UI primitives (shadcn/ui), charts, forms
├─ lib/                   # fetchers (shared-api), guards, date helpers
├─ i18n/                  # loader hooks into /i18n root
├─ styles/                # tailwind.css & tokens
└─ tests/ e2e/            # Playwright suites
```
**Rules**
- **No direct DB**; only call backend API or shared-api client.
- Strings only via **Module D** keys; pseudo-loc & RTL testable.

## 16.7 `packages/` (shared libraries)
- **shared-policy:** Single implementation of Policy Guard (Annexe 6). Exports `authorize`, reason codes, helpers. Versioned (e.g., `policy@x.y.z`).  
- **shared-schema:** Zod + JSON Schema for Annexe 4 entities; exports TS types. Source of truth for ETag/versioned entities.  
- **shared-db:** Mongo client factory, typed repositories per collection, CAS helpers, index ensure scripts.  
- **shared-i18n:** Key registry, ICU wrappers, missing-key diff, pseudo locale; glossary loader.  
- **shared-telemetry:** Logger (JSON), metrics (prom-esque), tracing (OTel). Emits taxonomy from Annexe 8.  
- **shared-comms:** Renderers for comms (Discord embeds, push text), audience resolution & preview logic.  
- **shared-api:** OpenAPI types + fetch client with auth, retry, idempotency headers.

## 16.8 `configs/`
- `tsconfig.base.json` with `@/*` paths to shared packages.  
- `eslint.config.js` and `.prettier*` unified.  
- `tailwind.config.ts` tokens and a11y plugin set.  
- `turbo.json` pipelines: lint, typecheck, test, build, deploy.

## 16.9 `scripts/`
- `migrate.ts`, `seed.ts` (Annexe 15) — never run without **Maintenance Mode**.  
- `ensure-indexes.ts` — applies Annexe 4 indexes idempotently.  
- `dump-backup.sh` / `restore-backup.sh` — Atlas snapshots (Annexe 9).  
- `i18n-diff.ts` — missing/changed keys per namespace.  
- `changelog-gen.ts` — conventional commits → CHANGELOG.

## 16.10 `infra/`
- `fly.toml`, `railway.json`, `vercel.json`, `cloudflare-pages.json`.  
- `docker/` minimal images for bot/worker.  
- `env/` examples only: `.env.example`, `.env.staging.example`.

## 16.11 Naming Conventions
- **Folders:** `module_feature` (e.g., `H_events`, `E_culture`).  
- **Files:** `kebab-case.ts`; tests `*.test.ts`.  
- **Types:** `PascalCase`; **constants** `SCREAMING_SNAKE_CASE`.  
- **Env vars:** `UPPER_SNAKE`, prefixed per app (`BOT_`, `WEB_`, `WORKER_`).  
- **IDs:** **ULID** preferred for app-level ids; DB `_id` remains **ObjectId**.  
- **i18n keys:** dotted paths `events.create.dialog.title`.

## 16.12 Boundaries & Imports
- Apps → **packages only**. **No app↔app** imports.  
- `shared-*` packages must be **UI-free** and **side-effect-free** (except telemetry init).  
- No raw **Discord SDK** outside `apps/bot/discord/` adapters.  
- No raw **Mongo** outside **shared-db** repositories.

## 16.13 Testing Layout
```text
<package>/test/              # unit tests near code
apps/web/tests/e2e/          # Playwright
apps/bot/test/               # interaction handlers (mocks)
```
- Mocks for Discord & Mongo in `packages/shared-utils/test/`.  
- **CI must run:** lint → typecheck → unit → build → e2e (staging env).

## 16.14 Code Ownership & PR Hygiene
- `.github/CODEOWNERS` maps module folders to owners (e.g., Culture Lead for `E_culture`).  
- PR template requires: module impact (A–H), annex references, migration flag (A15), policy changes (A6) behind feature flag.  
- **Conventional commits**; product releases per **Annexe 9**.

## 16.15 Scaffolding Commands (optional, nice-to-have)
- `pnpm gen:module <key>` → creates `apps/bot/modules/<key>/` + `apps/web/app/(authed)/[guildId]/<route>/` + i18n namespace stubs.  
- `pnpm gen:command <name>` → slash command boilerplate with policy hook & telemetry.

## 16.16 Lock & Change Control
- This annexe is **LOCKED**. Structural changes require **R4/R5 approval** + revision note.  
- Breaking folder moves must be paired with **CI green** on: build, tests, and “link-check” (no orphaned imports).

## 16.17 Cross-References
- **Annexe 4:** repositories map 1:1 to collections.  
- **Annexe 6:** **shared-policy** is the only auth source.  
- **Annexe 7:** job handlers live in `apps/worker/handlers`.  
- **Annexe 8:** telemetry initialisers in **shared-telemetry**.  
- **Annexe 9:** CI expects this layout for caching/artifacts.  
- **Module D:** `/i18n` structure mirrors module namespaces.
