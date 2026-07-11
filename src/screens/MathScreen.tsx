import { EditableText } from '../components/editing/EditableText'
import { HiddenCardPlaceholder } from '../components/editing/HiddenCardPlaceholder'
import type {
  AppMode,
  CardId,
  NoiseTrackerState,
  MathContent,
  ScreenCardVisibility,
  ScreenId,
} from '../data/types'
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
  onCardVisibleChange: (
    screenId: ScreenId,
    cardId: CardId,
    visible: boolean,
  ) => void
  onBeautify?: () => void
}

export function MathScreen({
  content,
  mode,
  cardVisibility,
  noiseTracker,
  onContentChange,
  onCardVisibleChange,
  onBeautify,
}: MathScreenProps) {
  const isEdit = mode === 'edit'
  const actualLessonVisible = cardVisibility.lesson ?? true
  const actualMaterialsVisible = cardVisibility.materials ?? true
  const actualTimerVisible = cardVisibility.timer ?? true
  const actualNoiseVisible = cardVisibility.noise ?? true

  return (
    <div className={`${screenGridClass('math', mode)} relative`}>
      {(actualLessonVisible || isEdit) && (
        actualLessonVisible ? (
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
        ) : (
          <HiddenCardPlaceholder
            screenId="math"
            cardId="lesson"
            label="Lesson"
            onToggle={onCardVisibleChange}
            className={gridArea.math.lesson}
          />
        )
      )}
      {(actualMaterialsVisible || isEdit) && (
        actualMaterialsVisible ? (
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
        ) : (
          <HiddenCardPlaceholder
            screenId="math"
            cardId="materials"
            label="Materials"
            onToggle={onCardVisibleChange}
            className={gridArea.math.materials}
          />
        )
      )}
      {(actualTimerVisible || isEdit) && (
        actualTimerVisible ? (
          <TimerWidget
            screenId="math"
            mode={mode}
            teacherHint={content.timerNote}
            className={`min-h-0 ${gridArea.math.timer}`}
          />
        ) : (
          <HiddenCardPlaceholder
            screenId="math"
            cardId="timer"
            label="Timer"
            onToggle={onCardVisibleChange}
            className={gridArea.math.timer}
          />
        )
      )}
      {actualNoiseVisible && (
        <NoiseStatusCard
          tracker={noiseTracker}
          mode={mode}
          className={noiseCardOverlayClass(mode)}
        />
      )}
    </div>
  )
}
