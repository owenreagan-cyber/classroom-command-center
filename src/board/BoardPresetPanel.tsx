import { useState } from 'react'
import { getPresetsForScreen } from '../data/boardPresets'
import type {
  BoardPresetId,
  CustomBoardPreset,
  ScreenId,
} from '../data/types'

interface BoardPresetPanelProps {
  activeScreen: ScreenId
  customPresets: CustomBoardPreset[]
  onApplyPreset: (presetId: BoardPresetId) => void
  onSaveCustomPreset: (label: string) => void
  onApplyCustomPreset: (presetId: string) => void
  onDeleteCustomPreset: (presetId: string) => void
}

export function BoardPresetPanel({
  activeScreen,
  customPresets,
  onApplyPreset,
  onSaveCustomPreset,
  onApplyCustomPreset,
  onDeleteCustomPreset,
}: BoardPresetPanelProps) {
  const [label, setLabel] = useState('')
  const presets = getPresetsForScreen(activeScreen)
  const matchingCustomPresets = customPresets.filter(
    (preset) => preset.screenId === activeScreen,
  )

  const handleSave = () => {
    onSaveCustomPreset(label)
    setLabel('')
  }

  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Quick Setup
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Applies a starter setup to this screen only. Presets overwrite text
          and materials, but keep card visibility and timers.
        </p>
      </div>

      {presets.length > 0 ? (
        <div className="flex flex-col gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset.id)}
              className="rounded-xl border border-cyan-400/40 bg-cyan-950/30 px-3 py-2 text-left text-sm text-cyan-50 transition hover:border-cyan-300 hover:bg-cyan-900/40"
            >
              <span className="block font-semibold">{preset.label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-cyan-100/70">
                {preset.helperText}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-xs leading-relaxed text-slate-500">
          No starter presets are available for this screen yet.
        </p>
      )}

      <div className="rounded-xl border border-slate-700 bg-slate-950/50 p-3">
        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">
          Save current screen
        </h3>
        <div className="mt-2 flex flex-col gap-2">
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Preset name"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          />
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg border border-emerald-400/40 bg-emerald-950/40 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-900/50"
          >
            Save custom preset
          </button>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Saves the current screen content only. Custom presets stay local in
          this browser.
        </p>
      </div>

      {matchingCustomPresets.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">
            Custom presets
          </h3>
          {matchingCustomPresets.map((preset) => (
            <div
              key={preset.id}
              className="rounded-xl border border-slate-700 bg-slate-950/50 p-2"
            >
              <button
                type="button"
                onClick={() => onApplyCustomPreset(preset.id)}
                className="w-full rounded-lg border border-violet-400/40 bg-violet-950/30 px-3 py-2 text-left text-sm text-violet-50 transition hover:bg-violet-900/40"
              >
                <span className="block font-semibold">{preset.label}</span>
                <span className="mt-0.5 block text-xs text-violet-100/70">
                  Saved {new Date(preset.createdAt).toLocaleDateString()}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteCustomPreset(preset.id)}
                className="mt-2 w-full rounded-lg border border-rose-400/30 bg-rose-950/20 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-900/40"
              >
                Delete custom preset
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="rounded-xl border border-amber-400/20 bg-amber-950/20 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
        Presets are local and safe, but they replace current text on their
        screen. Edit after applying if you need today-specific wording.
      </p>
    </section>
  )
}
