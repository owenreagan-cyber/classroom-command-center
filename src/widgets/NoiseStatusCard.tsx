import type { AppMode, NoiseTrackerState, VoiceLevel } from '../data/types'
import {
  boardCardShell,
  displayFontRange,
} from '../lib/displayLayout'
import {
  getNoiseTowerCondition,
  getNoiseTowerConditionLabel,
  getNoiseTrackerTowerStatus,
} from '../lib/noiseTowers'

const VOICE_LABELS: Record<VoiceLevel, string> = {
  silent: 'SILENT',
  whisper: 'WHISPER',
  normal: 'NORMAL',
  off: 'OFF',
}

interface NoiseStatusCardProps {
  tracker: NoiseTrackerState
  mode: AppMode
  className?: string
}

function toneClasses(condition: 'intact' | 'damaged' | 'destroyed'): string {
  switch (condition) {
    case 'intact':
      return 'border-emerald-300/55 bg-[radial-gradient(circle_at_top,rgba(74,222,128,0.35),transparent_60%),linear-gradient(180deg,rgba(6,78,59,0.96),rgba(15,23,42,0.95))] text-emerald-50 shadow-[0_0_25px_rgba(16,185,129,0.22)]'
    case 'damaged':
      return 'border-amber-300/55 bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.35),transparent_60%),linear-gradient(180deg,rgba(120,53,15,0.96),rgba(15,23,42,0.95))] text-amber-50 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
    case 'destroyed':
      return 'border-rose-300/55 bg-[radial-gradient(circle_at_top,rgba(248,113,113,0.3),transparent_60%),linear-gradient(180deg,rgba(127,29,29,0.96),rgba(15,23,42,0.95))] text-rose-50 shadow-[0_0_25px_rgba(244,63,94,0.18)]'
  }
}

function voiceToneClass(isPaused: boolean, meterLevel: number): string {
  if (isPaused) return 'border-slate-300/40 bg-slate-900/80 text-slate-100'
  if (meterLevel >= 85) return 'border-rose-200/70 bg-rose-500/25 text-rose-50'
  if (meterLevel >= 65) return 'border-amber-200/70 bg-amber-500/25 text-amber-50'
  return 'border-cyan-200/70 bg-cyan-500/20 text-cyan-50'
}

export function NoiseStatusCard({
  tracker,
  mode,
  className = '',
}: NoiseStatusCardProps) {
  const isPaused = tracker.voiceLevel === 'off' || tracker.isPaused
  const isWarning = tracker.meterLevel >= 65 && !isPaused
  const isCritical = tracker.meterLevel >= 85 && !isPaused
  const titleFonts = displayFontRange(mode, 16, 24)
  const statFonts = displayFontRange(mode, 18, 30)
  const towerLabelFonts = displayFontRange(mode, 16, 22)

  return (
    <article
      className={`${boardCardShell(mode)} ${className} overflow-hidden border-slate-900/20 bg-slate-950 text-white shadow-2xl`}
    >
      <div
        className={`absolute inset-0 opacity-90 ${
          isCritical
            ? 'bg-[radial-gradient(circle_at_top_right,rgba(248,113,113,0.5),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(190,18,60,0.3),transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(127,29,29,0.95))]'
            : isWarning
              ? 'bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.45),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(217,119,6,0.25),transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(120,53,15,0.93))]'
              : 'bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.4),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.25),transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(8,47,73,0.93))]'
        }`}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.08),transparent_24%,transparent_76%,rgba(255,255,255,0.08))] opacity-40" />

      <div className="relative z-10 flex h-full min-h-0 flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.28em] text-cyan-100/85">
              Noise Tower Defense
            </p>
            <h2
              className="mt-1 break-words font-black uppercase tracking-tight text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]"
              style={{
                fontSize: `${titleFonts.maxFontSize}px`,
                lineHeight: 0.95,
              }}
            >
              {tracker.label.replace(' Noise', '')}
            </h2>
          </div>

          <div
            className={`shrink-0 rounded-2xl border px-4 py-3 text-right shadow-lg ${voiceToneClass(
              isPaused,
              tracker.meterLevel,
            )}`}
          >
            <span className="block text-[0.65rem] font-black uppercase tracking-[0.2em] opacity-80">
              Voice Level
            </span>
            <span className="block text-xl font-black uppercase tracking-[0.08em] md:text-2xl">
              {VOICE_LABELS[tracker.voiceLevel]}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-white/12 bg-black/30 p-3 shadow-inner backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-slate-100/80">
            <span>Room Meter</span>
            <span>{tracker.meterLevel}%</span>
          </div>
          <div className="h-6 overflow-hidden rounded-full border border-white/20 bg-black/55 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isPaused
                  ? 'bg-slate-500'
                  : isCritical
                    ? 'bg-rose-400'
                    : isWarning
                      ? 'bg-amber-300'
                      : 'bg-cyan-300'
              }`}
              style={{ width: `${tracker.meterLevel}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {tracker.towers.map((tower) => {
            const condition = getNoiseTowerCondition(tower)

            return (
              <div
                key={tower.letter}
                className={`relative flex min-h-[7rem] flex-col justify-between overflow-hidden rounded-2xl border p-2 text-center ${toneClasses(condition)}`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-white/15" />
                <span
                  className="mt-1 block font-black uppercase tracking-[0.14em] text-white/90"
                  style={{
                    fontSize: `${towerLabelFonts.minFontSize}px`,
                    lineHeight: 1,
                  }}
                >
                  {tower.letter}
                </span>
                <div className="flex flex-1 items-center justify-center">
                  <span
                    className="font-black tabular-nums text-white drop-shadow"
                    style={{
                      fontSize: `${statFonts.maxFontSize}px`,
                      lineHeight: 0.9,
                    }}
                  >
                    {tower.hp}
                    <span className="align-top text-[0.45em] text-white/70">
                      /{tower.maxHp}
                    </span>
                  </span>
                </div>
                <span className="mb-1 block text-[0.64rem] font-black uppercase tracking-[0.16em] text-white/80">
                  {getNoiseTowerConditionLabel(tower)}
                </span>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/15 bg-black/35 p-3 text-center shadow-inner">
            <span className="block text-[0.68rem] font-black uppercase tracking-[0.2em] text-slate-200/75">
              Noisy Points
            </span>
            <span
              className="block font-black tabular-nums text-white"
              style={{
                fontSize: `${statFonts.maxFontSize}px`,
                lineHeight: 0.9,
              }}
            >
              {tracker.noisyPoints}
            </span>
          </div>
          <div className="rounded-2xl border border-white/15 bg-black/35 p-3 text-center shadow-inner">
            <span className="block text-[0.68rem] font-black uppercase tracking-[0.2em] text-slate-200/75">
              Lap Minutes
            </span>
            <span
              className="block font-black tabular-nums text-white"
              style={{
                fontSize: `${statFonts.maxFontSize}px`,
                lineHeight: 0.9,
              }}
            >
              {tracker.lapMinutes}
            </span>
          </div>
        </div>

        <p className="rounded-2xl border border-white/12 bg-black/35 px-4 py-3 text-center text-sm font-bold uppercase tracking-[0.14em] text-slate-50 shadow-inner md:text-base">
          {tracker.voiceLevel === 'off'
            ? 'Tracker paused. Repair and reset stay manual.'
            : getNoiseTrackerTowerStatus(tracker)}
        </p>
      </div>
    </article>
  )
}
