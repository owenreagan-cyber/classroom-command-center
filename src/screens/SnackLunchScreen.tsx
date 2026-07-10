import type { AppMode, SnackLunchContent } from '../data/types'
import { PhaseTimerCard } from '../widgets/PhaseTimerCard'
import { ReminderCard } from '../widgets/ReminderCard'
import { SmartTextCard } from '../widgets/SmartTextCard'

interface SnackLunchScreenProps {
  content: SnackLunchContent
  mode: AppMode
  onBeautify?: () => void
}

export function SnackLunchScreen({
  content,
  mode,
  onBeautify,
}: SnackLunchScreenProps) {
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 md:grid-cols-3">
      <ReminderCard
        title={content.cleanupTitle}
        reminders={content.cleanupReminders}
        mode={mode}
        onBeautify={onBeautify}
        className="min-h-0"
      />
      <SmartTextCard
        mode={mode}
        onBeautify={onBeautify}
        className="min-h-0"
        model={{
          title: content.routineTitle,
          blocks: [{ kind: 'bullets', items: content.routine }],
          align: 'left',
          footer: content.title,
        }}
      />
      <PhaseTimerCard mode={mode} className="min-h-0" />
    </div>
  )
}
