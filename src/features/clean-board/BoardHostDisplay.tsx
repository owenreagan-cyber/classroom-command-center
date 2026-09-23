import { useMemo, useState } from 'react'
import { BoardCanvas } from './BoardCanvas'
import { loadHostDisplayState, projectHostDisplayPage } from './displayHost'
import { useWakeLock } from './useWakeLock'
import { unlockSynthesizer } from '../../lib/audio/synthesizer'
import { ProjectedStampCard } from '../../widgets/ProjectedStampCard'
import { QRCodeWidget } from '../../widgets/QRCodeWidget'
import { DisplayOverlayHost } from './DisplayOverlayHost'
import { DisplayFullscreenControl } from './DisplayFullscreenControl'

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
 *
 * Phase 4 (DB-Milestones/DB-QR) adds two teacher-cast overlays on top of the
 * board content: `ProjectedStampCard` (a live stamp-progress card + milestone
 * celebration, sourced only through `stampProjectionChannel.ts`'s narrow
 * read-only hooks — never the full stamp store) and `QRCodeWidget` (renders
 * whatever URL the teacher cast from Board Lab). Both render nothing until a
 * teacher explicitly activates them.
 */
export function BoardHostDisplay() {
  const resolved = useMemo(() => loadHostDisplayState(), [])
  const page = useMemo(() => projectHostDisplayPage(resolved), [resolved])
  const [soundUnlocked, setSoundUnlocked] = useState(false)

  // Silent keep-awake (no toggle UI on the student display).
  useWakeLock(true)

  return (
    <div
      className="relative flex h-dvh w-dvw overflow-hidden bg-slate-950"
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

      <ProjectedStampCard />
      <QRCodeWidget />

      {/* Cast-to-display overlay pipeline (Prize Board, Random Number,
          Display Composer, Morning Message, Now Showing). */}
      <DisplayOverlayHost />

      {/* Auto-hiding "Enter fullscreen" affordance + cursor auto-hide.
          Never shown to students during a normal lesson -- only appears on
          mouse movement. See DisplayFullscreenControl.tsx. */}
      <DisplayFullscreenControl />

      {/* A projector display has nobody physically clicking it in normal
          use, but browsers only allow a milestone fanfare to actually play
          once the shared AudioContext has been resumed inside a real user
          gesture at least once — this one-time banner is that gesture. */}
      {!soundUnlocked && (
        <button
          type="button"
          onClick={() => {
            unlockSynthesizer()
            setSoundUnlocked(true)
          }}
          className="absolute bottom-6 right-6 z-50 min-h-[44px] rounded-full border border-slate-600 bg-slate-900/85 px-4 py-2 text-xs font-semibold text-slate-200 shadow-lg backdrop-blur transition hover:bg-slate-800"
          data-display-sound-unlock
        >
          🔊 Tap to enable classroom sound
        </button>
      )}
    </div>
  )
}

export default BoardHostDisplay
