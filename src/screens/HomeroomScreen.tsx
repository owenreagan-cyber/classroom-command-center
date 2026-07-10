import { EditableList } from '../components/editing/EditableList'
import { EditableText } from '../components/editing/EditableText'
import type {
  AppMode,
  HomeroomContent,
  NoiseTrackerState,
  ScreenCardVisibility,
} from '../data/types'
import { gridArea, screenGridClass } from '../lib/displayLayout'
import { DoNowCard } from '../widgets/DoNowCard'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { ReadyPositionCard } from '../widgets/ReadyPositionCard'
import { ReminderCard } from '../widgets/ReminderCard'
import { NoiseStatusCard } from '../widgets/NoiseStatusCard'
import { TimerWidget } from '../widgets/TimerWidget'

interface HomeroomScreenProps {
  content: HomeroomContent
  mode: AppMode
  cardVisibility: ScreenCardVisibility['homeroom']
  noiseTracker: NoiseTrackerState
  onContentChange: (content: HomeroomContent) => void
  onBeautify?: () => void
}

export function HomeroomScreen({
  content,
  mode,
  cardVisibility,
  noiseTracker,
  onContentChange,
  onBeautify,
}: HomeroomScreenProps) {
  return (
    <div className={`${screenGridClass('homeroom', mode)} relative`}>
      {(cardVisibility['do-now'] ?? true) && (
        <DoNowCard
          title={content.doNowTitle}
          prompt={content.doNow}
          mode={mode}
          onBeautify={onBeautify}
          editSlot={
            <EditableText
              mode={mode}
              label="Do Now prompt"
              value={content.doNow}
              onChange={(doNow) => onContentChange({ ...content, doNow })}
              multiline
              helperText="This is the large student-facing arrival task."
            />
          }
          className={`min-h-0 ${gridArea.homeroom.doNow}`}
          hero
        />
      )}
      {(cardVisibility.reminders ?? true) && (
        <ReminderCard
          title={content.remindersTitle}
          reminders={content.reminders}
          mode={mode}
          onBeautify={onBeautify}
          editSlot={
            <EditableList
              mode={mode}
              label="Reminders"
              items={content.reminders}
              onChange={(reminders) =>
                onContentChange({ ...content, reminders })
              }
              helperText="One reminder per line. Blank lines are ignored."
            />
          }
          className={`min-h-0 ${gridArea.homeroom.reminders}`}
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
          className={`min-h-0 ${gridArea.homeroom.materials}`}
        />
      )}
      {(cardVisibility.ready ?? true) && (
        <ReadyPositionCard
          content={content.readyPosition}
          mode={mode}
          compact
          onBeautify={onBeautify}
          className={`min-h-0 ${gridArea.homeroom.ready}`}
        />
      )}
      {(cardVisibility.timer ?? true) && (
        <TimerWidget
          screenId="homeroom"
          mode={mode}
          className={`min-h-0 ${gridArea.homeroom.timer}`}
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
