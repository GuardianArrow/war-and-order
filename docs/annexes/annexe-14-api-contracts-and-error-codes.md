# Annexe 14 — API Contracts & Error Codes ✅ **LOCKED**
_Last Updated: 2025-08-15 (Europe/London)_

Defines the canonical HTTP+JSON API used by the PWA, bot services, and jobs. Full OpenAPI/JSON Schema live in-repo; this annexe locks conventions, core endpoints, and error taxonomy.

---

## 14.0 Scope & Goals
- **One consistent contract** for all modules (A–H, D=i18n, E=Onboarding/Profile, J→E Culture rename already applied elsewhere).
- **Safe writes** (ETag/If-Match; versioned docs per A4.V).
- **Idempotent side-effecting POSTs** (Annexe 7).
- **Cheap to run** (no exotic infra; works on Node/HTTP).

---

## 14.1 Transport & Envelope
- **Base URL:** `/api/v1`
- **Content:** `application/json; charset=utf-8`
- **Auth:** `Authorization: Bearer <discord-oauth-access-token>` (scoped to guild membership).
- **Guild scoping:** pass `X-Guild-Id` header (required) — must match actor’s guild and target entity (Annexe 6 §5).

**Envelope (success)**
```json
{ "ok": true, "data": { ... }, "traceId": "..." }
```

**Envelope (error)**
```json
{ "ok": false, "error": { "code": "POLICY.DENY", "message": "…", "details": { "reason": "MAINTENANCE_MODE" } }, "traceId": "..." }
```

- **Caching & concurrency:** responses for mutable entities include **ETag**; updates require **If-Match** with that tag (or version CAS field).
- **Idempotency:** side-effecting POST/PUT may include **Idempotency-Key** (opaque ≤ 128 chars). Server stores result for 24h; duplicates return the original status + `Idempotency-Replay: true`.
- **Localization:** requests may include **Accept-Language**; server renders messages using Module D locale resolution (profile → header → EN). _Errors carry stable codes; human messages are localizable._

---

## 14.2 Pagination, Filtering, Sorting
- **Cursor pagination:** `?limit=25&cursor=eyJ...` → response includes `nextCursor` (or absent if end). Default `limit=25`; max `100`. Stable order by `(createdAt, _id)`.
- **Filtering:** simple query operators: `eq` (default), `in`, `lt`, `lte`, `gt`, `gte`.  
  _Example:_ `/events?type=EliteWars&status=in(Scheduled,Live)&from=2025-08-01`.
- **Sorting:** `?sort=createdAt:desc` (whitelist per resource).

---

## 14.3 Standard Headers (client ↔ server)

| Header | Direction | Purpose |
|---|---|---|
| `Authorization` | → | Discord OAuth bearer |
| `X-Guild-Id` | → | **Mandatory** guild scope |
| `Accept-Language` | → | Locale hint (Module D) |
| `Idempotency-Key` | → | Dedup semantic POST/PUT |
| `If-Match` / `ETag` | ↔ | Optimistic concurrency (A4.V / A9.5) |
| `X-Request-Id` / `traceparent` | → | Correlation / tracing |
| `Idempotency-Replay` | ← | `true` if served from store |
| `Retry-After` | ← | For 429/503 with seconds |
| `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` | ← | Client rate-limit budgeting |

---

## 14.4 Error Families & Codes

Families map to HTTP; `error.code` is stable. Additional machine reason under `error.details.reason` where relevant.

| Family | Example Codes | HTTP |
|---|---|---|
| **AUTH** | `AUTH.REQUIRED`, `AUTH.FORBIDDEN` | 401 / 403 |
| **VALIDATION** | `VALIDATION.BAD_REQUEST`, `VALIDATION.FIELD_MISSING`, `VALIDATION.INVALID_STATE` | 400 |
| **POLICY** | `POLICY.DENY` (e.g., `MAINTENANCE_MODE`, `MIN_RANK_R4`, `PRIVACY_BOUNDARY`), `POLICY.SOFT_ALLOW` | 403 / 200 |
| **CONFLICT** | `CONFLICT.WRITE_STALE` | 409 |
| **NOT_FOUND** | `NOT_FOUND.ENTITY` | 404 |
| **RATE_LIMIT** | `RATE_LIMIT.DISCORD`, `RATE_LIMIT.LOCAL` | 429 |
| **INTEGRATION** | `INTEGRATION.DISCORD_FAIL`, `INTEGRATION.STORAGE_FAIL` | 502 |
| **INTERNAL** | `INTERNAL.ERROR` | 500 |

