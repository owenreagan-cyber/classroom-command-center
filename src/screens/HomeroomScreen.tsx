import type { AppMode, HomeroomContent } from '../data/types'
import { gridArea, screenGridClass } from '../lib/displayLayout'
import { DoNowCard } from '../widgets/DoNowCard'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { ReadyPositionCard } from '../widgets/ReadyPositionCard'
import { ReminderCard } from '../widgets/ReminderCard'
import { TimerWidget } from '../widgets/TimerWidget'

interface HomeroomScreenProps {
  content: HomeroomContent
  mode: AppMode
  onBeautify?: () => void
}

export function HomeroomScreen({ content, mode, onBeautify }: HomeroomScreenProps) {
  return (
    <div className={screenGridClass('homeroom', mode)}>
      <DoNowCard
        title={content.doNowTitle}
        prompt={content.doNow}
        mode={mode}
        onBeautify={onBeautify}
        className={`min-h-0 ${gridArea.homeroom.doNow}`}
        hero
      />
      <ReminderCard
        title={content.remindersTitle}
        reminders={content.reminders}
        mode={mode}
        onBeautify={onBeautify}
        className={`min-h-0 ${gridArea.homeroom.reminders}`}
      />
      <MaterialsCard
        title={content.materialsTitle}
        materials={content.materials}
        mode={mode}
        onBeautify={onBeautify}
        className={`min-h-0 ${gridArea.homeroom.materials}`}
      />
      <ReadyPositionCard
        content={content.readyPosition}
        mode={mode}
        compact
        onBeautify={onBeautify}
        className={`min-h-0 ${gridArea.homeroom.ready}`}
      />
      <TimerWidget
        screenId="homeroom"
        mode={mode}
        className={`min-h-0 ${gridArea.homeroom.timer}`}
      />
    </div>
  )
}
