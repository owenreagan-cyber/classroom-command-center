import { EditableText } from '../components/editing/EditableText'
import { HiddenCardPlaceholder } from '../components/editing/HiddenCardPlaceholder'
import { BlockRoutineStrip } from '../components/routines/BlockRoutineStrip'
import { useClockTick } from '../hooks/useClockTick'
import type {
  AppMode,
  CardId,
  NoiseTrackerState,
  MathContent,
  ScreenCardVisibility,
  ScreenId,
} from '../data/types'
import { gridArea, noiseCardOverlayClass, screenGridClass } from '../lib/displayLayout'
import { getBlockRoutineTimeline } from '../lib/routineEngine'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { VoiceLevelWidget } from '../widgets/VoiceLevelWidget'
import { TimerWidget } from '../widgets/TimerWidget'
import { LessonCard } from '../widgets/LessonCard'
import { VocabularyCard } from '../widgets/VocabularyCard'

interface MathScreenProps {
  content: MathContent
  mode: AppMode
  cardVisibility: ScreenCardVisibility['math']
  noiseTracker: NoiseTrackerState
  onContentChange: (content: MathContent) => void
  onCardVisibleChange: (
    screenId: ScreenId,
    cardId: CardId,
    visible: boolean,
  ) => void
  onBeautify?: () => void
}

