import { EditableList } from '../components/editing/EditableList'
import { EditableText } from '../components/editing/EditableText'
import { HiddenCardPlaceholder } from '../components/editing/HiddenCardPlaceholder'
import type {
  AppMode,
  CardId,
  HomeroomContent,
  NoiseTrackerState,
  ScreenCardVisibility,
  ScreenId,
} from '../data/types'
import { gridArea, noiseCardOverlayClass, screenGridClass } from '../lib/displayLayout'
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
  onCardVisibleChange: (
    screenId: ScreenId,
    cardId: CardId,
    visible: boolean,
  ) => void
  onBeautify?: () => void
}

export function HomeroomScreen({
  content,
  mode,
  cardVisibility,
  noiseTracker,
  onContentChange,
  onCardVisibleChange,
  onBeautify,
}: HomeroomScreenProps) {
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
        <NoiseStatusCard
          tracker={noiseTracker}
          mode={mode}
          className={noiseCardOverlayClass(mode)}
        />
      )}
    </div>
  )
}
