import { useAtmosphereStore } from './atmosphereStore'
import {
  CLASSROOM_PLAYLISTS,
  getPlaylistsForMode,
  MUSIC_MODE_LABELS,
} from './playlists'
import type { MusicMode } from './types'
import { SpotifyEmbedPlayer } from './SpotifyEmbedPlayer'

const MODES = Object.keys(MUSIC_MODE_LABELS) as MusicMode[]

export function ClassroomAtmospherePanel() {
  const activeMode = useAtmosphereStore((s) => s.activeMode)
  const activePlaylistId = useAtmosphereStore((s) => s.activePlaylistId)
  const isPlaying = useAtmosphereStore((s) => s.isPlaying)
  const volume = useAtmosphereStore((s) => s.volume)
  const showOnDisplay = useAtmosphereStore((s) => s.showOnDisplay)
  const setMode = useAtmosphereStore((s) => s.setMode)
  const setPlaylist = useAtmosphereStore((s) => s.setPlaylist)
  const play = useAtmosphereStore((s) => s.play)
  const pause = useAtmosphereStore((s) => s.pause)
  const setVolume = useAtmosphereStore((s) => s.setVolume)
  const toggleDisplayIndicator = useAtmosphereStore((s) => s.toggleDisplayIndicator)
  const stop = useAtmosphereStore((s) => s.stop)

  const modePlaylists = activeMode ? getPlaylistsForMode(activeMode) : []
  const activePlaylist = activePlaylistId
    ? CLASSROOM_PLAYLISTS.find((p) => p.id === activePlaylistId)
    : null

  return (
    <section className="space-y-3" aria-label="Classroom atmosphere">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Classroom Atmosphere
      </h2>

      <div className="grid grid-cols-2 gap-1.5">
        {MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setMode(mode)}
            className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
              activeMode === mode
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {MUSIC_MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      {activeMode && modePlaylists.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs text-slate-400">Playlist</label>
          <select
            value={activePlaylistId ?? ''}
            onChange={(e) => setPlaylist(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          >
            {modePlaylists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {activePlaylist && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={isPlaying ? pause : play}
              className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={stop}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
            >
              Stop
            </button>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400">
            Volume
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              className="flex-1"
            />
          </label>

          {isPlaying && activePlaylistId && (
            <SpotifyEmbedPlayer playlistId={activePlaylistId} volume={volume} />
          )}

          {activePlaylist.spotifyUrl && (
            <a
              href={activePlaylist.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-emerald-400 hover:underline"
            >
              Open in Spotify
            </a>
          )}
        </div>
      )}

      <label className="flex items-center gap-2 text-xs text-slate-400">
        <input
          type="checkbox"
          checked={showOnDisplay}
          onChange={toggleDisplayIndicator}
          className="rounded"
        />
        Show music indicator on display
      </label>
    </section>
  )
}
