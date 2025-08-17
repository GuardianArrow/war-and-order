
# Annexe 4 — Database Schemas — ✅ **LOCKED**
*Status:* Locked  
*Last Updated:* 2025-08-17 (UTC)

> Conventions apply across all collections unless noted. All strings are localized by Module D where marked `i18nKey`. API semantics (ETag/If-Match, error families) are detailed in Annexe 14.

---

## 4.0 Conventions (apply to all collections)

- **Common fields:** `_id:ObjectId`, `guildId:string` (required), `createdAt:ISODate`, `updatedAt:ISODate`, `version:int` (on mutable docs), `createdBy?:userId`, `updatedBy?:userId`.
- **Multi-guild safety:** All queries must filter by `guildId`.
- **Validation:** JSON Schemas (mirrored as TS types). Responses use `ETag: W/"<version>"`. Clients send **If-Match** on write (see §4.20 & Annexe 14).
- **Indexes (baseline):**
  - `{ guildId:1, _id:1 }` on all.
  - Domain indexes per collection (below).
  - TTL where retention allows (see §4.22); otherwise cleanup jobs (Annexe 7).
- **Privacy:** store gameplay + Discord IDs only (no emails/DOB). Retention per Annexe 10.

---

## 4.1 Users (`users`)

| Field        | Type      | Req | Notes                                        |
|--------------|-----------|-----|----------------------------------------------|
| discordId    | string    | ✓   | Primary user key                             |
| displayName  | string    |     | Discord display                              |
| ign          | string    |     | In-game name                                 |
| ranks        | string[]  | ✓   | e.g., `["Member"]`, includes R-rank          |
| roles        | string[]  |     | Specialist/Guru/Program roles                |
| language     | string    | ✓   | Locale; default `en`                         |
| timezone     | string    | ✓   | IANA TZ; default `UTC`                       |
| ageRange     | enum      |     | `U18` \| `18_30` \| `31_50` \| `51p`         |
| availability | object    |     | Weekly blocks                                |
| profileFlags | object    |     | `cbspMember:boolean`, `mentor:boolean`, …    |

**Indexes:** `{ guildId:1, discordId:1 } (unique)`, `{ guildId:1, ranks:1 }`, `{ guildId:1, roles:1 }`.

---

## 4.2 Agreements (`agreements`)

| Field       | Type   | Req | Notes                                 |
|-------------|--------|-----|---------------------------------------|
| userId      | string | ✓   | Discord ID                            |
| cocAccepted | bool   | ✓   | Code of Conduct                       |
| vowsAccepted| bool   | ✓   | Alliance Vows                         |
| cocVersion  | string | ✓   | Version string                        |
| vowsVersion | string | ✓   | Version string                        |
| timestamps  | object | ✓   | `{ cocAt:ISODate, vowsAt:ISODate }`   |

**Indexes:** `{ guildId:1, userId:1 } (unique)`.

---

## 4.3 Settings (`settings`)

| Field  | Type   | Req | Notes                                  |
|--------|--------|-----|----------------------------------------|
| key    | string | ✓   | e.g., `quietHours`, `featureFlags`     |
| value  | any    | ✓   | JSON blob                              |
| scope  | enum   | ✓   | `guild`                                |

**Feature flags** (`value` shape when `key="featureFlags"`): string→boolean map (missing ⇒ false).  
**Common flags:** `events.enabled`, `events.eliteWars`, `events.wof`, `events.publishToDiscordScheduler`, `cbsp.enabled`, `cbsp.depotEditing`, `shields.enabled`, `mentor.enabled`, `mentor.maxStudents`, `culture.enabled`, `culture.quizzes`, `culture.kudos`, `attendance.bulkMarking`, `maintenance.enabled`.

**Maintenance blob** (`value` shape when `key="maintenance"`):
```json
{
  "enabled": false,
  "message": "string?",
  "startedBy": "string?",
  "startedAt": "ISODate?",
  "scheduledWindow": { "startUTC": "ISODate?", "endUTC": "ISODate?" },
  "allowlistActions": ["string"]
}
```
*Effect:* when `enabled=true`, API rejects event publish/broadcast with `POLICY.DENY` & reason `MAINTENANCE_MODE`; workers queue but don’t deliver (Annexe 7). PWA shows banner with message.

