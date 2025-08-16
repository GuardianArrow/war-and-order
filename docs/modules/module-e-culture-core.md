*Target repo file:* `docs/modules/module-e-culture-core.md`

---

module: Module E (Culture & Community Core)
version: v2025.08
status: Working Draft
last_updated: 2025-08-15 (Europe/London)
owners: [GuardianArrow]
annexe_refs:
  - Module A (auth, Policy Guard, flags, maintenance, jobs, privacy, observability)
  - Module D (i18n)
  - Annexe 3 (UX Surface & Components)
  - Annexe 4 (Database Schemas)
  - Annexe 5 (Discord intents/scopes/permissions)
  - Annexe 7 (Jobs, Scheduling & Idempotency)
  - Annexe 8 (Observability)
  - Annexe 10 (Data Protection & Privacy)
  - Annexe 14 (API Contracts)
  - Annexe 16 (Server layout & permission templates)

---

# Module E — Culture & Community Core — 🛠️ **WORKING DRAFT**

## E1 — Purpose
A multilingual, low-friction framework for community building: **photo themes, quizzes, mini-competitions, kudos, spotlights, birthdays, clubs, suggestion box/polls**. Reuses Module **D** (i18n), Module **A** (auth, Policy Guard, flags, maintenance, jobs, privacy, obs), and Annexes **3/5/7/8/10/16**.

**Goals**
- One composer & pipeline for culture activities.
- Button-first UX in Discord with audience preview & safe-send guardrails.
- Quiet Hours, maintenance gate, idempotent delivery.
- Full audit/metrics; privacy controls.

---

## E2 — Roles & Permissions (Policy Guard)
**Roles**
- **Culture Lead** (R4-delegable): configure activities, publish/close, moderate content, manage badge catalog, award/revoke badges, manage quiz bank.
- **Badge Maintainer**: maintain/version badge catalog.
- **Culture Mods**: curate/moderate; run quizzes/contests.
- **Contributors (Member+)**: submit, vote, join quizzes/contests, give kudos.
- **Viewers (Visitors)**: read-only.
- **R5**: global override.

**Guards (Annexe 6)**
- `culture.activity.publish` → R4/R5 or Culture Lead
- `culture.activity.moderate` → Culture Lead/Mods/R5
- `culture.quizbank.manage` → Culture Lead/Badge Maintainer/R4/R5
- `culture.badge.catalog.manage` → Badge Maintainer/R4/R5
- `culture.badge.grant|revoke` → Culture Lead/R4/R5
- `culture.quiz.run` → Culture Lead/Mods  
All decisions logged (ALLOW/DENY/SOFT_ALLOW + reason).

---

## E3 — Surfaces
- **Discord**: Culture category (Annexe 16), forum/text channels; auto-threads per activity; buttons/selects/modals; minimal slash.
- **PWA**: Culture Hub (feed, galleries, leaderboards, Quiz Bank editor, “My badges & kudos”).
- **Notifications** (Module A → Annexes 5/7): launch / last-call / results; Quiet Hours honored (critical overrides per policy).
> Button-first (Annexe 3): Launcher → ephemeral panel; actions via buttons/selects/modals; deep-link to PWA for long lists/bulk.

---

## E4 — Safety & Content Policy
- SFW; no harassment/doxxing/hate; PG-13 tone.
- PWA uploads: **strip EXIF/GEO**; safe types only.
- Consent checkbox on submission.
- **Perceptual hash (pHash)** on images: detect near-duplicates (180d window); soft-block with “possible duplicate”; Mods can override (audited).
- Report → queue → action: hide/warn/delete (audited).
- AutoMod per-locale lists; spam/abuse rate-limits.

---

## E5 — Data Model (aligns with Annexe 4)
_All docs include `guildId`, `version`, `createdAt`, `updatedAt`, optional `deletedAt` and Policy Guard audit fields._

