import { DISPLAY_MODE_IDS, DISPLAY_MODES } from './displayModes'
import type { DisplayModeId } from './types'

/**
 * DB-4F — teacher-only display-mode selector (edit mode only).
 *
 * A compact picker so a teacher can switch classroom presentation modes with
 * one action. Never rendered in present mode; the parent gates it behind edit
 * mode. Selecting a mode only changes the projection preference — it never
 * mutates board objects or scenes.
 */
export function DisplayModeSelector({
  value,
  onChange,
}: {
  value: DisplayModeId
  onChange: (id: DisplayModeId) => void
}) {
  return (
    <label
      className="flex items-center gap-2"
      data-display-mode-selector
      title={DISPLAY_MODES[value].description}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Display Mode</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DisplayModeId)}
        className="rounded-lg border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-xs font-semibold text-slate-200 focus:border-emerald-500 focus:outline-none"
        data-display-mode-select
      >
        {DISPLAY_MODE_IDS.map((id) => (
          <option key={id} value={id}>
            {DISPLAY_MODES[id].name}
          </option>
        ))}
      </select>
    </label>
  )
}