_Localization of errors:_ message may be localized; `code` and `details.reason` are not.

---

## 14.5 Core Resources (canonical subset)

> Full OpenAPI covers all fields; below lists routes & patterns that other modules reference.

### Users
- `GET /users/me` → profile basics (language, timezone, roles).
- `PATCH /users/me` (**If-Match**) → edit profile basics (non-privileged).
- `POST /users/me/export` → enqueue DSR export (Annexe 10).
- `POST /users/me/delete` → start Exit Server flow (Module F).

### Events (Module H core)
- `GET /events?type=&status=&from=&to=&scope=`
- `POST /events` (**Idempotency-Key**) → create Draft (templateId optional).
- `GET /events/{id}` (ETag)
- `PUT /events/{id}` (**If-Match**) → edit (honors status locks).
- `POST /events/{id}/publish` → audience preview dry-run required; returns counts & sample; `confirm=true` to send.
- `POST /events/{id}/cancel` (reason required)
- `POST /events/{id}/reschedule`
- `POST /events/{id}/rsvp` → `{ "status": "Going|Maybe|No" }`
- `POST /events/{id}/attendance/batch` → bulk mark (H14), idempotent per `batchId`.

### Event Templates
- `GET /event-templates`
- `POST /event-templates` (R4/R5)
- `PUT /event-templates/{id}` (**If-Match**)  
  _Edits never mutate existing event instances._

### CBSP (Module B)
- `POST /cbsp/requests` → `{ type: "resources|cleaning", details: {...} }`
- `POST /cbsp/requests/{id}/approve|deny|complete`
- `GET /cbsp/depot`
- `PUT /cbsp/depot` (**If-Match**)

### Shields (Module C)
- `POST /shields` (host post)
- `POST /shields/{id}/extend`
- `POST /shields/{id}/subscribe|unsubscribe`
- `POST /shields/{id}/confirm` (new shield active)

### Mentor (Module G)
- `POST /mentor/enroll` \| `POST /mentor/resign`
- `POST /mentor/requests`
- `POST /mentor/requests/{id}/accept|reject`

### Culture & Community (Module E after rename)
- `GET /culture/leaderboards?period=&scope=`
- `POST /culture/themes/{id}/submit` (PWA upload → media proxy)
- `POST /culture/kudos`
- `POST /culture/badges/{badgeId}/grant|revoke` (R4/Curator)

### i18n Bundles (Module D)
- `GET /i18n/{locale}/{namespace}` → JSON key/value; cacheable; versioned.
- `GET /i18n/locales` → supported locales.

### Comms & Broadcast (Module H Comms integration)
- `POST /broadcasts/dry-run` → audience counts + sample list.
- `POST /broadcasts/send` (requires prior dry-run id + confirm) → multi-channel fan-out (Discord/app/in-game log only).

### Settings & Flags
- `GET /settings` (guild)
- `PUT /settings/feature-flags` (R4/R5; audit)

### Privacy & DSR (Annexe 10)
- `POST /privacy/requests` → create access/export/delete request.
- `GET /privacy/requests/{id}` → status.

### Health
- `GET /health` → liveness/ready probe.
- `GET /metrics` → Prometheus (protected).

---

## 14.6 Webhooks (optional, for integrations)
- **Purpose:** emit alliance events to external endpoints (e.g., mirror announcements, analytics).
- **Config:** R4/R5 registers endpoint & secret per guild.
- **Delivery:** `POST` with JSON
```json
{ "event": "event.published", "id": "...", "data": { ... }, "ts": "..." }
```
- **Security:**
  - `X-AMS-Signature`: `t=<unix>, v1=<hex-hmac-sha256(payload, secret)>`
  - Reject if `|now−t| > 5 min`.
  - Include **Idempotency-Key** per delivery; receivers should dedupe.
