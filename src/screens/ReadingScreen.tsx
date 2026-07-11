import { EditableText } from '../components/editing/EditableText'
import { HiddenCardPlaceholder } from '../components/editing/HiddenCardPlaceholder'
import type {
  AppMode,
  CardId,
  NoiseTrackerState,
  ReadingContent,
  ScreenCardVisibility,
  ScreenId,
} from '../data/types'
import { gridArea, noiseCardOverlayClass, screenGridClass } from '../lib/displayLayout'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { ReadyPositionCard } from '../widgets/ReadyPositionCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { NoiseStatusCard } from '../widgets/NoiseStatusCard'
import { TimerWidget } from '../widgets/TimerWidget'

interface ReadingScreenProps {
  content: ReadingContent
  mode: AppMode
  cardVisibility: ScreenCardVisibility['reading']
  noiseTracker: NoiseTrackerState
  onContentChange: (content: ReadingContent) => void
  onCardVisibleChange: (
    screenId: ScreenId,
    cardId: CardId,
    visible: boolean,
  ) => void
  onBeautify?: () => void
}

export function ReadingScreen({
  content,
  mode,
  cardVisibility,
  noiseTracker,
  onContentChange,
  onCardVisibleChange,
  onBeautify,
}: ReadingScreenProps) {
  const isEdit = mode === 'edit'
  const actualLessonVisible = cardVisibility.lesson ?? true
  const actualMaterialsVisible = cardVisibility.materials ?? true
  const actualReadyVisible = cardVisibility.ready ?? true
  const actualTimerVisible = cardVisibility.timer ?? true
  const actualNoiseVisible = cardVisibility.noise ?? true

  return (
    <div className={`${screenGridClass('reading', mode)} relative`}>
      {(actualLessonVisible || isEdit) && (
        actualLessonVisible ? (
          <SmartTextCard
            mode={mode}
            onBeautify={onBeautify}
            editSlot={
              <EditableText
                mode={mode}
                label="Reading lesson"
                value={content.lessonTitle}
                onChange={(lessonTitle) =>
                  onContentChange({ ...content, lessonTitle })
                }
                helperText="Keep this concise so it stays readable from across the room."
              />
            }
            className={`min-h-0 ${gridArea.reading.lesson}`}
            model={{
              title: 'Reading',
              blocks: [
                { kind: 'paragraph', text: content.lessonTitle, emphasis: true },
              ],
              align: 'center',
            }}
          />
        ) : (
          <HiddenCardPlaceholder
            screenId="reading"
            cardId="lesson"
            label="Reading focus"
            onToggle={onCardVisibleChange}
            className={gridArea.reading.lesson}
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
            className={`min-h-0 ${gridArea.reading.materials}`}
          />
        ) : (
          <HiddenCardPlaceholder
            screenId="reading"
            cardId="materials"
            label="Materials"
            onToggle={onCardVisibleChange}
            className={gridArea.reading.materials}
          />
        )
      )}
      {(actualReadyVisible || isEdit) && (
        actualReadyVisible ? (
          <ReadyPositionCard
            content={content.readyPosition}
            mode={mode}
            onBeautify={onBeautify}
            className={`min-h-0 ${gridArea.reading.ready}`}
          />
        ) : (
          <HiddenCardPlaceholder
            screenId="reading"
            cardId="ready"
            label="Ready Position"
            onToggle={onCardVisibleChange}
            className={gridArea.reading.ready}
          />
        )
      )}
      {(actualTimerVisible || isEdit) && (
        actualTimerVisible ? (
          <TimerWidget
            screenId="reading"
            mode={mode}
            teacherHint={content.timerNote}
            className={`min-h-0 ${gridArea.reading.timer}`}
          />
        ) : (
          <HiddenCardPlaceholder
            screenId="reading"
            cardId="timer"
            label="Timer"
            onToggle={onCardVisibleChange}
            className={gridArea.reading.timer}
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
