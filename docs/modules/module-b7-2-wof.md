# Module B.7.2 — War of Frontiers (Sub-module of Events Core) — ✅ **LOCKED**

## B7.2.1 Purpose & Context

**War of Frontiers (WoF)** is a cross-realm, multi-stage tower-conquest tournament alternating **Defence** and **Attack** phases (each **24h**). Alliances field up to **70** players across **7 towers (A–G, 10 per tower)**.

- **Win condition (tournament):** crowns awarded per round; most crowns across stages wins.
- **Scoring (per match):** **+1 point per tile** cleared; bonus for capturing an enemy **A tower (Main Castle)**.
- **Model:** each phase/day is an **event instance** linked to a parent tournament via `tournamentId`, inheriting B7 Core lifecycle & reporting.

---

## B7.2.2 Default Template (inherits B7 Core)

**Template name:** `War of Frontiers — Phase`

**Defaults**

- `defaultDuration`: **24:00**
- `defaultVisibilityScope`: **alliance**
- `publishToDiscordScheduler`: **true** (discoverability for alliance-wide phases)
- `defaultRSVPOptions`: **Going / Maybe / No**
- `defaultNotificationPattern`: **1h, 30m, 15m, start** (plus phase-specific logic below)
- **params (WoF specific):**
  - `phaseType: "defence" | "attack"`
  - `stage: "group" | "crown"`
  - `roundIndex: int (1..N)`
  - `opponents: { leftRealmName, rightRealmName, theirCrownTotals? }`
  - `towers: ["A","B","C","D","E","F","G"]`
  - `towerCapacity: 10`
  - `attackSlotsDefault (UTC): ["01:00-02:00","10:00-11:00","15:00-16:00","19:00-20:00","22:00-23:00"]`
  - `defenceConfirmAlerts: "T-6h, T-1h if not confirmed"`
  - `noShowExclusion: true` (exclude from next defence by default; leaders can override)

---

## B7.2.3 Tournament Structure

- **Group Stage:** 3 **Attack** rounds, each preceded by a **Defence** phase.
- **Crown Stage:** 3 **Attack** rounds, each preceded by a **Defence** phase.
- Each phase day is a separate **event instance** linked via `tournamentId`, `stage`, and `roundIndex`.

---

## B7.2.4 Map & Tower Mechanics (Alliance view)

- We spawn in **blue** (bottom); opponents on **left (red)** and **right (yellow)**.
- Towers **A–G** per side; **A** is Main Castle (bonus on capture).
- **Attack rules:** only **adjacent** towers can be attacked; a tower is captured when **all tiles** inside are cleared.

---

## B7.2.5 Defence Phase (24h)

**Requirements**

- Players must **send a defence march** to their assigned tower to be **eligible to attack next phase**.

**Assignments**

- Leaders assign players to towers **A–G** (max **10** each).
- **Lock rule:** when Defence ends, assignments **lock**; no moves during Attack.

**Readiness tracking**

- Players click **“Confirm March Sent”** (button) once done.
- System stores `defenceConfirmedAt` (per player & phase).
- Alerts if not confirmed:
  - **T-6h:** gentle reminder
  - **T-1h:** urgent reminder\
    *Alerts stop immediately after confirmation.*

**Opponents visible**

- During Defence, upcoming **left/right** opponents are visible in the phase panel.

---

## B7.2.6 Attack Phase (24h)

**Attack Time-Slots (hourly)**

- Defaults (UTC): **01–02, 10–11, 15–16, 19–20, 22–23** (guild-configurable).
- Each slot has a **Time-Slot Leader**.

**Player behavior**

- Each participant **selects one slot** (stored to profile preference for reuse).
- Must be online **before slot start**; can change slot if availability changes.
- Can flag **“Attacks Already Completed”** to suppress remaining slot reminders for that phase.

**Process**

- Within a tower: tiles revealed front-to-back. First hits discover strength; leaders assign attackers; **all tiles cleared = capture**.

**Reminders (per player, for their slot)**

- **T-1h, T-30m, T-15m, Start.**
- Quiet Hours apply; **Start** may be critical per guild config.