- **Retries:** exponential backoff up to 5 attempts; `Retry-After` honored if provided.

---

## 14.7 Rate Limits (client-facing)
- Per-guild & per-user budgets enforced; **429** returns `Retry-After` seconds.
- Headers: `X-RateLimit-Limit/Remaining/Reset`.
- For broadcasts, server batches internally (≤ **50 recipients/chunk**) and exposes a **parent job id** to poll.

---

## 14.8 Maintenance Gate Semantics (Annexe 6/7)
When `settings.maintenance.enabled=true`:
- **Blocks:** `event.publish`, `broadcasts.send`, non-critical jobs.
- **Allows:** privacy/DSR endpoints and integrity jobs (delete/export).
- Errors return `POLICY.DENY` with `details.reason="MAINTENANCE_MODE"`.

---

## 14.9 Examples

**Create event (idempotent)**
```http
POST /api/v1/events
Authorization: Bearer …
X-Guild-Id: 1234567890
Idempotency-Key: evt:create:2025-08-15T19:00Z:EliteWars

{ "type": "EliteWars", "templateId": "ew_v1", "startUTC": "2025-08-16T19:00:00Z", "visibilityScope": "alliance" }
```
**201**
```json
{ "ok": true, "data": { "eventId": "EVT_abc123", "status": "Draft", "etag": ""v3"" }, "traceId": "t-..." }
```

**Publish with audience preview**
```http
POST /api/v1/events/EVT_abc123/publish
Authorization: Bearer …
X-Guild-Id: 123
{ "dryRun": true }
```
**200**
```json
{ "ok": true, "data": { "recipients": 87, "sampleUserIds": ["..."], "dryRunId": "DRN_xyz" }, "traceId": "..." }
```

**Confirm**
```http
POST /api/v1/events/EVT_abc123/publish
...
{ "dryRunId": "DRN_xyz", "confirm": true }
```

**Optimistic update**
```http
PUT /api/v1/events/EVT_abc123
If-Match: "v3"

{ "title": "Elite Wars (Rescheduled)", "startUTC": "2025-08-16T20:00:00Z" }
```
**409 CONFLICT (someone edited first)**
```json
{ "ok": false, "error": { "code": "CONFLICT.WRITE_STALE", "message": "…", "details": { "latest": { … } } }, "traceId": "…" }
```

---

## 14.10 Security & Privacy (alignment)
- No **Message Content** intent reliance; inputs via interactions/APIs.
- Minimal PII (Discord IDs, gameplay data).
- **Audit** every privileged ALLOW/DENY (Annexe 6 & 8).
- **DSR flows** high-priority & idempotent (Annexe 10 & 7).
- Media uploads go through **proxy that strips EXIF**; returned URLs are **short-lived**.

---

## 14.11 Versioning & Deprecation
- Path-versioned (`/v1`). Add fields **additively**; do not repurpose types.
- Deprecations announced in release notes; optional `Sunset` header and `Deprecation: true`.
- Breaking changes require new version `/v2` and migration notes (Annexe 9).

---

## 14.12 Compatibility Matrix
- **Annexe 4:** ETag/If-Match mirrors version CAS; ids match schemas.
- **Annexe 5:** stack choices (Node/TS) + libs (`zod`) validate payloads.
- **Annexe 6:** Policy Guard enforces authorization before mutation.
- **Annexe 7:** Idempotency keys and job fan-out semantics.
- **Annexe 8:** error logs, traceIds, metrics for rate limits & conflicts.
- **Annexe 10:** privacy endpoints & retention guarantees.
- **Annexe 3:** Refresh & Reapply UX consumes 409 payloads.

---

**Status:** LOCKED — Any changes require R5 approval and an entry in **Annexe 15 — Revision History** (include endpoints, headers, or codes modified).