**`culture_activities`**  
`activityId`, `type` (`photo_theme|quiz|mini_comp|spotlight|kudos_stream|birthday|club|poll`), `titleKey`, `descKey`, `status` (`draft|live|closed|archived`), `scope` (`alliance|program|private`), `managers[]`, `schedule{startUTC,endUTC}`, `params{}`, `visibilityRoles[]?`

**`culture_submissions`**  
`submissionId`, `activityId`, `userId`, `payload{mediaUrl|answer|text}`, `lang`, `flags{reported:boolean,…}`, `pHash? (hex)`, `score`, `voteCount`

**`culture_votes`**  
`voteId`, `activityId`, `submissionId`, `userId`, `value(1)`, `ts`

**`culture_badges` (catalog)**  
`catalogVersion (semver)`, `badgeId`, `nameKey`, `descKey`, `icon`, `criteria{ruleSet}`, `isSeasonal`, `createdBy`, `changeLog[]`

**`culture_badges_awarded`**  
`awardId`, `badgeId`, `toUserId`, `awardedBy (auto|manual)`, `ts`, `season?`

**`culture_kudos`**  
`kudosId`, `fromUserId`, `toUserId`, `reason`, `ts`

**`culture_leaderboard_snapshots`**  
`period (weekly|monthly|season|lifetime)`, `scope`, `range{startUTC,endUTC}`, `topN[]`

**`culture_quiz_bank` (new)**  
`quizId`, `titleKey`, `topicTags[]`, `ownerId`, `visibility (private|guild|global)`, `reviewStatus (draft|in_review|approved)`, `questions[]`  
_Question:_ `qId`, `textKey`, `choices[{id,textKey,isCorrect}]`, `explanationKey?`, `localeVariants[{locale,text,choices}]?`

**`culture_clubs` (new)**  
`clubId`, `name`, `ownerId`, `minMembers (default 5)`, `memberIds[]`, `lastActiveAt`, `archivedAt?`, `settings{autoArchiveDays:30}`

**Annexe 4 Delta / Indexes**  
Add `pHash` to `culture_submissions`; add `culture_quiz_bank`, `culture_clubs`; split awards into `culture_badges` & `culture_badges_awarded`.  
Indexes: by `guildId`, `{activityId,userId}`, `pHash`, `clubId`, `lastActiveAt`, `reviewStatus`.

---

## E6 — Common Workflows
**Create (Draft) → Configure → Publish (Live) → Participate → Close → Showcase**  
- Announcements at **launch / 24h left / 1h left / results** (localized; Module D).
- Discord: thread per activity; PWA: feed card + detail view.
- Close → gallery/archives; auto-archive “closed” after **30d** (gallery view persists).

---

## E7 — Sub-Modules (Phase 1)
**E7.1 Photo Themes & Gallery** — weekly prompts; 1–3 submissions/user; likes or ranked voting; pHash de-dup; EXIF stripped; winners promoted.  
**E7.2 Quizzes & Trivia** — live (Discord buttons) or async (24–48h PWA); Quiz Bank (E9); randomized order; anti-leak; timers; scoreboards.  
**E7.3 Mini-Competitions** — memes/builds/speed-runs; 48–72h votes; optional judges.  
**E7.4 Kudos** — members give kudos (rate-limited); counts feed leaderboards/badges.  
**E7.5 Spotlights** — scheduled shoutouts; cross-post to Culture feed.  
**E7.6 Birthdays (opt-in)** — month/day only; localized greetings; Quiet Hours honored.  
**E7.7 Clubs (with governance)** — request → reach **minMembers(5)** in 7d or auto-cancel; inactivity **auto-archive** after `autoArchiveDays(30)`; re-activate on owner+R4 approval.  
**E7.8 Suggestion Box / Polls** — anonymous suggestions (moderated); polls (multi-choice); results on close.

---

