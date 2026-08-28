import { useState } from 'react'
import type { BoardPage, DisplayModeId } from './types'
import { BACKGROUND_PRESETS, isBackgroundPresetId } from './backgrounds'
import { BOARD_THEME_IDS, BOARD_THEMES, isBoardThemeId } from './themes'
import { clampTimerMinutes } from './timerPresets'
import {
  ASSISTANT_EXAMPLE_PROMPTS,
  displayModeIdForRoutine,
  parseRoutinePrompt,
  reviseRoutinePlan,
  routinePlanToBoardPage,
  routinePlanToSavedLayout,
  routinePlanToScene,
} from './routinePromptPlanner'
import type { RoutinePlan } from './routinePromptPlanner'
import {
  createEmptyBoardState,
} from './storage/boardSerialization'
import {
  loadPersistedBoardState,
  persistBoardState,
  saveLayout,
  saveScene,
  setActiveLayout,
  setActiveScene,
} from './storage/boardStorage'

/**
 * DB-7C — prompt routine builder panel.
 *
 * Teacher-facing, edit-mode-only surface where a teacher types what they want
 * for the classroom display and gets a previewable, editable routine scene —
 * with no AI provider, no network, and no parallel runtime. Applying produces
 * normal Clean Board state that flows through autosave / scene / present /
 * host-display exactly like hand-authored content.
 */

const inputCls =
  'min-h-[44px] w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none'
const labelCls = 'text-[10px] font-semibold uppercase tracking-wide text-slate-500'
const primaryBtn =
  'min-h-[44px] rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40'
const ghostBtn =
  'min-h-[44px] rounded-md border border-slate-700 bg-slate-800/60 px-2.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40'
const chipCls =
  'min-h-[36px] rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-slate-100'

const QUICK_REVISIONS = [
  'Make it shorter',
  'Add turn in folders',
  'Change timer to 20 minutes',
  'No music',
]

interface RoutinePromptPanelProps {
  onApply: (page: BoardPage, displayModeId: DisplayModeId) => void
  fullWidth?: boolean
}

