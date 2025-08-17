# War & Order — PWA + Discord Bot

A unified **PWA** and **Discord Bot** that helps alliances run War and Order. The project now ships with a **theming system** that works in both the web app and Discord embeds (named themes + per‑guild overrides).

> **Repo:** `GuardianArrow/war-and-order`  
> **Stack:** Node 20 · PNPM Workspaces · TypeScript · Next.js 14 (App Router) · Tailwind · Playwright · Vitest · MongoDB

---

## What’s inside

```
apps/
  web/                      # Next.js PWA
    app/(public)/design/    # Tokens, components gallery, themes admin
    components/design/      # Preview widgets + ThemePicker
    tests/                  # Playwright tests (tokens/components + snapshots + persistence)
    app/api/themes/[guildId]/route.ts  # REST endpoint to read/write per‑guild theme config
  bot/                      # Discord bot
    discord/styles/         # Theme-aware embed color resolver
    discord/commands/       # /theme slash command (set/show/override/clear)
    data/                   # Mongo DAO for guild_theme_configs (TTL cache)
    tests/                  # Vitest unit tests (resolver, overrides, tone/status)
configs/
  tokens/
    palette.json            # Named themes (default, midnight…) + role scales
    tailwind.tokens.ts      # Emits CSS vars for each theme (Tailwind plugin)
docs/
  annexes/                  # Product & tech specs (LOCKED); see Annexe 17
.github/
  workflows/ci.yml          # CI: Vitest (bot) + Playwright (web)
```

---

## Theming — What you can do now

- **Named themes** in `configs/tokens/palette.json` (e.g. `default`, `midnight`).  
- **Runtime switching** in the PWA via `next-themes` (`data-theme="<key>"`).  
- **Per‑guild overrides** stored in Mongo (`guild_theme_configs`) like `{ "--role-primary-500": "#123456" }`.  
- **Discord embeds** use the **same tokens** via `embedColorFor(themeKey, role, shade, overrides?)`.  
- **Admin UI** `/design/themes` to read/write the per‑guild config through the REST route.  
- **Screenshots** generated for docs: default + midnight (Playwright).

**Quick demo**
- Visit **`/design/tokens`** and **`/design/components`**.  
- Use the header **ThemePicker** or append **`?theme=midnight`** to the URL.  
- Theme choice persists across pages via `localStorage["wao-theme"]`.

---

## Quick start

### 1) Install dependencies (root)
```bash
pnpm install
```

### 2) Run the PWA
```bash
pnpm --filter ./apps/web dev
# http://localhost:3000/design/tokens
```

### 3) Run the bot (requires a .env with DISCORD_TOKEN etc.)
```bash
pnpm --filter ./apps/bot dev
```

> **Secrets:** For local dev, create `.env` files in each app:
>
> `apps/web/.env.local` (optional if you hit the themes API)  
> `apps/bot/.env` (required)  
> 
> **Required keys:**  
> - `MONGODB_URI` — connection string (or provide via Codespaces/CI secrets)  
> - `MONGODB_DB` — database name (defaults to `ams`)  
> - `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, (optional) `DISCORD_GUILD_ID` for command registration  
> - `GUILD_THEME_CACHE_TTL_MS` — optional cache TTL override for the DAO

---

## Web app: key routes

- `/design/tokens` — role color scales (50‑900) with live swatches.  
- `/design/components` — live previews (Buttons, Alerts, Discord Embed). Supports `?theme=<key>`.  
- `/design/themes` — minimal admin UI to read/write a guild’s theme selection + overrides.  
- `/api/themes/[guildId]` — REST endpoint (GET, PATCH) for `guild_theme_configs`.

**Tailwind wiring**
- `roleColorPalette()` exposes colors via `hsl(var(--role-...)/<alpha-value>)`.  
- `makeThemeCssVars()` registers CSS vars for **all themes** (`:root` for default, `[data-theme="<key>"]` for others).  
- `globals.css` defines font/radius/shadow tokens; per‑theme overrides can swap them.

---

## Discord bot: theming

**Resolver**
```ts
embedColorFor(themeKey, role, shade?, overrides?) → number  // 0xRRGGBB
colorFromToneWithTheme(themeKey, 'info'|'success'|..., overrides?) → number
colorFromEventStatusWithTheme(themeKey, 'Live'|'Cancelled'|..., overrides?) → number
```

**Guild-aware helper**
```ts
embedColorForGuild(guildId, role, shade?) → number
// internally resolves themeKey + overrides via Mongo DAO, with TTL cache
```

**Slash command**
```
/theme set key:<default|midnight|…>
/theme override name:<--role-primary-500> value:<#RRGGBB>
/theme clear name:<--role-primary-500>
/theme show
```

---

## Tests & CI

### Playwright (web)
```bash
# Run E2E
pnpm --filter ./apps/web run test

# Generate snapshots (tokens + components, default + midnight)
pnpm --filter ./apps/web run test:snapshots

# Show last report
pnpm --filter ./apps/web run report
```

### Vitest (bot)
```bash
pnpm --filter ./apps/bot test         # single run
pnpm --filter ./apps/bot test:watch   # watch mode
```

### CI
`.github/workflows/ci.yml` runs both:
- **Vitest** (bot) on Node 20
- **Playwright** (web) with the app auto‑served

---

## Key files (jump list)

- **Palette:** `configs/tokens/palette.json`  
- **Tailwind tokens:** `configs/tokens/tailwind.tokens.ts`  
- **Theme globals:** `apps/web/app/(public)/design/globals.css`  
- **Theme provider:** `apps/web/app/providers.tsx` (next‑themes)  
- **ThemePicker:** `apps/web/components/design/ThemePicker.tsx`  
- **Admin UI:** `apps/web/app/(public)/design/themes/page.tsx`  
- **REST route:** `apps/web/app/api/themes/[guildId]/route.ts`  
- **Embed colors (bot):** `apps/bot/discord/styles/embed-colors.ts`  
- **Guild DAO (bot):** `apps/bot/discord/data/guildThemeDao.ts`  
- **Bot tests:** `apps/bot/tests/embed-colors.test.ts`  
- **Web tests:** `apps/web/tests/*.spec.ts` + `snapshots.spec.ts`

---

## Troubleshooting

- **ESLint config errors (Next 14 vs ESLint 9):** use the pre‑ESLint‑9 setup in `apps/web/.eslintrc.json`.  
- **Brackets in folders (Next App Router):** use literal folder names like `[guildId]` when creating route segments.  
- **Mongo in API routes:** ensure `apps/web/app/api/themes/[guildId]/route.ts` runs on the **Node.js** runtime (`export const runtime = 'nodejs'`).  
- **Palette changes not visible:** Restart the dev server after editing `palette.json` so Tailwind can re‑emit CSS vars.

---

## Roadmap (next)

- Rich guild dashboards (events, attendance, CBSP tools).  
- Admin UX for theme cloning/export/import.  
- Policy Guard + audit trails (Annexe 6 & 19).  
- Worker jobs and delivery metrics (Annexes 7 & 8).

---

## License

MIT (unless superseded by alliance‑internal policy).

---

### Credits

Design & engineering by the Gavin Turner