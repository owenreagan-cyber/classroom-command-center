import type { CanvasWidget } from './types'

/**
 * Renders student-safe display content for a single widget.
 * Only renders widgets that are visible. Teacher-only data is never rendered.
 */
export function WidgetDisplayCard({ widget }: { widget: CanvasWidget }) {
  if (!widget.visible) return null

  switch (widget.type) {
    case 'directions-text':
      return (
        <div className="rounded-2xl bg-slate-950/40 px-5 py-3 backdrop-blur-sm">
          <p className="text-xl font-semibold leading-snug text-white">
            {(widget.settings.text as string) ?? ''}
          </p>
        </div>
      )

    case 'work-symbols': {
      const symbolLabels: Record<string, string> = {
        silent: '🤫 Silent Work', whisper: '🗣 Whisper', partner: '👥 Partner Work',
        group: '👨‍👩‍👧‍👦 Group Work', independent: '✍️ Independent',
      }
      const symbol = (widget.settings.symbol as string) ?? 'silent'
      return (
        <div className="rounded-2xl bg-slate-950/40 px-5 py-3 backdrop-blur-sm text-center">
          <p className="text-2xl font-bold text-white">{symbolLabels[symbol] ?? symbol}</p>
        </div>
      )
    }

    case 'mystery-student':
      return (
        <div className="rounded-2xl bg-amber-950/40 px-5 py-3 backdrop-blur-sm text-center">
          <p className="text-2xl font-bold text-amber-200">🌟 Mystery Star is watching</p>
          <p className="text-lg text-amber-100/70 mt-1">Keep showing your best effort</p>
        </div>
      )

    case 'random-picker':
      return (
        <div className="rounded-2xl bg-slate-950/40 px-5 py-3 backdrop-blur-sm text-center">
          <p className="text-2xl font-bold text-white">🎯 Ready</p>
        </div>
      )

    case '100-board':
      return (
        <div className="rounded-2xl bg-slate-950/40 px-5 py-3 backdrop-blur-sm text-center">
          <p className="text-2xl font-bold text-white">🔢 100 Board</p>
        </div>
      )

    case 'prize-board':
      return (
        <div className="rounded-2xl bg-amber-950/40 px-5 py-3 backdrop-blur-sm text-center">
          <p className="text-2xl font-bold text-amber-200">🎁 Prize Board</p>
        </div>
      )

    case 'press-your-luck':
      return (
        <div className="rounded-2xl bg-amber-950/40 px-5 py-3 backdrop-blur-sm text-center">
          <p className="text-2xl font-bold text-amber-200">🎰 Press Your Luck</p>
        </div>
      )

    case 'noise-meter': {
      const level = (widget.settings.level as string) ?? 'whisper'
      const labels: Record<string, string> = { silent: 'Silent', whisper: 'Whisper', normal: 'Normal', loud: 'Too Loud' }
      const colors: Record<string, string> = { silent: 'bg-emerald-500', whisper: 'bg-sky-500', normal: 'bg-amber-500', loud: 'bg-rose-500' }
      return (
        <div className="rounded-2xl bg-slate-950/40 px-5 py-3 backdrop-blur-sm text-center">
          <p className="text-lg font-semibold text-white">🔊 Voice Level</p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className={`h-3 w-3 rounded-full ${colors[level] ?? 'bg-sky-500'}`} />
            <p className="text-2xl font-bold text-white">{labels[level] ?? level}</p>
          </div>
        </div>
      )
    }

    case 'atmosphere':
      return (
        <div className="rounded-2xl bg-slate-950/40 px-5 py-3 backdrop-blur-sm text-center">
          <p className="text-2xl font-bold text-white">🎵 Music</p>
        </div>
      )

    case 'countdown-timer':
    case 'routine-timer':
      return (
        <div className="rounded-2xl bg-slate-950/40 px-5 py-3 backdrop-blur-sm text-center">
          <p className="text-2xl font-bold text-white">⏱ {widget.label}</p>
        </div>
      )

    case 'materials':
      return (
        <div className="rounded-2xl bg-slate-950/40 px-5 py-3 backdrop-blur-sm text-center">
          <p className="text-2xl font-bold text-white">📋 Materials</p>
        </div>
      )

    case 'checklist':
      return (
        <div className="rounded-2xl bg-slate-950/40 px-5 py-3 backdrop-blur-sm text-center">
          <p className="text-2xl font-bold text-white">✅ Checklist</p>
        </div>
      )

    default:
      return null
  }
}

/**
 * Renders all visible student-safe widgets for a display screen.
 * Only renders if there are visible widgets — no extra wrappers otherwise.
 */
export function WidgetDisplayOverlay({ widgets }: { widgets: CanvasWidget[] | undefined }) {
  if (!widgets || widgets.length === 0) return null

  const visible = widgets.filter((w) => w.visible)
  if (visible.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {visible.map((widget) => (
        <div
          key={widget.id}
          className="pointer-events-auto absolute"
          style={{
            left: `${widget.x}%`,
            top: `${widget.y}%`,
            width: `${widget.w}%`,
            height: `${widget.h}%`,
            zIndex: widget.zIndex,
          }}
        >
          <WidgetDisplayCard widget={widget} />
        </div>
      ))}
    </div>
  )
}
