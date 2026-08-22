import { useState } from 'react'
import { AiPlaylistPromptBuilder } from './AiPlaylistPromptBuilder'
import { CLASSROOM_PLAYLIST_RECIPES } from './playlistRecipes'
import { useSpotifyStore } from './spotifyStore'
import type { SpotifyTrack } from './spotifyTypes'

/**
 * DB-2C — teacher-only classroom playlist builder.
 *
 * Lives only inside the teacher panel (Edit mode). Never mounted in present
 * mode. Playlists default private; tracks are staged for explicit teacher
 * review before any Add is issued. Search hits surface the explicit flag
 * rather than hiding it.
 */

const btn =
  'rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40'
const inputCls =
  'w-full rounded-md border border-slate-700 bg-slate-900/60 px-2 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none'

function formatDuration(ms?: number): string {
  if (typeof ms !== 'number' || Number.isNaN(ms)) return ''
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function SpotifyPlaylistBuilder() {
  const {
    playlists,
    presets,
    searchResults,
    searching,
    builderBusy,
    builderMessage,
    selectedPlaylistId,
    loadUserPlaylists,
    searchForTracks,
    createClassroomPlaylist,
    addApprovedTracks,
    selectPlaylist,
    savePreset,
    removePreset,
    launchPreset,
  } = useSpotifyStore()

  const [searchInput, setSearchInput] = useState('')
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [pendingTracks, setPendingTracks] = useState<SpotifyTrack[]>([])

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) ?? null

  const stageTrack = (t: SpotifyTrack) => {
    if (pendingTracks.some((p) => p.uri === t.uri)) return
    setPendingTracks((prev) => [...prev, t])
  }

  const unstageTrack = (uri: string) => {
    setPendingTracks((prev) => prev.filter((t) => t.uri !== uri))
  }

  const commitStaged = () => {
    if (!selectedPlaylistId || pendingTracks.length === 0) return
    void addApprovedTracks(
      selectedPlaylistId,
      pendingTracks.map((t) => t.uri),
    )
    setPendingTracks([])
  }

  return (
    <div className="space-y-4" data-spotify-playlist-builder>
      {builderMessage && (
        <p className="m-0 rounded-md border border-slate-700 bg-slate-800/40 px-2 py-1.5 text-xs text-slate-300">
          {builderMessage}
        </p>
      )}

      {/* AI playlist prompt (DB-2F) — generates a search strategy, not tracks */}
      <AiPlaylistPromptBuilder />

      {/* Playlists */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Playlists
          </h3>
          <button
            type="button"
            className={btn}
            onClick={() => void loadUserPlaylists()}
            disabled={builderBusy}
          >
            {builderBusy ? 'Loading…' : 'Load mine'}
          </button>
        </div>

        <div className="flex gap-2">
          <input
            className={inputCls}
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="New private playlist name"
            data-spotify-new-playlist-input
          />
          <button
            type="button"
            className={btn}
            onClick={() => {
              void createClassroomPlaylist(newPlaylistName)
              setNewPlaylistName('')
            }}
            disabled={builderBusy || !newPlaylistName.trim()}
          >
            Create
          </button>
        </div>

        {playlists.length === 0 ? (
          <p className="m-0 text-xs text-slate-500" data-spotify-no-playlists>
            No playlists loaded. Load your playlists or create a private one.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {playlists.map((p) => {
              const selected = p.id === selectedPlaylistId
              return (
                <li key={p.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => selectPlaylist(selected ? null : p.id)}
                    className={`flex-1 rounded-md border px-2 py-1.5 text-left text-xs transition ${
                      selected
                        ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200'
                        : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-semibold">{p.name}</span>
                    {!p.isPublic && <span className="ml-2 text-slate-500">private</span>}
                  </button>
                  <button
                    type="button"
                    className={btn}
                    onClick={() => savePreset(p.name, p.uri, 'classroom')}
                    title="Save as preset"
                  >
                    Save
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Search */}
      <div className="space-y-2">
        <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Search tracks
        </h3>
        <div className="flex gap-2">
          <input
            className={inputCls}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void searchForTracks(searchInput)
            }}
            placeholder="Search by title or artist"
            data-spotify-search-input
          />
          <button
            type="button"
            className={btn}
            onClick={() => void searchForTracks(searchInput)}
            disabled={searching || !searchInput.trim()}
          >
            {searching ? '…' : 'Search'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {searchResults.map((t) => (
              <li key={t.uri || t.id} className="rounded-md border border-slate-800 bg-slate-900/40 p-2">
                <div className="flex items-center gap-2">
                  {t.artworkUrl ? (
                    <img src={t.artworkUrl} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-slate-800 text-sm">
                      ♪
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-xs font-semibold text-slate-200">{t.name}</p>
                    <p className="m-0 truncate text-[11px] text-slate-500">{t.artistName}</p>
                  </div>
                  {t.explicit && (
                    <span className="rounded bg-red-950/60 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-300">
                      explicit
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">{formatDuration(t.durationMs)}</span>
                  <button type="button" className={btn} onClick={() => stageTrack(t)}>
                    Stage
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Teacher review (staged tracks) */}
      {pendingTracks.length > 0 && (
        <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-950/20 p-2" data-spotify-review>
          <p className="m-0 text-xs font-semibold text-amber-200">
            Needs teacher review ({pendingTracks.length})
          </p>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {pendingTracks.map((t) => (
              <li key={t.uri || t.id} className="flex items-center gap-2 text-xs text-slate-300">
                <span className="min-w-0 flex-1 truncate">
                  {t.name} — {t.artistName}
                </span>
                {t.explicit && <span className="text-[10px] font-bold text-red-300">explicit</span>}
                <button type="button" className={btn} onClick={() => unstageTrack(t.uri)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={commitStaged}
            disabled={!selectedPlaylistId || pendingTracks.length === 0}
          >
            Add {pendingTracks.length} track(s) to {selectedPlaylist?.name ?? 'playlist'}
          </button>
          {!selectedPlaylistId && (
            <p className="m-0 text-xs text-slate-500">Select a playlist above first.</p>
          )}
        </div>
      )}

      {/* Recipes (template starting points) */}
      <div className="space-y-2">
        <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Recipe starting points
        </h3>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {CLASSROOM_PLAYLIST_RECIPES.map((r) => (
            <li key={r.id} className="rounded-md border border-slate-800 bg-slate-900/40 p-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="m-0 truncate text-xs font-semibold text-slate-200">{r.title}</p>
                  <p className="m-0 truncate text-[11px] text-slate-500">{r.classroomUse}</p>
                </div>
                <button
                  type="button"
                  className={btn}
                  onClick={() => {
                    setSearchInput(r.searchQueries[0] ?? '')
                    void searchForTracks(r.searchQueries[0] ?? '')
                  }}
                >
                  Search
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="m-0 text-[11px] text-slate-500">
          Recipes are templates only — every result needs teacher review.
        </p>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Presets
        </h3>
        {presets.length === 0 ? (
          <p className="m-0 text-xs text-slate-500" data-spotify-no-presets>
            No presets saved. Save a playlist above to launch it quickly.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {presets.map((p) => (
              <li key={p.id} className="flex items-center gap-1">
                <button
                  type="button"
                  className="flex-1 rounded-md border border-slate-800 bg-slate-900/40 px-2 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800"
                  onClick={() => void launchPreset(p.uri)}
                >
                  <span className="font-semibold">{p.label}</span>
                </button>
                <button type="button" className={btn} onClick={() => removePreset(p.id)} title="Remove preset">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
