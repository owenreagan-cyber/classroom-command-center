import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNoiseGameStore } from './noiseGameStore'
import { useNoiseMicEngine } from './micEngine'
import { HERO_ACADEMY_THEME } from './theme/heroAcademyTheme'
import { decideScreenJamAction, isNoiseHudAllowed } from './hudGate'
import { CALIBRATION_DURATION_MS } from './constants'
import { buildMissionReport } from './engine'
import {
  playAllTowersRestoredSfx,
  playCalibrationCompleteSfx,
  playHealChimeSfx,
  playProtocolChangeSfx,
  playRecoveryBeginSfx,
  playRegroupSfx,
  playStrikeSfx,
  playTowerCrumbleSfx,
  playWarningFlashSfx,
} from './noiseGameSynthesizer'
import { playVictoryFanfare } from '../../lib/audio/synthesizer'
import type { DisplayModeId } from '../clean-board/types'
import type { GameStatus, MissionReport, TowerState, VoiceProtocol } from './types'

const QUOTE_COOLDOWN_MS = 10_000
const TOWER_FALL_TAKEOVER_MS = 3200
const MISSION_COMPLETE_TAKEOVER_MS = 6000

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function pressureBandKey(pressure: number, warningThresholdPct: number): 'calm' | 'building' | 'warning' | 'critical' {
  if (pressure >= 90) return 'critical'
  if (pressure >= warningThresholdPct) return 'warning'
  if (pressure > 20) return 'building'
  return 'calm'
}

