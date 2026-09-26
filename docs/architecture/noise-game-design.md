# UA High Defense System — Noise Game Design

Status: **Superseded core mechanics, 2026-09-24. Open questions resolved, 2026-09-24 (same day).** This revision replaces the game-loop mechanics (§3) that shipped in the first Stage 1 build (`src/features/noise-defense/`, built 2026-09-24 per the prior version of this doc) with Owen's own original "Villain Pressure" design. See §0a for exactly what's replaced vs. kept, and §0b for Owen's answers to every open question this revision originally raised. This is a design-only revision — no application code changed (§11).
Scope: Classroom Command Center (`/display` + `/control`), local-first, single classroom LAN.
Date: original design 2026-09-23, Stage 1 built 2026-09-24, this mechanics revision 2026-09-24.

---

## 0. One-paragraph summary

Five defense towers spelling **N‑O‑I‑S‑E** stand on `/display`, one **active** at a time (front to back). While a session runs, the display machine's mic (M1) is sampled continuously; noise above the currently-selected **voice protocol's** threshold fills a **Villain Pressure** meter — faster the louder it gets — and quiet drains it. At 100% pressure, a **villain strike** hits the active tower for 25 damage and pressure resets to 0. Sustained quiet well below the threshold slowly heals the active tower; a tower that hits 0 HP crumbles and stops being interactive, handing off "active" to the next tower in sequence. A **Comms Jammer** lets the teacher pause audio analysis for a legitimate interruption without losing any progress; a **manual break/repair** override lets the teacher hand-adjust the active tower independent of the mic entirely. Speech bubbles from a small cast of hero/villain characters narrate every state change. An opt-in, off-by-default **penalty formula** (`fallen towers × multiplier = a teacher-defined consequence`) can feed a class-level (never per-student) consequence tally, shown on the TV or kept teacher-only. **"Hero Academy"** is the first theme pack — original geometric art, fresh writing, swappable like any skin.

---

## 0a. What this revision replaces, and what it keeps

The prior version of this document (and the Stage 1 code it specified) built a **continuous, multi-band HP-drain engine**: four hysteresis-bounded bands (Calm/Caution/Danger/Critical), each with its own dB offset above baseline, where sustained time in Danger/Critical bled a fixed **4 or 10 HP per second** off the front-most tower for as long as the room stayed loud. That entire damage model is now **legacy and superseded**. In its place: a single **Villain Pressure meter (0–100%)** that fills proportional to how far the level sits above one active threshold, and damage happens as one bounded, discrete **25-HP strike** the instant pressure caps out, then pressure resets to zero and starts over. The game no longer bleeds HP continuously while a room is loud — it builds tension toward a countable event.