**Indexes:** `{ guildId:1, key:1, scope:1 } (unique per scope)`.

---

## 4.4 Events (`events`)

| Field             | Type     | Req | Notes                                                       |
|-------------------|----------|-----|-------------------------------------------------------------|
| eventId           | string   | ✓   | Short id/slug                                              |
| templateId        | string   |     | From master list                                           |
| type              | string   | ✓   | e.g., `EliteWars`, `WoF`, `Custom`                         |
| title             | i18nKey  | ✓   | Module D keys                                              |
| description       | i18nKey  |     |                                                             |
| ownerId           | string   | ✓   | Creator                                                    |
| managers          | string[] |     | Co-hosts                                                   |
| visibilityScope   | enum     | ✓   | `alliance` \| `program` \| `private`                       |
| programKey        | string   |     | e.g., `CBSP`, `Mentor`                                     |
| participants      | string[] |     | When private                                               |
| startUTC          | ISODate  | ✓   |                                                             |
| endUTC            | ISODate  | ✓   |                                                             |
| recurrence        | RRULE    |     | Optional                                                   |
| timeSlots         | array    |     | For slot events                                            |
| capacity          | int      |     |                                                             |
| roleQuotas        | object   |     | `{ roleId: int }`                                          |
| status            | enum     | ✓   | `Draft` \| `Scheduled` \| `Live` \| `Completed` \| `Cancelled` |
| params            | object   |     | Submodule fields                                           |
| announceChannelId | string   |     | Discord channel                                            |
| schedulerEventId  | string   |     | Native Discord event id                                    |

**Indexes:** `{ guildId:1, eventId:1 } (unique)`, `{ guildId:1, type:1, startUTC:1 }`, `{ guildId:1, status:1 }`.

---

## 4.5 Event Templates (`event_templates`)

| Field              | Type    | Req | Notes               |
|--------------------|---------|-----|---------------------|
| templateId         | string  | ✓   | Unique              |
| name               | i18nKey | ✓   |                     |
| defaultDurationMin | int     | ✓   |                     |
| defaultScope       | enum    | ✓   |                     |
| maxCapacity        | int     |     |                     |
| defaultRSVP        | array   |     | Labels              |
| relatedRoles       | string[]|     |                     |
| active             | boolean | ✓   |                     |

**Indexes:** `{ guildId:1, templateId:1 } (unique)`, `{ guildId:1, active:1 }`.

---

## 4.6 RSVPs (`event_rsvps`)

| Field  | Type   | Req | Notes                      |
|--------|--------|-----|----------------------------|
| eventId| string | ✓   |                            |
| userId | string | ✓   |                            |
| status | enum   | ✓   | `Going` \| `Maybe` \| `No` |
| source | enum   | ✓   | `bot` \| `web`             |
| at     | ISODate| ✓   | Timestamp                  |

**Indexes:** `{ guildId:1, eventId:1, userId:1 } (unique)`, `{ guildId:1, eventId:1, status:1 }`.

---

## 4.7 Attendance Batches (`event_attendance_batches`)

| Field   | Type   | Req | Notes                                                |
|---------|--------|-----|------------------------------------------------------|
| eventId | string | ✓   |                                                      |
| batchId | string | ✓   | Unique per event                                     |
| marks   | array  | ✓   | e.g., `{ userId, status:'attended' }`                |
| actorId | string | ✓   | Who marked                                           |
| at      | ISODate| ✓   | When batch applied                                   |

**Indexes:** `{ guildId:1, eventId:1, batchId:1 } (unique)`.

---

## 4.8 CBSP Members (`cbsp_members`)

| Field               | Type   | Req | Notes                                        |
|---------------------|--------|-----|----------------------------------------------|
| userId              | string | ✓   |                                              |
| farms               | array  |     | `{ name, coords:"xxxx:xxxx" }[]`             |
| resourceAssignment  | object |     | `{ primary, secondary }`                     |
| notes               | string |     | Manager notes                                 |
| flags               | object |     | `{ underperforming?:boolean }`               |

**Indexes:** `{ guildId:1, userId:1 } (unique)`.

---

## 4.9 CBSP Depot (`cbsp_depot`)

