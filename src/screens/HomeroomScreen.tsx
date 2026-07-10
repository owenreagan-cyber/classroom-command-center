import type { AppMode, HomeroomContent } from '../data/types'
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
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      <ReminderCard
        title={content.remindersTitle}
        reminders={content.reminders}
        mode={mode}
        onBeautify={onBeautify}
        className="min-h-0"
      />
      <DoNowCard
        title={content.doNowTitle}
        prompt={content.doNow}
        mode={mode}
        onBeautify={onBeautify}
        className="min-h-0"
      />
      <MaterialsCard
        title={content.materialsTitle}
        materials={content.materials}
        mode={mode}
        onBeautify={onBeautify}
        className="min-h-0"
      />
      <ReadyPositionCard
        content={content.readyPosition}
        mode={mode}
        compact
        onBeautify={onBeautify}
        className="min-h-0"
      />
      <TimerWidget screenId="homeroom" mode={mode} className="min-h-0" />
    </div>
  )
}
