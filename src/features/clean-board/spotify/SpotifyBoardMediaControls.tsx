import { useSpotifyStore } from './spotifyStore'

/**
 * DB-2E — teacher-only media controls embedded in the Spotify board pill.
 *
 * Renders Previous / Play-Pause / Next using the existing Spotify store
 * actions. Mounted ONLY in edit mode (gated by `showTeacherControls` in the
 * board renderer); never rendered in present/student mode. Reads playback
 * state to choose Play vs Pause, and disables while a command is in flight.
 */

export function SpotifyBoardMediaControls() {
  const { nowPlaying, transportBusy, play, pause, next, previous } = useSpotifyStore()

  const isPlaying = nowPlaying?.isPlaying ?? false
  const busy = transportBusy

  const btn =
    'flex h-8 w-8 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-base text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div
      className="flex items-center gap-2"
      data-spotify-board-controls
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={btn}
        onClick={() => void previous()}
        disabled={busy}
        aria-label="Previous track"
      >
        ◀
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => void (isPlaying ? pause() : play())}
        disabled={busy}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {busy ? '…' : isPlaying ? '❚❚' : '▶'}
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => void next()}
        disabled={busy}
        aria-label="Next track"
      >
        ▶
      </button>
    </div>
  )
}
