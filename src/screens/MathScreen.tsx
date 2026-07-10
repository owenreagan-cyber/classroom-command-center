import type { AppMode, MathContent } from '../data/types'
import { gridArea, screenGridClass } from '../lib/displayLayout'
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
    <div className={screenGridClass('math', mode)}>
      <SmartTextCard
        mode={mode}
        onBeautify={onBeautify}
        className={`min-h-0 ${gridArea.math.lesson}`}
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
        className={`min-h-0 ${gridArea.math.materials}`}
      />
      <TimerWidget
        screenId="math"
        mode={mode}
        className={`min-h-0 ${gridArea.math.timer}`}
      />
    </div>
  )
}
