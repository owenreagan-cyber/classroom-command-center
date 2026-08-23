import { showTeacherControls } from './boardSafety'
import type { BoardMode, BoardObject, BoardTheme } from './types'
import { SpotifyBoardMediaControls } from './spotify/SpotifyBoardMediaControls'
import { SpotifyNowPlayingWidget } from './spotify/SpotifyNowPlayingWidget'
import type { SafeNowPlaying } from './spotify/spotifySafety'

interface BoardObjectRendererProps {
  object: BoardObject
  /** Student-safe now-playing metadata; null while idle or disconnected. */
  spotifyNowPlaying?: SafeNowPlaying | null
  /** Present vs edit. Edit mode may render teacher-only embedded controls. */
  mode: BoardMode
  /** Board theme; used for the message card surface + text tone. */
  theme?: BoardTheme
}

const MESSAGE_CARD_TONE_ACCENTS = {
  neutral: '#94a3b8',
  calm: '#34d399',
  focus: '#38bdf8',
  warning: '#fbbf24',
  success: '#22c55e',
} as const

const MESSAGE_CARD_TITLE_SIZES = { small: 30, medium: 42, large: 54 } as const
const MESSAGE_CARD_BODY_SIZES = { small: 24, medium: 30, large: 38 } as const

function messageCardSurface(theme: BoardTheme | undefined): {
  card: string
  title: string
  body: string
} {
  const surface = theme?.surface ?? 'solid'
  const textTone = theme?.textTone ?? 'light'
  if (surface === 'glass') {
    return textTone === 'light'
      ? { card: 'border-white/20 bg-white/10', title: '#f8fafc', body: '#e2e8f0' }
      : { card: 'border-black/10 bg-black/5', title: '#0f172a', body: '#334155' }
  }
  if (surface === 'minimal') {
    return textTone === 'light'
      ? { card: 'border-white/25 bg-transparent', title: '#f8fafc', body: '#e2e8f0' }
      : { card: 'border-black/15 bg-transparent', title: '#0f172a', body: '#334155' }
  }
  return textTone === 'light'
    ? { card: 'border-slate-700 bg-slate-900/90', title: '#f8fafc', body: '#e2e8f0' }
    : { card: 'border-slate-200 bg-white/95', title: '#0f172a', body: '#334155' }
}

/**
 * Renders a single board object's content.
 *
 * Presentational only: no selection, drag, or teacher state. Clock and timer
 * remain static placeholders; the Spotify placeholder renders the safe
 * now-playing widget, plus teacher-only media controls in edit mode only.
 */
export function BoardObjectRenderer({
  object,
  spotifyNowPlaying = null,
  mode,
  theme,
}: BoardObjectRendererProps) {
  const cfg = object.config
  switch (cfg.kind) {
    case 'text':
      return (
        <div
          className="flex h-full w-full items-center"
          style={{
            justifyContent:
              cfg.align === 'center' ? 'center' : cfg.align === 'right' ? 'flex-end' : 'flex-start',
          }}
        >
          <p
            className="m-0 whitespace-pre-wrap leading-tight"
            style={{ fontSize: cfg.fontSize, color: cfg.color, textAlign: cfg.align }}
          >
            {cfg.text}
          </p>
        </div>
      )
    case 'image':
      if (!cfg.src) {
        return (
          <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-slate-600 bg-slate-900/40">
            <span className="text-2xl font-medium text-slate-400">Image</span>
          </div>
        )
      }
      return (
        <img
          src={cfg.src}
          alt={cfg.alt}
          draggable={false}
          className="h-full w-full rounded-2xl"
          style={{ objectFit: cfg.fit }}
        />
      )
    case 'link':
      return (
        <div className="flex h-full w-full items-center gap-4 rounded-2xl border border-slate-700/60 bg-slate-900/60 px-6">
          <div className="min-w-0">
            <p className="m-0 truncate text-2xl font-semibold text-slate-100">{cfg.label}</p>
            <p className="m-0 truncate text-lg text-slate-400">{cfg.url}</p>
          </div>
        </div>
      )
    case 'videoEmbed':
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl border border-slate-700/60 bg-slate-900/60">
          <p className="m-0 text-2xl font-semibold text-slate-100">{cfg.label}</p>
          <p className="m-0 text-lg text-slate-400">Video placeholder</p>
        </div>
      )
    case 'clock':
      return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/60">
          <p className="m-0 text-5xl font-bold tabular-nums text-slate-100">{cfg.label}</p>
          <p className="m-0 text-base text-slate-400">Clock</p>
        </div>
      )
    case 'timer':
      return (
        <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-900/60">
          <p className="m-0 text-5xl font-bold tabular-nums text-slate-100">{cfg.label}</p>
          <p className="m-0 text-base text-slate-400">Timer</p>
        </div>
      )
    case 'spotifyNowPlayingPlaceholder':
      return (
        <SpotifyNowPlayingWidget
          nowPlaying={spotifyNowPlaying}
          controls={showTeacherControls(mode) ? <SpotifyBoardMediaControls /> : undefined}
        />
      )
    case 'messageCard': {
      const accent = MESSAGE_CARD_TONE_ACCENTS[cfg.tone]
      const surface = messageCardSurface(theme)
      const titleSize = MESSAGE_CARD_TITLE_SIZES[cfg.textSize]
      const bodySize = MESSAGE_CARD_BODY_SIZES[cfg.textSize]
      const lines = cfg.message.split('\n')
      return (
        <div
          className={`flex h-full w-full flex-col overflow-hidden rounded-2xl border ${surface.card}`}
          style={{ borderLeft: `6px solid ${accent}` }}
          data-message-card
        >
          <div className="shrink-0 px-6 pb-3 pt-5">
            <h3
              className="m-0 font-bold leading-tight"
              style={{ fontSize: titleSize, color: surface.title }}
            >
              {cfg.title}
            </h3>
          </div>
          <div
            className={`min-h-0 flex-1 px-6 pb-5 ${mode === 'edit' ? 'overflow-y-auto' : 'overflow-hidden'}`}
          >
            {cfg.checklistStyle ? (
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {lines
                  .filter((l) => l.trim().length > 0)
                  .map((line, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className="mt-[0.5em] h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: accent }}
                      />
                      <span
                        className="whitespace-pre-wrap leading-snug"
                        style={{ fontSize: bodySize, color: surface.body }}
                      >
                        {line}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p
                className="m-0 whitespace-pre-wrap leading-snug"
                style={{ fontSize: bodySize, color: surface.body }}
              >
                {cfg.message}
              </p>
            )}
          </div>
        </div>
      )
    }
  }
}