**No cap per slot**

- There is **no maximum per slot**; aim is convenience/coverage, not balancing.

---

## B7.2.7 No-Show Handling

- Time-Slot Leaders and Event Leader can mark players **No-Show** for the attack phase.
- If `noShowExclusion=true`, those players are **auto-excluded from next Defence tower assignment** (overrideable by Event Leader/R4/R5).
- No-show flags are written to **profile history** (retention per Annexe 10).

---

## B7.2.8 Scoring & Progression

- **+1 point per tile** cleared.
- **Bonus** for capturing enemy **A** tower.
- **Crowns** awarded per round; totals rank alliances across the tournament.

---

## B7.2.9 Data Model Extensions (Annexe 4 alignment)

**Event `params` for a WoF phase**

```json
{
  "tournamentId": "string",
  "stage": "group|crown",
  "roundIndex": 1,
  "phaseType": "defence|attack",
  "opponents": { "left": "string", "right": "string", "leftCrowns?": 0, "rightCrowns?": 0 },
  "towers": ["A","B","C","D","E","F","G"],
  "towerCapacity": 10,
  "towerAssignments": { "A": ["userId", "..."], "...": [] },
  "defenceConfirmed": { "userId": "ISO8601", "...": "..." },
  "attackSlots": ["01:00-02:00","10:00-11:00","15:00-16:00","19:00-20:00","22:00-23:00"],
  "slotLeads": { "01:00-02:00": "userId", "...": "..." },
  "slotChoices": { "userId": "01:00-02:00", "...": "..." },
  "attackedEarly": ["userId", "..."],
  "noShows": ["userId", "..."],
  "tilePoints": 0,
  "bonusMainCaptured": false
}
```

**Profile fields (Module B4)**

- `wofPreferredSlot: string` (one of the configured slots).
- **No persistent tower assignment** in profile (only per-phase).

> All event docs include `{ guildId, version, createdAt, updatedAt }`.

---

## B7.2.10 Roles & Permissions (Policy Guard; Annexe 6)

