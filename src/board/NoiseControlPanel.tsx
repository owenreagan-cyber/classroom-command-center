import { useState, useEffect } from 'react'
import type { NoiseTrackerId, NoiseTrackerState, VoiceLevel, ScreenId } from '../data/types'
import {
  getNoiseTowerCondition,
  getNoiseTowerSummary,
  getNoiseTrackerIdForScreen,
} from '../lib/noiseTowers'

const TRACKER_ORDER: NoiseTrackerId[] = ['homeroom', 'math', 'reading']

const VOICE_LEVEL_LABELS: Record<VoiceLevel, string> = {
  silent: '0 Silent',
  whisper: '1 Whisper',
  normal: '2 Normal',
  off: 'Off / Paused',
}

interface NoiseControlPanelProps {
  noiseTrackers: Record<NoiseTrackerId, NoiseTrackerState>
  activeScreen?: ScreenId
  onVoiceLevelChange: (trackerId: NoiseTrackerId, voiceLevel: VoiceLevel) => void
  onAddNoisyPoint: (trackerId: NoiseTrackerId) => void
  onRepairNoiseTick: (trackerId: NoiseTrackerId) => void
  onAdjustLapMinutes: (trackerId: NoiseTrackerId, delta: number) => void
  onSetMeterLevel: (trackerId: NoiseTrackerId, meterLevel: number) => void
  onResetLapMinutes: (trackerId: NoiseTrackerId) => void
  onResetTracker: (trackerId: NoiseTrackerId) => void
}

