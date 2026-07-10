import type { AppMode, ReadingContent, ScreenCardVisibility } from '../data/types'
import { gridArea, screenGridClass } from '../lib/displayLayout'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { ReadyPositionCard } from '../widgets/ReadyPositionCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { TimerWidget } from '../widgets/TimerWidget'

interface ReadingScreenProps {
  content: ReadingContent
  mode: AppMode
  cardVisibility: ScreenCardVisibility['reading']
  onBeautify?: () => void
}

export function ReadingScreen({
  content,
  mode,
  cardVisibility,
  onBeautify,
}: ReadingScreenProps) {
  return (
    <div className={screenGridClass('reading', mode)}>
      {(cardVisibility.lesson ?? true) && (
        <SmartTextCard
          mode={mode}
          onBeautify={onBeautify}
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
    </div>
  )
}
