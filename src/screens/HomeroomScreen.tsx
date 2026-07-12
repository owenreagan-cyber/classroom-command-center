import { EditableList } from '../components/editing/EditableList'
import { EditableText } from '../components/editing/EditableText'
import { HiddenCardPlaceholder } from '../components/editing/HiddenCardPlaceholder'
import { CompactRealClock } from '../components/routines/CompactRealClock'
import { LauncherDock } from '../components/routines/LauncherDock'
import { RoutineBanner } from '../components/routines/RoutineBanner'
import { useClockTick } from '../hooks/useClockTick'
import type {
  AppMode,
  CardId,
  HomeroomContent,
  NoiseTrackerState,
  ScreenCardVisibility,
  ScreenId,
} from '../data/types'
import { gridArea, noiseCardOverlayClass, screenGridClass } from '../lib/displayLayout'
import { getDailyBlockTimeline, getRoutineTimeline } from '../lib/routineEngine'
import { DoNowCard } from '../widgets/DoNowCard'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { ReadyPositionCard } from '../widgets/ReadyPositionCard'
import { ReminderCard } from '../widgets/ReminderCard'
import { VoiceLevelWidget } from '../widgets/VoiceLevelWidget'
import { TimerWidget } from '../widgets/TimerWidget'
import { formatTimerMs } from '../lib/timerFormat'
import { useTimerStore } from '../store/timerStore'
import type { RoutineSuggestion } from '../data/routineTypes'

interface HomeroomScreenProps {
  content: HomeroomContent
  mode: AppMode
  cardVisibility: ScreenCardVisibility['homeroom']
  noiseTracker: NoiseTrackerState
  onContentChange: (content: HomeroomContent) => void
  onNavigateSuggestedScreen?: (screenId: ScreenId) => void
  onCardVisibleChange: (
    screenId: ScreenId,
    cardId: CardId,
    visible: boolean,
  ) => void
  onBeautify?: () => void
}

function hasScreenSuggestion(
  suggestion: RoutineSuggestion | undefined,
): suggestion is RoutineSuggestion & { screenId: ScreenId } {
  return suggestion?.screenId !== undefined
}

