import { useEffect, useMemo, useState } from 'react'
import { BoardCanvas } from './BoardCanvas'
import { loadHostDisplayState, projectHostDisplayPage, type HostDisplayState } from './displayHost'
import { KEY_AUTOSAVE, KEY_STATE } from './storage/boardStorage'
import { useWakeLock } from './useWakeLock'
import { unlockSynthesizer } from '../../lib/audio/synthesizer'
import { ProjectedStampCard } from '../../widgets/ProjectedStampCard'
import { QRCodeWidget } from '../../widgets/QRCodeWidget'
import { NoiseDefenseHUD } from '../noise-defense/NoiseDefenseHUD'
import { DisplayOverlayHost } from './DisplayOverlayHost'
import { DisplayFullscreenControl } from './DisplayFullscreenControl'
import { useDisplaySyncClient } from '../../lib/sync/displaySyncClient'
import { PairingCodeBadge } from '../../lib/sync/PairingCodeBadge'
import { SyncStatusDot } from '../../lib/sync/SyncStatusDot'

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
  const [resolved, setResolved] = useState<HostDisplayState>(() => loadHostDisplayState())
  const page = useMemo(() => projectHostDisplayPage(resolved), [resolved])
  const [soundUnlocked, setSoundUnlocked] = useState(false)

  // Silent keep-awake (no toggle UI on the student display).
  useWakeLock(true)

  // Live cross-tab scene sync (in-room-test brief, point 4): `/control` (or
  // `/board-lab`) and `/display` are separate tabs sharing only
  // localStorage, and this resolver previously ran exactly once at mount
  // (`useMemo(..., [])`) -- an already-open `/display` tab never picked up
  // a scene switch or a Display Mode change without a manual reload, which
  // is exactly the gap that let a HUD-hiding screen switch (e.g. to
  // Assessment Mode) leave the noise-defense HUD/mic running unseen. Mirrors
  // the existing `storage`-event bridge already used by
  // `displayComposerStore.ts`/`noiseGameStore.ts` -- `/board-lab`'s own tab
  // (the writer) never needs this, since same-tab writes never fire
  // `storage` there; only *other* tabs/devices sharing this origin do.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== KEY_STATE && event.key !== KEY_AUTOSAVE) return
      setResolved(loadHostDisplayState())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Cross-device sync (docs/architecture/cross-device-control.md):
  // best-effort, no-ops entirely if no classroom sync server is reachable.
  const { pairingCode, connected: syncConnected } = useDisplaySyncClient()
  const syncStatus = !syncConnected ? 'disconnected' : pairingCode ? 'awaiting-pairing' : 'paired'

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
      {/* Stage 0 — opt-in, per-screen (design-doc "STAGE 0"): the HUD itself
          decides whether it's allowed to render at all for `displayModeId`,
          structurally excluded for Assessment Mode regardless of any
          per-screen toggle — see `hudGate.ts`. */}
      <NoiseDefenseHUD displayModeId={resolved.displayModeId} />

      {/* Cast-to-display overlay pipeline (Prize Board, Random Number,
          Display Composer, Morning Message, Now Showing). */}
      <DisplayOverlayHost />

      {/* Stage 3 pairing code — a system indicator, not classroom content,
          so it renders above Blank (z-[70] vs. Blank's z-50) same as the
          fullscreen control below. Empty/hidden once paired. */}
      <PairingCodeBadge code={pairingCode} />

      {/* Connection status — same "system indicator, not classroom content"
          rationale as the pairing badge above. Bottom-right, offset to avoid
          the sound-unlock banner in the same corner (see SyncStatusDot). */}
      <SyncStatusDot status={syncStatus} />

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
