# war-and-order
Bot and App to support War and Order App game.
## Project Context & Quick Start

**Repo:** GuardianArrow/war-and-order  
**Stack:** Node 20 LTS · PNPM workspaces · TypeScript · Next.js 14 · Tailwind · Playwright  
**Docs:** Specs live in `docs/annexes/` (LOCKED). Start at `docs/spec/v2025.08/index.md`.

### What’s in here
- **apps/**
  - **web/** — Next.js PWA (design tokens page, future dashboards)
  - **bot/** — Discord bot (intents / embeds / interactions) — _skeleton paths set_
  - **worker/** — Background jobs (Annexe 7) — _planned_
- **packages/** — Reserved for shared libs (policy, schema, db, i18n, telemetry, comms, api)
- **configs/tokens/**
  - **palette.json** — Canonical color palette (brand/semantic/role)
  - **tailwind.tokens.ts** — Tailwind helpers (role color palette + runtime CSS vars)
- **apps/bot/discord/styles/**
  - **discord-embed-colors.ts** — Embed color map (Design System)
- **docs/annexes/** — Annexes 1–17 (LOCKED)
- **.github/workflows/**
  - **web-e2e.yml** — PWA E2E (Playwright) CI workflow

### Local dev (PWA)
```bash
pnpm install
pnpm --filter ./apps/web dev
# Visit: http://localhost:3000/design/tokens
```

**Design tokens smoke test**  
Route **/design/tokens** renders palette swatches and role CSS vars. Tailwind is wired to `configs/tokens/tailwind.tokens.ts`.

### E2E tests (Playwright)
```bash
# Local (nice reporter)
pnpm run web:e2e

# CI-style (line reporter)
pnpm run web:e2e:ci
```
Playwright auto-starts the Next.js dev server via `apps/web/playwright.config.ts`.

**Tests live in `apps/web/tests/`:**
- `tokens.spec.ts` — palette swatches render
- `tokens-vars.spec.ts` — role CSS variables are present

### CI
Workflow: `.github/workflows/web-e2e.yml`
- Installs browsers for the web app only
- Uses the `e2e:ci` script and Playwright `webServer` auto-start

### Conventions (short)
- **Workspaces:** PNPM (`pnpm -w` at repo root, `--filter ./apps/web` for web app)
- **Commits:** Conventional Commits (`type(scope): message`)
- **Docs:** Annex updates are LOCKED; record changes in **Annexe 15** (Revision History)
- **Runtime:** Node 20 LTS; strict TS; Tailwind v3 wired to tokens

### Handy paths
- Tokens: `configs/tokens/palette.json`, `configs/tokens/tailwind.tokens.ts`
- Embed colors: `apps/bot/discord/styles/discord-embed-colors.ts`
- PWA tokens page: `apps/web/app/(public)/design/tokens/page.tsx`
- Annex index: `docs/spec/v2025.08/index.md`

---

## One-shot: add this section to README and push

> Option A — Append to `README.md`

```bash
cat >> README.md <<'MD'
## Project Context & Quick Start

**Repo:** GuardianArrow/war-and-order  
**Stack:** Node 20 LTS · PNPM workspaces · TypeScript · Next.js 14 · Tailwind · Playwright  
**Docs:** Specs live in `docs/annexes/` (LOCKED). Start at `docs/spec/v2025.08/index.md`.

### What’s in here
- **apps/**
  - **web/** — Next.js PWA (design tokens page, future dashboards)
  - **bot/** — Discord bot (intents / embeds / interactions) — _skeleton paths set_
  - **worker/** — Background jobs (Annexe 7) — _planned_
- **packages/** — Reserved for shared libs (policy, schema, db, i18n, telemetry, comms, api)
- **configs/tokens/**
  - **palette.json** — Canonical color palette (brand/semantic/role)
  - **tailwind.tokens.ts** — Tailwind helpers (role color palette + runtime CSS vars)
- **apps/bot/discord/styles/**
  - **discord-embed-colors.ts** — Embed color map (Design System)
- **docs/annexes/** — Annexes 1–17 (LOCKED)
- **.github/workflows/**
  - **web-e2e.yml** — PWA E2E (Playwright) CI workflow

### Local dev (PWA)
\`\`\`bash
pnpm install
pnpm --filter ./apps/web dev
# Visit: http://localhost:3000/design/tokens
\`\`\`

**Design tokens smoke test**  
Route **/design/tokens** renders palette swatches and role CSS vars. Tailwind is wired to \`configs/tokens/tailwind.tokens.ts\`.

### E2E tests (Playwright)
\`\`\`bash
# Local (nice reporter)
pnpm run web:e2e

# CI-style (line reporter)
pnpm run web:e2e:ci
\`\`\`
Playwright auto-starts the Next.js dev server via \`apps/web/playwright.config.ts\`.

**Tests live in \`apps/web/tests/\`:**
- \`tokens.spec.ts\` — palette swatches render
- \`tokens-vars.spec.ts\` — role CSS variables are present

### CI
Workflow: \`.github/workflows/web-e2e.yml\`
- Installs browsers for the web app only
- Uses the \`e2e:ci\` script and Playwright \`webServer\` auto-start

### Conventions (short)
- **Workspaces:** PNPM (\`pnpm -w\` at repo root, \`--filter ./apps/web\` for web app)
- **Commits:** Conventional Commits (\`type(scope): message\`)
- **Docs:** Annex updates are LOCKED; record changes in **Annexe 15** (Revision History)
- **Runtime:** Node 20 LTS; strict TS; Tailwind v3 wired to tokens

### Handy paths
- Tokens: \`configs/tokens/palette.json\`, \`configs/tokens/tailwind.tokens.ts\`
- Embed colors: \`apps/bot/discord/styles/discord-embed-colors.ts\`
- PWA tokens page: \`apps/web/app/(public)/design/tokens/page.tsx\`
- Annex index: \`docs/spec/v2025.08/index.md\`
MD

git add README.md
git commit -m "docs(readme): add Project Context & Quick Start section"
git push
```

> Option B — Keep as `docs/README_Context_Summary.md` and link it from README

```bash
mkdir -p docs
cp README_Context_Summary.md docs/README_Context_Summary.md

# Add a link near the top of README.md
grep -q "README_Context_Summary.md" README.md ||   printf '
> See also: [Project Context & Quick Start](docs/README_Context_Summary.md)
' >> README.md

git add README.md docs/README_Context_Summary.md
git commit -m "docs: add README context summary and link"
git push
```
