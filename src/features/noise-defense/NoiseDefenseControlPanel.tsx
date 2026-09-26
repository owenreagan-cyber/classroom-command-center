import { useState } from 'react'
import { useNoiseGameStore } from './noiseGameStore'
import { TOWER_ORDER, VOICE_PROTOCOL_ORDER } from './types'
import { HERO_ACADEMY_THEME } from './theme/heroAcademyTheme'
import { MANUAL_BREAK_DAMAGE } from './constants'
import { DISPLAY_MODE_IDS, getDisplayModeConfig } from '../clean-board/displayModes'
import { loadHostDisplayState } from '../clean-board/displayHost'
import { isNoiseHudAllowed } from './hudGate'
import type { TowerId, VoiceProtocol } from './types'

function formatDb(value: number | null): string {
  if (value === null) return '—'
  return `${value.toFixed(1)} dB`
}

function formatSeconds(value: number): string {
  return `${value.toFixed(1)}s`
}

/**
 * `/control`-only. Session controls (Start/End/Reset/Calibrate), the voice
 * protocol picker, the Comms Jammer toggle, per-tower Manual Break/Repair,
 * Restore All, Calm Mode, per-screen HUD opt-in (Stage 0), and a teacher-only
 * live tuning readout — design-doc §5.1/§5.2/§5.3(deferred)/§5.4. Visual
 * language matches `docs/design/mockup-control-home.html` (dark cards, blue
 * accent, rounded corners). Never rendered on `/display`; the tuning
 * readout never shows raw audio, only the numbers this same engine already
 * computes for the game itself.
 */