| Field        | Type   | Req | Notes                                                                 |
|--------------|--------|-----|-----------------------------------------------------------------------|
| depotId      | string | ✓   | Single or multi                                                       |
| levels       | object | ✓   | `{ food, wood, stone, iron:Number(0..999,999,999,999) }`             |
| minLevels    | object | ✓   | Deny below                                                            |
| lastUpdateBy | string | ✓   | Manager                                                               |
| source       | enum   | ✓   | `clean` \| `withdrawal`                                               |

**Indexes:** `{ guildId:1, depotId:1 } (unique)`.

---

## 4.10 CBSP Requests (`cbsp_requests`)

| Field     | Type   | Req | Notes                                    |
|-----------|--------|-----|------------------------------------------|
| requestId | string | ✓   |                                          |
| userId    | string | ✓   |                                          |
| type      | enum   | ✓   | `resources` \| `cleaning`                |
| details   | object | ✓   | Amounts / castles                        |
| state     | enum   | ✓   | `Open` \| `Approved` \| `Denied` \| `Completed` |
| decision  | object |     | `{ by, at, note }`                       |

**Indexes:** `{ guildId:1, requestId:1 } (unique)`, `{ guildId:1, state:1 }`.

---

## 4.11 Shield Posts (`shields_posts`)

| Field           | Type   | Req | Notes                                                 |
|-----------------|--------|-----|-------------------------------------------------------|
| shieldId        | string | ✓   |                                                       |
| hostId          | string | ✓   |                                                       |
| coords          | string | ✓   | `xxxx:xxxx`                                           |
| startUTC        | ISODate| ✓   |                                                       |
| duration        | enum   | ✓   | `2h` \| `8h` \| `1d` \| `3d`                          |
| endUTC          | ISODate| ✓   | Derived                                               |
| extensionIntent | object |     | `{ plan?:bool, when?:ISODate, newDuration?:enum }`    |
| status          | enum   | ✓   | `Active` \| `Expired` \| `Extended` \| `Cancelled`     |

**Indexes:** `{ guildId:1, shieldId:1 } (unique)`, `{ guildId:1, status:1, endUTC:1 }`.

---

## 4.12 Shield Subscriptions (`shields_subscriptions`)

| Field          | Type   | Req | Notes                     |
|----------------|--------|-----|---------------------------|
| shieldId       | string | ✓   |                           |
| userId         | string | ✓   |                           |
| quietOverrides | object |     | Next alert gate           |
| unsubscribedAt | ISODate|     |                           |

**Indexes:** `{ guildId:1, shieldId:1, userId:1 } (unique)`.

---

## 4.13 Mentor Pairs (`mentor_pairs`)

| Field     | Type   | Req | Notes                               |
|-----------|--------|-----|-------------------------------------|
| mentorId  | string | ✓   |                                     |
| studentId | string | ✓   |                                     |
| startedAt | ISODate| ✓   |                                     |
| closedAt  | ISODate|     |                                     |
| status    | enum   | ✓   | `Active` \| `Closed`                |

**Indexes:** `{ guildId:1, mentorId:1, studentId:1, status:1 }`.

---

## 4.14 Mentor Spaces (`mentor_spaces`)

| Field           | Type     | Req | Notes                               |
|-----------------|----------|-----|-------------------------------------|
| mentorId        | string   | ✓   |                                     |
| channelId       | string   | ✓   | Discord channel/thread               |
| members         | string[] | ✓   | userIds                              |
| visibilityRoles | string[] |     | R4/R5                                |

**Indexes:** `{ guildId:1, mentorId:1 } (unique)`.

---

## 4.15 Formation Builder (B3)

### 4.15.1 March Types (`march_types`)

| Field        | Type   | Req | Notes                                     |
|--------------|--------|-----|-------------------------------------------|
| marchTypeId  | string | ✓   | Unique                                    |
| name         | string | ✓   | Display                                   |
| rules        | object | ✓   | Allocation rules (percent/count/fill/conditional) |
| notes        | string |     | Version notes/changelog                    |
| active       | bool   | ✓   |                                           |

**Indexes:** `{ guildId:1, marchTypeId:1 } (unique)`, `{ guildId:1, active:1 }`.

### 4.15.2 Saved Formations (`formations_saved`)

