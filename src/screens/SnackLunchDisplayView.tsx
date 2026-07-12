import { EditableList } from '../components/editing/EditableList'
import { HiddenCardPlaceholder } from '../components/editing/HiddenCardPlaceholder'
import { CompactRealClock } from '../components/routines/CompactRealClock'
import { LauncherDock } from '../components/routines/LauncherDock'
import { RoutineBanner } from '../components/routines/RoutineBanner'
import { useClockTick } from '../hooks/useClockTick'
import type { AppMode, CardId, SnackContent, LunchContent, NoiseTrackerState, ScreenId } from '../data/types'
import type { ScreenCardVisibility } from '../data/types'
import { screenGridClass, noiseCardOverlayClass } from '../lib/displayLayout'
import { getDailyBlockTimeline, getRoutineTimeline } from '../lib/routineEngine'
import { VoiceLevelWidget } from '../widgets/VoiceLevelWidget'
import { useTimerStore } from '../store/timerStore'
import { PhaseTimerCard } from '../widgets/PhaseTimerCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { ReminderCard } from '../widgets/ReminderCard'
import type { RoutineSuggestion } from '../data/routineTypes'

interface SnackLunchDisplayViewProps {
  content: SnackContent | LunchContent
  snackKind: 'snack' | 'lunch'
  mode: AppMode
  cardVisibility: ScreenCardVisibility['snack'] | ScreenCardVisibility['lunch']
  noiseTracker?: NoiseTrackerState
  onContentChange: (content: SnackContent | LunchContent) => void
  onCardVisibleChange: (screenId: ScreenId, cardId: CardId, visible: boolean) => void
  onBeautify?: () => void
  onNavigateSuggestedScreen?: (screenId: ScreenId) => void
}

function hasScreenSuggestion(
  suggestion: RoutineSuggestion | undefined,
): suggestion is RoutineSuggestion & { screenId: ScreenId } {
  return suggestion?.screenId !== undefined
}

export function SnackLunchDisplayView({
  content,
  snackKind,
  mode,
  cardVisibility,
  noiseTracker,
  onContentChange,
  onCardVisibleChange,
  onBeautify,
  onNavigateSuggestedScreen,
}: SnackLunchDisplayViewProps) {
  const now = useClockTick(1000)
  const routineControls = useTimerStore((state) => state.routineControls)
  const currentDate = new Date(now)
  const blockTimeline = getDailyBlockTimeline(currentDate)
  const scheduleId = snackKind === 'lunch' ? 'lunch-routine' : 'snack-routine'
  const routineTimeline = getRoutineTimeline(scheduleId, currentDate, routineControls)

  if (mode === 'display') {
    const fallbackSuggestion = snackKind === 'lunch'
      ? { label: 'Open Recess', screenId: 'recess' as ScreenId, pageId: 'recess-play' as const }
      : { label: 'Open History/Science', screenId: 'science' as ScreenId, pageId: 'history-science-get-ready' as const }
    const suggestion =
      routineTimeline.phase?.nextPageSuggestion ??
      routineTimeline.suggestion ??
      blockTimeline.currentBlock?.pageSuggestion ??
      blockTimeline.nextBlock?.pageSuggestion ??
      fallbackSuggestion

    return (
      <div className="relative h-full min-h-0 overflow-hidden rounded-[2.25rem] border border-white/12 bg-white/5 p-4 md:p-5">
        <div className="relative grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.72fr)]">
          <div className="flex min-h-0 flex-col gap-4">
            <RoutineBanner
              phase={routineTimeline.phase}
              currentBlockLabel={blockTimeline.currentBlock?.label ?? snackKind === 'lunch' ? 'Lunch' : 'Snack'}
              nextBlockLabel={blockTimeline.nextBlock?.label ?? 'Next block'}
              suggestion={suggestion}
              compact
              finishedLabel={snackKind === 'lunch' ? 'Ready for Recess' : 'Ready for next block'}
              onSuggestionClick={
                hasScreenSuggestion(suggestion) && onNavigateSuggestedScreen
                  ? () => onNavigateSuggestedScreen(suggestion.screenId)
                  : undefined
              }
            />
            <section className="rounded-[2rem] border border-white/12 bg-slate-950/24 p-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)] backdrop-blur-sm md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-100/70">
                {routineTimeline.phase?.label ?? (snackKind === 'lunch' ? 'Lunch' : 'Snack')}
              </p>
              <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white/92">
                {routineTimeline.phase?.instructions?.[0] ?? (snackKind === 'lunch' ? 'Enjoy your lunch quietly.' : 'Enjoy your snack quietly.')}
              </p>
            </section>
          </div>
          <div className="flex min-h-0 flex-col gap-4">
            <CompactRealClock now={now} label={snackKind === 'lunch' ? 'Lunch clock' : 'Snack clock'} />
            {routineTimeline.phase && (
              <section className="rounded-[2rem] border border-white/12 bg-slate-950/24 p-4 text-white shadow backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-100/70">Phase</p>
                <p className="mt-2 text-lg font-bold text-amber-50">{routineTimeline.phase.label}</p>
              </section>
            )}
            <LauncherDock mode="display" />
          </div>
        </div>
      </div>
    )
  }

  const isEdit = mode === 'edit'
  const actualCleanupVisible = cardVisibility.cleanup ?? true
  const actualRoutineVisible = cardVisibility.routine ?? true
  const actualPhaseTimerVisible = cardVisibility['phase-timer'] ?? true
  const actualNoiseVisible = cardVisibility.noise ?? true

  return (
    <div className={`${screenGridClass(snackKind, mode)} relative`}>
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
                onChange={(cr) => onContentChange({ ...content, cleanupReminders: cr })}
                helperText="One cleanup reminder per line."
              />
            }
            className="min-h-0"
          />
        ) : (
          <HiddenCardPlaceholder screenId={snackKind} cardId="cleanup" label="Cleanup reminders" onToggle={onCardVisibleChange} />
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
            className="min-h-0"
            model={{
              title: content.routineTitle,
              blocks: [{ kind: 'bullets', items: content.routine }],
              align: 'left',
              footer: content.title,
            }}
          />
        ) : (
          <HiddenCardPlaceholder screenId={snackKind} cardId="routine" label="Routine" onToggle={onCardVisibleChange} />
        )
      )}
      {(actualPhaseTimerVisible || isEdit) && (
        actualPhaseTimerVisible ? (
          <PhaseTimerCard mode={mode} teacherHint={content.phaseNote} className="min-h-0" />
        ) : (
          <HiddenCardPlaceholder screenId={snackKind} cardId="phase-timer" label="Phase timer" onToggle={onCardVisibleChange} />
        )
      )}
      {noiseTracker && actualNoiseVisible && (
        <VoiceLevelWidget level={noiseTracker.voiceLevel} mode={mode} className={noiseCardOverlayClass(mode)} />
      )}
    </div>
  )
}
