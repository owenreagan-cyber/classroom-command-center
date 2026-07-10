import { getPresetsForScreen } from '../data/boardPresets'
import type { BoardPresetId, ScreenId } from '../data/types'

interface BoardPresetPanelProps {
  activeScreen: ScreenId
  onApplyPreset: (presetId: BoardPresetId) => void
}

export function BoardPresetPanel({
  activeScreen,
  onApplyPreset,
}: BoardPresetPanelProps) {
  const presets = getPresetsForScreen(activeScreen)

  if (presets.length === 0) {
    return (
      <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Quick Setup
        </h2>
        <p className="text-xs leading-relaxed text-slate-500">
          No quick setup presets are available for this screen yet.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Quick Setup
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Applies a starter setup to this screen only. It overwrites this
          screen’s text and materials, but keeps card visibility and timers.
        </p>
      </div>

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

      <p className="rounded-xl border border-amber-400/20 bg-amber-950/20 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
        Presets are local and safe, but they replace current text on this screen.
        Edit after applying if you need today-specific wording.
      </p>
    </section>
  )
}