| Field        | Type   | Req | Notes                                                       |
|--------------|--------|-----|-------------------------------------------------------------|
| formationId  | string | ✓   | Unique                                                      |
| userId       | string | ✓   | Owner                                                       |
| marchTypeId  | string |     |                                                             |
| inputs       | object | ✓   | `{ castleRange, frontRow, backRow, marchSize }`             |
| allocations  | object | ✓   | Final troop numbers by category                             |
| isDefault    | bool   |     | One per user optional                                       |

**Indexes:** `{ guildId:1, userId:1 }`, partial `{ guildId:1, userId:1, isDefault:1 } WHERE isDefault=true`.

---

## 4.16 Alliance Communication & Alerts (Module C/H)

### 4.16.1 Messages (`comms_messages`) — *canonical broadcast record*

| Field                 | Type    | Req | Notes                                                                 |
|-----------------------|---------|-----|-----------------------------------------------------------------------|
| messageId             | string  | ✓   | Stable id/slug (PK within guild)                                     |
| type                  | enum    | ✓   | `announcement` \| `event` \| `operational` \| `emergency`             |
| source                | enum    | ✓   | `manual` \| `automation` \| `job`                                     |
| titleKey              | i18nKey |     | Localized title key (optional)                                       |
| bodyKey               | i18nKey |     | Localized body key (optional)                                        |
| bodySnapshot          | object  | ✓   | Final rendered payload(s) at send time (per-channel text)            |
| channels              | enum[]  | ✓   | e.g., `["discord_channel","discord_dm","push","ingame_mail"]`        |
| discordTargets        | object  |     | `{ channelId?, threadId?, webhookId? }`                               |
| audience              | object  | ✓   | Criteria snapshot (roles, locales, lists). IDs not required here     |
| audienceResolvedCount | int     |     | Count of resolved recipients at send time                             |
| audienceSampleUserIds | string[]|     | Up to 10 userIds for preview/audit                                    |
| eventId               | string  |     | Link to `events.eventId` when applicable                              |
| scheduledAt           | ISODate |     | For scheduled/recurring sends                                         |
| sentAt                | ISODate |     | First send time (set when status→sent)                                |
| status                | enum    | ✓   | `draft` \| `scheduled` \| `sent` \| `cancelled` \| `failed`           |
| idempotencyKey        | string  |     | For de-duping identical sends                                         |
| result                | object  |     | `{ delivered:int, failed:int, deferred:int, notes?:string }`          |

**Indexes:** `{ guildId:1, messageId:1 } (unique)`, `{ guildId:1, status:1, scheduledAt:1 }`, `{ guildId:1, eventId:1 }`, `{ guildId:1, idempotencyKey:1 } (sparse, unique)`.

### 4.16.2 Deliveries (`comms_deliveries`) — *per-recipient outcomes*

| Field           | Type    | Req | Notes                                                                 |
|-----------------|---------|-----|-----------------------------------------------------------------------|
| deliveryId      | string  | ✓   | PK (ULID/UUID)                                                       |
| messageId       | string  | ✓   | FK → `comms_messages.messageId`                                      |
| userId          | string  | ✓   | Recipient Discord ID                                                 |
| channel         | enum    | ✓   | `discord_dm` \| `discord_channel` \| `push` \| `ingame_mail`          |
| locale          | string  |     | Locale used for this delivery                                        |
| status          | enum    | ✓   | `pending` \| `sent` \| `failed` \| `deferred` \| `skipped`           |
| attemptCount    | int     | ✓   | Starts at 0; increment on retries                                    |
| lastError       | string  |     | Truncated reason (non-PII)                                           |
| ts              | ISODate | ✓   | Created/queued timestamp                                             |
| sentAt          | ISODate |     | When actually sent (status=sent)                                     |
| deferredUntil   | ISODate |     | Next allowed window (quiet hours)                                    |
| idempotencyKey  | string  | ✓   | `msg:{messageId}:user:{userId}:ch:{channel}`                         |
| deliveryLog     | object  |     | `{ fallbackUsed?:boolean, threadId?:string }`                        |

**Indexes:** `{ guildId:1, messageId:1, userId:1, channel:1 } (unique)`, `{ guildId:1, status:1, ts:1 }`, `{ guildId:1, idempotencyKey:1 } (unique)`.  
**TTL (optional):** `{ ts:1 }` with `expireAfterSeconds ≈ 15552000` (≈180 days) to align with Annexe 10.  
*Note:* store only IDs and minimal status (no raw bodies). DM-fallback sets `deliveryLog.fallbackUsed=true`.

