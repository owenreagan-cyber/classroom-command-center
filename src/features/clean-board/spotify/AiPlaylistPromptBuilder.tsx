import { useState } from 'react'
import { playlistPromptGenerator, sanitizePlaylistPlan } from './playlistAiProvider'
import type { PlaylistEnergy, PlaylistPlan } from './playlistAiProvider'
import { useSpotifyStore } from './spotifyStore'

/**
 * DB-2F — AI classroom playlist prompt builder (teacher-only).
 *
 * Turns a free-text goal into a structured *search strategy*, then feeds the
 * first generated query into the existing Spotify search. Tracks still flow
 * through the teacher review/staging flow in the parent builder — this
 * component never creates a playlist and never adds tracks.
 */

const btn =
  'rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40'
const primary =
  'rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40'
const inputCls =
  'w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none'

export function AiPlaylistPromptBuilder() {
  const { searchForTracks, searching } = useSpotifyStore()

  const [goal, setGoal] = useState('')
  const [duration, setDuration] = useState(30)
  const [energy, setEnergy] = useState<PlaylistEnergy>('low')
  const [noExplicit, setNoExplicit] = useState(true)
  const [instrumental, setInstrumental] = useState(true)
  const [plan, setPlan] = useState<PlaylistPlan | null>(null)
  const [generating, setGenerating] = useState(false)

  const generate = async () => {
    if (!goal.trim()) return
    setGenerating(true)
    try {
      const restrictions = [
        ...(noExplicit ? ['no explicit lyrics'] : []),
        ...(instrumental ? ['instrumental preferred'] : []),
      ]
      const raw = await playlistPromptGenerator.generatePlan({
        goal: goal.trim(),
        durationMinutes: duration,
        energy,
        restrictions,
      })
      const safe = sanitizePlaylistPlan(raw)
      setPlan(safe)
      if (safe && safe.searchQueries.length > 0) {
        void searchForTracks(safe.searchQueries[0])
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-slate-800 bg-slate-900/40 p-3" data-ai-playlist-prompt>
      <div>
        <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
          AI playlist prompt
        </h3>
        <p className="m-0 mt-1 text-[11px] text-slate-500">
          Describe a classroom need — the app builds a search plan, then you review tracks.
        </p>
      </div>

      <textarea
        className={inputCls}
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Calm writing music for Friday afternoon. 4th grade. No lyrics. Piano/acoustic style."
        rows={3}
        data-ai-goal-input
      />

      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-1 text-xs text-slate-400">
          Duration
          <input
            type="number"
            min={1}
            max={120}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 30)}
            className="w-16 rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-slate-200"
            data-ai-duration-input
          />
          min
        </label>
        <label className="flex items-center gap-1 text-xs text-slate-400">
          Energy
          <select
            value={energy}
            onChange={(e) => setEnergy(e.target.value as PlaylistEnergy)}
            className="rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1 text-xs text-slate-200"
            data-ai-energy-select
          >
            <option value="low">Calm</option>
            <option value="medium">Steady</option>
            <option value="high">Upbeat</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={noExplicit} onChange={(e) => setNoExplicit(e.target.checked)} />
          No explicit
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={instrumental}
            onChange={(e) => setInstrumental(e.target.checked)}
          />
          Instrumental preferred
        </label>
      </div>

      <button
        type="button"
        className={primary}
        onClick={() => void generate()}
        disabled={generating || searching || !goal.trim()}
        data-ai-generate-button
      >
        {generating ? 'Generating…' : 'Generate Playlist Plan'}
      </button>

      {plan && (
        <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-950/20 p-2" data-ai-plan-card>
          <div className="flex items-center justify-between gap-2">
            <p className="m-0 text-sm font-semibold text-amber-100">{plan.title}</p>
            <span className="text-[10px] uppercase tracking-wide text-amber-400">{plan.energy} · {plan.durationMinutes}m</span>
          </div>
          <p className="m-0 text-xs text-slate-300">{plan.classroomPurpose}</p>
          {plan.requirements.length > 0 && (
            <p className="m-0 text-[11px] text-slate-400">Requirements: {plan.requirements.join(', ')}</p>
          )}
          <div className="space-y-1">
            <p className="m-0 text-[11px] font-semibold text-slate-400">Search queries</p>
            <div className="flex flex-wrap gap-1">
              {plan.searchQueries.map((q) => (
                <button
                  key={q}
                  type="button"
                  className={btn}
                  onClick={() => void searchForTracks(q)}
                  disabled={searching}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <p className="m-0 text-[11px] text-amber-200/80">{plan.teacherNotes}</p>
        </div>
      )}
    </div>
  )
}
