import type { EngineConfig } from './types'

/**
 * Villain Pressure default tuning constants (design-doc §3.2/§3.3/§3.4,
 * confirmed to ship as-is per §0b #2). These are Owen's-best-judgment
 * defaults, not the product of a real-classroom measurement pass — paired
 * with a live `/control` tuning readout specifically so they can be judged
 * against a real room before anyone trusts them. Real-room tuning happens
 * after 2026-10-08 (Owen is away from the physical classroom until then).
 * Don't treat these numbers as final before then.
 */
export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  // 100 HP per tower; a strike is a fixed fraction (25%) of that, so 4
  // strikes fell a tower from full, matching the mechanic spec exactly.
  maxTowerHp: 100,

  // Fixed per the mechanic spec (§3.2) — a bounded, countable event, never a
  // bleed. 4 strikes fell a tower from full.
  strikeDamage: 25,

  // Anti-transient guard (carries forward §2.4's dose reasoning): a clap or
  // dropped book can't sustain 2s of continuous excess.
  pressureDwellSeconds: 2,

  // How fast pressure climbs once dwell clears, scaled by excess-above-
  // threshold dB.
  pressureAttackTauSeconds: 2,

  // Slightly faster decay than rise, so the meter doesn't stay "hot" long
  // after the room actually quiets down.
  pressureDecayTauSeconds: 1.5,

  // Gives a beat of "it's building" before the strike lands; re-arms once
  // pressure falls back under half.
  warningThresholdPct: 75,
  warningRearmPct: 50,

  // Recovery must be meaningfully quieter than "not building pressure," not
  // just "at the line" — 6 dB below whichever protocol threshold is active.
  recoveryMarginDb: 6,

  // Sustained-quiet dwell before healing begins, independent of the pressure
  // dwell guard.
  recoveryGraceSeconds: 5,

  // ~33s to fully rebuild a tower from 0 — real, sustained effort, not a
  // few seconds of silence erasing a strike.
  healPerSecond: 3,

  // Voice protocols (§3.4) — all as dB offsets above the calibrated quiet
  // baseline (never absolute dBFS, §2.3). Stealth (silent work) is tightest;
  // Combat (active discussion) is most permissive.
  protocolThresholdOffsetDb: {
    stealth: 4,
    patrol: 9,
    combat: 16,
  },
}

/** Default voice protocol on a fresh engine / after a full reset. */
export const DEFAULT_VOICE_PROTOCOL = 'patrol'

/** Manual Break / Manual Repair (§3.6) — Break matches one strike's worth of
 * damage exactly; Repair is a full heal to max, not the old partial nudge. */
export const MANUAL_BREAK_DAMAGE = DEFAULT_ENGINE_CONFIG.strikeDamage

/** Sampling tick rate — §3.1: ~4 Hz, fast enough to feel responsive on the
 * live meter, slow enough not to burn CPU on an all-day classroom machine. */
export const SAMPLE_INTERVAL_MS = 250

/** Game tick rate — §3.1: pressure/HP evaluation happens at 1 Hz, decoupled
 * from the faster sampling tick. (Sampling is fed continuously via
 * `ingestSample`; this constant documents the intended cadence for any
 * future rate-limiting of effect/quote transitions, matching §3.1.) */
export const GAME_TICK_MS = 1000

/** Quiet-baseline calibration window — within the design doc's "~5-10
 * seconds" range (§2.3). */
export const CALIBRATION_DURATION_MS = 7000

/** `AnalyserNode.fftSize` — 2048 is enough for RMS/level detection; no need
 * for full frequency-domain analysis in this build (§2.2). */
export const ANALYSER_FFT_SIZE = 2048

/** Floor applied before taking `20*log10(rms)`, so a literal 0 (dead
 * silence / a muted/disconnected input) never produces `-Infinity`. */
export const RMS_FLOOR = 1e-6