export function NoiseDefenseControlPanel() {
  const [expanded, setExpanded] = useState(false)
  const [tab, setTab] = useState<'session' | 'towers' | 'screens' | 'report'>('session')
  const engineState = useNoiseGameStore((s) => s.engine)
  const hudOptIn = useNoiseGameStore((s) => s.hudOptIn)
  const lastMissionReport = useNoiseGameStore((s) => s.lastMissionReport)
  const start = useNoiseGameStore((s) => s.start)
  const endGame = useNoiseGameStore((s) => s.endGame)
  const resetGame = useNoiseGameStore((s) => s.resetGame)
  const beginCalibration = useNoiseGameStore((s) => s.beginCalibration)
  const setCalmMode = useNoiseGameStore((s) => s.setCalmMode)
  const setProtocol = useNoiseGameStore((s) => s.setProtocol)
  const engageJammer = useNoiseGameStore((s) => s.engageJammer)
  const disengageJammer = useNoiseGameStore((s) => s.disengageJammer)
  const manualBreak = useNoiseGameStore((s) => s.manualBreak)
  const manualRepair = useNoiseGameStore((s) => s.manualRepair)
  const restoreAll = useNoiseGameStore((s) => s.restoreAll)
  const setHudOptIn = useNoiseGameStore((s) => s.setHudOptIn)

  const theme = HERO_ACADEMY_THEME
  const relativeDb = engineState.baselineDb === null ? null : engineState.lastDb - engineState.baselineDb
  const thresholdDb = engineState.config.protocolThresholdOffsetDb[engineState.protocol]
  const activeTower = engineState.towers.find((t) => t.hp > 0) ?? null
  const isRegroup = engineState.status === 'regroup'
  const isJammed = engineState.status === 'jammed'

  // In-room-test brief, point 2: the engine (`engine.ts`'s `disengageJammer`)
  // needs to know whether the screen currently on stage would actually show
  // the HUD, same as `/display`'s own `NoiseDefenseHUD.tsx` computes it, so
  // it can refuse to resume into a state the class can't see. Read fresh on
  // every render rather than memoized -- this panel already re-renders on
  // every engine tick while a session is running, and `/board-lab`'s own
  // scene/Display Mode writes never fire a same-tab `storage` event (only
  // *other* tabs get that), so a memoized read here would go stale exactly
  // when it matters most: this same tab switching scenes.
  const allowedOnThisScreen = isNoiseHudAllowed(loadHostDisplayState().displayModeId, hudOptIn)
  const disengageDisabled = isJammed && engineState.jamReason === 'auto' && !allowedOnThisScreen

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="fixed right-3 top-3 z-[70] rounded-full border border-[#2c303a] bg-[#14161c]/90 px-3 py-1.5 text-[11px] font-medium text-[#9aa1ad] backdrop-blur transition hover:border-[#3a6fd8] hover:text-[#e7e9ee]"
        data-noise-defense-control-toggle
      >
        🛡️ Hero Academy Defense · {engineState.status}
        {isRegroup && ' · REGROUP'}
      </button>
    )
  }

  return (
    <div
      className="fixed right-3 top-3 z-[70] w-[360px] rounded-2xl border border-[#23262f] bg-[#14161c]/96 p-4 text-[#e7e9ee] shadow-2xl backdrop-blur"
      data-noise-defense-control-panel
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#e7e9ee]">{theme.displayName}</p>
          <p className="text-[10px] uppercase tracking-wide text-[#767c88]">
            Status: <span className="font-semibold text-[#8fa3ff]">{engineState.status}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="rounded-full border border-[#2c303a] px-2 py-0.5 text-[11px] text-[#9aa1ad] hover:text-[#e7e9ee]"
        >
          Hide
        </button>
      </div>

      {isRegroup && (
        <p className="mt-2 rounded-lg border border-rose-500/50 bg-rose-950/50 px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-rose-200">
          {theme.regroupTitle} — repair a tower to resume
        </p>
      )}

      {/* Decision #2 — teacher-only: distinguishes an auto-jam (this
          screen would hide the HUD, so listening auto-paused) from a
          teacher's own manual jam, which only clears on an explicit
          Disengage. Never shown on `/display` (teacher-only, per §5.2). */}
      {isJammed && (
        <p
          className="mt-2 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-cyan-200"
          data-noise-defense-jam-reason={engineState.jamReason ?? 'unknown'}
        >
          {engineState.jamReason === 'auto'
            ? '🛰️ Paused (screen hidden) — listening resumes automatically once an eligible screen is shown'
            : '🛰️ Comms Jammer manually engaged — tap Disengage Jammer to resume'}
        </p>
      )}

      {/* ── Tab strip ── */}
      <div className="mt-3 grid grid-cols-4 gap-1 rounded-lg bg-[#0f1116] p-1 text-[10px] font-bold uppercase tracking-wide">
        {(['session', 'towers', 'screens', 'report'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-md px-2 py-1.5 ${tab === t ? 'bg-[#2b6ef2] text-white' : 'text-[#767c88] hover:text-[#e7e9ee]'}`}
            data-noise-defense-tab={t}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'session' && (
        <div className="mt-3 space-y-3">
          {/* ── Session controls ── */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={start}
              disabled={engineState.baselineDb === null || engineState.status === 'running' || engineState.status === 'regroup'}
              className="rounded-lg border border-emerald-500/50 bg-emerald-950/40 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-200 disabled:cursor-not-allowed disabled:opacity-30"
              data-noise-defense-action="start"
            >
              Start
            </button>
            <button
              type="button"
              onClick={isJammed ? () => disengageJammer(allowedOnThisScreen) : engageJammer}
              disabled={
                disengageDisabled ||
                (!isJammed && engineState.status !== 'running' && engineState.status !== 'regroup')
              }
              className="rounded-lg border border-cyan-500/50 bg-cyan-950/40 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-cyan-200 disabled:cursor-not-allowed disabled:opacity-30"
              data-noise-defense-action="jammer-toggle"
              data-noise-defense-disengage-disabled={isJammed ? disengageDisabled : undefined}
              title={
                disengageDisabled
                  ? 'Paused — screen hidden. Resumes when the HUD is shown.'
                  : 'Comms Jammer: pauses audio analysis only -- pressure/HP/protocol are preserved exactly.'
              }
            >
              {disengageDisabled
                ? 'Paused — screen hidden. Resumes when the HUD is shown.'
                : isJammed
                  ? 'Disengage Jammer'
                  : 'Comms Jammer'}
            </button>
            <button
              type="button"
              onClick={endGame}
              disabled={engineState.status === 'idle' || engineState.status === 'ended'}
              className="rounded-lg border border-rose-500/50 bg-rose-950/40 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-rose-200 disabled:cursor-not-allowed disabled:opacity-30"
              data-noise-defense-action="end"
            >
              End
            </button>
            <button
              type="button"
              onClick={resetGame}
              className="rounded-lg border border-[#2c303a] bg-[#1b1e26] px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#9aa1ad]"
              data-noise-defense-action="reset"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={beginCalibration}
              disabled={engineState.status === 'calibrating'}
              className="col-span-2 rounded-lg border border-[#3a6fd8]/60 bg-[#1b2438] px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#8fa3ff] disabled:cursor-not-allowed disabled:opacity-30"
              data-noise-defense-action="calibrate"
            >
              {engineState.status === 'calibrating' ? 'Calibrating…' : 'Calibrate Quiet'}
            </button>
          </div>

          {engineState.status === 'calibrating' && (
            <p className="text-center text-[10px] text-[#8fa3ff]">
              Keep the room quiet — sampling the baseline now.
            </p>
          )}

          {/* ── Voice protocol picker ── */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#767c88]">Voice Protocol</p>
            <div className="mt-1 grid grid-cols-3 gap-1.5">
              {VOICE_PROTOCOL_ORDER.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProtocol(p)}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide ${
                    engineState.protocol === p
                      ? 'border-[#2b6ef2] bg-[#23324a] text-white'
                      : 'border-[#2c303a] bg-[#1b1e26] text-[#9aa1ad]'
                  }`}
                  data-noise-defense-action={`protocol-${p}`}
                >
                  {theme.protocolNames[p]}
                  <span className="block text-[9px] font-normal normal-case text-[#767c88]">
                    +{engineState.config.protocolThresholdOffsetDb[p]} dB
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Calm Mode ── */}
          <label className="flex items-center justify-between rounded-lg border border-[#2c303a] bg-[#1b1e26] px-2.5 py-1.5 text-[11px] font-semibold text-[#9aa1ad]">
            Calm Mode (mute theatrics, keep logic running)
            <input
              type="checkbox"
              checked={engineState.calmMode}
              onChange={(e) => setCalmMode(e.target.checked)}
              data-noise-defense-action="calm-mode-toggle"
            />
          </label>

          {/* ── Teacher-only tuning readout — never shown on /display ── */}
          <div className="rounded-lg border border-[#2c303a] bg-black/30 p-2 text-[10px]">
            <p className="mb-1 font-black uppercase tracking-widest text-[#767c88]">
              Tuning Readout (teacher only)
            </p>
            <dl className="grid grid-cols-2 gap-x-2 gap-y-0.5 tabular-nums text-[#c8ccd6]">
              <dt className="text-[#767c88]">Live RMS</dt>
              <dd data-noise-defense-readout="rms">{engineState.lastRms.toFixed(4)}</dd>
              <dt className="text-[#767c88]">Live level</dt>
              <dd data-noise-defense-readout="db">{formatDb(engineState.lastDb)}</dd>
              <dt className="text-[#767c88]">Baseline</dt>
              <dd data-noise-defense-readout="baseline">{formatDb(engineState.baselineDb)}</dd>
              <dt className="text-[#767c88]">Above baseline</dt>
              <dd data-noise-defense-readout="relative">{relativeDb === null ? '—' : `${relativeDb.toFixed(1)} dB`}</dd>
              <dt className="text-[#767c88]">Pressure</dt>
              <dd data-noise-defense-readout="pressure">{engineState.pressure.toFixed(1)}%</dd>
              <dt className="text-[#767c88]">Protocol threshold</dt>
              <dd data-noise-defense-readout="threshold">+{thresholdDb} dB</dd>
              <dt className="text-[#767c88]">Active tower</dt>
              <dd data-noise-defense-readout="active-tower">
                {activeTower ? `${activeTower.id} (${activeTower.hp}/${activeTower.maxHp})` : '— (Regroup)'}
              </dd>
              <dt className="text-[#767c88]">Dwell (s)</dt>
              <dd data-noise-defense-readout="dwell">{formatSeconds(engineState.aboveThresholdSeconds)}</dd>
              <dt className="text-[#767c88]">Recovery grace (s)</dt>
              <dd data-noise-defense-readout="grace">{formatSeconds(engineState.quietSeconds)}</dd>
              <dt className="text-[#767c88]">Comms Jammer</dt>
              <dd data-noise-defense-readout="jam-reason">
                {!isJammed
                  ? 'Not engaged'
                  : engineState.jamReason === 'auto'
                    ? 'Auto-paused (screen hidden)'
                    : 'Manually engaged'}
              </dd>
            </dl>
          </div>
        </div>
      )}

      {tab === 'towers' && (
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={restoreAll}
            className="w-full rounded-lg border border-emerald-500/60 bg-emerald-950/40 px-2 py-2 text-[11px] font-bold uppercase tracking-wide text-emerald-200"
            data-noise-defense-action="restore-all"
          >
            Restore All (full heal, clears Regroup)
          </button>
          <div className="space-y-1">
            {TOWER_ORDER.map((id) => {
              const tower = engineState.towers.find((t) => t.id === id)
              const condition = !tower ? 'intact' : tower.hp <= 0 ? 'fallen' : tower.hp >= tower.maxHp ? 'intact' : 'damaged'
              return (
                <div
                  key={id}
                  className="flex items-center gap-1.5 rounded-lg border border-[#2c303a] bg-[#1b1e26] px-2 py-1"
                >
                  <span className="w-16 truncate text-[11px] font-black text-[#e7e9ee]" title={id}>
                    {theme.towerNames[id]}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/40">
                    <div
                      className={`h-full rounded-full ${condition === 'fallen' ? 'bg-rose-400' : 'bg-cyan-400'}`}
                      style={{
                        width: `${tower ? Math.round((tower.hp / tower.maxHp) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-[10px] tabular-nums text-[#9aa1ad]">
                    {tower?.hp ?? 0}/{tower?.maxHp ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => manualBreak(id as TowerId)}
                    className="rounded border border-rose-500/50 px-1.5 py-0.5 text-[10px] font-bold text-rose-300"
                    data-noise-defense-action={`manual-break-${id}`}
                    title={`Manual Break: ${MANUAL_BREAK_DAMAGE} HP`}
                  >
                    Break
                  </button>
                  <button
                    type="button"
                    onClick={() => manualRepair(id as TowerId)}
                    className="rounded border border-emerald-500/50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300"
                    data-noise-defense-action={`manual-repair-${id}`}
                    title="Manual Repair: full heal to 100%"
                  >
                    Repair
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'screens' && (
        <div className="mt-3 space-y-2">
          <p className="text-[10px] text-[#767c88]">
            The HUD only ever appears on `/display` while a session is running AND the current screen
            is opted in below. Assessment Mode can never be opted in.
          </p>
          <div className="space-y-1">
            {DISPLAY_MODE_IDS.map((id) => {
              const cfg = getDisplayModeConfig(id)
              const disabled = !cfg.noiseHudEligible
              return (
                <label
                  key={id}
                  className={`flex items-center justify-between rounded-lg border border-[#2c303a] bg-[#1b1e26] px-2.5 py-1.5 text-[11px] font-semibold ${
                    disabled ? 'text-[#4a4f5c]' : 'text-[#9aa1ad]'
                  }`}
                >
                  {cfg.name}
                  <input
                    type="checkbox"
                    checked={!disabled && Boolean(hudOptIn[id])}
                    disabled={disabled}
                    onChange={(e) => setHudOptIn(id, e.target.checked)}
                    data-noise-defense-hud-optin={id}
                  />
                </label>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'report' && (
        <div className="mt-3 space-y-2 text-[11px]">
          {!lastMissionReport ? (
            <p className="text-[#767c88]">No mission has ended yet this session.</p>
          ) : (
            <div className="rounded-lg border border-[#2c303a] bg-[#1b1e26] p-3" data-noise-defense-mission-report>
              <p className="font-black uppercase tracking-widest text-[#8fa3ff]">
                {lastMissionReport.clean ? 'Clean Mission!' : 'Mission Complete'}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 tabular-nums text-[#c8ccd6]">
                <dt className="text-[#767c88]">Duration</dt>
                <dd>{Math.round(lastMissionReport.durationSeconds)}s</dd>
                <dt className="text-[#767c88]">Strikes</dt>
                <dd>{lastMissionReport.strikeCount}</dd>
                <dt className="text-[#767c88]">Tower falls</dt>
                <dd>{lastMissionReport.towerFallCount}</dd>
                <dt className="text-[#767c88]">Recoveries completed</dt>
                <dd>{lastMissionReport.recoveryCompleteCount}</dd>
                <dt className="text-[#767c88]">Jammed time</dt>
                <dd>{Math.round(lastMissionReport.jammedSeconds)}s</dd>
                <dt className="text-[#767c88]">Paused — screen hidden</dt>
                <dd data-noise-defense-readout="auto-jammed-seconds">
                  {Math.round(lastMissionReport.autoJammedSeconds)}s
                </dd>
              </dl>
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[#767c88]">
                Time per protocol
              </p>
              <dl className="grid grid-cols-3 gap-1 text-center text-[10px] tabular-nums text-[#c8ccd6]">
                {VOICE_PROTOCOL_ORDER.map((p) => (
                  <div key={p} className="rounded border border-[#2c303a] py-1">
                    <div className="text-[#767c88]">{theme.protocolNames[p]}</div>
                    <div>{Math.round(lastMissionReport.protocolSeconds[p as VoiceProtocol])}s</div>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-[9px] text-[#4a4f5c]">
                Class-level only — this report never includes any per-student data.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NoiseDefenseControlPanel
