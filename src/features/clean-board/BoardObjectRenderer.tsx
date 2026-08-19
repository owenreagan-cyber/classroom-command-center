import type { BoardObject } from './types'

/**
 * DB-1 — renders a single board object's content.
 *
 * Presentational only: no selection, drag, or teacher state. All widget kinds
 * (clock, timer, spotify) render static placeholder content — no live logic.
 */
export function BoardObjectRenderer({ object }: { object: BoardObject }) {
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
        <div className="flex h-full w-full items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-6">
          <div className="min-w-0">
            <p className="m-0 text-xl font-semibold text-emerald-200">{cfg.label}</p>
            <p className="m-0 text-lg text-emerald-100/70">Classroom Playlist</p>
          </div>
        </div>
      )
  }
}