---

## 4.17 Culture & Community (Module E)

### 4.17.1 Activities (`culture_activities`)

| Field     | Type     | Req | Notes                                       |
|-----------|----------|-----|---------------------------------------------|
| activityId| string   | ✓   | Unique                                      |
| type      | enum     | ✓   | `theme` \| `gallery` \| `quiz` \| `competition` … |
| titleKey  | i18nKey  | ✓   |                                             |
| descKey   | i18nKey  |     |                                             |
| status    | enum     | ✓   | `draft` \| `live` \| `closed` \| `archived` |
| managers  | string[] |     | User IDs                                    |
| schedule  | object   |     | `openUTC/closeUTC`                          |
| scope     | enum     | ✓   | `guild`                                     |
| params    | object   |     | Type-specific config                        |

**Indexes:** `{ guildId:1, type:1, status:1, createdAt:1 }`.

### 4.17.2 Submissions (`culture_submissions`)

| Field        | Type    | Req | Notes                                        |
|--------------|---------|-----|----------------------------------------------|
| submissionId | string  | ✓   | Unique                                       |
| activityId   | string  | ✓   | FK                                           |
| userId       | string  | ✓   | Author                                       |
| payload      | object  | ✓   | Media/answer refs (no raw PII)               |
| lang         | string  |     |                                              |
| pHash        | string  |     | Perceptual hash (hex 16–64)                  |
| flags        | object  |     | Moderation flags (e.g., `possibleDuplicate`) |
| votesCount   | int     | ✓   | Cache                                        |
| score        | number  |     | For rankings                                 |
| status       | enum    | ✓   | `submitted` \| `removed`                     |

**Indexes:** `{ guildId:1, activityId:1, userId:1 }`, `{ guildId:1, pHash:1 } (sparse)`, `{ guildId:1, status:1, createdAt:1 }`.

### 4.17.3 Votes (`culture_votes`)

| Field        | Type   | Req | Notes |
|--------------|--------|-----|-------|
| activityId   | string | ✓   |       |
| submissionId | string | ✓   |       |
| userId       | string | ✓   |       |
| value        | number | ✓   | `+1` (or scale) |
| at           | ISODate| ✓   |       |

**Indexes:** `{ guildId:1, activityId:1, submissionId:1, userId:1 } (unique)`, `{ guildId:1, activityId:1, at:1 }`.

### 4.17.4 Badge Catalog (`culture_badges`) — *catalog*

| Field          | Type    | Req | Notes            |
|----------------|---------|-----|------------------|
| badgeId        | string  | ✓   | Unique           |
| catalogVersion | string  | ✓   | semver           |
| nameKey        | i18nKey | ✓   |                  |
| descKey        | i18nKey | ✓   |                  |
| icon           | string  |     | URL/asset key    |
| criteria       | object  | ✓   | Rule JSON        |
| isSeasonal     | boolean | ✓   |                  |
| changeLog      | array   |     | `{ ts, actorId, note }` |

**Indexes:** `{ guildId:1, badgeId:1 }`, `{ guildId:1, catalogVersion:1 }`.

### 4.17.5 Badge Awards (`culture_badges_awarded`) — *awards*

| Field      | Type   | Req | Notes                           |
|------------|--------|-----|---------------------------------|
| awardId    | string | ✓   | Unique                          |
| badgeId    | string | ✓   | FK → catalog                    |
| toUserId   | string | ✓   | Recipient                       |
| awardedBy  | enum   | ✓   | `auto` \| `manual`              |
| season     | string |     | Optional                        |
| ts         | ISODate| ✓   |                                 |

**Indexes:** `{ guildId:1, toUserId:1, ts:-1 }`, `{ guildId:1, badgeId:1, ts:-1 }`.

### 4.17.6 Quiz Bank (`culture_quiz_bank`)

| Field        | Type     | Req | Notes                                                            |
|--------------|----------|-----|------------------------------------------------------------------|
| quizId       | string   | ✓   | Unique                                                           |
| titleKey     | string   | ✓   |                                                                  |
| topicTags    | string[] |     |                                                                  |
| ownerId      | string   | ✓   | Author                                                           |
| visibility   | enum     | ✓   | `private` \| `guild` \| `global`                                 |
| reviewStatus | enum     | ✓   | `draft` \| `in_review` \| `approved`                              |
| questions    | array    | ✓   | `{ qId, textKey, choices[], explanationKey?, localeVariants[] }` |

