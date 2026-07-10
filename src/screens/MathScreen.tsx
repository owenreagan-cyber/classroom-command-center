import { EditableText } from '../components/editing/EditableText'
import type { AppMode, NoiseTrackerState, MathContent, ScreenCardVisibility } from '../data/types'
import { gridArea, noiseCardOverlayClass, screenGridClass } from '../lib/displayLayout'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { NoiseStatusCard } from '../widgets/NoiseStatusCard'
import { TimerWidget } from '../widgets/TimerWidget'

interface MathScreenProps {
  content: MathContent
  mode: AppMode
  cardVisibility: ScreenCardVisibility['math']
  noiseTracker: NoiseTrackerState
  onContentChange: (content: MathContent) => void
  onBeautify?: () => void
}

export function MathScreen({
  content,
  mode,
  cardVisibility,
  noiseTracker,
  onContentChange,
  onBeautify,
}: MathScreenProps) {
  return (
    <div className={`${screenGridClass('math', mode)} relative`}>
      {(cardVisibility.lesson ?? true) && (
        <SmartTextCard
          mode={mode}
          onBeautify={onBeautify}
          editSlot={
            <EditableText
              mode={mode}
              label="Lesson title"
              value={content.lessonTitle}
              onChange={(lessonTitle) =>
                onContentChange({ ...content, lessonTitle })
              }
              helperText="Keep this concise so it stays readable from across the room."
            />
          }
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
          onMaterialsChange={(materials) =>
            onContentChange({ ...content, materials })
          }
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
      {(cardVisibility.noise ?? true) && (
        <NoiseStatusCard
          tracker={noiseTracker}
          mode={mode}
          className={noiseCardOverlayClass(mode)}
        />
      )}
    </div>
  )
}
