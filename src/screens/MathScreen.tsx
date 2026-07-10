import type { AppMode, MathContent } from '../data/types'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { TimerWidget } from '../widgets/TimerWidget'

interface MathScreenProps {
  content: MathContent
  mode: AppMode
  onBeautify?: () => void
}

export function MathScreen({ content, mode, onBeautify }: MathScreenProps) {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 md:grid-cols-3">
      <SmartTextCard
        mode={mode}
        onBeautify={onBeautify}
        className="min-h-0"
        model={{
          title: 'Lesson',
          blocks: [{ kind: 'paragraph', text: content.lessonTitle, emphasis: true }],
          align: 'center',
        }}
      />
      <MaterialsCard
        title={content.materialsTitle}
        materials={content.materials}
        mode={mode}
        onBeautify={onBeautify}
        className="min-h-0"
      />
      <TimerWidget screenId="math" mode={mode} className="min-h-0" />
    </div>
  )
}