**Indexes:** `{ guildId:1, reviewStatus:1 }`, `{ guildId:1, topicTags:1 } (multi)`, `{ guildId:1, titleKey:1 }`.

### 4.17.7 Clubs (`culture_clubs`)

| Field         | Type     | Req | Notes                                   |
|---------------|----------|-----|-----------------------------------------|
| clubId        | string   | ✓   | Unique                                  |
| name          | string   | ✓   | 1..60                                   |
| ownerId       | string   | ✓   |                                         |
| memberIds     | string[] | ✓   |                                         |
| minMembers    | int      | ✓   | default **5** (3–50)                    |
| lastActiveAt  | ISODate  | ✓   |                                         |
| archivedAt    | ISODate  |     |                                         |
| settings      | object   |     | `{ autoArchiveDays:int (default 30) }`  |

**Indexes:** `{ guildId:1, archivedAt:1 }`, `{ guildId:1, lastActiveAt:1 }`, `{ guildId:1, name:1 }` (collation).

> *Deprecation note:* older `culture_posts`/`kudos` are superseded by activities/submissions/votes and badges. Migrate via Annexe 15.

---

## 4.18 Jobs (`jobs`)

| Field             | Type   | Req | Notes                                                      |
|-------------------|--------|-----|------------------------------------------------------------|
| jobId             | string | ✓   |                                                            |
| type              | string | ✓   | e.g., `reminder.send`, `comms.send`                        |
| payload           | object | ✓   | Includes `idempotencyKey` and optional `runAtBucket`       |
| priority          | int    | ✓   | 1 (high) … 5 (low)                                         |
| runAt             | ISODate| ✓   |                                                            |
| attempts          | int    | ✓   | 0..N                                                        |
| lastError         | string |     |                                                            |
| state             | enum   | ✓   | `queued` \| `processing` \| `done` \| `failed` \| `dlq`     |

**Indexes:**  
`{ guildId:1, state:1, runAt:1 }`,  
`{ guildId:1, type:1, "payload.idempotencyKey":1, "payload.runAtBucket":1 }` (unique — dedupe per Annexe 7).

---

## 4.19 Audit Logs (`audit_logs`)

| Field   | Type   | Req | Notes                                      |
|---------|--------|-----|--------------------------------------------|
| logId   | string | ✓   |                                            |
| module  | string | ✓   | A/E/B… or Annexe code                      |
| action  | string | ✓   | e.g., `EVENT.PUBLISH`                      |
| actorId | string |     | Omit for system jobs                       |
| targetId| string |     | eventId/shieldId/etc                       |
| details | object |     | reason codes, diffs                        |
| ts      | ISODate| ✓   |                                            |

**Indexes:** `{ guildId:1, module:1, ts:1 }`, `{ guildId:1, targetId:1 }`.

---

## 4.20 Optimistic Concurrency (write pattern)

- Include **version** in all update requests (and in modals/forms).
- **Mongo CAS example:**
```js
updateOne(
  { _id, guildId, version },
  { $set: { ...fields, updatedAt: now }, $inc: { version: 1 } }
)
```
- If `matchedCount=0` ⇒ return **409 CONFLICT** with latest snapshot.
- Optional index: `{ guildId:1, _id:1, version:1 }`.

---

## 4.21 Performance & Index Guidelines

- Prefer **compound indexes** that include `guildId`.
- For time-ranged lists, index `{ guildId:1, status:1, startUTC:1 }` (events), `{ guildId:1, ts:1 }` (deliveries).
- Use **partial indexes** for booleans (e.g., `{ guildId:1, isDefault:1 } WHERE isDefault=true`).
- Keep arrays **bounded**; move per-recipient delivery state to `comms_deliveries`.

---

## 4.22 Retention & TTL (align with Annexe 10)

- `comms_deliveries`: TTL **30–180 days** per ops need.
- `culture_submissions` & `culture_votes`: **180 days** then archive/soft-delete.
- `audit_logs`: **6–12 months** (configurable).
- `jobs`: completed **7–30 days**; failed/dlq per ops.
- `events`/`event_rsvps`/`attendance`: at least the **rolling period** you want reports for (e.g., **12 months**).
- `pHash` is non-PII; retain alongside submission retention.

