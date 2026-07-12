import { usePickerStore } from '../pickerStore'

export function SettingsTab() {
  const settings = usePickerStore((s) => s.settings)
  const updateSettings = usePickerStore((s) => s.updateSettings)

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
        Reveal Preferences
      </h3>

      <div className="space-y-3 rounded-xl bg-slate-900/50 p-3 border border-slate-700">
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-slate-200 group-hover:text-white transition">Reduce Motion</span>
            <p className="text-[10px] text-slate-500">Shorten or remove ambient reveal animations.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => updateSettings({ reducedMotion: e.target.checked })}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer group pt-2 border-t border-slate-800">
          <div className="space-y-0.5">
            <span className="text-sm font-medium text-slate-200 group-hover:text-white transition">Skip Reveal Animation</span>
            <p className="text-[10px] text-slate-500">Jump immediately to the revealed student.</p>
          </div>
          <input
            type="checkbox"
            checked={settings.skipAnimation}
            onChange={(e) => updateSettings({ skipAnimation: e.target.checked })}
            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
          />
        </label>
      </div>

      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
        <p className="text-[10px] leading-tight text-amber-200/70">
          <strong>Note:</strong> System-level "Reduced Motion" preferences are also respected automatically.
        </p>
      </div>
    </div>
  )
}
