import type { AppMode, SubjectContent } from '../data/types'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { TeacherHint } from '../widgets/TeacherHint'

interface SubjectScreenProps {
  content: SubjectContent
  mode: AppMode
  onBeautify?: () => void
}

export function SubjectScreen({
  content,
  mode,
  onBeautify,
}: SubjectScreenProps) {
  return (
    <section className="board-grid board-grid-three">
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

      <div className="flex min-h-0 flex-col gap-3">
        <MaterialsCard
          title={content.materialsTitle}
          materials={content.materials}
          mode={mode}
        />
        <TeacherHint mode={mode} text={content.teacherHint} />
      </div>
    </section>
  )
}
