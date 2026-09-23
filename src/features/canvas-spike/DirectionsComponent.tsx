import { useState, useCallback } from 'react'
import { HTMLContainer, useEditor } from 'tldraw'
import type { DirectionsTextShape } from './DirectionsTextShape'

export function DirectionsComponent({ shape }: { shape: DirectionsTextShape }) {
  const editor = useEditor()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(shape.props.text)

  const startEdit = useCallback(() => {
    setDraft(shape.props.text)
    setEditing(true)
  }, [shape.props.text])

  const commit = useCallback(() => {
    editor.updateShape({
      id: shape.id,
      type: 'spike-directions' as never,
      props: { ...shape.props, text: draft },
    })
    setEditing(false)
  }, [editor, shape.id, shape.props, draft])

  if (editing) {
    return (
      <HTMLContainer>
        <div className="flex h-full w-full flex-col rounded-2xl bg-slate-900 border-2 border-cyan-400 p-3">
          <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">{shape.props.label}</span>
          <textarea
            className="flex-1 resize-none rounded-lg bg-slate-800 p-2 text-sm text-white outline-none"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Escape') { setEditing(false); setDraft(shape.props.text) } }}
            autoFocus
          />
        </div>
      </HTMLContainer>
    )
  }

  return (
    <HTMLContainer>
      <div className="flex h-full w-full flex-col rounded-2xl bg-slate-950/80 px-4 py-3 text-white shadow-xl backdrop-blur-sm" onDoubleClick={startEdit}>
        <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{shape.props.label}</span>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{shape.props.text}</p>
      </div>
    </HTMLContainer>
  )
}
