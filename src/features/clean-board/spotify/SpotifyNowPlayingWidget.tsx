import type { ReactNode } from 'react'
import type { SafeNowPlaying } from './spotifySafety'

/**
 * DB-2A — student-safe now-playing widget (pure presentational).
 *
 * Renders only track metadata and playback state. Never receives tokens,
 * account, email, or device identifiers — those are stripped upstream via
 * `toSafeNowPlaying`. The placeholder branch keeps the board legible before
 * any track metadata exists.
 *
 * `controls` is an optional teacher-only slot (DB-2E). It is passed only by
 * the board renderer in edit mode; present mode never passes it, so no
 * teacher control ever reaches the student view.
 */
export function SpotifyNowPlayingWidget({
  nowPlaying,
  controls,
}: {
  nowPlaying: SafeNowPlaying | null
  controls?: ReactNode
}) {
  return (
    <div
      className="flex h-full w-full flex-col justify-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-6"
      data-spotify-widget={nowPlaying ? 'live' : 'idle'}
    >
      <div className="flex items-center gap-4">
        {nowPlaying?.artworkUrl ? (
          <img
            src={nowPlaying.artworkUrl}
            alt=""
            draggable={false}
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-2xl">
            ♪
          </div>
        )}
        <div className="min-w-0">
          {nowPlaying ? (
            <>
              <p className="m-0 text-lg font-semibold text-emerald-200">
                {nowPlaying.isPlaying ? 'Now Playing' : 'Paused'}
              </p>
              <p className="m-0 truncate text-xl font-bold text-white">{nowPlaying.trackName}</p>
              <p className="m-0 truncate text-lg text-emerald-100/70">{nowPlaying.artistName}</p>
            </>
          ) : (
            <>
              <p className="m-0 text-xl font-semibold text-emerald-200">Classroom Music</p>
              <p className="m-0 text-lg text-emerald-100/70">Nothing playing</p>
            </>
          )}
        </div>
      </div>
      {controls}
    </div>
  )
}
