import { BACKGROUND_ASSETS } from '../data/backgroundAssets'
import { SCREEN_META } from '../data/defaults'
import type { AppMode, BackgroundAssetId, ScreenId } from '../data/types'

interface TeacherDockProps {
  mode: AppMode
  activeScreen: ScreenId
  backgroundId: BackgroundAssetId
  canUndoBeautify: boolean
  onModeChange: (mode: AppMode) => void
  onScreenChange: (screen: ScreenId) => void
  onBackgroundChange: (backgroundId: BackgroundAssetId) => void
  onBeautify: () => void
  onUndoBeautify: () => void
  onReset: () => void
}

export function TeacherDock({
  mode,
  activeScreen,
  backgroundId,
  canUndoBeautify,
  onModeChange,
  onScreenChange,
  onBackgroundChange,
  onBeautify,
  onUndoBeautify,
  onReset,
}: TeacherDockProps) {
  if (mode !== 'edit') {
    return null
  }

  return (
    <aside
      className="flex w-80 shrink-0 flex-col gap-5 overflow-y-auto border-r border-slate-700 bg-slate-950 p-5 text-slate-100"
      aria-label="Teacher controls"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
          Cyber-Slate HUD
        </p>
        <h1 className="mt-1 text-2xl font-bold text-white">Teacher Dock</h1>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Mode
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <DockButton
            active={mode === 'edit'}
            onClick={() => onModeChange('edit')}
            label="Edit"
          />
          <DockButton
            active={false}
            onClick={() => onModeChange('display')}
            label="Display"
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Screens
        </h2>
        <nav className="flex flex-col gap-2" aria-label="Screen navigation">
          {SCREEN_META.map((screen) => (
            <DockButton
              key={screen.id}
              active={activeScreen === screen.id}
              onClick={() => onScreenChange(screen.id)}
              label={screen.label}
            />
          ))}
        </nav>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Background
        </h2>
        <div className="flex flex-col gap-2">
          {BACKGROUND_ASSETS.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => onBackgroundChange(asset.id)}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-medium transition ${
                backgroundId === asset.id
                  ? 'border-cyan-400 bg-slate-800 text-white'
                  : 'border-slate-700 bg-slate-900/70 text-slate-200 hover:border-slate-500'
              }`}
            >
              <span
                className="h-8 w-8 shrink-0 rounded-lg border border-white/30"
                style={{ background: asset.fallbackGradient }}
                aria-hidden="true"
              />
              <span>
                <span className="block">{asset.label}</span>
                <span className="block text-xs text-slate-400">{asset.mood}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-auto space-y-2 pt-2">
        <button
          type="button"
          onClick={onBeautify}
          className="w-full rounded-xl border border-cyan-400/50 bg-cyan-950/40 px-3 py-3 text-base font-semibold text-cyan-100 transition hover:bg-cyan-900/50"
        >
          Beautify active screen
        </button>
        {canUndoBeautify && (
          <button
            type="button"
            onClick={onUndoBeautify}
            className="w-full rounded-xl border border-amber-400/50 bg-amber-950/40 px-3 py-3 text-base font-semibold text-amber-100 transition hover:bg-amber-900/50"
          >
            Undo Beautify
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-xl border border-rose-400/60 bg-rose-950/40 px-3 py-3 text-base font-semibold text-rose-100 transition hover:bg-rose-900/50"
        >
          Reset to defaults
        </button>
        <p className="text-xs leading-relaxed text-slate-400">
          Beautify is conservative and reversible. Display mode hides this dock.
        </p>
      </section>
    </aside>
  )
}

interface DockButtonProps {
  active: boolean
  label: string
  onClick: () => void
}

function DockButton({ active, label, onClick }: DockButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-3 text-left text-base font-semibold transition ${
        active
          ? 'bg-cyan-500 text-slate-950'
          : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  )
}