export function HomeroomScreen({
  content,
  mode,
  cardVisibility,
  noiseTracker,
  onContentChange,
  onNavigateSuggestedScreen,
  onCardVisibleChange,
  onBeautify,
}: HomeroomScreenProps) {
  const now = useClockTick(1000)
  const routineControls = useTimerStore((state) => state.routineControls)
  const currentDate = new Date(now)
  const routineTimeline = getRoutineTimeline('homeroom-arrival', currentDate, routineControls)
  const blockTimeline = getDailyBlockTimeline(currentDate)

  if (mode === 'display') {
    const openMathSuggestion = {
      label: 'Open Math',
      screenId: 'math' as ScreenId,
      pageId: 'math-get-ready' as const,
    }
    const suggestion =
      routineTimeline.phase?.nextPageSuggestion ??
      routineTimeline.suggestion ??
      blockTimeline.currentBlock?.pageSuggestion ??
      blockTimeline.nextBlock?.pageSuggestion ??
      openMathSuggestion

    return (
      <div className="relative h-full min-h-0 overflow-hidden rounded-[2.25rem] border border-white/12 bg-white/5 p-4 md:p-5">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.18),transparent_42%)]"
          aria-hidden="true"
        />
        <div className="relative grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.72fr)]">
          <div className="flex min-h-0 flex-col gap-4">
            <RoutineBanner
              phase={routineTimeline.phase}
              currentBlockLabel={blockTimeline.currentBlock?.label ?? 'Carpool/Homeroom'}
              nextBlockLabel={blockTimeline.nextBlock?.label ?? 'Math'}
              suggestion={suggestion}
              finishedLabel="Ready for Math"
              onSuggestionClick={
                hasScreenSuggestion(suggestion) && onNavigateSuggestedScreen
                  ? () => onNavigateSuggestedScreen(suggestion.screenId)
                  : undefined
              }
            />

            <section className="rounded-[2rem] border border-white/12 bg-slate-950/24 p-6 text-white shadow-[0_20px_50px_rgba(15,23,42,0.22)] backdrop-blur-sm md:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-cyan-100/70">
                START HERE
              </p>
              <ol className="mt-4 space-y-3">
                {content.doNow
                  ? [
                      'Unpack',
                      'Turn in homework',
                      'Get your materials',
                      'Begin silently',
                    ].map((step, index) => (
                      <li
                        key={step}
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-200/30 bg-cyan-100/12 text-sm font-black text-cyan-50">
                          {index + 1}
                        </span>
                        <span className="pt-0.5 text-lg font-semibold leading-snug text-white/95">
                          {step}
                        </span>
                      </li>
                    ))
                  : null}
              </ol>
              {routineTimeline.phase?.label === 'Clean Up' && (
                <div className="mt-5 rounded-2xl border border-cyan-200/20 bg-cyan-100/10 px-4 py-3 text-cyan-50">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100/75">
                    Clean Up
                  </p>
                  <ul className="mt-2 space-y-1 text-base leading-relaxed">
                    <li>Finish your work</li>
                    <li>Put it away</li>
                    <li>Get ready for Math</li>
                  </ul>
                </div>
              )}
            </section>
          </div>

          <div className="flex min-h-0 flex-col gap-4">
            <CompactRealClock now={now} />

            <section className="rounded-[2rem] border border-white/12 bg-slate-950/24 p-4 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)] backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
                Materials
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {[
                  'Blue folder',
                  'Math notebook',
                  'Math textbook',
                  'Folder organizer',
                  'Pencil pouch',
                  'Snack',
                  'Water',
                ].map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-sm font-medium text-white/90"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[2rem] border border-white/12 bg-slate-950/24 p-4 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)] backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
                Routine timer
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums text-cyan-50">
                {routineTimeline.phase ? formatTimerMs(routineTimeline.phase.remainingMs) : 'Ready'}
              </p>
              <p className="mt-1 text-sm text-white/75">
                {routineTimeline.phase?.label ?? 'Ready for Math'}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/80">
                {blockTimeline.currentBlock?.label
                  ? `Current block: ${blockTimeline.currentBlock.label}`
                  : 'Waiting for the next scheduled block.'}
              </p>
            </section>

            <LauncherDock mode="display" />

            <section className="rounded-[2rem] border border-white/12 bg-slate-950/24 p-4 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)] backdrop-blur-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
                Music
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/82">
                Future music launcher placeholder. Not yet integrated.
              </p>
            </section>
          </div>
        </div>
      </div>
    )
  }

  const isEdit = mode === 'edit'
  const showDoNow = (cardVisibility['do-now'] ?? true) || isEdit
  const showReminders = (cardVisibility.reminders ?? true) || isEdit
  const showMaterials = (cardVisibility.materials ?? true) || isEdit
  const showReady = (cardVisibility.ready ?? true) || isEdit
  const showTimer = (cardVisibility.timer ?? true) || isEdit

  const actualDoNowVisible = cardVisibility['do-now'] ?? true
  const actualRemindersVisible = cardVisibility.reminders ?? true
  const actualMaterialsVisible = cardVisibility.materials ?? true
  const actualReadyVisible = cardVisibility.ready ?? true
  const actualTimerVisible = cardVisibility.timer ?? true
  const actualNoiseVisible = cardVisibility.noise ?? true

  const activeLeft = showDoNow || showMaterials
  const activeMiddle = showReminders
  const activeRight = showTimer || showReady

  const columns: string[] = []
  if (activeLeft) {
    if (activeMiddle && activeRight) columns.push('minmax(0, 1.15fr)')
    else if (activeMiddle) columns.push('minmax(0, 1.25fr)')
    else if (activeRight) columns.push('minmax(0, 1.2fr)')
    else columns.push('minmax(0, 1fr)')
  }
  if (activeMiddle) {
    if (activeLeft && activeRight) columns.push('minmax(0, 0.95fr)')
    else if (activeLeft) columns.push('minmax(0, 0.95fr)')
    else if (activeRight) columns.push('minmax(0, 1.15fr)')
    else columns.push('minmax(0, 1fr)')
  }
  if (activeRight) {
    if (activeLeft && activeMiddle) columns.push('minmax(0, 0.72fr)')
    else if (activeLeft) columns.push('minmax(0, 0.8fr)')
    else if (activeMiddle) columns.push('minmax(0, 0.85fr)')
    else columns.push('minmax(0, 1fr)')
  }

  const gridTemplateColumns = columns.join(' ')

  const leftTwo = showDoNow && showMaterials
  const rightTwo = showTimer && showReady
  const hasTwoRows = leftTwo || rightTwo

  let gridTemplateRows: string
  let gridTemplateAreas: string

  if (hasTwoRows) {
    gridTemplateRows = 'minmax(0, 1.05fr) minmax(0, 0.88fr)'
    const row1: string[] = []
    const row2: string[] = []

    if (activeLeft) {
      row1.push(showDoNow ? 'do-now' : 'materials')
      row2.push(showMaterials ? 'materials' : 'do-now')
    }
    if (activeMiddle) {
      row1.push('reminders')
      row2.push('reminders')
    }
    if (activeRight) {
      row1.push(showTimer ? 'timer' : 'ready')
      row2.push(showReady ? 'ready' : 'timer')
    }
    gridTemplateAreas = `"${row1.join(' ')}" "${row2.join(' ')}"`
  } else {
    gridTemplateRows = 'minmax(0, 1fr)'
    const row1: string[] = []
    if (activeLeft) {
      row1.push(showDoNow ? 'do-now' : 'materials')
    }
    if (activeMiddle) {
      row1.push('reminders')
    }
    if (activeRight) {
      row1.push(showTimer ? 'timer' : 'ready')
    }
    gridTemplateAreas = `"${row1.join(' ')}"`
  }

  const gridStyle = {
    '--homeroom-cols': gridTemplateColumns || 'none',
    '--homeroom-rows': gridTemplateRows || 'none',
    '--homeroom-areas': gridTemplateAreas || 'none',
  } as React.CSSProperties

  return (
    <div
      className={`${screenGridClass('homeroom', mode)} relative`}
      style={gridStyle}
    >
      {showDoNow && (
        actualDoNowVisible ? (
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
        ) : (
          <HiddenCardPlaceholder
            screenId="homeroom"
            cardId="do-now"
            label="Do Now"
            onToggle={onCardVisibleChange}
            className={gridArea.homeroom.doNow}
          />
        )
      )}
      {showReminders && (
        actualRemindersVisible ? (
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
        ) : (
          <HiddenCardPlaceholder
            screenId="homeroom"
            cardId="reminders"
            label="Reminders"
            onToggle={onCardVisibleChange}
            className={gridArea.homeroom.reminders}
          />
        )
      )}
      {showMaterials && (
        actualMaterialsVisible ? (
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
        ) : (
          <HiddenCardPlaceholder
            screenId="homeroom"
            cardId="materials"
            label="Materials"
            onToggle={onCardVisibleChange}
            className={gridArea.homeroom.materials}
          />
        )
      )}
      {showReady && (
        actualReadyVisible ? (
          <ReadyPositionCard
            content={content.readyPosition}
            mode={mode}
            compact
            onBeautify={onBeautify}
            editSlot={
              <EditableText
                mode={mode}
                label="Compact cue"
                value={content.readyPosition.compactLine}
                onChange={(compactLine) =>
                  onContentChange({
                    ...content,
                    readyPosition: { ...content.readyPosition, compactLine },
                  })
                }
                multiline
                helperText="A quick one-line reminder for the homeroom board."
              />
            }
            className={`min-h-0 ${gridArea.homeroom.ready}`}
          />
        ) : (
          <HiddenCardPlaceholder
            screenId="homeroom"
            cardId="ready"
            label="Ready Position"
            onToggle={onCardVisibleChange}
            className={gridArea.homeroom.ready}
          />
        )
      )}
      {showTimer && (
        actualTimerVisible ? (
          <TimerWidget
            screenId="homeroom"
            mode={mode}
            className={`min-h-0 ${gridArea.homeroom.timer}`}
          />
        ) : (
          <HiddenCardPlaceholder
            screenId="homeroom"
            cardId="timer"
            label="Timer"
            onToggle={onCardVisibleChange}
            className={gridArea.homeroom.timer}
          />
        )
      )}
      {actualNoiseVisible && (
        <VoiceLevelWidget
          level={noiseTracker.voiceLevel}
          mode={mode}
          className={noiseCardOverlayClass(mode)}
        />
      )}
    </div>
  )
}
