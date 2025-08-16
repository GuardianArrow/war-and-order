# Annexe 15 — Data Migration & Seeding (LOCKED)
_Last Updated: 2025-08-15 (Europe/London)_

**Purpose:** Safe, idempotent plan to (a) migrate legacy data into new schemas (Annexe 4), (b) seed required reference data (templates, feature flags, badge catalog), and (c) define rollback, verification, and observability.

---

## 15.1 Principles & Guardrails
- **Idempotent by design:** Every step re-runnable without dupes/corruption (UPSERTs on stable IDs).
- **Tracked:** Each step writes a record to `migrations` with status, counts, checksums.
- **Read-only cutover:** Enable **Maintenance Mode** (A4 §4.3) to pause publishes/reminders and block risky writes; log the toggle in audit.
- **No resurrection:** Respect tombstones and deletion logs (Module F, Annexe 10).
- **Per-guild isolation:** Always scope by `guildId`.
- **Dry-run first:** Produce a migration plan report before writing.

---

## 15.2 Source→Target Inventory

| Domain        | Legacy                                   | Target (Annexe 4)                                                                                           | Notes                                                                                 |
|---------------|------------------------------------------|--------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| Events Core   | events (older), inline RSVPs             | events, event_templates, event_rsvps, event_attendance_batches                                               | Add guildId, version, schedulerEventId; split RSVPs/attendance; coerce enums.         |
| CBSP          | cbsp_members/depot/requests (older)      | same collections (normalized)                                                                                | Validate bounds; add minLevels; normalize states.                                     |
| Shield Hosting| shields (posts+subs mixed)               | shields_posts, shields_subscriptions                                                                         | Split; derive endUTC; extensionIntent.                                                |
| Mentor        | pair spreadsheet/table                    | mentor_pairs, mentor_spaces                                                                                  | Create spaces only if exists or policy requires.                                      |
| Formation     | profile JSON                              | (optional future collections)                                                                                | Backfill defaults if you formalize storage.                                           |
| Comms/Alerts  | N/A                                       | comms_messages, comms_deliveries                                                                             | NOTE: add to A4 when ready (see §15.12.4 note).                                       |
| Culture       | culture_posts/kudos/badges               | culture_activities, culture_submissions, culture_votes, culture_badges (catalog), culture_badges_awarded (awards), culture_quiz_bank, culture_clubs | Map posts→activities/submissions; likes→votes; pHash.                                 |
| Settings/Flags| ad-hoc config                             | settings (featureFlags, maintenance, module settings)                                                        | See §15.12 seeds.                                                                     |
| i18n          | scattered                                 | files only (Module D)                                                                                        | Verify key references.                                                                |

---

## 15.3 Orchestration & Registry

**`migrations` (registry) document:**

```json
{
  "_id": "ObjectId",
  "guildId": "string",
  "code": "M15.CULTURE_SPLIT_V1",
  "startedAt": "ISODate",
  "finishedAt": "ISODate?",
  "status": "pending|running|done|failed|rolled_back",
  "stats": { "read": 0, "written": 0, "skipped": 0, "errors": 0 },
  "checksum": "sha256",
  "notes": "string"
}
```

**Order (per guild):**
1) Enable Maintenance → 2) Back up → 3) Ensure indexes → 4) Dry-run report → 5) Canary batch (1k docs) → 6) Full run (Settings → Seeds → Events → CBSP → Shields → Mentor → Formation → Culture) → 7) Verify → 8) Disable Maintenance → 9) Schedule post-migration jobs.

---

## 15.4 Pre-Flight, Dry-Run & Backups

- **Dry-run:** scan legacy, produce counts, target estimates, enum coercions, “would-write” summaries, and top risks (missing users, invalid states). Persist `migrations` row with `status="pending"` + stats.
- **Backup example:**

```bash
mongodump --db alliance --out ./backup-$(date +%F) \
  --collection events --collection culture_posts --collection badges --collection users
```

- Record baseline counts per collection & guildId.
- Workers paused or honoring Maintenance gate.

---

## 15.5 Idempotent Write Patterns

**UPSERT macro (pseudo):**

```ts
function upsert(coll, match, doc, setOnInsert = {}) {
  return db[coll].updateOne(
    match,
    { $set: { ...doc, updatedAt: now() },
      $setOnInsert: { createdAt: now(), ...setOnInsert },
      $inc: { version: 1 } },
    { upsert: true }
  );
}
```

