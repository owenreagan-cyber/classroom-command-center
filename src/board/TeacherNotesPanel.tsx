import type { AppMode, ScreenId } from '../data/types'
import { filterVisibleItems } from '../lib/visibility'
import type { TeacherNote } from '../data/types'

interface TeacherNotesPanelProps {
  mode: AppMode
  activeScreen: ScreenId
  notes: TeacherNote[]
}

export function TeacherNotesPanel({
  mode,
  activeScreen,
  notes,
}: TeacherNotesPanelProps) {
  if (mode !== 'edit') {
    return null
  }

  const scoped = notes.filter(
    (note) => !note.screenId || note.screenId === activeScreen,
  )
  const visible = filterVisibleItems(scoped, mode)

  if (visible.length === 0) {
    return null
  }

  return (
    <section className="space-y-2" aria-label="Teacher notes">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Teacher Notes
      </h2>
      <ul className="space-y-2">
        {visible.map((note) => (
          <li
            key={note.id}
            className="rounded-xl border border-amber-400/35 bg-amber-950/25 px-3 py-2.5"
            data-visibility={note.visibility ?? 'teacherOnly'}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200/80">
              Teacher only
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-50/95">
              {note.text}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
