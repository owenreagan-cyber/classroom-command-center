import { useDisplayComposerStore } from './displayComposerStore'
import { toDisplaySafeScreen } from './displaySafe'
import { DisplayScreenRenderer } from './DisplayScreenRenderer'

/**
 * Mounted on /display via `DisplayOverlayHost` (Clean Board host), like the
 * Prize Board / Random Number overlays. Renders nothing unless a teacher has
 * sent a composed screen to the display; falls through to the normal board
 * view otherwise. studentSafe=false screens never render here.
 *
 * The parent (`DisplayOverlayHost`) also gates this on blank/black screen
 * state; the check below is a second, redundant guard so this component is
 * safe to mount from elsewhere too.
 */
export function DisplayComposerOverlay() {
  const activeScreenId = useDisplayComposerStore((s) => s.activeScreenId)
  const screen = useDisplayComposerStore((s) =>
    s.activeScreenId ? s.screens[s.activeScreenId] : undefined,
  )
  const displayBlanked = useDisplayComposerStore((s) => s.displayBlanked)

  if (!activeScreenId || displayBlanked) return null

  const safeScreen = toDisplaySafeScreen(screen)
  if (!safeScreen) return null

  return (
    <div className="absolute inset-0 z-30 animate-in fade-in duration-300">
      <DisplayScreenRenderer screen={safeScreen} variant="display" />
    </div>
  )
}