export function NoiseControlPanel({
  noiseTrackers,
  activeScreen,
  onVoiceLevelChange,
  onAddNoisyPoint,
  onRepairNoiseTick,
  onAdjustLapMinutes,
  onSetMeterLevel,
  onResetLapMinutes,
  onResetTracker,
}: NoiseControlPanelProps) {
  const [confirmResetId, setConfirmResetId] = useState<NoiseTrackerId | null>(null)

  // Auto-reset confirmation state after 3 seconds
  useEffect(() => {
    if (confirmResetId === null) return
    const timer = setTimeout(() => {
      setConfirmResetId(null)
    }, 3000)
    return () => clearTimeout(timer)
  }, [confirmResetId])

  const activeTrackerId = activeScreen ? getNoiseTrackerIdForScreen(activeScreen) : null
  const activeTracker = activeTrackerId ? noiseTrackers[activeTrackerId] : null

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Noise Tracker Controls
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Control active voice limits and simulate noise classroom-side.
        </p>
      </div>

      {/* Active Tracker Identity Header Block */}
      <div className="rounded-xl bg-slate-950/60 p-3 border border-slate-800/80 shadow-inner">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-1.5">
          Current Assignment
        </span>
        {activeTracker ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-sm font-black text-cyan-100">
                Active: {activeTracker.label}
              </span>
            </div>
            <span className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-wider">
              Linked to Screen
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-600" />
            <span className="text-xs font-semibold text-slate-400 italic">
              No noise tracker assigned to this screen
            </span>
          </div>
        )}
      </div>

      <div className="space-y-5">
        {TRACKER_ORDER.map((trackerId) => {
          const tracker = noiseTrackers[trackerId]
          const towerStateSummary = getNoiseTowerSummary(tracker.towers)
          const isActive = activeTrackerId === trackerId

          return (
            <div
              key={tracker.id}
              className={`space-y-4 rounded-xl border p-4 transition-all duration-300 ${
                isActive
                  ? 'border-cyan-500/60 bg-slate-950/90 shadow-lg shadow-cyan-950/30'
                  : 'border-slate-800/60 bg-slate-950/30 opacity-70 hover:opacity-100'
              }`}
            >
              {/* Header with Active Badge and Title */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800/50 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-black tracking-tight ${isActive ? 'text-cyan-50' : 'text-slate-200'}`}>
                      {tracker.label}
                    </h3>
                    {isActive && (
                      <span className="rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/70">
                    {towerStateSummary}
                  </p>
                </div>
              </div>

              {/* Tower Defenses Grid */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Defense Integrity
                  </span>
                  <span className="text-[9px] font-bold text-slate-600 uppercase">
                    5 Towers (N-O-I-S-E)
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {tracker.towers.map((tower) => {
                    const condition = getNoiseTowerCondition(tower)
                    return (
                      <div
                        key={tower.letter}
                        className={`rounded-lg border px-1 py-1.5 text-center shadow-sm transition-colors duration-300 ${
                          condition === 'destroyed'
                            ? 'border-rose-500/40 bg-rose-950/50 text-rose-100'
                            : condition === 'damaged'
                              ? 'border-amber-400/40 bg-amber-950/40 text-amber-100'
                              : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-100'
                        }`}
                      >
                        <span className="block text-[0.55rem] font-black uppercase tracking-[0.25em] opacity-90 mb-0.5">
                          {tower.letter}
                        </span>
                        <div className="flex flex-col items-center">
                          <span className="block text-[11px] font-black leading-none">{tower.hp}</span>
                          <span className="block text-[7px] font-bold uppercase tracking-[0.1em] opacity-60 mt-0.5">
                            {condition}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Controls Grouped by Type */}

              {/* 1. Voice Limit (Policy) */}
              <div className="space-y-2 rounded-xl bg-slate-900/40 p-3 border border-slate-800/50">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Voice Level Policy
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(VOICE_LEVEL_LABELS) as VoiceLevel[]).map((level) => {
                    const isSelected = tracker.voiceLevel === level
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => onVoiceLevelChange(tracker.id, level)}
                        className={`rounded-lg border px-2.5 py-2 text-left text-[11px] font-black transition-all duration-150 ${
                          isSelected
                            ? level === 'off'
                              ? 'border-rose-500/60 bg-rose-950/80 text-rose-100 shadow-md shadow-rose-950/40'
                              : 'border-cyan-500/60 bg-cyan-950/80 text-cyan-100 shadow-md shadow-cyan-950/40'
                            : 'border-slate-800 bg-slate-900/60 text-slate-500 hover:border-slate-700 hover:bg-slate-800/80 hover:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isSelected
                                ? level === 'off'
                                  ? 'bg-rose-400'
                                  : 'bg-cyan-400 animate-pulse'
                                : 'bg-slate-700'
                            }`}
                          />
                          <span className="uppercase tracking-wide">{VOICE_LEVEL_LABELS[level]}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. Meter & Incidents (Immediate Action) */}
              <div className="space-y-2.5 rounded-xl bg-slate-900/40 p-3 border border-slate-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Manual Meter & Penalty
                  </span>
                  <span className="text-[10px] font-black tabular-nums text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-2 py-0.5 rounded-full">
                    {tracker.meterLevel}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative flex items-center h-6">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={tracker.meterLevel}
                      onChange={(event) =>
                        onSetMeterLevel(tracker.id, Number(event.target.value))
                      }
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-full appearance-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddNoisyPoint(tracker.id)}
                    disabled={tracker.voiceLevel === 'off'}
                    className={`rounded-lg border font-black text-[10px] uppercase tracking-wider px-3 py-2 transition-all duration-150 shrink-0 ${
                      tracker.voiceLevel === 'off'
                        ? 'border-slate-800 bg-slate-900/40 text-slate-600 cursor-not-allowed'
                        : 'border-rose-500/50 bg-rose-950/50 text-rose-200 hover:bg-rose-900/60 hover:border-rose-400/60 active:scale-95 shadow-sm'
                    }`}
                    title={tracker.voiceLevel === 'off' ? 'Enable a voice limit to track noise' : 'Classroom was too noisy! Adds a noisy point and damages a tower.'}
                  >
                    + Noisy Point
                  </button>
                </div>
              </div>

              {/* 3. Stats & Recovery (Cleanup) */}
              <div className="space-y-3 rounded-xl bg-slate-900/40 p-3 border border-slate-800/50">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block">
                  Recovery & Maintenance
                </span>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl bg-slate-950/60 border border-slate-800/60 p-2 shadow-inner">
                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                      Lap Duration
                    </span>
                    <span className="text-xs font-black text-slate-200 tabular-nums">{tracker.lapMinutes}m</span>
                  </div>
                  <div className="rounded-xl bg-slate-950/60 border border-slate-800/60 p-2 shadow-inner">
                    <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">
                      Total Points
                    </span>
                    <span className="text-xs font-black text-slate-200 tabular-nums">{tracker.noisyPoints}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onAdjustLapMinutes(tracker.id, -2)}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 py-2 text-[10px] font-black text-slate-400 transition-all duration-150 hover:bg-slate-800 hover:text-slate-100 uppercase tracking-tight"
                  >
                    -2 Min
                  </button>
                  <button
                    type="button"
                    onClick={() => onAdjustLapMinutes(tracker.id, 2)}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 py-2 text-[10px] font-black text-slate-400 transition-all duration-150 hover:bg-slate-800 hover:text-slate-100 uppercase tracking-tight"
                  >
                    +2 Min
                  </button>
                  <button
                    type="button"
                    onClick={() => onResetLapMinutes(tracker.id)}
                    className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 py-2 text-[10px] font-black text-emerald-300 transition-all duration-150 hover:bg-emerald-900/50 uppercase tracking-tight shadow-sm"
                    title="Students served their time. Resets lap minutes and noisy points."
                  >
                    Served
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onRepairNoiseTick(tracker.id)}
                  className="w-full rounded-lg border border-sky-500/40 bg-sky-950/30 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-sky-200 transition-all duration-150 hover:bg-sky-900/50 hover:border-sky-400/50 shadow-sm"
                  title="Repair a damaged tower. Does not affect noisy points."
                >
                  Apply Repair Tick
                </button>
              </div>

              {/* 4. Destruction (Danger Zone) */}
              <div className="rounded-xl border border-rose-950/40 bg-rose-950/10 p-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-400/80 block">
                      Danger Zone
                    </span>
                    <p className="text-[9px] text-rose-400/60 leading-tight mt-0.5">
                      Destructive tracker reset
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmResetId === trackerId) {
                        onResetTracker(tracker.id)
                        setConfirmResetId(null)
                      } else {
                        setConfirmResetId(trackerId)
                      }
                    }}
                    className={`rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all duration-150 shrink-0 ${
                      confirmResetId === trackerId
                        ? 'border-rose-500 bg-rose-500 text-white shadow-lg shadow-rose-900 animate-pulse'
                        : 'border-rose-500/30 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50'
                    }`}
                  >
                    {confirmResetId === trackerId ? 'Confirm Reset' : 'Full Reset'}
                  </button>
                </div>
                {confirmResetId === trackerId && (
                  <div className="mt-2.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <p className="text-[9px] font-bold text-rose-400 leading-normal">
                      Wait! This wipes all towers, points, and lap minutes for {tracker.label}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </section>
  )
}