- **Batching:** 500–1,000 docs; sleep 100–250ms between batches.
- **Reads:** use cursors (batchSize: 500), sorted by `_id`.
- **Idempotency for jobs/comms:** include stable `idempotencyKey`.
- **Index warmup:** ensure new indexes exist before heavy writes.

---

## 15.6 Settings & Feature Flags (seed)

- Upsert into `settings`:

  - `key="featureFlags"` → booleans only:

    ```json
    {
      "events.enabled": true,
      "events.eliteWars": true,
      "events.wof": true,
      "events.publishToDiscordScheduler": true,
      "cbsp.enabled": true,
      "cbsp.depotEditing": true,
      "shields.enabled": true,
      "mentor.enabled": true,
      "culture.enabled": true,
      "culture.quizzes": true,
      "culture.kudos": true,
      "attendance.bulkMarking": true,
      "maintenance.enabled": false
    }
    ```

  - `key="maintenance"` → `{ "enabled": false }`

- **Verify:** read-back & assert booleans.

---

## 15.7 Event Normalisation

Targets: `events`, `event_templates`, `event_rsvps`, `event_attendance_batches`.

- Ensure `guildId`, `version:int`, timestamps.
- **Enums:** map status to `Draft|Scheduled|Live|Completed|Cancelled`; scope to `alliance|program|private`; RSVP to `Going|Maybe|No`.
- Move **inline RSVPs** → `event_rsvps` (`status`, `source`, `at`). 
- **Embedded attendance** → `event_attendance_batches` with `actorId="legacy_migration"`.
- Preserve `schedulerEventId` where present.

**Checks:** RSVP count parity; UTC timestamps; common template backfill (see §15.12.2).

---

## 15.8 CBSP Adjustments

- Clamp depot levels to `0..999,999,999,999`.
- Seed `minLevels` if missing (defaults: 200m/200m/50m/25m).
- Normalize request `state` to `Open|Approved|Denied|Completed`.
- Map freeform assignments to enumerated resources.

---

## 15.9 Shield Hosting Split

- To `shields_posts`: `hostId`, `coords`, `startUTC`, `duration`, `endUTC`, `extensionIntent`, `status`.
- To `shields_subscriptions`: 1 row/subscriber (`unsubscribedAt` if applicable).
- Derive `endUTC = startUTC + duration`; if unknown, infer from last alert; else mark **Expired** and warn.

---

## 15.10 Mentor Program

- Create `mentor_pairs` from legacy; set `status`.
- `mentor_spaces` only if channels exist or policy requires; otherwise runtime creation on approval.

---

## 15.11 Culture Split & Enhancements

### 15.11.1 Posts → Activities + Submissions

- Legacy “hosted” posts → **activity + submissions**.
- Ad-hoc posts → **activity type `gallery`** + one **submission**.
- Likes → `culture_votes` (`value=1`, `at` from reaction time when known).

### 15.11.2 Badges → Catalog + Awards

- Static definitions → `culture_badges` with `catalogVersion="1.0.0"`.
- Grants → `culture_badges_awarded` (`awardedBy="manual"| "auto"`, optional `season`).

### 15.11.3 pHash Backfill (de-dup)

- Compute perceptual hash (e.g., **dHash 64-bit hex**) for image submissions → `culture_submissions.pHash`.
- Index: `{ guildId:1, pHash:1 }` **sparse**.
- **Collisions:** Hamming distance ≤ 8/64 → flag `flags.possibleDuplicate=true`, notify mods.
- **Privacy:** pHash is non-PII; retain per Annexe 10; evict after retention via job.

### 15.11.4 Quiz Bank & Clubs

- Quizzes → `culture_quiz_bank` with `reviewStatus="in_review"`.
- Clubs → `culture_clubs` with `lastActiveAt` and `settings.autoArchiveDays` (default 30).

---

## 15.12 Seeds (Reference Data)

### 15.12.1 Feature Flags → see §15.6.

### 15.12.2 Event Templates

- **Elite Wars (45m)** — alliance scope, reminders 24h/1h/15m.
- **WoF Defence Phase** — program scope, scheduler OFF.
- **WoF Attack Phase** — program scope, scheduler OFF, slot metadata.
- **Alliance Meeting (30m)** — alliance scope, scheduler ON.

### 15.12.3 Badge Catalog (starter)

- **Participation:** `first_post`, `five_themes`, `ten_quizzes`
- **Achievement:** `theme_winner`, `quiz_ace`, `all_rounder`
- **Community:** `kudos_magnet`, `helpful_hand`
- **Streaks:** `weekly_regular`