function formatElapsed(startedAtMs: number | null): string {
  if (startedAtMs === null) return '0:00'
  const totalSeconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

interface NoiseDefenseHUDProps {
  /** The `/display` screen currently on stage — Stage 0's opt-in gate reads
   * this against the teacher's per-screen setting (structurally excluded
   * for Assessment Mode regardless — see `hudGate.ts`). */
  displayModeId: DisplayModeId
}

/**
 * `/display`-only. Docked HUD by default (design-doc §4.1); a brief
 * full-board takeover fires for a tower-fall, holds for Regroup, and fires
 * (auto-reverting) for Mission Complete (an ordinary Strike never takes over
 * -- §4.3 -- only an in-HUD flash + tower flinch, below). Owns the
 * microphone (`useNoiseMicEngine`) — `/control` never runs it.
 *
 * Decision #2 (towers must never take damage the class can't see): the mic
 * session no longer just keeps ticking across whatever screen is on stage.
 * Whenever this screen would hide the HUD (opt-in off, or Assessment Mode,
 * structurally), this component auto-engages the Comms Jammer, which pauses
 * the mic exactly as a manual jam already does; showing an eligible screen
 * again auto-resumes it, unless the jam was engaged manually by the teacher
 * (a fire drill, etc.), which only the teacher's own disengage ever clears.
 * See the `decideScreenJamAction` effect below, and `engine.ts`'s
 * `autoEngageJammer`/`autoDisengageJammer`.
 */
export function NoiseDefenseHUD({ displayModeId }: NoiseDefenseHUDProps) {
  const engineState = useNoiseGameStore((s) => s.engine)
  const micFailureReason = useNoiseGameStore((s) => s.micFailureReason)
  const hudOptIn = useNoiseGameStore((s) => s.hudOptIn)
  const ingestSample = useNoiseGameStore((s) => s.ingestSample)
  const setMicDenied = useNoiseGameStore((s) => s.setMicDenied)
  const clearMicDenied = useNoiseGameStore((s) => s.clearMicDenied)
  const finishCalibration = useNoiseGameStore((s) => s.finishCalibration)
  const autoEngageJammer = useNoiseGameStore((s) => s.autoEngageJammer)
  const autoDisengageJammer = useNoiseGameStore((s) => s.autoDisengageJammer)

  const [micGestureGiven, setMicGestureGiven] = useState(false)
  const [flinchTowerId, setFlinchTowerId] = useState<string | null>(null)
  const [takeover, setTakeover] = useState<
    | { kind: 'towerFallen'; towerId: string; label: string; until: number }
    | { kind: 'regroup' }
    | { kind: 'missionComplete'; clean: boolean; until: number; report: MissionReport }
    | null
  >(null)
  const [quote, setQuote] = useState<{ text: string; speaker: string; tone: 'hero' | 'villain'; key: number } | null>(
    null,
  )

  const theme = HERO_ACADEMY_THEME
  const prevRef = useRef<{
    towers: TowerState[]
    status: GameStatus
    protocol: VoiceProtocol
    warningArmed: boolean
    recovering: boolean
  } | null>(null)
  const lastQuoteAtRef = useRef(0)

  // The mic session runs while calibrating/running/regroup -- it stops
  // entirely while jammed (§3.7: "mic sampling stops entirely", now
  // including an *auto*-engaged jam, decision #2) and while
  // mic-denied/idle/ended. This invariant is also what keeps auto-resume
  // safe: it only ever flips `status` between 'jammed' and
  // 'running'/'regroup', both already covered here, and it can never touch
  // `status` at all while idle/ended (see `decideScreenJamAction`), so it
  // can never be the thing that starts the mic with no session in progress.
  const micShouldBeActive =
    engineState.status === 'calibrating' ||
    engineState.status === 'running' ||
    engineState.status === 'regroup'

  useNoiseMicEngine({
    enabled: micShouldBeActive && micGestureGiven,
    onSample: (rms, atMs) => ingestSample(rms, atMs),
    onDenied: (reason) => setMicDenied(reason),
  })

  // Stage 0's per-screen gate, computed up front (decision #2 needs it for
  // the auto-jam watcher below, not just for the render gate further down).
  const allowedOnThisScreen = isNoiseHudAllowed(displayModeId, hudOptIn)

  // ── Decision #2: towers must never take damage the class can't see. ──
  // Whenever the currently-shown `/display` screen's HUD-allowed-ness (this
  // screen's opt-in, or Assessment Mode's structural exclusion) or the
  // engine's jam state changes, ask the pure decision function
  // (`hudGate.ts`) what the Comms Jammer should do and, if anything,
  // dispatch it. `decideScreenJamAction` never fires `autoEngage` unless a
  // session is running/regroup, and never fires `autoDisengage` for a
  // teacher's own manual jam -- see its doc comment for the full case list.
  useEffect(() => {
    const action = decideScreenJamAction(engineState.status, engineState.jamReason, allowedOnThisScreen)
    if (action === 'autoEngage') autoEngageJammer()
    else if (action === 'autoDisengage') autoDisengageJammer()
  }, [engineState.status, engineState.jamReason, allowedOnThisScreen, autoEngageJammer, autoDisengageJammer])

  function fireQuote(pool: { speaker: string; text: string }[], tone: 'hero' | 'villain') {
    const now = Date.now()
    if (now - lastQuoteAtRef.current < QUOTE_COOLDOWN_MS || pool.length === 0) return
    lastQuoteAtRef.current = now
    const line = pool[Math.floor(Math.random() * pool.length)]
    setQuote({ text: line.text, speaker: line.speaker, tone, key: now })
  }

  // Diff engine state each render to decide what SFX/quote/takeover to fire.
  // Works uniformly whether the change came from this tab's own mic ticks or
  // a manual override issued remotely from /control (synced via the store's
  // storage-event mirror).
  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = {
      towers: engineState.towers,
      status: engineState.status,
      protocol: engineState.protocol,
      warningArmed: engineState.warningArmed,
      recovering: engineState.recovering,
    }
    if (!prev) return

    const calm = engineState.calmMode
    const reduced = prefersReducedMotion()
    const now = Date.now()

    // ── Per-tower diffs: strike flash / tower fall / full heal ──
    for (let i = 0; i < engineState.towers.length; i++) {
      const before = prev.towers[i]
      const after = engineState.towers[i]
      if (!before || !after) continue

      if (after.hp < before.hp) {
        if (!calm) playStrikeSfx()
        setFlinchTowerId(after.id)
        window.setTimeout(() => setFlinchTowerId((id) => (id === after.id ? null : id)), 420)
        fireQuote(theme.quotes.strike, 'villain')

        if (after.hp === 0 && before.hp > 0) {
          if (!calm) playTowerCrumbleSfx()
          fireQuote(theme.quotes.towerFall, 'villain')
          if (!calm && !reduced) {
            setTakeover({
              kind: 'towerFallen',
              towerId: after.id,
              label: theme.towerNames[after.id],
              until: now + TOWER_FALL_TAKEOVER_MS,
            })
          }
        }
      } else if (after.hp > before.hp && after.hp === after.maxHp) {
        if (!calm) playHealChimeSfx()
        fireQuote(theme.quotes.recoveryComplete, 'hero')
      }
    }

    // ── Recovery begins (edge on the `recovering` flag) ──
    if (engineState.recovering && !prev.recovering) {
      if (!calm) playRecoveryBeginSfx()
      fireQuote(theme.quotes.recoveryBegin, 'hero')
    }

    // ── Warning (edge on `warningArmed`) ──
    if (engineState.warningArmed && !prev.warningArmed) {
      if (!calm) playWarningFlashSfx()
      fireQuote(theme.quotes.warning, 'villain')
    }

    // ── Protocol change ──
    if (engineState.protocol !== prev.protocol) {
      if (!calm) playProtocolChangeSfx()
      fireQuote(theme.quotes.protocolChange[engineState.protocol], 'hero')
    }

    // ── Status transitions: calibration complete / regroup / mission complete ──
    if (prev.status === 'calibrating' && engineState.status === 'idle' && engineState.baselineDb !== null) {
      if (!calm) playCalibrationCompleteSfx()
      fireQuote(theme.quotes.idle, 'hero')
    }

    if (engineState.status === 'regroup' && prev.status !== 'regroup') {
      if (!calm) playRegroupSfx()
      fireQuote(theme.quotes.allTowersDown, 'villain')
      if (!reduced) setTakeover({ kind: 'regroup' })
    }
    if (prev.status === 'regroup' && engineState.status !== 'regroup') {
      setTakeover((t) => (t?.kind === 'regroup' ? null : t))
    }

    if (engineState.status === 'ended' && prev.status !== 'ended') {
      const clean = engineState.missionStats.strikeCount === 0
      if (!calm) {
        if (clean) playVictoryFanfare()
        else playAllTowersRestoredSfx()
      }
      fireQuote(theme.quotes.missionComplete, 'hero')
      setTakeover({
        kind: 'missionComplete',
        clean,
        until: now + MISSION_COMPLETE_TAKEOVER_MS,
        // Computed once here (an effect, not render) and carried on the
        // takeover object -- render must stay pure, so it reads this
        // snapshot rather than calling `buildMissionReport(..., Date.now())`
        // itself.
        report: buildMissionReport(engineState, now),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    engineState.towers,
    engineState.status,
    engineState.protocol,
    engineState.warningArmed,
    engineState.recovering,
    engineState.calmMode,
  ])

  useEffect(() => {
    if (!quote) return
    const t = setTimeout(() => setQuote(null), 4200)
    return () => clearTimeout(t)
  }, [quote])

  useEffect(() => {
    if (!takeover || takeover.kind === 'regroup' || !('until' in takeover)) return
    const t = setTimeout(() => setTakeover((cur) => (cur === takeover ? null : cur)), takeover.until - Date.now())
    return () => clearTimeout(t)
  }, [takeover])

  // Calibration window (§2.3): only starts counting down once the mic is
  // actually engaged (gesture given) -- calibrating before any samples can
  // arrive would just produce an empty/garbage baseline.
  useEffect(() => {
    if (engineState.status !== 'calibrating' || !micGestureGiven) return
    const t = setTimeout(() => finishCalibration(), CALIBRATION_DURATION_MS)
    return () => clearTimeout(t)
  }, [engineState.status, micGestureGiven, finishCalibration])

  const reduced = useMemo(() => prefersReducedMotion(), [])

  // ── Stage 0 opt-in gate: a noise session must be actively running (not
  // idle/ended) AND this specific screen must be both eligible (structural,
  // never true for Assessment Mode) and opted in by the teacher, for the
  // *docked HUD and full-board takeovers* specifically (pressure meter,
  // towers, quotes, Tower Fall/Regroup/Mission Complete) -- the *engine*
  // (decision #2, above) reacts to the exact same `allowedOnThisScreen`
  // value to auto-jam a running/regrouping session on a HUD-hiding screen,
  // so towers never take damage the class can't see.
  //
  // The mic-consent gesture and the mic-denied banner, below, are
  // deliberately NOT gated on `allowedOnThisScreen` -- calibration needs to
  // work correctly on the very first screen a teacher lands on, before
  // they've ever visited /control's Screens tab to opt anything in
  // (in-room-test fix, 2026-09-26: this opt-in gate used to hide those too,
  // which meant Calibrate Quiet could never collect a sample -- and
  // therefore Baseline could never be set, and Start stayed disabled
  // forever -- on any screen that wasn't already opted in). It's still
  // structurally impossible for any of this to *appear* on Assessment Mode,
  // since `micShouldBeActive` and the mic UI below are independent of
  // `allowedOnThisScreen` but Assessment Mode never reaches `sessionActive`
  // in a way a teacher would notice — the auto-jam above still applies to
  // `running`/`regroup` on an ineligible screen exactly as before. ──
  const sessionActive = engineState.status !== 'idle' && engineState.status !== 'ended'
  if (!sessionActive) return null

  const bandKey = pressureBandKey(engineState.pressure, engineState.config.warningThresholdPct)
  const bandVisual = theme.pressureBand[bandKey]
  const pulseActive = bandKey === 'warning' || bandKey === 'critical'

  return (
    <>
      {/* ── Docked HUD -- gated on this screen's HUD opt-in ── */}
      {allowedOnThisScreen && (
      <div
        className="absolute left-6 top-6 z-40 w-[320px]"
        data-noise-defense-hud
        data-noise-defense-status={engineState.status}
        data-noise-defense-protocol={engineState.protocol}
        data-noise-defense-pressure-band={bandKey}
      >
        <motion.div
          className={`rounded-2xl border p-3 shadow-2xl backdrop-blur-sm ${bandVisual.borderClass} ${bandVisual.bgClass} ${bandVisual.glowClass}`}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className={`truncate text-[0.6rem] font-black uppercase tracking-[0.2em] ${bandVisual.textClass} opacity-80`}>
                {theme.displayName}
              </p>
              <p className={`text-[0.55rem] font-semibold uppercase tracking-[0.14em] ${bandVisual.textClass} opacity-60`}>
                {theme.protocolNames[engineState.protocol]} · {formatElapsed(engineState.missionStats.startedAtMs)}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide ${bandVisual.borderClass} ${bandVisual.textClass}`}
              data-noise-defense-band-label
            >
              {bandVisual.label}
            </span>
          </div>

          {/* Villain Pressure meter (§3.2/§4.2) */}
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/40" data-noise-defense-pressure-meter>
            <motion.div
              className={`h-full rounded-full ${
                bandKey === 'critical' ? 'bg-rose-400' : bandKey === 'warning' ? 'bg-orange-300' : 'bg-emerald-300'
              } ${pulseActive && !engineState.calmMode && !reduced ? 'animate-pulse' : ''}`}
              style={{ width: `${Math.max(0, Math.min(100, Math.round(engineState.pressure)))}%` }}
            />
          </div>

          <div className="mt-2 grid grid-cols-5 gap-1">
            {engineState.towers.map((tower) => {
              const condition = tower.hp <= 0 ? 'fallen' : tower.hp >= tower.maxHp ? 'intact' : 'damaged'
              const isActive = engineState.towers.find((t) => t.hp > 0)?.id === tower.id
              return (
                <div
                  key={tower.id}
                  data-noise-defense-tower={tower.id}
                  data-noise-defense-tower-condition={condition}
                  data-noise-defense-tower-active={isActive || undefined}
                  className={`flex flex-col items-center rounded-lg border px-0.5 py-1 text-center transition-transform ${
                    flinchTowerId === tower.id ? 'scale-95' : ''
                  } ${
                    condition === 'fallen'
                      ? 'border-rose-400/50 bg-rose-950/40 opacity-60'
                      : condition === 'damaged'
                        ? 'border-amber-400/50 bg-amber-950/30'
                        : 'border-emerald-400/40 bg-emerald-950/25'
                  } ${isActive ? 'ring-2 ring-white/70' : ''}`}
                  title={theme.towerNames[tower.id]}
                >
                  <span className="truncate text-[0.6rem] font-black text-white/90">{theme.towerNames[tower.id]}</span>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/40">
                    <div
                      className={`h-full rounded-full ${
                        condition === 'fallen'
                          ? 'bg-rose-400'
                          : condition === 'damaged'
                            ? 'bg-amber-300'
                            : 'bg-emerald-300'
                      }`}
                      style={{ width: `${Math.max(0, Math.round((tower.hp / tower.maxHp) * 100))}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {engineState.status === 'jammed' && (
            <p
              className="mt-2 rounded-lg border border-cyan-400/40 bg-cyan-950/50 py-1 text-center text-[0.6rem] font-bold uppercase tracking-widest text-cyan-100"
              data-noise-defense-jammer-badge
            >
              🛰️ {theme.jammerBadgeLabel}
            </p>
          )}

          {engineState.calmMode && (
            <p className="mt-2 text-center text-[0.6rem] font-bold uppercase tracking-widest text-slate-300/80">
              Calm Mode — game running, theatrics muted
            </p>
          )}
        </motion.div>

        <AnimatePresence>
          {quote && (
            <motion.p
              key={quote.key}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-lg ${
                quote.tone === 'hero'
                  ? 'border-emerald-300/50 bg-emerald-950/85 text-emerald-50'
                  : 'border-rose-300/50 bg-rose-950/85 text-rose-50'
              }`}
              data-noise-defense-quote
            >
              <span className="opacity-70">{quote.speaker}:</span> {quote.text}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      )}

      {/* ── Mic gesture / mic-denied states (§3.8) — distinct, unmissable.
          Deliberately NOT gated on `allowedOnThisScreen` -- see the doc
          comment above `sessionActive`. ── */}
      {micShouldBeActive && !micGestureGiven && engineState.status !== 'mic-denied' && (
        <button
          type="button"
          onClick={() => setMicGestureGiven(true)}
          className="absolute bottom-6 right-24 z-50 min-h-[44px] rounded-full border border-cyan-500 bg-cyan-950/90 px-4 py-2 text-xs font-semibold text-cyan-100 shadow-lg backdrop-blur transition hover:bg-cyan-900"
          data-noise-defense-mic-gesture
        >
          🎙️ {theme.micNotStartedLabel}
        </button>
      )}

      {engineState.status === 'mic-denied' && (
        <div
          className="absolute inset-x-0 top-0 z-[75] flex items-center justify-center gap-4 border-b border-rose-400/60 bg-rose-950/95 px-6 py-3 text-center shadow-2xl"
          data-noise-defense-mic-denied
        >
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-rose-100">
              {theme.micDeniedTitle}
              {micFailureReason ? ` (${micFailureReason})` : ''}
            </p>
            <p className="text-xs text-rose-200/90">{theme.micDeniedBody}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearMicDenied()
              setMicGestureGiven(false)
            }}
            className="min-h-[36px] rounded-full border border-rose-300 bg-rose-900 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-rose-50 hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Full-board takeovers — Tower Fall (brief), Regroup (holds),
          Mission Complete (brief) — §4.1/§4.3. Gated on this screen's HUD
          opt-in, same as the docked HUD above. ── */}
      {allowedOnThisScreen && (
      <AnimatePresence>
        {takeover && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={
              // Screen shake, where used at all, is reserved for Tower Fall
              // / Regroup only (never an ordinary Strike, which has no
              // full-screen takeover at all -- §4.3) -- capped in amplitude
              // and duration, and skipped entirely for Calm Mode or reduced
              // motion.
              (takeover.kind === 'towerFallen' || takeover.kind === 'regroup') &&
              !engineState.calmMode &&
              !reduced
                ? { opacity: 1, x: [0, -3, 3, -2, 2, 0] }
                : { opacity: 1 }
            }
            transition={{ x: { duration: 0.4 } }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-[78] flex items-center justify-center backdrop-blur-sm ${
              takeover.kind === 'regroup'
                ? 'bg-rose-950/90'
                : takeover.kind === 'missionComplete'
                  ? takeover.clean
                    ? 'bg-emerald-950/85'
                    : 'bg-slate-950/85'
                  : 'bg-rose-950/85'
            }`}
            data-noise-defense-takeover={takeover.kind}
          >
            <motion.div
              initial={engineState.calmMode ? { scale: 1, rotate: 0 } : { scale: 0.7, rotate: -4 }}
              animate={{ scale: 1, rotate: 0 }}
              className="rounded-3xl border-4 border-white/30 bg-black/40 px-10 py-8 text-center shadow-2xl"
            >
              {takeover.kind === 'towerFallen' && (
                <>
                  <p className="text-4xl font-black uppercase tracking-tight text-rose-50 drop-shadow">Tower Down!</p>
                  <p className="mt-2 text-lg font-bold text-rose-100">
                    {takeover.towerId} — {takeover.label} has fallen.
                  </p>
                </>
              )}
              {takeover.kind === 'regroup' && (
                <>
                  <p className="text-4xl font-black uppercase tracking-tight text-rose-50 drop-shadow">
                    {theme.regroupTitle}
                  </p>
                  <p className="mt-2 text-lg font-bold text-rose-100">{theme.regroupBody}</p>
                </>
              )}
              {takeover.kind === 'missionComplete' && (
                <>
                  <p className="text-4xl font-black uppercase tracking-tight text-white drop-shadow">
                    Mission Complete{takeover.clean ? ' — Clean Run!' : ''}
                  </p>
                  <p className="mt-2 text-lg font-bold text-white/90">
                    {takeover.report.strikeCount} strike{takeover.report.strikeCount === 1 ? '' : 's'} ·{' '}
                    {takeover.report.towerFallCount} tower fall{takeover.report.towerFallCount === 1 ? '' : 's'}
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      )}
    </>
  )
}

export default NoiseDefenseHUD
