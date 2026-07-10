import type { AppMode, NoiseTrackerState, VoiceLevel } from '../data/types'
import { boardCardShell } from '../lib/displayLayout'

const VOICE_LEVEL_LABELS: Record<VoiceLevel, string> = {
  silent: 'Silent',
  whisper: 'Whisper',
  normal: 'Normal',
  off: 'Off',
}

const VOICE_LEVEL_HELPER: Record<VoiceLevel, string> = {
  silent: 'No talking. Mission stealth mode.',
  whisper: 'Tiny voices. Keep the room calm.',
  normal: 'Cafe voices. Talk with control.',
  off: 'Tracker paused.',
}

interface NoiseStatusCardProps {
  tracker: NoiseTrackerState
  mode: AppMode
  className?: string
}

export function NoiseStatusCard({
  tracker,
  mode,
  className = '',
}: NoiseStatusCardProps) {
  const isPaused = tracker.voiceLevel === 'off' || tracker.isPaused
  const isWarning = tracker.meterLevel >= 65 && !isPaused
  const isCritical = tracker.meterLevel >= 85 && !isPaused

  return (
    <article
      className={`${boardCardShell(mode)} ${className} overflow-hidden border-slate-900/20 bg-slate-950/90 text-white shadow-2xl`}
    >
      <div
        className={`absolute inset-0 opacity-70 ${
          isCritical
            ? 'bg-[radial-gradient(circle_at_top_right,rgba(248,113,113,0.45),transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(127,29,29,0.9))]'
            : isWarning
              ? 'bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.45),transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(113,63,18,0.85))]'
              : 'bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.35),transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(8,47,73,0.85))]'
        }`}
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-black uppercase tracking-[0.24em] text-cyan-100/80">
              Noise Defense
            </p>
            <h2 className="mt-1 text-3xl font-black uppercase tracking-tight text-white drop-shadow md:text-4xl">
              {tracker.label.replace(' Noise', '')}
            </h2>
          </div>

          <div
            className={`rounded-2xl border px-4 py-2 text-right shadow-lg ${
              isPaused
                ? 'border-slate-400/40 bg-slate-900/70 text-slate-200'
                : isCritical
                  ? 'border-rose-200/70 bg-rose-500/30 text-rose-50'
                  : isWarning
                    ? 'border-amber-200/70 bg-amber-500/30 text-amber-50'
                    : 'border-emerald-200/60 bg-emerald-500/20 text-emerald-50'
            }`}
          >
            <span className="block text-[0.65rem] font-black uppercase tracking-[0.18em] opacity-80">
              Level
            </span>
            <span className="block text-xl font-black">
              {VOICE_LEVEL_LABELS[tracker.voiceLevel]}
            </span>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.18em] text-slate-200/80">
            <span>Room Meter</span>
            <span>{tracker.meterLevel}%</span>
          </div>
          <div className="h-5 overflow-hidden rounded-full border border-white/20 bg-black/50 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isPaused
                  ? 'bg-slate-500'
                  : isCritical
                    ? 'bg-rose-400'
                    : isWarning
                      ? 'bg-amber-300'
                      : 'bg-emerald-300'
              }`}
              style={{ width: `${tracker.meterLevel}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/15 bg-black/35 p-3 text-center">
            <span className="block text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-300">
              Noisy Points
            </span>
            <span className="mt-1 block text-5xl font-black text-white">
              {tracker.noisyPoints}
            </span>
          </div>
          <div className="rounded-2xl border border-white/15 bg-black/35 p-3 text-center">
            <span className="block text-[0.65rem] font-black uppercase tracking-[0.18em] text-slate-300">
              Laps
            </span>
            <span className="mt-1 block text-5xl font-black text-white">
              {tracker.lapMinutes}
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
              minutes
            </span>
          </div>
        </div>

        <p className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center text-sm font-bold uppercase tracking-[0.12em] text-slate-100">
          {isCritical
            ? 'Critical surge — reset the room.'
            : isWarning
              ? 'Warning zone — lower the volume.'
              : VOICE_LEVEL_HELPER[tracker.voiceLevel]}
        </p>
      </div>
    </article>
  )
}
