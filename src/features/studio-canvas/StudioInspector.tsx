import type { PageWidget } from '../../data/types'

interface StudioInspectorProps {
  widget: PageWidget | null
}

/** Compact, read-only geometry readout for the selected widget. Content
 * editing itself happens inline on the widget card, not here — this stays
 * a small side panel rather than a giant overlay dashboard. */
export function StudioInspector({ widget }: StudioInspectorProps) {
  if (!widget) {
    return (
      <aside className="hidden w-48 shrink-0 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-500 lg:block">
        Select a widget to see its position and size.
      </aside>
    )
  }

  return (
    <aside className="hidden w-48 shrink-0 space-y-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-300 lg:block">
      <p className="font-bold uppercase tracking-wide text-cyan-300/80">{widget.type}</p>
      <dl className="space-y-1">
        <Row label="X" value={Math.round(widget.x)} />
        <Row label="Y" value={Math.round(widget.y)} />
        <Row label="Width" value={Math.round(widget.width)} />
        <Row label="Height" value={Math.round(widget.height)} />
        <Row label="Layer" value={widget.zIndex} />
      </dl>
      <p className="text-slate-500">{widget.locked ? 'Locked' : 'Unlocked'}</p>
    </aside>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-mono text-slate-200">{value}</dd>
    </div>
  )
}
