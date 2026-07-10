import { EditableText } from '../components/editing/EditableText'
import type { AppMode, NoiseTrackerState, ReadingContent, ScreenCardVisibility } from '../data/types'
import { gridArea, screenGridClass } from '../lib/displayLayout'
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
  onBeautify?: () => void
}

export function ReadingScreen({
  content,
  mode,
  cardVisibility,
  noiseTracker,
  onContentChange,
  onBeautify,
}: ReadingScreenProps) {
  return (
    <div className={`${screenGridClass('reading', mode)} relative`}>
      {(cardVisibility.lesson ?? true) && (
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
          className={`min-h-0 ${gridArea.reading.materials}`}
        />
      )}
      {(cardVisibility.ready ?? true) && (
        <ReadyPositionCard
          content={content.readyPosition}
          mode={mode}
          onBeautify={onBeautify}
          className={`min-h-0 ${gridArea.reading.ready}`}
        />
      )}
      {(cardVisibility.timer ?? true) && (
        <TimerWidget
          screenId="reading"
          mode={mode}
          teacherHint={content.timerNote}
          className={`min-h-0 ${gridArea.reading.timer}`}
        />
      )}
      {(cardVisibility.noise ?? true) && (
        <NoiseStatusCard
          tracker={noiseTracker}
          mode={mode}
          className="absolute bottom-4 right-4 z-20 h-[18rem] w-[min(28rem,34vw)]"
        />
      )}
    </div>
  )
}