---

## 4.23 Cross-References

- Module A: CAS/versioning, Maintenance & Feature Flags.  
- Module B3: March types & saved formations (§4.15).  
- Module B7 (Events Core): Events, RSVPs, Attendance (§§4.4–4.7).  
- Module D (i18n): i18n keys stored in text fields marked `i18nKey`.  
- Module E (Culture): Culture collections (§4.17).  
- Module C/H (Comms & Alerts): Communications collections (§4.16).  
- Annexe 5: SDKs, Discord intents/scopes; storage drivers.  
- Annexe 6: Policy Guard decisions logged via `audit_logs`.  
- Annexe 7: Jobs, idempotency, maintenance gates.  
- Annexe 8: Telemetry naming; drift/conflict/delivery metrics.  
- Annexe 10: Privacy & retention guidance.  
- Annexe 14: API headers `X-Guild-ID`, `If-Match`, error families.  
- Annexe 15: Data migration & seeding (e.g., culture posts → activities).

---

## 4.24 Theming (per guild) — `guild_theme_configs`

> **Purpose:** allow each guild to pick a **theme key** from the canonical palette and optionally provide **CSS variable overrides** (minimal, last-resort). Used by the PWA for live theming and by the Discord bot when mapping embed colors.

| Field         | Type    | Req | Notes                                                                 |
|---------------|---------|-----|-----------------------------------------------------------------------|
| configId      | string  | ✓   | PK (ULID/UUID)                                                        |
| guildId       | string  | ✓   | Discord guild ID                                                      |
| themeKey      | string  | ✓   | e.g., `default`, `midnight` (must exist in `configs/tokens/palette.json`) |
| overrides     | object  |     | `Record<string,string>`; CSS var name → value (e.g., `"--role-primary-500":"#4F46E5"`) |
| updatedAt     | ISODate | ✓   | ISO timestamp                                                         |
| updatedBy     | string  |     | Discord user id or `system`                                          |
| version       | int     | ✓   | For CAS/ETag                                                          |

**Constraints & validation:**  
- `themeKey` ∈ keys of `palette.themes`.  
- `overrides` keys must match `/^--[a-z0-9-]+$/` and values must be valid CSS colors or token values.  
- Keep overrides **small**; prefer editing source themes in `palette.json` for broad changes.

**Indexes:**  
- `{ guildId:1 } (unique)` — one active config per guild.  
- `{ themeKey:1 }` — optional, for analytics.  
- `{ updatedAt:-1 }` — for recency listing.

**Sample JSON Schema (abridged):**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "GuildThemeConfig",
  "type": "object",
  "required": ["configId","guildId","themeKey","updatedAt","version"],
  "properties": {
    "configId": { "type": "string" },
    "guildId": { "type": "string" },
    "themeKey": { "type": "string", "minLength": 1 },
    "overrides": {
      "type": "object",
      "additionalProperties": { "type": "string" },
      "propertyNames": { "pattern": "^--[a-z0-9-]+$" }
    },
    "updatedAt": { "type": "string", "format": "date-time" },
    "updatedBy": { "type": "string" },
    "version": { "type": "integer", "minimum": 0 }
  }
}
```

**Resolution flow (PWA & Bot):**
1. Look up `guild_theme_configs` by `guildId`.  
2. `themeKey = doc?.themeKey ?? "default"`.  
3. Apply `overrides` (if any) to the computed CSS var set.  
4. For Discord embeds, call `embedColorFor(themeKey, role, shade)` (Annexe 17); overrides for role shades may be applied prior to hex selection.

**API shape (example):**
```json
{
  "configId": "gth_01HXXX...",
  "guildId": "123456789012345678",
  "themeKey": "midnight",
  "overrides": {
    "--role-primary-500": "#6D28D9"
  },
  "updatedAt": "2025-08-17T12:00:00.000Z",
  "updatedBy": "987654321098765432",
  "version": 3
}
```

---

## Revision Notes
- **2025-08-15:** Major consolidation pass: comms_messages/comms_deliveries; activities/submissions/votes; march types & formations; flags and maintenance clarified; dedupe indexes added.
- **2025-08-17:** Added §4.24 **`guild_theme_configs`** for per-guild theming (PWA + Discord), including indexes, validation, and resolution flow.
