import { EditableList } from '../components/editing/EditableList'
import { EditableText } from '../components/editing/EditableText'
import type { AppMode, CardId, SubjectContent } from '../data/types'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { TeacherHint } from '../widgets/TeacherHint'

type SubjectCardVisibility = Partial<Record<CardId, boolean>>

interface SubjectScreenProps {
  content: SubjectContent
  mode: AppMode
  cardVisibility: SubjectCardVisibility
  onContentChange: (content: SubjectContent) => void
  onBeautify?: () => void
}

export function SubjectScreen({
  content,
  mode,
  cardVisibility,
  onContentChange,
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
          editSlot={
            <EditableText
              mode={mode}
              label="Focus task"
              value={content.focusTask}
              onChange={(focusTask) => onContentChange({ ...content, focusTask })}
              multiline
            />
          }
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
          editSlot={
            <EditableList
              mode={mode}
              label="Agenda"
              items={content.agenda}
              onChange={(agenda) => onContentChange({ ...content, agenda })}
            />
          }
        />
      )}

      {(cardVisibility.materials ?? true) && (
        <div className="flex min-h-0 flex-col gap-3">
          <MaterialsCard
            title={content.materialsTitle}
            materials={content.materials}
            mode={mode}
            onMaterialsChange={(materials) =>
              onContentChange({ ...content, materials })
            }
          />
          <TeacherHint mode={mode} text={content.teacherHint} />
        </div>
      )}
    </section>
  )
}
