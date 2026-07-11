import { EditableList } from '../components/editing/EditableList'
import { EditableText } from '../components/editing/EditableText'
import type {
  AppMode,
  HomeroomContent,
  NoiseTrackerState,
  ScreenCardVisibility,
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
  onBeautify?: () => void
}

export function HomeroomScreen({
  content,
  mode,
  cardVisibility,
  noiseTracker,
  onContentChange,
  onBeautify,
}: HomeroomScreenProps) {
  const showDoNow = cardVisibility['do-now'] ?? true
  const showReminders = cardVisibility.reminders ?? true
  const showMaterials = cardVisibility.materials ?? true
  const showReady = cardVisibility.ready ?? true
  const showTimer = cardVisibility.timer ?? true

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
      {(cardVisibility['do-now'] ?? true) && (
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
      )}
      {(cardVisibility.reminders ?? true) && (
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
      )}
      {(cardVisibility.materials ?? true) && (
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
      {(cardVisibility.noise ?? true) && (
        <NoiseStatusCard
          tracker={noiseTracker}
          mode={mode}
          className={noiseCardOverlayClass(mode)}
        />
      )}
    </div>
  )
}
