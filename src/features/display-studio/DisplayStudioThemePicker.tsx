import { DISPLAY_STUDIO_THEMES, resolveThemeBackground } from './themeRegistry'
import { resolveDisplayBackground } from '../display-composer/backgroundStyles'
import { useDisplayStudioUI } from './useDisplayStudioUI'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import type { DisplayScreenBackground } from '../display-composer/types'

/**
 * Phase 15G — Inline theme picker shown in the inspector Style section.
 * Shows all 10 themes as color swatch cards with preview and apply.
 */
export function DisplayStudioThemePicker() {
  const { selectedScreenId } = useDisplayStudioUI()
  const updateScreen = useDisplayComposerStore((s) => s.updateScreen)
  const screens = useDisplayComposerStore((s) => s.screens)

  const screen = selectedScreenId ? screens[selectedScreenId] : undefined
  if (!screen) return null

  const currentBg = screen.background

  const handleApplyTheme = (themeId: string) => {
    const resolved = resolveThemeBackground(themeId as Parameters<typeof resolveThemeBackground>[0])
    updateScreen(screen.id, {
      background: { type: resolved.type, token: resolved.token } as DisplayScreenBackground,
    })
  }

  return (
    <div className="mt-2" data-display-studio-theme-picker>
      <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
        Theme
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        {DISPLAY_STUDIO_THEMES.map((theme) => {
          const resolved = resolveDisplayBackground({
            type: theme.backgroundType,
            token: theme.backgroundToken,
          })
          const isActive = currentBg.token === theme.backgroundToken && currentBg.type === theme.backgroundType
          return (
            <button
              key={theme.id}
              type="button"
              className={`flex flex-col items-start rounded-lg border p-2 text-left transition ${
                isActive
                  ? 'border-cyan-400/60 bg-cyan-950/30 ring-1 ring-cyan-400/40'
                  : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
              }`}
              onClick={() => handleApplyTheme(theme.id)}
              title={theme.description}
            >
              {/* Color swatch bar */}
              <div
                className="h-6 w-full rounded"
                style={{
                  background:
                    resolved.backgroundImage !== 'none'
                      ? resolved.backgroundImage
                      : resolved.backgroundColor ?? '#0f172a',
                }}
              />
              <span className="mt-1 text-[10px] font-semibold text-slate-200 truncate w-full">
                {theme.label}
              </span>
              <div className="mt-0.5 flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: theme.accentColor }}
                  aria-hidden
                />
                <span className="text-[8px] text-slate-500 truncate">{theme.categories[0]}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
