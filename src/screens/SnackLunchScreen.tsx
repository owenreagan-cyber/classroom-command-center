import { EditableList } from '../components/editing/EditableList'
import type {
  AppMode,
  ScreenCardVisibility,
  SnackLunchContent,
} from '../data/types'
import { gridArea, screenGridClass } from '../lib/displayLayout'
import { PhaseTimerCard } from '../widgets/PhaseTimerCard'
import { ReminderCard } from '../widgets/ReminderCard'
import { SmartTextCard } from '../widgets/SmartTextCard'

interface SnackLunchScreenProps {
  content: SnackLunchContent
  mode: AppMode
  cardVisibility: ScreenCardVisibility['snack-lunch']
  onContentChange: (content: SnackLunchContent) => void
  onBeautify?: () => void
}

export function SnackLunchScreen({
  content,
  mode,
  cardVisibility,
  onContentChange,
  onBeautify,
}: SnackLunchScreenProps) {
  return (
    <div className={screenGridClass('snack-lunch', mode)}>
      {(cardVisibility.cleanup ?? true) && (
        <ReminderCard
          title={content.cleanupTitle}
          reminders={content.cleanupReminders}
          mode={mode}
          onBeautify={onBeautify}
          editSlot={
            <EditableList
              mode={mode}
              label="Cleanup reminders"
              items={content.cleanupReminders}
              onChange={(cleanupReminders) =>
                onContentChange({ ...content, cleanupReminders })
              }
              helperText="One cleanup reminder per line."
            />
          }
          className={`min-h-0 ${gridArea.snackLunch.cleanup}`}
        />
      )}
      {(cardVisibility.routine ?? true) && (
        <SmartTextCard
          mode={mode}
          onBeautify={onBeautify}
          editSlot={
            <EditableList
              mode={mode}
              label="Routine"
              items={content.routine}
              onChange={(routine) => onContentChange({ ...content, routine })}
              helperText="One routine step per line."
            />
          }
          className={`min-h-0 ${gridArea.snackLunch.routine}`}
          model={{
            title: content.routineTitle,
            blocks: [{ kind: 'bullets', items: content.routine }],
            align: 'left',
            footer: content.title,
          }}
        />
      )}
      {(cardVisibility['phase-timer'] ?? true) && (
        <PhaseTimerCard
          mode={mode}
          teacherHint={content.phaseNote}
          className={`min-h-0 ${gridArea.snackLunch.timer}`}
        />
      )}
    </div>
  )
}
