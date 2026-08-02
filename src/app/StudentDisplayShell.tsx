import { useState } from 'react'
import { RandomNumberDisplay } from '../features/random-number/components/RandomNumberDisplay'
import { shouldShowRandomNumberDisplay } from '../features/random-number/displaySafe'
import { useRandomNumberStore } from '../features/random-number/randomNumberStore'
import { PrizeBoardProjectorMode } from '../features/prize-board/components/PrizeBoardProjectorMode'
import { shouldShowProjectorMode } from '../features/prize-board/pressYourLuck/spinEngine'
import { usePressYourLuckStore } from '../features/prize-board/pressYourLuck/pressYourLuckStore'
import { DisplayComposerOverlay } from '../features/display-composer/DisplayComposerOverlay'
import { useDisplayComposerStore } from '../features/display-composer/displayComposerStore'
import { BoardWorkspace } from './BoardWorkspace'
import {
  FULLSCREEN_DENIED_MESSAGE,
  FULLSCREEN_UNAVAILABLE_MESSAGE,
  isBrowserFullscreen,
  requestBrowserFullscreen,
} from './displayFullscreen'

/** Student/projector route — classroom content only; no teacher-only components mount. */
export function StudentDisplayShell() {
  const [fullscreenNotice, setFullscreenNotice] = useState<string | null>(null)
  const pylPhase = usePressYourLuckStore((s) => s.phase)
  const projectorActive = shouldShowProjectorMode(pylPhase)
  const randomNumberResult = useRandomNumberStore((s) => s.lastResult)
  const randomNumberShow = useRandomNumberStore((s) => s.showOnDisplay)
  const randomNumberActive = shouldShowRandomNumberDisplay(randomNumberResult, randomNumberShow)
  const composerScreen = useDisplayComposerStore((s) =>
    s.activeScreenId ? s.screens[s.activeScreenId] : undefined,
  )
  // Precedence: Prize Board > Random Number > Display Composer > normal board.
  // Gated on studentSafe, not just "an id is set" — a screen the teacher marked
  // not-safe must fall back to the normal board, never blank the display.
  const composerActive = Boolean(composerScreen?.studentSafe) && !projectorActive && !randomNumberActive

  const handleEnterFullscreen = async () => {
    const result = await requestBrowserFullscreen(document)
    if (result.ok) {
      setFullscreenNotice(null)
      return
    }
    setFullscreenNotice(
      result.reason === 'unavailable'
        ? FULLSCREEN_UNAVAILABLE_MESSAGE
        : FULLSCREEN_DENIED_MESSAGE,
    )
  }

  return (
    <div className="relative flex h-dvh w-dvw overflow-hidden bg-slate-950">
      {!projectorActive && !composerActive && <BoardWorkspace effectiveMode="display" studentDisplay />}
      {composerActive && <DisplayComposerOverlay />}
      <PrizeBoardProjectorMode />
      <RandomNumberDisplay />
      {!projectorActive && (
      <div className="pointer-events-none absolute bottom-[max(1rem,var(--board-safe-bottom,1rem))] right-[max(1rem,var(--board-safe-x,1rem))] z-40">
        <button
          type="button"
          onClick={() => {
            void handleEnterFullscreen()
          }}
          className="display-fullscreen-btn pointer-events-auto rounded-xl border border-white/20 bg-slate-950/65 px-4 py-2 text-sm font-semibold text-white/90 shadow-lg backdrop-blur transition hover:bg-slate-950/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          aria-label={isBrowserFullscreen(document) ? 'Exit fullscreen via browser' : 'Enter fullscreen'}
        >
          {isBrowserFullscreen(document) ? 'Fullscreen On' : 'Enter Fullscreen'}
        </button>
        {fullscreenNotice && (
          <p
            role="status"
            className="pointer-events-auto mt-2 max-w-xs rounded-xl border border-amber-400/30 bg-amber-950/80 px-3 py-2 text-xs leading-relaxed text-amber-100/90 backdrop-blur"
          >
            {fullscreenNotice}
          </p>
        )}
      </div>
      )}
    </div>
  )
}
