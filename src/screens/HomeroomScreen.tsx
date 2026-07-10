import type { AppMode, HomeroomContent, ScreenCardVisibility } from '../data/types'
import { gridArea, screenGridClass } from '../lib/displayLayout'
import { DoNowCard } from '../widgets/DoNowCard'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { ReadyPositionCard } from '../widgets/ReadyPositionCard'
import { ReminderCard } from '../widgets/ReminderCard'
import { TimerWidget } from '../widgets/TimerWidget'

interface HomeroomScreenProps {
  content: HomeroomContent
  mode: AppMode
  cardVisibility: ScreenCardVisibility['homeroom']
  onBeautify?: () => void
}

export function HomeroomScreen({
  content,
  mode,
  cardVisibility,
  onBeautify,
}: HomeroomScreenProps) {
  return (
    <div className={screenGridClass('homeroom', mode)}>
      {(cardVisibility['do-now'] ?? true) && (
        <DoNowCard
          title={content.doNowTitle}
          prompt={content.doNow}
          mode={mode}
          onBeautify={onBeautify}
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
          className={`min-h-0 ${gridArea.homeroom.reminders}`}
        />
      )}
      {(cardVisibility.materials ?? true) && (
        <MaterialsCard
          title={content.materialsTitle}
          materials={content.materials}
          mode={mode}
          onBeautify={onBeautify}
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
    </div>
  )
}
