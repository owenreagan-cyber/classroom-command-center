import type { NoiseTrackerId, NoiseTrackerState, VoiceLevel } from '../data/types'

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
  onAdjustLapMinutes: (trackerId: NoiseTrackerId, delta: number) => void
  onSetMeterLevel: (trackerId: NoiseTrackerId, meterLevel: number) => void
  onResetLapMinutes: (trackerId: NoiseTrackerId) => void
}

export function NoiseControlPanel({
  noiseTrackers,
  onVoiceLevelChange,
  onAddNoisyPoint,
  onAdjustLapMinutes,
  onSetMeterLevel,
  onResetLapMinutes,
}: NoiseControlPanelProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Noise Trackers
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Manual saved tracking for Homeroom, Math, and Reading. Mic sensing,
          repair crews, and tower defense visuals come after this foundation.
        </p>
      </div>

      <div className="space-y-3">
        {TRACKER_ORDER.map((trackerId) => {
          const tracker = noiseTrackers[trackerId]

          return (
            <div
              key={tracker.id}
              className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/50 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    {tracker.label}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Points {tracker.noisyPoints} · Laps {tracker.lapMinutes} min
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
            </div>
          )
        })}
      </div>
    </section>
  )
}
