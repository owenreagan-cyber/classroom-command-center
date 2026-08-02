import { EditableList } from '../../components/editing/EditableList'
import { EditableText } from '../../components/editing/EditableText'
import type { AppMode, ScreenContents, ScreenId, VibePage } from '../../data/types'
import { DoNowCard } from '../../widgets/DoNowCard'
import { MaterialsCard } from '../../widgets/MaterialsCard'
import { ReadyPositionCard } from '../../widgets/ReadyPositionCard'
import { ReminderCard } from '../../widgets/ReminderCard'
import { LessonCard } from '../../widgets/LessonCard'
import { VocabularyCard } from '../../widgets/VocabularyCard'
import { SmartTextCard } from '../../widgets/SmartTextCard'
import { TimerWidget } from '../../widgets/TimerWidget'
import { TransitionTimerWidget } from '../../widgets/TransitionTimerWidget'
import { TaskTimerWidget } from '../../widgets/TaskTimerWidget'
import { RoutineTimerWidget } from '../../widgets/RoutineTimerWidget'
import { MorningMessageWidget } from '../../features/morning-message/MorningMessageWidget'
import type { SimpleTimerScreenId } from '../../data/timerTypes'
import {
  TIMER_CAPABLE_SCREENS,
  getDoNowSlot,
  getFocusSlot,
  getLessonCardSlot,
  getLessonTitleSlot,
  getMaterialsSlot,
  getReadyPositionSlot,
  getRemindersSlot,
  getTimerNote,
  getVocabularySlot,
} from './widgetContentAdapter'

export interface WidgetContentBodyProps {
  screenId: ScreenId
  type: string
  mode: AppMode
  contents: ScreenContents
  page: VibePage
  onContentsChange: (contents: ScreenContents) => void
  onBeautify?: () => void
  className?: string
}

/** Renders a page widget's actual content by delegating to the same widget
 * card components the legacy per-screen dashboards use. Because those cards
 * already branch on `mode` internally (inline EditableText/EditableList in
 * 'edit', clean read-only markup in 'display'), this single component works
 * unmodified for both Studio Canvas and Classroom Mode. */
