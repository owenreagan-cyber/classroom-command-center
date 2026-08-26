import { useMemo } from 'react'
import { BoardCanvas } from './BoardCanvas'
import { loadHostDisplayState, projectHostDisplayPage } from './displayHost'
import { useWakeLock } from './useWakeLock'

/**
 * DB-7A — Clean Board host display.
 *
 * The student/projector route (`/display`) for the MacBook Air M1. Renders the
 * projected Clean Board content full-bleed with zero teacher chrome: no header,
 * no editor toolbar, no template/saved-boards panels, no Spotify builder, no
 * image upload, no debug controls, no page dots.
 *
 * It consumes the same normal Clean Board state + projection helpers as
 * `/board-lab?mode=present`, so a scene/layout saved in Board Lab appears here
 * unchanged. On a fresh machine it falls back to "Morning Arrival — New
 * Classroom" so the display is useful immediately.
 *
 * The screen wake lock is requested automatically: a classroom display host
 * should not sleep while it is on stage.
 */
export function BoardHostDisplay() {
  const resolved = useMemo(() => loadHostDisplayState(), [])
  const page = useMemo(() => projectHostDisplayPage(resolved), [resolved])

  // Silent keep-awake (no toggle UI on the student display).
  useWakeLock(true)

  return (
    <div
      className="flex h-dvh w-dvw overflow-hidden bg-slate-950"
      data-clean-board-host-display
      data-host-display-source={resolved.source}
    >
      <BoardCanvas
        background={page.background}
        objects={page.objects}
        mode="present"
        selectedObjectId={null}
        onSelect={() => {}}
        onMoveObject={() => {}}
        spotifyNowPlaying={null}
        accent={page.theme.accent}
        theme={page.theme}
      />
    </div>
  )
}

export default BoardHostDisplay
