import { useDisplayComposerStore } from './displayComposerStore'
import { toDisplaySafeScreen } from './displaySafe'
import { DisplayScreenRenderer } from './DisplayScreenRenderer'

/**
 * Mounted unconditionally on /display (StudentDisplayShell), like the Prize
 * Board / Random Number overlays. Renders nothing unless a teacher has sent a
 * composed screen to the display; falls through to the normal board view
 * otherwise. studentSafe=false screens never render here.
 */
export function DisplayComposerOverlay() {
  const activeScreenId = useDisplayComposerStore((s) => s.activeScreenId)
  const screen = useDisplayComposerStore((s) =>
    s.activeScreenId ? s.screens[s.activeScreenId] : undefined,
  )

  if (!activeScreenId) return null

  const safeScreen = toDisplaySafeScreen(screen)
  if (!safeScreen) return null

  return (
    <div className="absolute inset-0 z-30">
      <DisplayScreenRenderer screen={safeScreen} variant="display" />
    </div>
  )
}
