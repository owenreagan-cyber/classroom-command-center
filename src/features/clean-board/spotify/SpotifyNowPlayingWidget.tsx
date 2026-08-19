import type { SafeNowPlaying } from './spotifySafety'

/**
 * DB-2A — student-safe now-playing widget (pure presentational).
 *
 * Renders only track metadata and playback state. Never receives tokens,
 * account, email, or device identifiers — those are stripped upstream via
 * `toSafeNowPlaying`. The placeholder branch keeps the board legible before
 * any track metadata exists.
 */
export function SpotifyNowPlayingWidget({ nowPlaying }: { nowPlaying: SafeNowPlaying | null }) {
  if (!nowPlaying) {
    return (
      <div
        className="flex h-full w-full items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-6"
        data-spotify-widget="idle"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-2xl">
          ♪
        </div>
        <div className="min-w-0">
          <p className="m-0 text-xl font-semibold text-emerald-200">Classroom Music</p>
          <p className="m-0 text-lg text-emerald-100/70">Nothing playing</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex h-full w-full items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-6"
      data-spotify-widget="live"
    >
      {nowPlaying.artworkUrl ? (
        <img
          src={nowPlaying.artworkUrl}
          alt=""
          draggable={false}
          className="h-full max-h-24 w-auto shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-3xl">
          ♪
        </div>
      )}
      <div className="min-w-0">
        <p className="m-0 text-lg font-semibold text-emerald-200">
          {nowPlaying.isPlaying ? 'Now Playing' : 'Paused'}
        </p>
        <p className="m-0 truncate text-xl font-bold text-white">{nowPlaying.trackName}</p>
        <p className="m-0 truncate text-lg text-emerald-100/70">{nowPlaying.artistName}</p>
      </div>
    </div>
  )
}
