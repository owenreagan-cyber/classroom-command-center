import type { AppMode, SnackLunchContent } from '../data/types'
import { gridArea, screenGridClass } from '../lib/displayLayout'
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
    <div className={screenGridClass('snack-lunch', mode)}>
      <ReminderCard
        title={content.cleanupTitle}
        reminders={content.cleanupReminders}
        mode={mode}
        onBeautify={onBeautify}
        className={`min-h-0 ${gridArea.snackLunch.cleanup}`}
      />
      <SmartTextCard
        mode={mode}
        onBeautify={onBeautify}
        className={`min-h-0 ${gridArea.snackLunch.routine}`}
        model={{
          title: content.routineTitle,
          blocks: [{ kind: 'bullets', items: content.routine }],
          align: 'left',
          footer: content.title,
        }}
      />
      <PhaseTimerCard
        mode={mode}
        teacherHint={content.phaseNote}
        className={`min-h-0 ${gridArea.snackLunch.timer}`}
      />
    </div>
  )
}