(Names/descriptions via Module D keys; `catalogVersion="1.0.0"`.)

### 15.12.4 Comms Templates & Collections

- Seed i18n for announcement/publish preview/reminders/weekly culture roundup.

- **Schema NOTE:** If not yet defined in Annexe 4, add:

  - `comms_messages`: `{ messageId, channels[], body, i18nKey?, createdBy, createdAt }`
  - `comms_deliveries`: `{ messageId, userId, channel, status, ts, idempotencyKey }`

  (Both keyed by guildId; indexes on `{guildId,messageId}` and `{guildId,status,ts}`.)

### 15.12.5 Module Settings (non-flag)

- Upsert `settings` rows for numeric/string config:
  - `key="mentor.maxStudents"` → `3` (int)
  - **Future:** `culture.points.weights`, `events.reminderLadder` overrides, etc.

---

## 15.13 Validation & Reconciliation

- **Parity counts:** events, RSVPs, culture posts→activities+submissions, likes→votes.
- **Sanity queries:**
  - events with `endUTC < startUTC` → expect `0`
  - submissions with `pHash` `null` after backfill → acceptable (pending), but log remaining
  - RSVPs with invalid enum → `0` after coercion
- **Spot checks:** 20 random per type; verify titles (i18n keys), UTC, scope, scheduler mirror id.
- **Index health:** validate new indexes; confirm sparse/partial behavior.

---

## 15.14 Observability & Telemetry

**Metrics (Annexe 8):**
- `e_migration_steps_total{code,status}`
- `e_migration_docs_written_total{collection}`
- `e_migration_errors_total{code}`
- `e_migration_dryrun_total{status}` (new)
- `e_culture_phash_collisions_total`

**Logs per batch:** `{ guildId, code, read, written, skipped, durationMs }`.

**Audit:** maintenance toggles, break-glass, and any “skips due to privacy”.

---

## 15.15 Rollout & Rollback

**Rollout (per guild):**
1) Enable Maintenance → 2) Backups → 3) Indexes → 4) Dry-run → 5) Canary → 6) Full run → 7) Verify → 8) Disable Maintenance → 9) Resume workers.

**Rollback:**
- Prefer re-running idempotent steps after fixes rather than destructive rollback.
- If needed, restore from snapshot or swap `_old` collections.
- Never un-delete previously deleted user data.

---

## 15.16 Security & Access

- Runner uses **least-privilege DB user** (read legacy, write target).
- Secrets per environment; actions logged to `audit_logs` (`module="MIGRATION"`).

---

## 15.17 DSR & Privacy

- Do **not** migrate tombstoned users or content.
- Anonymise legacy references as “Deleted User #<hash>”.
- **Respect retention** (Annexe 10); migration does not extend retention clocks.

---

## 15.18 Post-Migration Tasks

- Schedule jobs (Annexe 7): `clubs_auto_archive`, `phash_index_maintenance`, optional `quizbank_review_digest`.
- Enable Drift Detection for scheduler mirrors (Module H §4.0.9).
- Warm caches (templates, leaderboards).
- Send completion summary to **R4/R5**.

---

## 15.19 Example CLI Skeleton (Node/TS, pseudo)

```ts
async function runAll(guildId: string) {
  await enableMaintenance(guildId); // audit
  try {
    await backup(guildId);
    await ensureIndexes();
    await dryRunReport(guildId); // save to migrations
    await seedSettingsAndFlags(guildId);
    await canary(() => migrateEvents(guildId));
    await migrateEvents(guildId);
    await migrateCBSP(guildId);
    await migrateShields(guildId);
    await migrateMentor(guildId);
    await migrateFormations(guildId);
    await migrateCulture(guildId); // includes pHash queue
    await verify(guildId);
    await markMigrationDone(guildId);
  } catch (e) {
    await markMigrationFailed(guildId, e);
    throw e;
  } finally {
    await disableMaintenance(guildId); // audit
  }
}
```

---

## 15.20 Cross-References

Annexe 4 (Schemas & indexes) · Annexe 6 (Policy) · Annexe 7 (Jobs, idempotency, maintenance) · Annexe 8 (metrics/logs) · Annexe 10 (Privacy/retention/DSR) · Annexe 14 (API headers; ETag/If-Match).

---

## 15.21 Revision Log

- **2025-08-15:** **LOCKED.** Added dry-run/canary, flags vs module settings split, comms collections note, maintenance audit, data quality & sanity queries, and clarified drift detection ref to Module H §4.0.9.