- **Create/Edit/Publish** WoF phases: **R4/R5** (owner can be delegated).
- **Tower assignments (Defence):** Event Leader/**R4/R5**.
- **Time-Slot Leads:** assignable by Event Leader/R4/R5; can mark attendance within their slot and report absentees.
- **Defence Lock** is enforced at **Attack start** (no tower moves during Attack).

---

## B7.2.11 Notifications & Alerts

**Defence phase**

- **T-6h / T-1h** defence confirmation alerts for players who haven’t confirmed.
- Confirmation click **suppresses** further defence alerts for that player.

**Attack phase**

- Slot ladder: **T-1h / T-30m / T-15m / Start**.
- Players who flagged **“attacked early”** skip remaining slot alerts.

**Delivery**

- **DM first**; DM-fallback to **scoped event thread** ping once if DMs fail (see Module A §A7.1 & Annexe 5).
- **Quiet Hours** apply except critical alerts as configured.

---

## B7.2.12 Attendance (uses B7.14 core)

- **Per-slot bulk marking** (Time-Slot Leader UI): shortcuts **A**=Present, **L**=Late, **X**=No-Show, **I**=Excused; range-select; undo.
- **Auto-check-in** may mark Present if a player interacts with the event thread during their slot window.
- Attendance writes to **event instance + profile history**.

---

## B7.2.13 Reports & End-of-Phase Summary

**Auto-generated at phase end (Attack):**

- Towers captured; tiles cleared.
- Attendance per slot; **no-shows list**.
- Crown/point deltas (if available from manual entry).
- Delivered to **Event Leader** and **Time-Slot Leaders**; optional thread post.

**Leader dashboards**

- Defence roster (who confirmed / who didn’t).
- Tower fill levels and violations.
- Slot participation **heatmap**.

---

## B7.2.14 Reliability & Concurrency

- **CAS** on `towerAssignments`, `defenceConfirmed`, `slotChoices`, and `noShows`. Conflicts trigger **Refresh & Reapply** (Annexe 3).
- **Idempotent** reminder jobs with jitter; **Maintenance Mode** honors global pause (Module A).
- **Drift check** for mirrored Discord Scheduled Events (Annexe 5 note).

---

## B7.2.15 Observability (Annexe 8)

**Logs**

```
module=B.7.2 action=defence_confirm|tower_assign|slot_assign|slot_lead_set|attendance_mark result=allow|deny eventId=<id> userId=<id>
```

**Metrics**

- `wof_defence_confirm_total`
- `wof_tower_fill_ratio{tower}`
- `wof_slot_signups_total{slot}`
- `wof_no_shows_total`
- `am_conflicts_total{module="B.7.2"}`

**Alerts**

- **Underfilled towers** at **T-1h** of Defence.
- **High no-show rate** (>X%) per Attack phase.

---

## B7.2.16 UI & Commands

**Discord (button-first; Annexe 3)**

*Phase Panel (Defence)*

- **Assign Towers** (owner/R4/R5) · **Confirm March Sent** (players) · **View Opponents** · **Lock Assignments (at end)**

*Phase Panel (Attack)*

- **Pick/Change My Slot** · **I’ve Attacked Already** · **Set Slot Leader** (owner/R4/R5) · **Open Attendance (This Slot)**

*Leader panel*

- **Tower Roster** · **Defence Confirmations** · **Slot Attendance** · **End-of-Phase Summary**

**Slash (minimal)**

```
/wof assign <tower A..G> <@user>             (R4+)
/wof slot set <@user> <slot>                 (R4+)
/wof slot lead <slot> <@user>                (R4+)
/wof confirm-defence <@user>                 (R4+ manual override)
/wof report phase <eventId>                  (R4+)
/wof noshow add|remove <@user>               (slot lead / R4+)
```

**Web/PWA**

- **Tournament view (parent)** → list of phases with status.
- **Phase details:** Towers, Defence confirmations, Slots & leaders, Attendance, Summary.
- **Drag-and-drop** tower assignment (Defence only; locks at phase end).

---

## B7.2.17 Privacy, i18n, Accessibility

- **Privacy:** store Discord IDs and gameplay metadata only; retention per Annexe 10.
- **i18n:** all strings via Module D; times in user locale/TZ; ICU plurals for reminders.
- **Accessibility:** keyboardable bulk grid; clear labels/emojis; no color-only signals.

---

## B7.2.18 Integrations & Defaults

- **Profiles (B4):** persists `wofPreferredSlot`; no persistent tower assignment.
- **Attendance (B7.14):** shared states and exports.
- **Events Core (B7):** lifecycle, scheduler mirroring, DM fallback, audience preview.
- **Annexe 16:** ensures WoF channels/threads are permissioned for alliance-wide visibility.

---

## B7.2.19 Revision & Δ Notes

- **2025-08-15:** **LOCKED** initial version aligned to B7 Core. Added defence confirmation alerts (T-6h/T-1h), **no tower reassignment during Attack**, slot reminders, **no slot caps**, no-show → next-defence exclusion rule, end-of-phase summaries, and full observability hooks.
- **Removed** all “speed/speeder” concepts (not applicable to WoF).

---

## Annexe 4 — Schema Deltas (for your master)

**Add/extend:**

- `events.params` (WoF)
  - `tournamentId: string`
  - `stage: "group"|"crown"`
  - `roundIndex: number`
  - `phaseType: "defence"|"attack"`
  - `opponents: { left: string, right: string, leftCrowns?: number, rightCrowns?: number }`
  - `towerAssignments: Record<"A"|"B"|"C"|"D"|"E"|"F"|"G", UserId[]>`
  - `defenceConfirmed: Record<UserId, ISODateString>`
  - `attackSlots: string[]`
  - `slotLeads: Record<string, UserId>`
  - `slotChoices: Record<UserId, string>`
  - `attackedEarly: UserId[]`
  - `noShows: UserId[]`
  - `tilePoints: number`
  - `bonusMainCaptured: boolean`
- `profiles`
  - `wofPreferredSlot?: string`
