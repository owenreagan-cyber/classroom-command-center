import { memo } from 'react'
import { useAtmosphereStore, getDisplayMusicLabel } from './atmosphereStore'

/** Student-safe music indicator — mode label only, no URLs or controls. */
export const MusicDisplayIndicator = memo(function MusicDisplayIndicator() {
  const showOnDisplay = useAtmosphereStore((s) => s.showOnDisplay)
  const activeMode = useAtmosphereStore((s) => s.activeMode)
  const isPlaying = useAtmosphereStore((s) => s.isPlaying)

  if (!showOnDisplay || !activeMode || !isPlaying) return null

  const label = getDisplayMusicLabel(activeMode)
  if (!label) return null

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-emerald-200 backdrop-blur-md"
      role="status"
      aria-label={`Music: ${label}`}
      data-testid="music-display-indicator"
    >
      <span aria-hidden="true">♪</span>
      {label}
    </div>
  )
})