## E8 — Leaderboards, Badges & Shoutouts
### E8.1 Leaderboards
**Periods:** Weekly, Monthly, Seasonal (90d), Lifetime. **Scopes:** Global; optionally per-locale/activity.  
**Default weights (configurable):**
- Submission accepted **+1**; Vote cast **+0.25** (cap **10/day**)
- Unique vote received **+0.5** (cap **30/submission**)
- Theme winner **+5/+3/+2**; Quiz correct **+1**; Quiz top-3 **+5/+3/+2**
- Kudos received (unique) **+0.5** (cap **5/wk**); Kudos given (unique) **+0.25** (cap **5/wk**)
**Anti-gaming:** per-day caps; ignore self-votes/alts; Member+ only; diminishing returns; kudos rate-limits.  
**Tie-breakers:** unique contributions → earliest → activity diversity.  
**Rollups:** nightly → `culture_leaderboard_snapshots`.

### E8.2 Badges (catalog governance)
Versioned **catalog** (semver); **Badge Maintainer** keeps `changeLog`.  
Taxonomy: Participation, Achievement, Community, All-Rounder, Streaks, Host/Judge.  
Awarding: **automatic** via rules on close; **manual grant/revoke** by Culture Lead/R4/R5 (audited).  
Visibility: profile strip; PWA leaderboards show icons; localized names/descriptions.

### E8.3 Shoutouts & Roundups
Weekly roundup job: top contributors, new badges, highlights, upcoming prompts; posts to Culture channel + PWA feed. Templates in `culture/comms.json`.

---

## E9 — Quiz Bank Tooling (new)
**Purpose:** author/review/publish quizzes per-locale.  
**Editor (PWA):** create quiz, questions, choices, answers, explanations; tags; locale variants.  
**Import/Export:** CSV/JSON (round-trip).  
**Workflow:** `draft → in_review → approved`; only **approved** quizzes can be scheduled.  
**Permissions:** `culture.quizbank.manage`.  
**Observability:** edit/publish logs; metrics: `e_culture_quizbank_quizzes_total`, `…_questions_total`.

---

## E10 — Optional Auto-Translation Assist (new)
**Flag:** `features.culture.autoTranslateDrafts=false` by default.  
Flow: EN → machine **drafts** for selected locales → Language Leads review/edit → approve.  
Privacy/Cost: **no external calls** unless explicitly enabled/configured in Annexe 5.  
Telemetry: usage counts, errors; “needs review” queue.  
Safeguard: machine output **never** goes live without human approval.

---

## E11 — UI & Commands
**Discord (button-first)**
- `/culture` → panel: Create Activity, Publish/Close, Submit, Vote, Run Quiz, Give Kudos, View Leaderboard, Manage Badges, Quiz Bank, Clubs.
- Examples:
  - `/culture theme create|publish|close`
  - `/culture submit`
  - `/culture vote`
  - `/quiz create|publish|start|close|join`
  - `/quiz bank` (open editor link)
  - `/quiz leaderboard`
  - `/kudos @user [badge] [reason]`
  - `/badge grant|revoke`
  - `/spotlight schedule @user`
  - `/club request <name>` | `/club manage`
**PWA:** Culture Hub (feed), activity detail, submit/vote, galleries, leaderboards, “My badges & kudos,” Quiz Bank Editor, Clubs, admin settings (weights/caps/catalog).  
**Discord constraints:** ≤5 rows/message, selects ≤25 options, modals ≤5 inputs (Annexe 3). Deep-link to PWA for long lists/bulk.

---

## E12 — Scheduling, Jobs & Reliability (Annexe 7)
Jobs: activity open/close, **reminders** (launch/last-call/results), **weekly roundup**, **nightly leaderboard rollup**, **badge awarding**.  
Clubs auto-archive: scan `lastActiveAt`; archive after `autoArchiveDays`.  
pHash sweep: maintain recents; flag serial duplicates.  
Idempotency keys per activity/phase; jittered fan-out; **DLQ** for non-retryable.  
Maintenance Mode: culture sends **pause**; panels show banner.

---