export function WidgetContentBody({
  screenId,
  type,
  mode,
  contents,
  page,
  onContentsChange,
  onBeautify,
  className = 'h-full',
}: WidgetContentBodyProps) {
  switch (type) {
    case 'do-now': {
      const slot = getDoNowSlot(screenId, contents)
      if (!slot) return <UnavailablePlaceholder label="Do Now" className={className} />
      return (
        <DoNowCard
          title={slot.title}
          prompt={slot.prompt}
          mode={mode}
          hero
          onBeautify={onBeautify}
          className={className}
          editSlot={
            <EditableText
              mode={mode}
              label="Do Now prompt"
              value={slot.prompt}
              onChange={(v) => onContentsChange(slot.onChange(v))}
              multiline
              helperText="This is the large student-facing arrival task."
            />
          }
        />
      )
    }

    case 'reminders': {
      const slot = getRemindersSlot(screenId, contents)
      if (!slot) return <UnavailablePlaceholder label="Reminders" className={className} />
      return (
        <ReminderCard
          title={slot.title}
          reminders={slot.reminders}
          mode={mode}
          onBeautify={onBeautify}
          className={className}
          editSlot={
            <EditableList
              mode={mode}
              label="Reminders"
              items={slot.reminders}
              onChange={(v) => onContentsChange(slot.onChange(v))}
              helperText="One reminder per line. Blank lines are ignored."
            />
          }
        />
      )
    }

    case 'materials': {
      const slot = getMaterialsSlot(screenId, contents)
      if (!slot) return <UnavailablePlaceholder label="Materials" className={className} />
      return (
        <MaterialsCard
          title={slot.title}
          materials={slot.materials}
          mode={mode}
          onBeautify={onBeautify}
          className={className}
          onMaterialsChange={(materials) => onContentsChange(slot.onChange(materials))}
        />
      )
    }

    case 'ready': {
      const slot = getReadyPositionSlot(screenId, contents)
      return (
        <ReadyPositionCard
          content={slot.content}
          mode={mode}
          onBeautify={onBeautify}
          className={className}
          editSlot={
            <EditableList
              mode={mode}
              label="Checklist steps"
              items={slot.content.steps}
              onChange={(steps) => onContentsChange(slot.onChange({ ...slot.content, steps }))}
              helperText={
                slot.isSharedFallback
                  ? 'One checklist cue per line. This page shares content with the Ready Position screen.'
                  : 'One checklist cue per line.'
              }
            />
          }
        />
      )
    }

    case 'compact-cue': {
      const slot = getReadyPositionSlot(screenId, contents)
      return (
        <SmartTextCard
          mode={mode}
          className={className}
          model={{
            title: mode === 'display' ? 'Quick Cue' : 'Compact Cue',
            blocks: [{ kind: 'paragraph', text: slot.content.compactLine, emphasis: true }],
            align: 'center',
          }}
          editSlot={
            <EditableText
              mode={mode}
              label="Compact cue"
              value={slot.content.compactLine}
              onChange={(compactLine) => onContentsChange(slot.onChange({ ...slot.content, compactLine }))}
              multiline
              helperText="A quick one-line reminder."
            />
          }
        />
      )
    }

    case 'lesson': {
      const slot = getLessonTitleSlot(screenId, contents)
      if (!slot) return <UnavailablePlaceholder label="Lesson" className={className} />
      return (
        <SmartTextCard
          mode={mode}
          className={className}
          onBeautify={onBeautify}
          model={{ title: 'Lesson', blocks: [{ kind: 'paragraph', text: slot.lessonTitle, emphasis: true }], align: 'center' }}
          editSlot={
            <EditableText
              mode={mode}
              label="Lesson title"
              value={slot.lessonTitle}
              onChange={(v) => onContentsChange(slot.onChange(v))}
              helperText="Keep this concise so it stays readable from across the room."
            />
          }
        />
      )
    }

    case 'lesson-card': {
      const slot = getLessonCardSlot(screenId, contents)
      if (!slot) return <UnavailablePlaceholder label="Lesson Card" className={className} />
      return (
        <LessonCard
          content={slot.lesson}
          mode={mode}
          onBeautify={onBeautify}
          className={className}
          onContentChange={(lesson) => onContentsChange(slot.onChange(lesson))}
        />
      )
    }

    case 'vocabulary-card': {
      const slot = getVocabularySlot(screenId, contents)
      if (!slot) return <UnavailablePlaceholder label="Vocabulary Card" className={className} />
      return (
        <VocabularyCard
          content={slot.vocabulary}
          mode={mode}
          onBeautify={onBeautify}
          className={className}
          onContentChange={(vocabulary) => onContentsChange(slot.onChange(vocabulary))}
        />
      )
    }

    case 'focus': {
      const slot = getFocusSlot(screenId, contents)
      if (!slot) return <UnavailablePlaceholder label="Focus" className={className} />
      return (
        <SmartTextCard
          mode={mode}
          className={className}
          onBeautify={onBeautify}
          model={{
            title: slot.focusTitle,
            blocks: [{ kind: 'paragraph', text: slot.focusTask, emphasis: true }],
          }}
          editSlot={
            <EditableText
              mode={mode}
              label="Focus task"
              value={slot.focusTask}
              onChange={(v) => onContentsChange(slot.onChangeTask(v))}
              multiline
              helperText="This appears on the student board as the main focus task."
            />
          }
        />
      )
    }

    case 'morning-message':
      return <MorningMessageWidget mode={mode} className={className} />

    case 'timer': {
      if (!TIMER_CAPABLE_SCREENS.has(screenId)) {
        return (
          <UnavailablePlaceholder
            label="Timer"
            className={className}
            note="Timer controls are available for Homeroom, Math, Reading, and Spelling in this phase."
          />
        )
      }
      return (
        <TimerWidget
          screenId={screenId as SimpleTimerScreenId}
          mode={mode}
          teacherHint={getTimerNote(screenId, contents)}
          className={className}
        />
      )
    }

    case 'transition-timer':
      return (
        <TransitionTimerWidget
          pageId={page.id}
          mode={mode}
          className={className}
        />
      )

    case 'task-timer':
      return (
        <TaskTimerWidget
          taskId={page.id === 'snack-silent-clean-up' ? 'bathroom-water' : 'bathroom-water'}
          mode={mode}
          className={className}
        />
      )

    case 'routine-timer':
      return (
        <RoutineTimerWidget
          routineId="lunch-routine"
          mode={mode}
          className={className}
        />
      )

    case 'message':
    default: {
      return (
        <SmartTextCard
          mode={mode}
          className={className}
          model={{
            title: page.title,
            subtitle: page.subtitle,
            blocks: [
              { kind: 'paragraph', text: page.primaryMessage, emphasis: true },
              ...(page.supportingContent && page.supportingContent.length > 0
                ? [{ kind: 'bullets' as const, items: page.supportingContent }]
                : []),
            ],
            align: 'center',
          }}
        />
      )
    }
  }
}

function UnavailablePlaceholder({
  label,
  className,
  note,
}: {
  label: string
  className?: string
  note?: string
}) {
  return (
    <div
      className={`flex h-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-slate-400/40 bg-slate-900/20 p-4 text-center text-slate-400 ${className ?? ''}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-[11px] leading-snug">{note ?? 'Not available for this page.'}</p>
    </div>
  )
}
