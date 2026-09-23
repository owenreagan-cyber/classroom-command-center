import { PrizeBoardProjectorMode } from '../prize-board/components/PrizeBoardProjectorMode'
import { shouldShowProjectorMode } from '../prize-board/pressYourLuck/spinEngine'
import { usePressYourLuckStore } from '../prize-board/pressYourLuck/pressYourLuckStore'
import { RandomNumberDisplay } from '../random-number/components/RandomNumberDisplay'
import { shouldShowRandomNumberDisplay } from '../random-number/displaySafe'
import { useRandomNumberStore } from '../random-number/randomNumberStore'
import { DisplayComposerOverlay } from '../display-composer/DisplayComposerOverlay'
import { useDisplayComposerStore } from '../display-composer/displayComposerStore'
import { useBoardStore } from '../../store/boardStore'
import { MorningMessageDisplay } from '../morning-message/MorningMessageDisplay'
import { NowShowingDisplayLabel } from '../display/NowShowingDisplayLabel'
import { resolveNowShowingDisplay } from '../../lib/nowShowing'

/**
 * DB-7B — display overlay composer.
 *
 * Re-composes the "cast to student projector" pipeline into the Clean Board
 * host without restoring `StudentDisplayShell`. Precedence matches the
 * historical contract (see qa/display-overlay-pipeline-audit.md):
 *
 *   Blank > Prize Board > Random Number > Display Composer > Morning Message
 *   / Now Showing > base Clean Board
 *
 * The base Clean Board canvas is rendered by `BoardHostDisplay` itself; this
 * component only layers the active student-facing overlays above it. Every
 * overlay is student-safe and renders nothing (or a safe fallback) unless a
 * teacher explicitly activated it.
 */
export function DisplayOverlayHost() {
  const pylPhase = usePressYourLuckStore((s) => s.phase)
  const projectorActive = shouldShowProjectorMode(pylPhase)

  const randomNumberResult = useRandomNumberStore((s) => s.lastResult)
  const randomNumberShow = useRandomNumberStore((s) => s.showOnDisplay)
  const randomNumberActive = shouldShowRandomNumberDisplay(randomNumberResult, randomNumberShow)

  const displayBlanked = useDisplayComposerStore((s) => s.displayBlanked)
  const composerScreen = useDisplayComposerStore((s) =>
    s.activeScreenId ? s.screens[s.activeScreenId] : undefined,
  )
  const composerActive =
    Boolean(composerScreen?.studentSafe) && !projectorActive && !randomNumberActive && !displayBlanked

  // Morning Message / Now Showing are the old "normal board" student-facing
  // content, shown only when no modal overlay is active.
  const activePageId = useBoardStore((s) => s.activePageId)
  const morningMessageContent = useBoardStore((s) => s.morningMessage.current)
  const todayPrep = useBoardStore((s) => s.todayPrep)
  const nowShowing = resolveNowShowingDisplay(todayPrep.nowShowingResourceId, todayPrep.resourceLinks)

  const morningMessageActive = activePageId === 'homeroom-morning-message'
  const showContentOverlays = !projectorActive && !randomNumberActive && !displayBlanked && !composerActive

  return (
    <>
      {/* Blank screen overlay */}
      {displayBlanked && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black animate-in fade-in duration-300">
          <p className="text-5xl font-black text-slate-800">Screen Paused</p>
          <p className="mt-3 text-lg text-slate-700">The display has been blanked by the teacher</p>
        </div>
      )}

      {/* Display Composer overlay */}
      {composerActive && <DisplayComposerOverlay />}

      {/* Prize Board projector (full screen). Gated on !displayBlanked here,
          not just internally, because it self-mounts and its z-[60] would
          otherwise render above the Blank overlay's z-50 — Blank must always
          win, per the documented precedence. */}
      {!displayBlanked && <PrizeBoardProjectorMode />}

      {/* Random Number full-screen display. Gated on !displayBlanked (same
          reasoning as Prize Board above) and also !projectorActive: both
          self-mount from independent stores, so if a spin and a random-number
          draw are both flagged active at once, without this guard both would
          mount — Prize Board's opaque z-[60] would visually cover Random
          Number's z-[55], but Random Number's aria-live region would still
          announce stale/hidden content to assistive tech. Excluding it here
          keeps the documented precedence (Prize Board > Random Number) true
          in the DOM, not just visually. */}
      {!displayBlanked && !projectorActive && <RandomNumberDisplay />}

      {/* Morning Message (student-facing content over the Clean Board) */}
      {showContentOverlays && morningMessageActive && (
        <div className="absolute inset-0 z-40 bg-white animate-in fade-in duration-300">
          <MorningMessageDisplay content={morningMessageContent} mode="display" />
        </div>
      )}

      {/* Now Showing badge (student-facing, floats over the Clean Board) */}
      {showContentOverlays && nowShowing && (
        <div className="pointer-events-none absolute left-1/2 top-[max(1rem,var(--board-safe-top,1rem))] z-40 -translate-x-1/2">
          <NowShowingDisplayLabel info={nowShowing} />
        </div>
      )}
    </>
  )
}