## E13 — Observability & Reporting (Annexe 8)
**Logs:** result, actor, `module=culture`, action (publish/submit/vote/award/quizbank.edit/club.archive), ids.  
**Metrics:**
- `e_culture_activities_total{type,status}`
- `e_culture_submissions_total{type}`
- `e_culture_votes_total`
- `e_culture_kudos_total`
- `e_culture_badges_awarded_total{badge}`
- `e_culture_quizbank_quizzes_total` / `…_questions_total`
- `e_culture_phash_collisions_total`
- `e_culture_auto_translate_drafts_total`
- `e_culture_roundup_job_duration_seconds`
- `e_culture_rate_limit_hits_total`
**Alerts:** quiz bank publish failures; roundup failures; pHash collision spikes; moderation backlog > N.

---

## E14 — Privacy & Retention (Annexe 10)
- **Retention:** 180d for submissions/votes/kudos (configurable). Galleries persist via URLs; raw uploads removed on schedule if mirrored.
- **pHash:** non-reversible; de-dup only; retained **180d**; included in DSR purge alongside submission.
- **DSR:** on profile deletion, anonymize historical winners (“Deleted User #hash”), remove personal content/links; keep non-PII counters.
- **Minimization:** store URLs & minimal metadata; strip EXIF; birthdays are **month/day only** and **opt-in**.

---

## E15 — Feature Flags & Config
- `features.culture.enabled=true`
- `features.culture.quizzes.enabled=true`
- `features.culture.badges.enabled=true`
- `features.culture.roundups.enabled=true`
- `features.culture.autoTranslateDrafts=false` (new)
- Per-activity toggles: `.photoThemes`, `.miniComps`, `.kudos`, `.spotlights`, `.birthdays`, `.clubs`, `.polls`.
- Settings: leaderboard weights/caps; voting windows; media size limits; anti-gaming thresholds; clubs `minMembers=5`, `autoArchiveDays=30`.

---

## E16 — API Touchpoints (Annexe 14)
**Headers:** `X-Guild-ID`, `If-Match (ETag)`, `Idempotency-Key` for mutating calls.

- `POST /culture/activities` (create) → 201 `{activityId,…}`
- `PATCH /culture/activities/{id}` (CAS updates)
- `POST /culture/activities/{id}/publish|close`
- `POST /culture/activities/{id}/submissions` (computes pHash on media)
- `POST /culture/submissions/{id}/vote`
- `POST /culture/kudos`
- `POST /culture/badges/{badgeId}/grant|revoke`
- `GET /culture/leaderboards?period&scope`
- `GET /culture/feed` (paged)

**Quiz Bank (new)**
- `POST /culture/quizbank` | `PATCH /culture/quizbank/{quizId}`
- `POST /culture/quizbank/{quizId}/review` (state changes)
- `POST /culture/quizbank/import` | `GET /culture/quizbank/{quizId}/export`

**Errors:** `409 CONFLICT.WRITE_STALE`, `429 RATE_LIMIT`, plus families per Annexe 14.

---

## E17 — Discord Integration (Annexe 5 & 16)
**Scopes/intents:** `applications.commands`, `bot`; Guild Members intent if directory lookups used for awards.  
**Permissions:** Send Messages, Manage Threads (forums/threads), Attach Files, Manage Webhooks (optional).  
**Server layout:** “Culture & Community” category with forum `#culture-themes`, `#quizzes`, `#shoutouts`, optional `#clubs-directory` (Annexe 16 templates).

---

## E18 — i18n & Accessibility (Module D & Annexe 11)
All strings via Module D namespaces (`culture.json`, `culture_quiz.json`, `culture_comms.json`).  
ICU plurals/ordinals; RTL support (`dir="rtl"`); screen-reader labels on buttons; never rely on color alone; short labels + emoji hints.  
Auto-translation assist gated by feature flag; **human review required**.

---

## E19 — Status & Revision
**Status:** Working Draft (awaiting lock).  
**Change log — 2025-08-15:** Added quiz bank tooling, optional auto-translation assist, club governance (min members + inactivity auto-archive), badge catalog governance (maintainer + versioning), image content hashing & de-dup; updated schema, jobs, metrics, API, and privacy notes.