export function RoutinePromptPanel({ onApply, fullWidth = false }: RoutinePromptPanelProps) {
  const [promptText, setPromptText] = useState('')
  const [plan, setPlan] = useState<RoutinePlan | null>(null)
  const [status, setStatus] = useState<{ kind: 'error' | 'ok'; message: string } | null>(null)
  const [revisionText, setRevisionText] = useState('')
  const [revisionNote, setRevisionNote] = useState<{ kind: 'error' | 'ok'; message: string } | null>(null)

  const patchPlan = (patch: Partial<RoutinePlan>) =>
    setPlan((p) => (p ? { ...p, ...patch } : p))

  const handleGenerate = () => {
    const trimmed = promptText.trim()
    if (!trimmed) {
      setStatus({ kind: 'error', message: 'Type what you want to set up first.' })
      return
    }
    const next = parseRoutinePrompt(trimmed)
    setPlan(next)
    setStatus(null)
    setRevisionNote(null)
    setRevisionText('')
  }

  const handleClear = () => {
    setPromptText('')
    setPlan(null)
    setStatus(null)
    setRevisionNote(null)
    setRevisionText('')
  }

  const handleRevise = () => {
    if (!plan) return
    const instruction = revisionText.trim()
    if (!instruction) return
    const res = reviseRoutinePlan(plan, instruction)
    setPlan(res.plan)
    setRevisionNote(
      res.applied
        ? { kind: 'ok', message: res.note ?? 'Revision applied.' }
        : { kind: 'error', message: res.note ?? 'Could not apply that revision.' },
    )
    setRevisionText('')
  }

  const applyQuickRevision = (instruction: string) => {
    if (!plan) return
    const res = reviseRoutinePlan(plan, instruction)
    setPlan(res.plan)
    setRevisionNote(
      res.applied
        ? { kind: 'ok', message: res.note ?? 'Revision applied.' }
        : { kind: 'error', message: res.note ?? 'Could not apply that revision.' },
    )
  }

  const handleApply = () => {
    if (!plan) return
    onApply(routinePlanToBoardPage(plan), displayModeIdForRoutine(plan.kind))
    setStatus({ kind: 'ok', message: 'Applied to board' })
  }

  const handleSaveScene = () => {
    if (!plan) return
    const layout = routinePlanToSavedLayout(plan)
    const scene = routinePlanToScene(plan, layout)
    let state = loadPersistedBoardState() ?? createEmptyBoardState()
    state = saveLayout(state, layout)
    state = saveScene(state, scene)
    state = setActiveScene(setActiveLayout(state, layout.id), scene.id)
    persistBoardState(state)
    onApply(routinePlanToBoardPage(plan), layout.displayModeId)
    setStatus({ kind: 'ok', message: 'Scene saved — now on the display' })
  }

  const handleOpenDisplay = () => {
    if (typeof window !== 'undefined') {
      window.open('/display', '_blank', 'noopener,noreferrer')
    }
  }

  const updateChecklistItem = (index: number, value: string) => {
    if (!plan) return
    const items = plan.checklistItems.map((it, i) => (i === index ? value : it))
    patchPlan({ checklistItems: items })
  }

  const removeChecklistItem = (index: number) => {
    if (!plan) return
    patchPlan({ checklistItems: plan.checklistItems.filter((_, i) => i !== index) })
  }

  const addChecklistItem = () => {
    if (!plan) return
    patchPlan({ checklistItems: [...plan.checklistItems, ''] })
  }

  const updateTimer = (index: number, patch: { title?: string; minutes?: number }) => {
    if (!plan) return
    const timers = plan.timers.map((t, i) =>
      i === index
        ? {
            ...t,
            ...(patch.title !== undefined ? { title: patch.title } : {}),
            ...(patch.minutes !== undefined ? { minutes: clampTimerMinutes(patch.minutes) } : {}),
          }
        : t,
    )
    patchPlan({ timers })
  }

  const removeTimer = (index: number) => {
    if (!plan) return
    const timers = plan.timers.filter((_, i) => i !== index)
    patchPlan({ timers: timers.length > 0 ? timers : [{ title: 'Work Time', minutes: 20, tone: 'neutral' }] })
  }

  const addTimer = () => {
    if (!plan) return
    patchPlan({ timers: [...plan.timers, { title: 'Work Time', minutes: 5, tone: 'neutral' }] })
  }

  return (
    <div
      className={`flex h-full flex-col gap-3 overflow-y-auto bg-slate-900/40 p-3 ${
        fullWidth ? 'w-full' : 'w-80 shrink-0'
      }`}
      data-routine-prompt-panel
    >
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-xs font-bold uppercase tracking-wider text-slate-200">
          ✨ Board Assistant
        </h2>
      </div>

      <p className="m-0 text-xs leading-relaxed text-slate-400">
        Describe the classroom routine and Clean Board will set it up for you.
      </p>

      <div className="flex flex-wrap gap-1.5" data-assistant-example-chips>
        {ASSISTANT_EXAMPLE_PROMPTS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={chipCls}
            onClick={() => {
              setPromptText(chip.prompt)
              setPlan(null)
              setStatus(null)
              setRevisionNote(null)
            }}
            data-assistant-chip={chip.id}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <label className={labelCls} htmlFor="routine-prompt-input">
        Tell Clean Board what to set up
      </label>
      <textarea
        id="routine-prompt-input"
        className="min-h-[140px] w-full resize-y rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs leading-relaxed text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder="Set up morning arrival for today. Students should complete math review, turn in folders, work quietly for 25 minutes, and be ready for math. Use a calm background and soft piano music."
        data-routine-prompt-textarea
      />
      <div className="flex gap-2">
        <button type="button" className={primaryBtn} onClick={handleGenerate} data-routine-generate>
          Generate Setup
        </button>
        <button type="button" className={ghostBtn} onClick={handleClear} data-routine-clear>
          Clear
        </button>
      </div>

      {status && (
        <p
          className={`m-0 text-xs font-medium ${status.kind === 'error' ? 'text-amber-400' : 'text-emerald-400'}`}
          role="status"
        >
          {status.message}
        </p>
      )}

      {plan && (
        <div className="flex flex-col gap-3" data-routine-preview>
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
              Preview
            </div>
            <p className="m-0 text-xs font-semibold text-slate-100">{plan.sceneName}</p>
            <p className="m-0 mt-0.5 text-xs text-slate-400">{plan.title}</p>
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <label className={labelCls}>Scene name</label>
              <input
                className={inputCls}
                value={plan.sceneName}
                onChange={(e) => patchPlan({ sceneName: e.target.value })}
                data-routine-scene-name
              />
            </div>
            <div>
              <label className={labelCls}>Title</label>
              <input
                className={inputCls}
                value={plan.title}
                onChange={(e) => patchPlan({ title: e.target.value })}
                data-routine-title
              />
            </div>
            <div>
              <label className={labelCls}>Intro line</label>
              <input
                className={inputCls}
                value={plan.intro}
                onChange={(e) => patchPlan({ intro: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className={labelCls}>Checklist</span>
              <button type="button" className={ghostBtn} onClick={addChecklistItem}>
                + Add
              </button>
            </div>
            {plan.checklistItems.map((item, i) => (
              <div key={i} className="flex gap-1">
                <input
                  className={inputCls}
                  value={item}
                  onChange={(e) => updateChecklistItem(i, e.target.value)}
                />
                <button
                  type="button"
                  className={`${ghostBtn} min-w-[44px]`}
                  onClick={() => removeChecklistItem(i)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className={labelCls}>Closing line</label>
            <input
              className={inputCls}
              value={plan.closing}
              onChange={(e) => patchPlan({ closing: e.target.value })}
              placeholder="Be ready for math!"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className={labelCls}>Timers</span>
              <button type="button" className={ghostBtn} onClick={addTimer}>
                + Add
              </button>
            </div>
            {plan.timers.map((t, i) => (
              <div key={i} className="flex items-center gap-1">
                <input
                  className={inputCls}
                  value={t.title}
                  onChange={(e) => updateTimer(i, { title: e.target.value })}
                />
                <input
                  className="min-h-[44px] w-16 rounded-md border border-slate-700 bg-slate-900/60 px-2 py-2 text-xs tabular-nums text-slate-200"
                  type="number"
                  min={1}
                  max={120}
                  value={t.minutes}
                  onChange={(e) => updateTimer(i, { minutes: parseInt(e.target.value, 10) || 1 })}
                />
                <span className="w-8 text-[10px] text-slate-500">min</span>
                <button
                  type="button"
                  className={`${ghostBtn} min-w-[44px]`}
                  onClick={() => removeTimer(i)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Background</label>
              <select
                className="min-h-[44px] w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-2 text-xs text-slate-200"
                value={plan.visualStyle.backgroundPresetId}
                onChange={(e) => {
                  const v = e.target.value
                  if (isBackgroundPresetId(v)) {
                    patchPlan({
                      visualStyle: { ...plan.visualStyle, backgroundPresetId: v },
                    })
                  }
                }}
              >
                {BACKGROUND_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Theme</label>
              <select
                className="min-h-[44px] w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-2 text-xs text-slate-200"
                value={plan.visualStyle.themeId}
                onChange={(e) => {
                  const v = e.target.value
                  if (isBoardThemeId(v)) {
                    patchPlan({ visualStyle: { ...plan.visualStyle, themeId: v } })
                  }
                }}
              >
                {BOARD_THEME_IDS.map((id) => (
                  <option key={id} value={id}>
                    {BOARD_THEMES[id].name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Sticker / graphic suggestion</label>
            <input
              className={inputCls}
              value={plan.visualStyle.accentGraphicSuggestion ?? ''}
              onChange={(e) =>
                patchPlan({
                  visualStyle: {
                    ...plan.visualStyle,
                    accentGraphicSuggestion: e.target.value || undefined,
                  },
                })
              }
              placeholder="A small school-themed accent"
            />
            <p className="m-0 mt-1 text-[10px] text-slate-500">
              Stored as a suggestion only — no generated image assets yet.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={plan.music.enabled}
                onChange={(e) => patchPlan({ music: { ...plan.music, enabled: e.target.checked } })}
                className="h-4 w-4"
              />
              <span className="text-xs font-semibold text-slate-200">Include music</span>
            </label>
            {plan.music.enabled && (
              <div className="mt-2 flex flex-col gap-2">
                <div>
                  <label className={labelCls}>Playlist name</label>
                  <input
                    className={inputCls}
                    value={plan.music.suggestedPlaylistName}
                    onChange={(e) =>
                      patchPlan({ music: { ...plan.music, suggestedPlaylistName: e.target.value } })
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Search terms (comma separated)</label>
                  <input
                    className={inputCls}
                    value={plan.music.searchTerms.join(', ')}
                    onChange={(e) =>
                      patchPlan({
                        music: {
                          ...plan.music,
                          searchTerms: e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                  />
                </div>
                <p className="m-0 text-[10px] text-slate-500">
                  Playlist suggestions only — live Spotify playback still requires the host session.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <label className={labelCls}>Need changes?</label>
            <div className="mt-2 flex gap-2">
              <input
                className={inputCls}
                value={revisionText}
                onChange={(e) => setRevisionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRevise()
                }}
                placeholder='e.g. "make it shorter", "add turn in folders", "change timer to 20 minutes"'
                data-routine-revision-input
              />
              <button
                type="button"
                className={ghostBtn}
                onClick={handleRevise}
                disabled={!revisionText.trim()}
                data-routine-revise
              >
                Revise
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_REVISIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={chipCls}
                  onClick={() => applyQuickRevision(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            {revisionNote && (
              <p
                className={`m-0 mt-2 text-xs font-medium ${
                  revisionNote.kind === 'error' ? 'text-amber-400' : 'text-emerald-400'
                }`}
                role="status"
                data-routine-revision-note
              >
                {revisionNote.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button type="button" className={primaryBtn} onClick={handleApply} data-routine-apply>
              Apply to Board
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                className={`${ghostBtn} flex-1`}
                onClick={handleSaveScene}
                data-routine-save-scene
              >
                Save as Scene
              </button>
              <button
                type="button"
                className={`${ghostBtn} flex-1`}
                onClick={handleOpenDisplay}
                data-routine-open-display
              >
                Open Display
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoutinePromptPanel
