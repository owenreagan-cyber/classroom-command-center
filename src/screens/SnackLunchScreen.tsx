import { EditableList } from '../components/editing/EditableList'
import { HiddenCardPlaceholder } from '../components/editing/HiddenCardPlaceholder'
import type {
  AppMode,
  CardId,
  ScreenCardVisibility,
  SnackLunchContent,
  NoiseTrackerState,
  ScreenId,
} from '../data/types'
import { gridArea, screenGridClass, noiseCardOverlayClass } from '../lib/displayLayout'
import { PhaseTimerCard } from '../widgets/PhaseTimerCard'
import { ReminderCard } from '../widgets/ReminderCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { NoiseStatusCard } from '../widgets/NoiseStatusCard'

interface SnackLunchScreenProps {
  content: SnackLunchContent
  mode: AppMode
  cardVisibility: ScreenCardVisibility['snack-lunch']
  noiseTracker?: NoiseTrackerState
  onContentChange: (content: SnackLunchContent) => void
  onCardVisibleChange: (
    screenId: ScreenId,
    cardId: CardId,
    visible: boolean,
  ) => void
  onBeautify?: () => void
}

export function SnackLunchScreen({
  content,
  mode,
  cardVisibility,
  noiseTracker,
  onContentChange,
  onCardVisibleChange,
  onBeautify,
}: SnackLunchScreenProps) {
  const isEdit = mode === 'edit'
  const actualCleanupVisible = cardVisibility.cleanup ?? true
  const actualRoutineVisible = cardVisibility.routine ?? true
  const actualPhaseTimerVisible = cardVisibility['phase-timer'] ?? true
  const actualNoiseVisible = cardVisibility.noise ?? true

  return (
    <div className={`${screenGridClass('snack-lunch', mode)} relative`}>
      {(actualCleanupVisible || isEdit) && (
        actualCleanupVisible ? (
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
        ) : (
          <HiddenCardPlaceholder
            screenId="snack-lunch"
            cardId="cleanup"
            label="Cleanup reminders"
            onToggle={onCardVisibleChange}
            className={gridArea.snackLunch.cleanup}
          />
        )
      )}
      {(actualRoutineVisible || isEdit) && (
        actualRoutineVisible ? (
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
        ) : (
          <HiddenCardPlaceholder
            screenId="snack-lunch"
            cardId="routine"
            label="Routine"
            onToggle={onCardVisibleChange}
            className={gridArea.snackLunch.routine}
          />
        )
      )}
      {(actualPhaseTimerVisible || isEdit) && (
        actualPhaseTimerVisible ? (
          <PhaseTimerCard
            mode={mode}
            teacherHint={content.phaseNote}
            className={`min-h-0 ${gridArea.snackLunch.timer}`}
          />
        ) : (
          <HiddenCardPlaceholder
            screenId="snack-lunch"
            cardId="phase-timer"
            label="Phase timer"
            onToggle={onCardVisibleChange}
            className={gridArea.snackLunch.timer}
          />
        )
      )}
      {noiseTracker && actualNoiseVisible && (
        <NoiseStatusCard
          tracker={noiseTracker}
          mode={mode}
          className={noiseCardOverlayClass(mode)}
        />
      )}
    </div>
  )
}
