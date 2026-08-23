import type { BoardObjectKind } from './types'

const ADD_ITEMS: ReadonlyArray<{ kind: BoardObjectKind; label: string }> = [
  { kind: 'text', label: 'Text' },
  { kind: 'messageCard', label: 'Message Card' },
  { kind: 'link', label: 'Link' },
  { kind: 'image', label: 'Image' },
  { kind: 'videoEmbed', label: 'Video' },
  { kind: 'clock', label: 'Clock' },
  { kind: 'timer', label: 'Timer' },
  { kind: 'spotifyNowPlayingPlaceholder', label: 'Spotify' },
]

interface BoardToolbarProps {
  /** Add a non-image object kind. Image inserts go through the file picker. */
  onAdd: (kind: Exclude<BoardObjectKind, 'image'>) => void
  /** Open the local image file picker for an image board object. */
  onPickImage: () => void
}

/** DB-1 — minimal edit toolbar. Only mounts in edit mode. */
export function BoardToolbar({ onAdd, onPickImage }: BoardToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-board-toolbar>
      {ADD_ITEMS.map((item) => (
        <button
          key={item.kind}
          type="button"
          onClick={() => {
            if (item.kind === 'image') onPickImage()
            else onAdd(item.kind)
          }}
          data-board-add={item.kind}
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
