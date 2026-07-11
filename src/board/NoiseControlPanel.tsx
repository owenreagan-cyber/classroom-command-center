import { useState, useEffect } from 'react'
import type { NoiseTrackerId, NoiseTrackerState, VoiceLevel, ScreenId } from '../data/types'
import {
  getNoiseTrackerIdForScreen,
} from '../lib/noiseTowers'

const TRACKER_ORDER: NoiseTrackerId[] = ['homeroom', 'math', 'reading']

const VOICE_LEVEL_LABELS: Record<VoiceLevel, string> = {
  silent: '0 Silent',
  whisper: '1 Whisper',
  normal: '2 Normal Voice',
  off: 'Off / Inactive',
}

interface NoiseControlPanelProps {
  noiseTrackers: Record<NoiseTrackerId, NoiseTrackerState>
  activeScreen?: ScreenId
  onVoiceLevelChange: (trackerId: NoiseTrackerId, voiceLevel: VoiceLevel) => void
  onResetTracker: (trackerId: NoiseTrackerId) => void
}

export function NoiseControlPanel({
  noiseTrackers,
  activeScreen,
  onVoiceLevelChange,
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
          Voice Level & Traffic Light
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Set voice expectations for students. No microphone is used. This is a
          manual visual guide.
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
                    <h3
                      className={`text-sm font-black tracking-tight ${isActive ? 'text-cyan-50' : 'text-slate-200'}`}
                    >
                      {tracker.label.replace(' Noise', '')}
                    </h3>
                    {isActive && (
                      <span className="rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/40 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest animate-pulse">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 1. Voice Limit (Policy) */}
              <div className="space-y-2 rounded-xl bg-slate-900/40 p-3 border border-slate-800/50">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Select Visual expectation
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(VOICE_LEVEL_LABELS) as VoiceLevel[]).map(
                    (level) => {
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
                            <span className="uppercase tracking-wide">
                              {VOICE_LEVEL_LABELS[level]}
                            </span>
                          </div>
                        </button>
                      )
                    },
                  )}
                </div>
              </div>

              {/* Tower Defenses and other stats parked for future phase */}
              <div className="pt-2">
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
                  className={`w-full rounded-lg border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all duration-150 ${
                    confirmResetId === trackerId
                      ? 'border-rose-500 bg-rose-500 text-white animate-pulse'
                      : 'border-slate-800 text-slate-600 hover:text-slate-400'
                  }`}
                >
                  {confirmResetId === trackerId ? 'Confirm Reset All' : 'Reset Tracker State'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
