import type { TimerConfig, TimerPresetId, TimerTone } from './types'
import {
  TIMER_MAX_MINUTES,
  TIMER_PRESET_IDS,
  TIMER_TONES,
  clampTimerMinutes,
  formatTimerDuration,
  getTimerPreset,
  timerConfigFromPreset,
} from './timerPresets'

/**
 * DB-4D — teacher-only timer editor (edit mode only).
 *
 * Compact controls for the selected timer: preset selector (applies a preset,
 * updating title/duration/tone), title field, duration-minutes field, tone
 * selector, and quick-start buttons for the most common routines. Never
 * rendered in present mode; the parent gates it behind edit mode + selection.
 */

const field =
  'w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none'
const label = 'text-[10px] font-semibold uppercase tracking-wide text-slate-500'
const segBtn = 'rounded-md px-2 py-1 text-xs font-semibold transition'
const segActive = 'border-cyan-400 bg-slate-800 text-white'
const segIdle = 'border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700'
const chip =
  'rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-[10px] font-semibold text-slate-300 transition hover:border-slate-500 hover:text-slate-100'

const TONE_ACCENTS: Record<TimerTone, string> = {
  neutral: '#94a3b8',
  calm: '#34d399',
  focus: '#38bdf8',
  urgent: '#fbbf24',
  success: '#22c55e',
}

const QUICK_START_PRESETS: TimerPresetId[] = [
  'morningWork',
  'mathSprint',
  'independentWork',
  'cleanup',
  'transition',
  'exitTicket',
]

interface TimerTeacherPanelProps {
  config: TimerConfig
  onChange: (next: TimerConfig) => void
  /** Fill the parent drawer width instead of a fixed 288px side panel. */
  fullWidth?: boolean
}

export function TimerTeacherPanel({
  config,
  onChange,
  fullWidth = false,
}: TimerTeacherPanelProps) {
  const applyPreset = (presetId: TimerPresetId) => {
    onChange(timerConfigFromPreset(presetId))
  }

  const setDuration = (raw: string) => {
    const parsed = Number(raw)
    const minutes = clampTimerMinutes(parsed)
    onChange({ ...config, durationMinutes: minutes, label: formatTimerDuration(minutes) })
  }

  return (
    <aside
      className={`flex h-full flex-col gap-3 overflow-y-auto bg-slate-900/40 p-3 ${
        fullWidth ? 'w-full' : 'w-72 shrink-0 border-l border-slate-800'
      }`}
      data-timer-panel
    >
      <h2 className="m-0 text-xs font-bold uppercase tracking-wider text-slate-200">Timer</h2>

      <div className="space-y-1">
        <label className={label} htmlFor="timer-preset">
          Preset
        </label>
        <select
          id="timer-preset"
          className={field}
          value={config.presetId}
          onChange={(e) => applyPreset(e.target.value as TimerPresetId)}
          data-timer-preset
        >
          {TIMER_PRESET_IDS.filter((id) => id !== 'custom').map((id) => (
            <option key={id} value={id}>
              {timerPresetLabel(id)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-1.5" data-timer-quick-start>
        {QUICK_START_PRESETS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => applyPreset(id)}
            className={chip}
            data-timer-quick={id}
          >
            {timerPresetLabel(id)}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <label className={label} htmlFor="timer-title">
          Title
        </label>
        <input
          id="timer-title"
          className={field}
          value={config.title}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
          placeholder="Timer title"
          data-timer-title
        />
      </div>

      <div className="space-y-1">
        <label className={label} htmlFor="timer-duration">
          Duration (minutes, 1–{TIMER_MAX_MINUTES})
        </label>
        <input
          id="timer-duration"
          className={field}
          type="number"
          min={1}
          max={TIMER_MAX_MINUTES}
          step={1}
          value={config.durationMinutes}
          onChange={(e) => setDuration(e.target.value)}
          data-timer-duration
        />
      </div>

      <div className="space-y-1">
        <span className={label}>Tone</span>
        <div className="flex flex-wrap gap-1.5">
          {TIMER_TONES.map((tone) => {
            const active = config.tone === tone
            return (
              <button
                key={tone}
                type="button"
                onClick={() => onChange({ ...config, tone })}
                className={`${segBtn} flex items-center gap-1.5 border capitalize ${
                  active ? segActive : segIdle
                }`}
                data-timer-tone={tone}
                data-active={active || undefined}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: TONE_ACCENTS[tone] }}
                />
                {tone}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => applyPreset(config.presetId === 'custom' ? 'morningWork' : config.presetId)}
        className="mt-1 rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
        data-timer-reset-preset
      >
        Apply preset
      </button>
    </aside>
  )
}

function timerPresetLabel(id: TimerPresetId): string {
  return getTimerPreset(id).label
}