| # | Legacy (superseded) | Replaced by |
|---|---|---|
| 1 | 4 bands (Calm/Caution/Danger/Critical), 3 separate dB offsets, hysteresis-margin band-stepping | One active threshold (set by the current **voice protocol**), a single fill/drain direction around it, small hysteresis margin only to stop flicker at the boundary (§3.2) |
| 2 | Continuous per-second HP drain (4 HP/s Danger, 10 HP/s Critical) while sustained loud | **Villain Pressure** (0–100%) fills proportional to excess-above-threshold; at 100%, one **25-HP strike**, then pressure resets to 0 (§3.1–3.3) |
| 3 | Screen-shake/flash tied to *sustained time in* a band | Effects tied to **discrete events** — Warning (pressure nearing cap), Strike, Tower Fall — not to how long the room stays loud (§4.3) |
| 4 | `dose`/`aboveDangerSeconds` naming, generic to any band | Same leaky-bucket-plus-dwell *mechanism*, renamed and re-scoped as the Pressure meter's own fill logic — see §0a row 6, this is carried forward, not replaced |
| 5 | `MANUAL_OVERRIDE_AMOUNT = 20`, a partial nudge, same button for "some damage" or "some heal" | Two named actions: **Manual Break** (one strike's worth, 25 HP) and **Manual Repair** (full heal to 100), matching the strike/heal-cap language of the new mechanic (§3.6) |
| 6 | Voice-level manual widget (`src/lib/noiseTowers.ts`'s `VoiceLevel`, already flagged for eventual retirement, untouched) partly duplicated by this game's own ad-hoc sensitivity knob | Fully and explicitly superseded **for this game** by three named **Voice Protocols** — Stealth / Patrol / Combat — each setting the active threshold (§3.4). (The legacy widget itself is still untouched code, per the original §8 decision #1 below — this only retires the *concept* inside the new game, not the old file.) |
| 7 | Penalty formula deferred wholesale to "Stage 2," no shape specified | Fully specified now: opt-in, off by default, configurable multiplier/unit/visibility/wording (§5.3) |
| 8 | Generic tower call-signs (Nomu Watch, Outpost, Ingenium Gate, Signal Spire, Endeavor Line) and the show catchphrase "PLUS ULTRA" as a literal tagline | Named Guardians (Deku, Uraraka, Todoroki, Iida, Bakugo) with fresh, non-catchphrase original flavor text — see the theme pack (§9) and `docs/design/noise-game/hero-academy-theme-pack.md` |

**Kept, unchanged in spirit:**

- §2 (measurement approach: raw mic constraints, RMS-over-window, calibration-against-baseline) — this is orthogonal to the damage model and stays exactly as designed.
- The leaky-bucket-integrator-plus-dwell-time *mechanism* itself (§2.4's reasoning) — it's carried forward as the Pressure meter's own fill math, not thrown away; only its consequence (continuous drain vs. one discrete strike) changed.
- Front-most-damage / back-most-repair as a *sequencing* rule — reframed as an explicit "active tower" pointer (N→O→I→S→E) rather than a per-tick scan, since Pressure only ever targets one tower at a time (§3.5).
- Mic-denied vs. teacher-pause as distinct, differently-styled states (§3.7) — Comms Jammer is the teacher-pause state's new name and job for this specific game, not a new third thing.
- Docked-HUD-by-default plus momentary full-board takeover for big moments (§4.1).
- Calm Mode: mute the theatrics, keep the logic running (§4.4) — now also the explicit spec for every mockup's "calm" variant (§8).
- Procedural SFX via the shared `AudioContext` singleton (§6).
- Class-level-only data, no per-student anything, anywhere (§5.3, §7).
- The theme-is-just-data architecture (`theme/types.ts`) — kept and extended, not rebuilt (§9).
- §1 (legacy Noise Tower Defense inventory/retirement decision), §7's later-stage scoping (per-period profiles, cross-device sync, iPad mic, AI quotes) — unaffected by this revision, reproduced below unchanged except for renumbering.

---

## 0b. Owen's answers to the open questions (2026-09-24)

Every open question the prior revision of this doc raised is now resolved. Answers are folded into their own sections below (cross-referenced here); this section is the single record of the actual decisions.

1. **All-towers-down behavior — confirmed.** Pressure freezes until a teacher repairs a tower (§3.5), exactly as designed. Two additions: a clear, distinctly-named **"Regroup"** state on `/display` (not just a generic "all down" banner — see §4.2/§4.3), and a one-tap **"Restore all"** control on `/control` (§3.6/§5.1) that repairs every tower to full HP in a single action, as a faster alternative to repairing towers one at a time.
2. **Numeric tuning — confirmed as-is for this build.** The defaults in §3.2/§3.3 (25 HP strike, 2s dwell, 2s/1.5s attack/decay, 6 dB recovery margin, 5s recovery grace, 3 HP/s heal, the three protocol dB offsets) ship as-is, validated only via the teacher-only live tuning readout (§5.2). Real-room tuning against the actual classroom mic/space happens after 2026-10-08 (Owen is away from the physical classroom until then — same constraint already tracked for the Samsung TV verification, see [[classroom-command-center-status]]). Don't treat these numbers as final before then.
3. **Penalty formula — deferred.** Fully specified as a design (§5.3) but explicitly **not part of this build** — it's a later implementation stage. Build the rest of the mechanics revision without wiring the penalty formula's UI/logic.
4. **Theme pack — single built-in theme, no picker, confirmed.** Hero Academy (§9) ships as the only theme for now. No in-app theme registry/picker UI in this build — the theme-is-just-data architecture stays ready for one later, but building the picker itself is out of scope here.
5. **Mission-complete SFX tiering — confirmed.** A zero-strike ("clean") mission gets the bigger `playVictoryFanfare` cue; an ordinary completion (any strikes occurred) gets the standard `playAllTowersRestoredSfx` cue (§6).
6. **Tower order — confirmed fixed.** N→O→I→S→E, not configurable (§3.5).
7. **Reviving a fallen tower — confirmed, with two more paths named.** Manual Repair targeted at a specific fallen tower (§3.6) is one revive path; the new one-tap **"Restore all"** (answer #1 above) is a second; the existing per-period/weekly reset (§5.5/§7) — which returns every tower to full HP as part of ending a session or a new period starting — is the third. These three are the *only* ways a fallen tower returns to play; there is no automatic revive.

---

## 1. Existing noise tracker — inventory and recommendation

*(Unchanged from the prior revision — reproduced for continuity. This section is about `src/lib/noiseTowers.ts` and friends, the old teacher-driven manual widget, not the mic-driven game this doc designs.)*

### 1.1 What's actually there today

The legacy feature is **"Noise Tower Defense,"** built in Phase 7A–7D (`docs/status/phase-7a-7b-noise-tracker-foundation.md`, `docs/status/phase-7c-7d-noise-tower-defense.md`): `src/lib/noiseTowers.ts` (pure logic), `src/data/types.ts` (`NoiseTrackerId`, `VoiceLevel`, tower/tracker state), `src/store/boardStore.ts` (zustand actions), `src/board/NoiseControlPanel.tsx` / `src/features/teacher-dock/toolPanels/NoiseToolPanel.tsx` (teacher panel), `src/widgets/NoiseStatusCard.tsx` (a full comic-ish tower HUD card, never rendered anywhere).

It has no microphone anywhere, is entirely teacher-driven (the only functions that change tower HP are never called from any UI), doesn't render on `/display` at all, is keyed to a fixed three-tracker model (homeroom/math/reading) with no per-period concept, and isn't part of the sync protocol. It is, in short, a manual traffic-light widget that reuses tower/letter/HP framing, sitting on `/control` only, wired to nothing.

### 1.2 Recommendation: replace, don't extend — with two pieces of prior art carried forward deliberately

Build the new game as a **separate feature area** (which is exactly what Stage 1 did — `src/features/noise-defense/`), and let the old Noise Tower Defense either retire or continue existing unchanged as the simple manual policy tool it always was. Two rules from the old design are worth keeping as *rules*, not code: **front-line-absorbs-the-hit sequencing** (now this doc's "active tower," §3.5) and **a destroyed tower having a class-level time consequence, with a full rebuild able to partially forgive it** (now this doc's penalty formula, §5.3).

---

## 2. Measurement approach: current best practice for browser-based classroom noise

*(Unchanged from the prior revision.)*

### 2.1 Raw mic input, not browser-processed input

`getUserMedia`'s audio constraints turn off all three standard processing features (`echoCancellation`, `noiseSuppression`, `autoGainControl`) — each one is designed to actively hide or flatten exactly the "room is generally loud" signal this feature exists to detect.

### 2.2 RMS over a rolling window, not instantaneous peak

`AnalyserNode.getFloatTimeDomainData()`, RMS per buffer, `fftSize` 2048. An optional later upgrade: a `BiquadFilterNode` bandpass (~300 Hz–3 kHz, the speech band) to reduce HVAC/rumble contribution — not required for the current build.

### 2.3 Calibration against a quiet baseline

Every threshold in this game — including every voice protocol's threshold and the recovery threshold (§3.4) — is defined **relative to a measured quiet baseline for this room/mic/gain setting, never an absolute dBFS constant.** Calibration flow, unchanged: teacher taps "Calibrate Quiet" on `/control` at the start of a period (room genuinely quiet); the display samples RMS for ~5–10 seconds (currently 7s, `CALIBRATION_DURATION_MS`); that average becomes `baselineDb`. Re-run per class period, not once per day.

### 2.4 Avoiding false spikes: a sustained-noise "dose," not instantaneous threshold-crossing

This reasoning is exactly what the new Pressure meter's fill math is built on (§3.2) — it's carried forward as a mechanism, just repurposed. A dropped book or chair scrape is loud but very short and largely silent immediately before/after; a genuinely noisy class is loud continuously, for many seconds. So: **pressure is driven by a leaky-bucket integrator of excess-above-threshold over time, gated by a minimum dwell requirement, never by any single sample or any single tick.** Peak/instantaneous level is tracked only for the teacher's own tuning readout, never used to fill pressure directly.

---

## 3. Game engine design

### 3.1 Tick rates (two, deliberately decoupled — unchanged)

- **Sampling tick (~4 Hz / every ~250 ms):** pull the analyser buffer, compute RMS, feed the pressure integrator.
- **Game tick (1 Hz / every second):** evaluate pressure against its cap, apply strikes/heals, evaluate speech-bubble/effect transitions. Effects fire on *transitions* (crossing into Warning, a Strike itself, a tower falling), each with its own cooldown, not on every tick of a sustained state.

### 3.2 Villain Pressure — the core mechanic

One meter, `pressure ∈ [0, 100]`, replacing the old 4-band ladder entirely.

- **Current threshold** = the active voice protocol's `thresholdOffsetDb` (§3.4), itself an offset above the calibrated baseline (§2.3) — never a fixed absolute level.
- **Above threshold:** pressure rises, proportional to *how far* above threshold the level is (excess dB), not just a binary over/under flag — a room 15 dB over threshold fills the meter markedly faster than a room 2 dB over. Concretely (carrying the leaky-bucket shape forward from the old `dose` math): `pressure += (excessDb * dt) / pressureAttackTauSeconds`, clamped to `[0, 100]`.
- **At/below threshold:** pressure drains: `pressure *= exp(-dt / pressureDecayTauSeconds)`.
- **Dwell guard (carries forward §2.4's anti-transient reasoning):** pressure only starts accumulating once the level has been continuously above threshold for `pressureDwellSeconds` (default 2s) — a rolling counter that resets the instant the level drops back at/under threshold. A single clap or dropped book contributes at most a fraction of a second of excess, which the dwell guard and the attack time-constant both damp to essentially nothing; it takes real, sustained loudness to move the meter, exactly as the old dose design intended, just serving a discrete-strike outcome instead of a continuous-drain one.
- **Strike:** the instant `pressure` reaches 100, a **villain strike** fires: the active tower (§3.5) takes a flat **25 damage**, and pressure resets to 0 immediately (not a gradual reset). This is a bounded, countable event — never a bleed.
- **Warning:** when pressure crosses **75%** on the way up (a one-shot transition, re-armed only once pressure falls back under 50%), fire a "warning" speech-bubble event (§3.8) — a heads-up before the strike actually lands, not a damage event itself.

Default constants (confirmed to ship as-is for this build, §0b #2 — validated only via the live tuning readout in §5.2 until a real-room tuning pass after 2026-10-08):

| Constant | Default | Why |
|---|---|---|
| `strikeDamage` | 25 | Fixed per the mechanic spec — 4 strikes fell a tower from full |
| `pressureDwellSeconds` | 2s | Anti-transient guard; a clap/scrape can't sustain this |
| `pressureAttackTauSeconds` | 2s | How fast pressure climbs once dwell clears, scaled by excess dB |
| `pressureDecayTauSeconds` | 1.5s | Slightly faster decay than rise, so the meter doesn't stay "hot" long after quieting |
| `warningThresholdPct` | 75% (re-arm below 50%) | Gives a beat of "it's building" before the strike lands |

### 3.3 Recovery — healing, distinct from pressure drain

Pressure draining (§3.2) is not the same thing as the active tower healing — a room merely *not accumulating pressure* isn't the same as the room being genuinely quiet enough to reward.

- **Recovery threshold** = `max(0, currentThresholdOffsetDb − recoveryMarginDb)`, default `recoveryMarginDb = 6`. This sits *below* whichever protocol threshold is active — meaningfully quieter than "not building pressure," not just "at the line."
- The level must sit **at/below the recovery threshold, continuously, for `recoveryGraceSeconds`** (default 5s) before healing begins — its own dwell-style guard, independent of the pressure dwell.
- Once satisfied, the **active tower** heals at `healPerSecond` (default 3 HP/s ⇒ ~33s to fully rebuild from 0), **capped at 100 (maxHp)**. Healing stops the instant the level rises back above the recovery threshold; the grace timer resets from zero on the next qualifying quiet stretch (no partial credit carried over, matching the old design's anti-gaming intent).
- Two distinct speech-bubble moments here (§3.8): **recovery beginning** (the grace period was just satisfied and healing starts) and **recovery complete** (the active tower just hit full HP) — these are different beats worth celebrating separately, not one generic "healing" event.
- **A fallen (0 HP, crumbled) tower does not auto-heal.** Recovery only ever applies to the current *active* tower (§3.5) — once a tower crumbles, it's inert until a teacher explicitly brings it back via Manual Repair (§3.6). This is a deliberate reading of "the next tower in sequence becomes active" (§3.5): a fallen tower has left play, not just gone quiet.

### 3.4 Voice protocols

Three named modes, teacher-selected on `/control`, each setting the single active pressure-fill threshold (`thresholdOffsetDb`) — this fully replaces the old 3-band-offset ladder and, for this game, replaces the legacy manual voice-level widget's job entirely (§0a row 6). All values are offsets above the calibrated baseline (§2.3), never absolute:

| Protocol | Meaning | Default `thresholdOffsetDb` |
|---|---|---|
| **Stealth** | Silent — independent work, testing-adjacent moments | +4 dB |
| **Patrol** | Whisper — partner work, quiet transitions | +9 dB |
| **Combat** | Normal discussion — active class discussion, group work | +16 dB |

Switching protocol is instant (no recalibration needed — only the threshold offset changes, the baseline itself doesn't move) and fires a **protocol change** speech bubble (§3.8). Protocol is independent of session status: a teacher can switch protocol while `running`, while jammed, or while paused.

### 3.5 Active tower sequencing and decay

Fixed order **N → O → I → S → E**, front to back — carried forward from the legacy front-most/back-most rule (§1.2), now expressed as an explicit pointer rather than a per-tick scan, since Pressure only ever targets exactly one tower:

- **Active tower** = the first tower in sequence with `hp > 0`.
- A **strike** always damages the active tower. A **manual break** (§3.6) does the same.
- Recovery healing (§3.3) always targets the active tower.
- When the active tower's HP hits 0: it **crumbles** — visually decays/grays out on `/display`, becomes non-interactive (no further damage or heal can land on it automatically), and the next tower in sequence becomes active. Fires a **tower fall** speech bubble (§3.8).
- **All five towers fallen — the "Regroup" state** (confirmed, §0b #1): there is no active tower. Pressure freezes at its current value — further loud stretches don't fill a meter with nothing to hit — until the teacher repairs at least one tower, either via a targeted Manual Repair (§3.6) or the one-tap **"Restore all"** control (§3.6/§5.1), which then resumes being active and clears the freeze. This state is deliberately named and styled as **"Regroup"** on `/display` (§4.2/§4.3), not a generic "all down" banner — it's the moment the class visibly rallies, not just a fail state.

### 3.6 Manual break / repair — teacher override, independent of the mic

A teacher control on `/control`, always available regardless of session status or Comms Jammer state — the whole point is an escape hatch that never depends on what the microphone is reading:

- **Manual Break:** deals exactly one strike's worth of damage (25 HP, matching `strikeDamage`) to the active tower. If this fells it, decay (§3.5) applies exactly as if the mic had done it — crumble, advance to the next tower, fire the tower-fall speech bubble.
- **Manual Repair:** fully restores the active tower to 100/100 HP in one action (not a partial nudge like the old `MANUAL_OVERRIDE_AMOUNT = 20`) — "fully repair... by hand," per the mechanic spec.
- **Reviving a fallen tower:** since the active-tower pointer only ever targets the front-most tower with HP > 0, bringing a *fallen* tower back requires targeting it specifically (the existing per-tower override capability already supports this — a teacher can select any tower, fallen or not, and apply Manual Repair to it directly). Repairing a fallen tower to full HP makes it, once again, the front-most intact tower in sequence — so it automatically becomes active again if every tower ahead of it (toward N) is also intact, or remains "waiting its turn" behind whichever earlier tower is still down.
- **Restore All (confirmed, §0b #1):** a single one-tap control, separate from per-tower Manual Repair, that restores every tower to 100/100 HP in one action and clears the Regroup state (§3.5) immediately regardless of which towers were down. Primarily meant for the all-towers-down case, but available any time as a fast full reset short of ending the mission.
- **The only three ways a fallen tower ever returns to play (confirmed, §0b #7):** a targeted Manual Repair, "Restore All," or the per-period/weekly reset (§5.5/§7). There is no automatic revive.

### 3.7 Comms Jammer — pause analysis without losing progress

A single teacher control that pauses **audio analysis only** — for a fire drill, a PA announcement, or any legitimate interruption:

- While engaged: mic sampling stops entirely (no ticks are fed to the engine at all — matching the existing "don't keep a live mic stream open longer than needed while paused" reasoning), and **pressure, active-tower HP, and the selected voice protocol are all frozen exactly as they were.** Nothing resets.
- Disengaging resumes exactly where it left off — same pressure value, same HP, same protocol.
- This is a **relabeling and narrowing of the existing teacher-initiated-pause state** (§0a row 6) specifically for this game — it is still visually and textually distinct from the mic-denied fault state (a calm, deliberate "Comms Jammer Engaged" badge vs. a warning-styled "Microphone unavailable" banner with a retry action), exactly as the prior revision specified.

### 3.8 Mic permission denied / unavailable (unchanged)

Same three explicit states as before — not yet requested (gesture button), denied/errored (unmissable banner, towers frozen, retry, never fabricated data), active (normal operation). This machinery is orthogonal to the mechanics change above and needs no revision.

---

## 4. `/display` presentation design

### 4.1 Default: a docked HUD, not a permanent full-screen takeover (unchanged in principle)

Docked HUD by default — five tower columns plus the pressure meter, in one screen corner, coexisting with board content. **Momentary full-screen takeovers** are reserved for the biggest, discrete events only: a **tower fall**, **"Regroup"** (all towers down, §0b #1), and **mission complete** — a brief auto-reverting flourish, then back to the dock (except Regroup, which holds until the teacher clears it via Manual Repair or Restore All, §3.6). A **strike** is deliberately *not* on this list — it stays an in-HUD flash + tower flinch only (§4.3); a full-screen takeover is reserved for a tower actually falling, not for each individual hit along the way. (Previously this was tied to "any HP loss" during a sustained band; now it's tied to the new discrete events directly, which is a strictly smaller, more intentional set of moments.)

### 4.2 HUD contents

- Five tower columns (N‑O‑I‑S‑E), each showing HP (numeric + fill bar) and condition (intact / damaged / **crumbled**, visually grayed and inert once fallen) — the active tower additionally gets a distinct highlight (a border glow or icon) so it's always obvious which tower is "on the line" right now.
- The **Villain Pressure meter** itself — a single dial/bar from 0–100%, replacing the old four-band "room meter." Approaching Warning (75%) gets a distinct visual treatment (e.g., a pulsing edge — capped in amplitude/frequency, never a rapid strobe, per the photosensitivity rule in §8) short of the Strike moment itself.
- The current **voice protocol** name, always visible (Stealth / Patrol / Combat) — this is new; the old HUD had no equivalent since there was no protocol concept.
- A **Comms Jammer** badge when engaged — calm, non-alarming styling, distinct from the mic-denied banner.
- A mission header: class period label, elapsed time.
- A speech-bubble region (§3.8/§4.3), throttled to one bubble at a time, auto-dismissing, never stacked.
- A small theme identifier so the HUD reads as "Hero Academy," not a generic overlay.

### 4.3 Escalation, now event-driven rather than band-driven

The old "warning flash → intense flash → screen shake → crumble" ladder was tied to *sustained time in* increasingly severe bands. That's gone along with the bands. The new mapping is tied to **discrete events**:

| Event | Visual | Audio (§6) |
|---|---|---|
| Pressure crosses Warning (75%) | A capped, non-strobing pulse on the meter's edge | Warning cue |
| **Strike** | A single sharp flash + the active tower visibly flinches/loses a chunk of its fill bar | Strike hit |
| **Tower Fall** | The tower's column crumbles/grays out over ~1s; brief full-screen takeover (§4.1) | Decay/crumble |
| **Regroup (all towers down)** | Full-screen "Regroup" takeover, holds until a teacher clears it (Manual Repair or Restore All) | Distinct sting, no repeated siren |
| **Recovery begins / completes** | A soft glow ramps in on the active tower's column | Two distinct heal cues (§6) |
| **Mission Complete** | Full-screen summary card | Victory cue |

Screen shake, where used at all (Tower Fall / All Towers Down only — never for an ordinary Strike), stays capped in amplitude/duration and respects `prefers-reduced-motion`, exactly as before. No state in this design flashes rapidly enough to be a photosensitivity concern (§8), and every color-coded state (protocol, tower condition, pressure level) is paired with an icon, shape, or text label, never color alone.

### 4.4 Calm Mode (unchanged in mechanism, now the explicit spec for every mockup's calm variant)

Mutes flashes, shake amplitude, and SFX volume **without pausing game logic** — pressure, HP, protocol, recovery all keep evaluating. This is the exact toggle the mockups' "Calm Mode versions" (§8) implement: no flashing, no shaking/jitter, full logic underneath.

---

## 5. `/control` (teacher) design

### 5.1 Session controls (updated)

Start / Pause / End, **Calibrate Quiet** (§2.3), a manual full Reset, protocol selector (Stealth/Patrol/Combat), the **Comms Jammer** toggle (§3.7), **Manual Break / Manual Repair** (§3.6, per-tower), and **Restore All** (§3.6, confirmed §0b #1 — a single one-tap control distinct from per-tower Manual Repair). This directly supersedes the old §5.2's list — protocol selection, the jammer, and Restore All are new controls this design adds; Start/Pause/End/Reset/Calibrate/Manual Break/Manual Repair carry forward unchanged.

### 5.2 Teacher-only tuning readout (unchanged in spirit, fields updated)

Live RMS, live dB, calibrated baseline, relative-to-baseline dB, **pressure (0–100%)**, **active tower + its HP**, **current protocol + its threshold**, dwell/grace timers. Never shown on `/display` (this stays teacher-only, exactly as before) — it exists so Owen can validate the new pressure math against a real room before trusting the default constants in §3.2/§3.3.

### 5.3 Penalty configuration — fully specified, deferred to a later build (§0b #3)

**Confirmed deferred (§0b #3): fully specified here as a design, but explicitly not part of this build.** Do not build the penalty formula's UI/logic in the same implementation pass as the rest of this mechanics revision — it's a later stage. The spec, for whenever that stage happens:

The formula: **fallen towers this session × a teacher-set multiplier = an amount of a teacher-defined consequence.** Fully configurable, matching the mechanic spec exactly:

- **Opt-in toggle**, off by default (carrying forward the original decision that penalties should never be a silent default).
- **Multiplier** — a plain number the teacher sets (e.g., 2).
- **Consequence unit/label** — free text the teacher defines (e.g., "minutes of quiet lunch," "minutes off recess," or anything else) — never hardcoded to a specific unit.
- **Visibility** — TV-visible or teacher-only, **default teacher-only.**
- **Friendly-wording toggle** — softens the on-screen copy from a punitive framing ("Penalty: 6 minutes owed") to a neutral/encouraging one ("Team Focus Minutes: 6") without changing the underlying number. Both wording modes are just presentation over the same tally.
- The tally recalculates live as towers fall during the session (not only at session end), and is part of the end-of-session mission report (§5.4) regardless of the TV-visibility setting.

### 5.4 End-of-session mission report — class-level only (updated)

Generated on "End Mission." Shows: period name/date, session duration, final tower condition (letters intact/damaged/fallen), strike count, tower-fall count, recovery-complete count, time spent in each voice protocol (plus time Comms-Jammer-paused), the penalty tally if enabled (in whichever wording mode is set), and a comic-flavored summary line. **Contains no individual student data** — purely class aggregate metrics, unchanged constraint from the original design. Persistence and the weekly-reset mechanism (§5.5 in the prior revision) are unaffected by this mechanics change and are reproduced in §7 below.

### 5.5 What happens after Mission Complete

Ending a mission (teacher taps "End Mission," or a period naturally ends) shows the mission report (§5.4) and returns the engine to `idle` — same as `end()` today. Pressure, active-tower pointer, and protocol are **not** carried into the next session; the next "Start" requires a fresh Calibrate Quiet (or reuses the existing baseline if one was already captured this period, matching §2.3's per-period-not-per-day cadence) and towers reset to full HP. This is the same reset shape the engine already has (`reset()`); this section only makes explicit that Mission Complete implies this reset, since the old doc never stated it directly.

---

## 6. Procedural sound effects — for the existing synthesizer

`src/lib/audio/synthesizer.ts` already provides the shared lazy `AudioContext` singleton (`getSharedAudioContext`), the gesture-unlock pattern, and two worked examples of the house style: `playTierUnlock` (an ascending square-wave arpeggio, root/third/fifth/octave, low-pass filtered per note) and `playVictoryFanfare` (a filtered white-noise blast into a triumphant ascending melody). `noiseGameSynthesizer.ts` already extends this with `scheduleTone`/`scheduleNoiseBurst` helpers in the same idiom. The event set below replaces the old band-driven SFX list (warning/danger-hit/critical-siren/crumble/heal/all-restored) with one matched to the new discrete-event model — specified as synthesis recipes for the existing approach, not new audio files:

| Event | Spec |
|---|---|
| **Protocol change** | A short two-note "chirp-click," triangle wave, low volume — a clean, administrative tone (not celebratory, not alarming) so switching Stealth→Patrol→Combat reads as a settings change, not a game beat. ~80 ms per note. |
| **Calibration complete** | A single clean bell tone (sine, ~660 Hz, gentle low-pass), confirming the baseline was captured — distinct from any heal/victory chime so it never reads as "something good just happened in the game." |
| **Warning (pressure crosses 75%)** | A short, mild ascending triangle-wave blip (reuse the existing `playWarningFlashSfx` shape) — a nudge, not an alarm; must not repeat while pressure hovers near the threshold (fire once per crossing, per §3.2's re-arm rule). |
| **Strike** | A short, sharp descending sawtooth hit (reuse `playDangerHitSfx`'s shape) layered with a brief low-pass noise "impact" burst — reads as a single decisive blow, not a sustained siren. |
| **Tower Fall (decay)** | A filtered noise "crumble" burst (longer, lower cutoff than the Strike's impact burst) plus a low descending sine thud (reuse `playTowerCrumbleSfx`'s shape) — the bigger, sadder cousin of the Strike sound. |
| **Regroup (all towers down)** | A single low, ominous descending 3-note minor-feeling sweep (square wave, sweeping down, low-pass filtered) — a "things just got serious" sting, deliberately not a repeating siren loop (a repeating alarm on a TV a room of kids stares at is worth avoiding on its own merits). |
| **Recovery begins** | A soft, single rising sine tone, quiet volume — a gentle "something good is starting" cue, distinct from and quieter than Recovery Complete. |
| **Recovery complete** | A bright 3-note ascending major arpeggio (triangle wave — reuse `playHealChimeSfx`'s exact shape) — unchanged from the prior revision, it already fits. |
| **Mission Complete** | **Confirmed tiering (§0b #5):** a zero-strike ("clean") mission gets the bigger `playVictoryFanfare` (noise-blast-into-melody); an ordinary completion (any strikes occurred) gets the standard `playAllTowersRestoredSfx` 4-note ascending triangle sequence. |
| **Mic blocked / Comms Jammer toggled** | No sound for Comms Jammer engage/disengage (it's a calm, deliberate teacher action — an audible cue would undercut "calm"); mic-denied gets no special sound either, since it's a fault banner that appears silently and shouldn't compete for attention with whatever caused the mic to drop. |

---

## 7. Later stages, honestly scoped (unchanged from the prior revision)

Per-period profiles, cross-device settings sync (a `noiseGame` sync channel so a teacher's iPad can reach a game running on the M1's `/display`), iPad mic support (local CA + HTTPS, §6.1 in the original numbering), and AI-generated quotes/voice (server-side only, explicit opt-in, cached not live-generated) remain later, honestly-scoped stages — none of this mechanics revision changes their staging or dependencies. Add to this list, confirmed (§0b #3): **the penalty formula (§5.3)** — fully specified as a design, but its build is deferred to a later stage, not part of this mechanics-revision build.

> **Known limitation: same-device only.** The whole feature — session status, `jamReason`, per-screen HUD opt-in, Jammer/Disengage — only cross-tab-syncs on **one device**, via `noiseGameStore.ts`'s own `localStorage` + `storage`-event bridge (same pattern as `qrCastStore.ts`/`stampStore.ts`). It has no path through the Stage 2/3 cross-device pairing/WebSocket sync server (`server/classroomSyncServer.ts`) at all — that server's own scope comment explicitly defers "Noise Defense" the same way it defers Prize Board. Concretely: **an iPad `/control` paired to a Mac `/display` cannot drive Noise Defense yet** — the mic only ever runs on whichever machine has `/display` open, and none of `/control`'s Start/Jammer/Disengage/opt-in actions reach a `/display` on a different device. This is exactly the `noiseGame` sync channel named above (redesign stage 1) — until that's built, run `/control` and `/display` as two tabs on the *same* browser/device for this feature to work at all.

---

## 8. Photosensitivity / accessibility constraints (unchanged, restated because they govern every mockup)

No state in this design flashes rapidly enough to be a strobe concern. Screen shake is capped in amplitude/duration and respects `prefers-reduced-motion`. Every color-coded state (tower condition, protocol, pressure level, Comms Jammer engaged) is paired with an icon, shape, or text label — color is never the only signal. Calm Mode (§4.4) is a first-class, always-available mode, not an afterthought, and every TV mockup in `docs/design/noise-game/` (§9 below) ships a Calm Mode counterpart with no flashing or shaking animation at all.

---

## 9. Theme pack: "Hero Academy"

The theme system already built in Stage 1 (`src/features/noise-defense/theme/types.ts`) is architecturally exactly right for this: the engine (`engine.ts`) knows nothing about any theme, imports nothing from it, and every HUD/control component reads a plain data object. This revision **extends** that interface (more event categories to give lines for — protocol change, warning, recovery-begin vs. recovery-complete split, mission complete, idle/calibrating, jammer) and **replaces its one shipped skin's content** — the old generic tower call-signs (Nomu Watch, Outpost, Ingenium Gate, Signal Spire, Endeavor Line) and the literal show catchphrase "PLUS ULTRA" as a tagline are superseded by named Guardians and fresh, non-catchphrase original writing, per §0a row 8.

Full theme content — Guardian-to-letter mapping, narrator roles, the 40+ line bank grouped by moment, and the visual-originality constraints — lives in **`docs/design/noise-game/hero-academy-theme-pack.md`** (kept as a separate content file so this architecture doc stays theme-agnostic, matching the existing "engine never imports from theme" principle). Summary:

- **Guardians** (towers): Deku (N), Uraraka (O), Todoroki (I), Iida (S), Bakugo (E) — together spelling N‑O‑I‑S‑E.
- **Villain:** Shigaraki.
- **Narrators:** All Might (booming, encouraging — mission complete, recovery), Aizawa (dry, low-key — protocol changes, idle/calibrating).
- **Theme is swappable**, not hardcoded: a new theme pack is a new object satisfying the same (extended) `NoiseGameTheme` interface; nothing in `engine.ts` or the mechanics in §3 above reference "Hero Academy," "UA High," or any character name. **Confirmed (§0b #4): single built-in theme, no picker, for this build.** Hero Academy ships as the only theme; no in-app theme registry/picker UI is built now. The interface stays picker-ready for later, but building that UI is explicitly out of scope here.
- **Visuals must be 100% original** — no official artwork, character likenesses, or logos anywhere, including every mockup in §9 below. All tower/villain/narrator representation in the mockups is abstract/geometric (colored shapes, icons, typography), never figurative character art.

---

## 10. Mockups

Static HTML, 1920×1080 logical canvas (scaled via the same `transform: scale()` convention already used in `docs/design/mockup-display-presets.html`), under `docs/design/noise-game/`:

| File | Contents |
|---|---|
| `tv-docked-hud-states.html` | Docked-HUD variant, full dramatic treatment, all 10 required states (idle, calibrating, calm, pressure rising, strike, tower fallen/decay, recovery, Regroup/all towers down, mission complete, mic blocked) |
| `tv-docked-hud-calm-mode.html` | Same 10 states, Calm Mode treatment — no flashing, no shake/jitter |
| `tv-fullscreen-mission-mode.html` | Full-screen mission-mode variant, dramatic treatment, all 10 states |
| `tv-fullscreen-calm-mode.html` | Full-screen mission-mode variant, Calm Mode treatment, all 10 states |
| `control-panel.html` | `/control` teacher panel — protocol selector, calibration trigger, Comms Jammer toggle, manual break/repair, penalty-formula settings. **Not yet updated for §0b's answers** — still shows only per-tower Repair (with copy claiming it's "the only way to bring a crumbled tower back into play") and the all-towers-down state isn't labeled "Regroup" anywhere in the mockups. A follow-up mockup pass should add the "Restore All" control and the Regroup naming before these are treated as final visuals — flagged here rather than silently claimed as done. |
| `mission-report.html` | End-of-session class-level mission report |

Each is self-contained HTML/CSS (matching this repo's existing wireframe-mockup fidelity level and dark visual language, per `mockup-control-home.html`/`mockup-display-presets.html`), with no application code, no libraries, and no figurative character art per §9's visual-originality constraint.

---

## 11. Confirmation of scope

No existing application file was modified for this revision. `src/features/noise-defense/**` (the Stage 1 code this doc describes) was read for grounding but not touched. Files created/edited: this document (including §0b's answers), `docs/design/noise-game/hero-academy-theme-pack.md`, and the six mockup files listed in §10, all under `docs/design/noise-game/`. No build, dev server, lint, or test command was run.

**2026-09-24, same day — open questions resolved (§0b).** This document was further updated in place to fold in Owen's answers to all 7 open questions; no new mockup files were created in this pass. Per §10's `control-panel.html` row, the mockups themselves have **not** yet been updated to reflect "Restore All" or the "Regroup" naming — that's flagged as a follow-up, not silently done. Still design-only; nothing was staged or committed as part of writing this update (see the repository's git history for what was committed afterward, if anything).
