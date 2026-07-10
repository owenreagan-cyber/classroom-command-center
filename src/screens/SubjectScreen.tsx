import type { AppMode, CardId, SubjectContent } from '../data/types'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { TeacherHint } from '../widgets/TeacherHint'

type SubjectCardVisibility = Partial<Record<CardId, boolean>>

interface SubjectScreenProps {
  content: SubjectContent
  mode: AppMode
  cardVisibility: SubjectCardVisibility
  onBeautify?: () => void
}

export function SubjectScreen({
  content,
  mode,
  cardVisibility,
  onBeautify,
}: SubjectScreenProps) {
  return (
    <section className="board-grid board-grid-three">
      {(cardVisibility.focus ?? true) && (
        <SmartTextCard
          className="board-card-hero"
          mode={mode}
          model={{
            title: content.focusTitle,
            subtitle: content.title,
            blocks: [
              {
                kind: 'paragraph',
                text: content.focusTask,
                emphasis: true,
              },
            ],
            footer: mode === 'edit' ? 'Student-facing focus task' : undefined,
          }}
          onBeautify={onBeautify}
        />
      )}

      {(cardVisibility.agenda ?? true) && (
        <SmartTextCard
          mode={mode}
          model={{
            title: content.agendaTitle,
            blocks: [
              {
                kind: 'bullets',
                items: content.agenda,
              },
              {
                kind: 'note',
                text: content.teacherHint,
                visibility: 'teacherOnly',
              },
            ],
          }}
        />
      )}

      {(cardVisibility.materials ?? true) && (
        <div className="flex min-h-0 flex-col gap-3">
          <MaterialsCard
            title={content.materialsTitle}
            materials={content.materials}
            mode={mode}
          />
          <TeacherHint mode={mode} text={content.teacherHint} />
        </div>
      )}
    </section>
  )
}
