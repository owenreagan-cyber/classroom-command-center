import type { BoardBackground, BoardTheme, ReadabilityOverlay } from './types'
import { BACKGROUND_PRESETS, effectiveOverlay } from './backgrounds'
import { BOARD_THEME_IDS, BOARD_THEMES } from './themes'

/**
 * DB-4B — teacher-only "Board Look" panel (edit mode only).
 *
 * Compact background/theme picker. Never rendered in present mode; the parent
 * gates it behind edit mode. Selecting a background preset, theme, or overlay
 * calls back into the board shell, which owns the board state and autosave.
 */

const btn =
  'rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs font-semibold text-slate-200 transition hover:bg-slate-700'

const OVERLAY_OPTIONS: ReadabilityOverlay[] = ['none', 'soft', 'strong']

interface BoardLookPanelProps {
  background: BoardBackground
  theme: BoardTheme
  onSetBackground: (bg: BoardBackground) => void
  onSetTheme: (theme: BoardTheme) => void
  onReset: () => void
  /** Fill the parent drawer width instead of a fixed 256px side panel. */
  fullWidth?: boolean
}

export function BoardLookPanel({
  background,
  theme,
  onSetBackground,
  onSetTheme,
  onReset,
  fullWidth = false,
}: BoardLookPanelProps) {
  const activePresetId = background.type === 'preset' ? background.presetId : null
  const currentOverlay = effectiveOverlay(background)

  const selectPreset = (presetId: (typeof BACKGROUND_PRESETS)[number]['id']) => {
    onSetBackground({ type: 'preset', presetId })
  }

  const selectOverlay = (overlay: ReadabilityOverlay) => {
    onSetBackground({ ...background, readabilityOverlay: overlay })
  }

  return (
    <aside
      className={`flex h-full flex-col gap-3 overflow-y-auto bg-slate-900/40 p-3 ${
        fullWidth ? 'w-full' : 'w-64 shrink-0 border-l border-slate-800'
      }`}
      data-board-look-panel
    >
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-xs font-bold uppercase tracking-wider text-slate-200">
          Board Look
        </h2>
        <button
          type="button"
          className={btn}
          onClick={onReset}
          data-reset-look
          title="Reset to default background and theme"
        >
          Reset
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Background
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {BACKGROUND_PRESETS.map((preset) => {
            const active = activePresetId === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset.id)}
                className={`flex flex-col items-stretch gap-1 rounded-md border p-1 text-left transition ${
                  active
                    ? 'border-cyan-400 bg-slate-800'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'
                }`}
                data-background-preset={preset.id}
                data-active={active || undefined}
                title={preset.name}
              >
                <span
                  className="block h-7 w-full rounded border border-slate-700/60"
                  style={{ background: preset.css }}
                />
                <span className="truncate text-[10px] font-semibold text-slate-200">
                  {preset.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Readability
        </h3>
        <div className="flex gap-1.5">
          {OVERLAY_OPTIONS.map((overlay) => (
            <button
              key={overlay}
              type="button"
              onClick={() => selectOverlay(overlay)}
              className={`${btn} flex-1 capitalize ${
                currentOverlay === overlay
                  ? 'border-cyan-400 bg-slate-800 text-white'
                  : ''
              }`}
              data-overlay-option={overlay}
              data-active={currentOverlay === overlay || undefined}
            >
              {overlay}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="m-0 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Theme
        </h3>
        <div className="flex flex-col gap-1.5">
          {BOARD_THEME_IDS.map((id) => {
            const t = BOARD_THEMES[id]
            const active = theme.id === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSetTheme(t)}
                className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left transition ${
                  active
                    ? 'border-cyan-400 bg-slate-800'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-600'
                }`}
                data-theme-option={id}
                data-active={active || undefined}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: t.accent }}
                />
                <span className="flex-1 truncate text-xs font-semibold text-slate-200">
                  {t.name}
                </span>
                <span className="text-[10px] uppercase text-slate-500">{t.textTone}</span>
              </button>
            )
          })}
        </div>
      </div>

      <p className="m-0 text-[10px] text-slate-500">
        Backgrounds and themes save with the board and apply in present mode.
      </p>
    </aside>
  )
}
