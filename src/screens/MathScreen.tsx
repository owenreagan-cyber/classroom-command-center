import type { AppMode, MathContent, ScreenCardVisibility } from '../data/types'
import { gridArea, screenGridClass } from '../lib/displayLayout'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { TimerWidget } from '../widgets/TimerWidget'

interface MathScreenProps {
  content: MathContent
  mode: AppMode
  cardVisibility: ScreenCardVisibility['math']
  onBeautify?: () => void
}

export function MathScreen({
  content,
  mode,
  cardVisibility,
  onBeautify,
}: MathScreenProps) {
  return (
    <div className={screenGridClass('math', mode)}>
      {(cardVisibility.lesson ?? true) && (
        <SmartTextCard
          mode={mode}
          onBeautify={onBeautify}
          className={`min-h-0 ${gridArea.math.lesson}`}
          model={{
            title: 'Lesson',
            blocks: [
              { kind: 'paragraph', text: content.lessonTitle, emphasis: true },
            ],
            align: 'center',
          }}
        />
      )}
      {(cardVisibility.materials ?? true) && (
        <MaterialsCard
          title={content.materialsTitle}
          materials={content.materials}
          mode={mode}
          onBeautify={onBeautify}
          className={`min-h-0 ${gridArea.math.materials}`}
        />
      )}
      {(cardVisibility.timer ?? true) && (
        <TimerWidget
          screenId="math"
          mode={mode}
          teacherHint={content.timerNote}
          className={`min-h-0 ${gridArea.math.timer}`}
        />
      )}
    </div>
  )
}
