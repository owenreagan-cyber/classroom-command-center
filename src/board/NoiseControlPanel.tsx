import type { NoiseTrackerId, NoiseTrackerState, VoiceLevel } from '../data/types'
import {
  getNoiseTowerCondition,
  getNoiseTowerConditionLabel,
  getNoiseTowerMeterLabel,
  getNoiseTowerSummary,
} from '../lib/noiseTowers'

const TRACKER_ORDER: NoiseTrackerId[] = ['homeroom', 'math', 'reading']

const VOICE_LEVEL_LABELS: Record<VoiceLevel, string> = {
  silent: '0 Silent',
  whisper: '1 Whisper',
  normal: '2 Normal',
  off: 'Off',
}

interface NoiseControlPanelProps {
  noiseTrackers: Record<NoiseTrackerId, NoiseTrackerState>
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
  onVoiceLevelChange,
  onAddNoisyPoint,
  onRepairNoiseTick,
  onAdjustLapMinutes,
  onSetMeterLevel,
  onResetLapMinutes,
  onResetTracker,
}: NoiseControlPanelProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Noise Trackers
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Manual local tracking for Homeroom, Math, and Reading. The tower
          model, repair ticks, and teacher reset stay fully offline.
        </p>
      </div>

      <div className="space-y-3">
        {TRACKER_ORDER.map((trackerId) => {
          const tracker = noiseTrackers[trackerId]
          const towerStateSummary = getNoiseTowerSummary(tracker.towers)

          return (
            <div
              key={tracker.id}
              className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {tracker.label}
                  </h3>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200/80">
                    {towerStateSummary}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {tracker.towers
                      .map((tower) =>
                        `${tower.letter} ${getNoiseTowerMeterLabel(tower)} ${getNoiseTowerConditionLabel(tower)}`,
                      )
                      .join(' · ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddNoisyPoint(tracker.id)}
                  className="rounded-lg border border-rose-400/40 bg-rose-950/40 px-2 py-1 text-xs font-bold text-rose-100 transition hover:bg-rose-900/50"
                  >
                    + noisy
                  </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {tracker.towers.map((tower) => {
                  const condition = getNoiseTowerCondition(tower)
                  return (
                    <div
                      key={tower.letter}
                      className={`rounded-xl border px-2 py-2 text-center shadow-sm ${
                        condition === 'destroyed'
                          ? 'border-rose-400/30 bg-rose-950/50 text-rose-50'
                          : condition === 'damaged'
                            ? 'border-amber-300/40 bg-amber-950/40 text-amber-50'
                            : 'border-emerald-300/35 bg-emerald-950/35 text-emerald-50'
                      }`}
                    >
                      <span className="block text-[0.65rem] font-black uppercase tracking-[0.2em] opacity-80">
                        {tower.letter}
                      </span>
                      <span className="block text-sm font-black">{tower.hp}/{tower.maxHp}</span>
                      <span className="block text-[0.64rem] font-bold uppercase tracking-[0.14em] opacity-80">
                        {condition}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(VOICE_LEVEL_LABELS) as VoiceLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onVoiceLevelChange(tracker.id, level)}
                    className={`rounded-lg border px-2 py-1.5 text-left text-xs font-bold transition ${
                      tracker.voiceLevel === level
                        ? 'border-cyan-300 bg-cyan-500 text-slate-950'
                        : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {VOICE_LEVEL_LABELS[level]}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="mb-1 block text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Manual meter
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={tracker.meterLevel}
                  onChange={(event) =>
                    onSetMeterLevel(tracker.id, Number(event.target.value))
                  }
                  className="w-full accent-cyan-400"
                />
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onAdjustLapMinutes(tracker.id, -2)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-bold text-slate-100 transition hover:bg-slate-800"
                >
                  -2 min
                </button>
                <button
                  type="button"
                  onClick={() => onAdjustLapMinutes(tracker.id, 2)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-bold text-slate-100 transition hover:bg-slate-800"
                >
                  +2 min
                </button>
                <button
                  type="button"
                  onClick={() => onResetLapMinutes(tracker.id)}
                  className="rounded-lg border border-emerald-400/40 bg-emerald-950/40 px-2 py-1.5 text-xs font-bold text-emerald-100 transition hover:bg-emerald-900/50"
                >
                  Served
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onRepairNoiseTick(tracker.id)}
                  className="rounded-lg border border-sky-400/40 bg-sky-950/40 px-2 py-2 text-xs font-bold uppercase tracking-wide text-sky-100 transition hover:bg-sky-900/50"
                >
                  Repair tick
                </button>
                <button
                  type="button"
                  onClick={() => onResetTracker(tracker.id)}
                  className="rounded-lg border border-rose-400/50 bg-rose-950/40 px-2 py-2 text-xs font-bold uppercase tracking-wide text-rose-100 transition hover:bg-rose-900/50"
                >
                  Reset tracker
                </button>
              </div>

              <p className="rounded-lg border border-rose-400/20 bg-rose-950/20 px-3 py-2 text-[11px] leading-relaxed text-rose-100/90">
                Reset tracker clears towers, noisy points, lap minutes, meter,
                and pause state for this room only.
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