export function MathScreen({
  content,
  mode,
  cardVisibility,
  noiseTracker,
  onContentChange,
  onCardVisibleChange,
  onBeautify,
}: MathScreenProps) {
  const now = useClockTick(1000)
  const blockRoutine = getBlockRoutineTimeline('math', new Date(now))
  const isEdit = mode === 'edit'
  const actualLessonVisible = cardVisibility.lesson ?? true
  const actualLessonCardVisible = cardVisibility['lesson-card'] ?? false
  const actualVocabVisible = cardVisibility['vocabulary-card'] ?? false
  const actualMaterialsVisible = cardVisibility.materials ?? true
  const actualTimerVisible = cardVisibility.timer ?? true
  const actualNoiseVisible = cardVisibility.noise ?? true

  const showLesson = actualLessonVisible || isEdit
  const showLessonCard = actualLessonCardVisible || isEdit
  const showVocab = actualVocabVisible || isEdit
  const showMaterials = actualMaterialsVisible || isEdit
  const showTimer = actualTimerVisible || isEdit

  const activeLeft = showLesson || showLessonCard
  const activeMiddle = showMaterials || showVocab
  const activeRight = showTimer

  const columns: string[] = []
  if (activeLeft) {
    if (activeMiddle && activeRight) columns.push('minmax(0, 1fr)')
    else if (activeMiddle) columns.push('minmax(0, 1.2fr)')
    else if (activeRight) columns.push('minmax(0, 1fr)')
    else columns.push('minmax(0, 1fr)')
  }
  if (activeMiddle) {
    if (activeLeft && activeRight) columns.push('minmax(0, 1.05fr)')
    else if (activeLeft) columns.push('minmax(0, 1.15fr)')
    else if (activeRight) columns.push('minmax(0, 1.15fr)')
    else columns.push('minmax(0, 1fr)')
  }
  if (activeRight) {
    if (activeLeft && activeMiddle) columns.push('minmax(0, 0.68fr)')
    else if (activeLeft) columns.push('minmax(0, 0.8fr)')
    else if (activeMiddle) columns.push('minmax(0, 0.8fr)')
    else columns.push('minmax(0, 1fr)')
  }

  const gridTemplateColumns = columns.join(' ')

  const leftTwo = showLesson && showLessonCard
  const middleTwo = showMaterials && showVocab

  let gridTemplateRows = 'minmax(0, 1fr)'
  if (leftTwo || middleTwo) {
    gridTemplateRows = 'minmax(0, 1fr) minmax(0, 1fr)'
  }

  const row1: string[] = []
  const row2: string[] = []

  if (activeLeft) {
    row1.push(showLessonCard ? 'lesson-card' : 'lesson')
    row2.push(leftTwo ? 'lesson' : (showLessonCard ? 'lesson-card' : 'lesson'))
  }
  if (activeMiddle) {
    row1.push(showVocab ? 'vocabulary-card' : 'materials')
    row2.push(middleTwo ? 'materials' : (showVocab ? 'vocabulary-card' : 'materials'))
  }
  if (activeRight) {
    row1.push('timer')
    row2.push('timer')
  }

  const gridTemplateAreas = (leftTwo || middleTwo)
    ? `"${row1.join(' ')}" "${row2.join(' ')}"`
    : `"${row1.join(' ')}"`

  const gridStyle = {
    '--math-cols': gridTemplateColumns || 'none',
    '--math-rows': gridTemplateRows || 'none',
    '--math-areas': gridTemplateAreas || 'none',
  } as React.CSSProperties

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <BlockRoutineStrip
        currentWindow={blockRoutine.currentWindow}
        nextWindowLabel={blockRoutine.nextWindow?.label ?? null}
      />
      <div className={`${screenGridClass('math', mode)} relative flex-1`} style={gridStyle}>
      {(actualLessonVisible || isEdit) && (
        actualLessonVisible ? (
          <SmartTextCard
            mode={mode}
            onBeautify={onBeautify}
            editSlot={
              <EditableText
                mode={mode}
                label="Lesson title"
                value={content.lessonTitle}
                onChange={(lessonTitle) =>
                  onContentChange({ ...content, lessonTitle })
                }
                helperText="Keep this concise so it stays readable from across the room."
              />
            }
            className={`min-h-0 ${gridArea.math.lesson}`}
            model={{
              title: 'Lesson',
              blocks: [
                { kind: 'paragraph', text: content.lessonTitle, emphasis: true },
              ],
              align: 'center',
            }}
          />
        ) : (
          <HiddenCardPlaceholder
            screenId="math"
            cardId="lesson"
            label="Lesson"
            onToggle={onCardVisibleChange}
            className={gridArea.math.lesson}
          />
        )
      )}
      {(actualLessonCardVisible || isEdit) && (
        actualLessonCardVisible ? (
          <LessonCard
            content={content.lesson}
            mode={mode}
            onBeautify={onBeautify}
            onContentChange={(lesson) =>
              onContentChange({ ...content, lesson })
            }
            className={`min-h-0 ${gridArea.math.lessonCard}`}
          />
        ) : (
          <HiddenCardPlaceholder
            screenId="math"
            cardId="lesson-card"
            label="Lesson Card"
            onToggle={onCardVisibleChange}
            className={gridArea.math.lessonCard}
          />
        )
      )}
      {(actualVocabVisible || isEdit) && (
        actualVocabVisible ? (
          <VocabularyCard
            content={content.vocabulary}
            mode={mode}
            onBeautify={onBeautify}
            onContentChange={(vocabulary) =>
              onContentChange({ ...content, vocabulary })
            }
            className={`min-h-0 ${gridArea.math.vocabularyCard}`}
          />
        ) : (
          <HiddenCardPlaceholder
            screenId="math"
            cardId="vocabulary-card"
            label="Vocabulary Card"
            onToggle={onCardVisibleChange}
            className={gridArea.math.vocabularyCard}
          />
        )
      )}
      {(actualMaterialsVisible || isEdit) && (
        actualMaterialsVisible ? (
          <MaterialsCard
            title={content.materialsTitle}
            materials={content.materials}
            mode={mode}
            onBeautify={onBeautify}
            onMaterialsChange={(materials) =>
              onContentChange({ ...content, materials })
            }
            className={`min-h-0 ${gridArea.math.materials}`}
          />
        ) : (
          <HiddenCardPlaceholder
            screenId="math"
            cardId="materials"
            label="Materials"
            onToggle={onCardVisibleChange}
            className={gridArea.math.materials}
          />
        )
      )}
      {(actualTimerVisible || isEdit) && (
        actualTimerVisible ? (
          <TimerWidget
            screenId="math"
            mode={mode}
            teacherHint={content.timerNote}
            className={`min-h-0 ${gridArea.math.timer}`}
          />
        ) : (
          <HiddenCardPlaceholder
            screenId="math"
            cardId="timer"
            label="Timer"
            onToggle={onCardVisibleChange}
            className={gridArea.math.timer}
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
    </div>
  )
}
