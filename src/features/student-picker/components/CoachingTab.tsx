import { usePickerStore } from '../pickerStore'
import { ALL_DEFAULT_LOOK_FORS } from '../defaults'
import type { ScreenId } from '../../../data/types'

export function CoachingTab() {
  const config = usePickerStore((s) => s.coachingConfig)
  const updateConfig = usePickerStore((s) => s.updateCoachingConfig)

  const toggleBehavior = (id: string) => {
    if (config.visibleBehaviors.includes(id)) {
      updateConfig({ visibleBehaviors: config.visibleBehaviors.filter((b) => b !== id) })
    } else {
      updateConfig({ visibleBehaviors: [...config.visibleBehaviors, id] })
    }
  }

  const toggleScreen = (screenId: ScreenId) => {
    if (config.showOnScreens.includes(screenId)) {
      updateConfig({ showOnScreens: config.showOnScreens.filter((s) => s !== screenId) })
    } else {
      updateConfig({ showOnScreens: [...config.showOnScreens, screenId] })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">Public Coaching Display</span>
        <button
          onClick={() => updateConfig({ enabled: !config.enabled })}
          className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
            config.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
          }`}
        >
          {config.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Show On Screens</label>
        <div className="flex flex-wrap gap-2">
          {(['homeroom', 'math', 'reading', 'writing', 'science'] as ScreenId[]).map((s) => (
            <button
              key={s}
              onClick={() => toggleScreen(s)}
              className={`rounded px-2 py-1 text-xs font-medium border ${
                config.showOnScreens.includes(s)
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto rounded-xl bg-slate-900/50 p-2">
        <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 px-1">Selected Behaviors</label>
        {ALL_DEFAULT_LOOK_FORS.map((bf) => (
          <label key={bf.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={config.visibleBehaviors.includes(bf.id)}
              onChange={() => toggleBehavior(bf.id)}
              className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
            />
            <span className="text-sm text-slate-300">{bf.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
