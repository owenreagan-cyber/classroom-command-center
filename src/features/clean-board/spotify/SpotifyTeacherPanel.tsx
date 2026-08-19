import { useSpotifyStore } from './spotifyStore'
import { describeStatus, isAuthConnected } from './spotifyState'
import { SpotifyPlaylistBuilder } from './SpotifyPlaylistBuilder'

/**
 * DB-2B — teacher-only Spotify control panel.
 *
 * Lives OUTSIDE the student board (side panel in Edit mode). Shows connect /
 * disconnect, connection status, Spotify Connect devices, transfer-to-board,
 * now-playing, transport controls, and a (currently empty) preset launcher.
 * Never renders inside present mode. The Connect/Disconnect decision is driven
 * by AUTH state only, so a device/playback failure never shows "Connect Spotify"
 * while a valid token exists.
 */

const btn =
  'rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40'
const primary =
  'rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40'

export function SpotifyTeacherPanel() {
  const {
    authStatus,
    opStatus,
    clientId,
    redirectUri,
    devices,
    activeDeviceId,
    nowPlaying,
    sdkReady,
    sdkDeviceId,
    errorMessage,
    noticeMessage,
    connect,
    disconnect,
    refreshDevices,
    refreshPlayback,
    transferToDevice,
    transferToSdk,
    play,
    pause,
    next,
    previous,
  } = useSpotifyStore()

  const configMissing = !clientId || !redirectUri
  const authenticated = isAuthConnected(authStatus)
  const controlsDisabled = !authenticated
  const statusText = describeStatus({ authStatus, opStatus })

  return (
    <aside
      className="flex h-full w-full flex-col gap-4 overflow-y-auto border-l border-slate-800 bg-slate-900/40 p-4"
      data-spotify-teacher-panel
    >
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-sm font-bold uppercase tracking-wider text-slate-200">
          Spotify
        </h2>
        {authenticated && (
          <button type="button" className={btn} onClick={disconnect}>
            Disconnect
          </button>
        )}
      </div>

      {configMissing ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/40 p-3" data-spotify-setup-needed>
          <p className="m-0 text-sm font-semibold text-amber-200">Spotify setup needed</p>
          <p className="m-0 mt-1 text-xs leading-relaxed text-amber-100/70">
            Set <code className="text-amber-100">VITE_SPOTIFY_CLIENT_ID</code> and{' '}
            <code className="text-amber-100">VITE_SPOTIFY_REDIRECT_URI</code> (see{' '}
            <code className="text-amber-100">.env.example</code>), then restart the dev server.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-xs font-semibold ${
                authenticated
                  ? opStatus === 'idle'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                  : 'text-slate-400'
              }`}
              data-spotify-status
            >
              {statusText}
            </span>
            {!authenticated && (
              <button
                type="button"
                className={primary}
                onClick={() => void connect()}
                disabled={authStatus === 'authorizing'}
              >
                {authStatus === 'authorizing' ? 'Connecting…' : 'Connect Spotify'}
              </button>
            )}
          </div>

          {errorMessage && (
            <p className="m-0 rounded-md border border-red-500/30 bg-red-950/40 px-2 py-1.5 text-xs text-red-200">
              {errorMessage}
            </p>
          )}

          {noticeMessage && !errorMessage && (
            <p className="m-0 rounded-md border border-amber-500/30 bg-amber-950/40 px-2 py-1.5 text-xs text-amber-200">
              {noticeMessage}
            </p>
          )}

          {nowPlaying && (
            <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              {nowPlaying.artworkUrl ? (
                <img
                  src={nowPlaying.artworkUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-emerald-500/15 text-xl">
                  ♪
                </div>
              )}
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-semibold text-white">
                  {nowPlaying.trackName}
                </p>
                <p className="m-0 truncate text-xs text-slate-400">{nowPlaying.artistName}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button type="button" className={btn} onClick={() => void previous()} disabled={controlsDisabled}>
              Prev
            </button>
            <button
              type="button"
              className={btn}
              onClick={() => void (nowPlaying?.isPlaying ? pause() : play())}
              disabled={controlsDisabled}
            >
              {nowPlaying?.isPlaying ? 'Pause' : 'Play'}
            </button>
            <button type="button" className={btn} onClick={() => void next()} disabled={controlsDisabled}>
              Next
            </button>
            <button type="button" className={btn} onClick={() => void refreshPlayback()} disabled={controlsDisabled}>
              Refresh
            </button>
          </div>
        </>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Devices
          </h3>
          <button type="button" className={btn} onClick={() => void refreshDevices()} disabled={configMissing || !authenticated}>
            Refresh
          </button>
        </div>

        <button
          type="button"
          className={btn}
          onClick={() => void transferToSdk()}
          disabled={configMissing || !sdkReady}
        >
          {sdkReady ? 'Transfer to board player' : 'Board player not ready'}
        </button>

        {devices.length === 0 ? (
          <p className="m-0 text-xs text-slate-500" data-spotify-no-devices>
            No Spotify Connect devices found.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {devices.map((d, index) => (
              <li key={`${d.name}-${index}`}>
                <button
                  type="button"
                  onClick={() => void transferToDevice(d.id)}
                  className={`w-full rounded-md border px-3 py-1.5 text-left text-xs transition ${
                    d.id === activeDeviceId || d.id === sdkDeviceId
                      ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200'
                      : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-semibold">{d.name}</span>
                  {d.isActive && <span className="ml-2 text-emerald-400">● active</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Playlist builder
        </h3>
        {authenticated ? (
          <div className="mt-2">
            <SpotifyPlaylistBuilder />
          </div>
        ) : (
          <p className="m-0 mt-1 text-xs text-slate-500">
            Connect Spotify to load and build classroom playlists.
          </p>
        )}
      </div>
    </aside>
  )
}
