import { EditableList } from '../components/editing/EditableList'
import { EditableText } from '../components/editing/EditableText'
import { HiddenCardPlaceholder } from '../components/editing/HiddenCardPlaceholder'
import type { AppMode, CardId, SubjectContent, NoiseTrackerState, ScreenId } from '../data/types'
import { MaterialsCard } from '../widgets/MaterialsCard'
import { SmartTextCard } from '../widgets/SmartTextCard'
import { TeacherHint } from '../widgets/TeacherHint'
import { VoiceLevelWidget } from '../widgets/VoiceLevelWidget'
import { noiseCardOverlayClass } from '../lib/displayLayout'

type SubjectCardVisibility = Partial<Record<CardId, boolean>>

interface SubjectScreenProps {
  content: SubjectContent
  screenId: ScreenId
  mode: AppMode
  cardVisibility: SubjectCardVisibility
  noiseTracker?: NoiseTrackerState
  onContentChange: (content: SubjectContent) => void
  onCardVisibleChange: (
    screenId: ScreenId,
    cardId: CardId,
    visible: boolean,
  ) => void
  onBeautify?: () => void
}

export function SubjectScreen({
  content,
  screenId,
  mode,
  cardVisibility,
  noiseTracker,
  onContentChange,
  onCardVisibleChange,
  onBeautify,
}: SubjectScreenProps) {
  const isEdit = mode === 'edit'
  const actualFocusVisible = cardVisibility.focus ?? true
  const actualAgendaVisible = cardVisibility.agenda ?? true
  const actualMaterialsVisible = cardVisibility.materials ?? true
  const actualNoiseVisible = cardVisibility.noise ?? true

  return (
    <section className="board-grid board-grid-three relative">
      {(actualFocusVisible || isEdit) && (
        actualFocusVisible ? (
          <SmartTextCard
            className="board-card-hero"
            mode={mode}
            model={{
              title: content.focusTitle,
              subtitle: content.title,
              blocks: [
                {
                  kind: 'paragraph',
                  text: content.focusTask,
                  emphasis: true,
                },
              ],
              footer: mode === 'edit' ? 'Student-facing focus task' : undefined,
            }}
            editSlot={
              <EditableText
                mode={mode}
                label="Focus task"
                value={content.focusTask}
                onChange={(focusTask) => onContentChange({ ...content, focusTask })}
                multiline
                helperText="This appears on the student board as the main focus task."
              />
            }
            onBeautify={onBeautify}
          />
        ) : (
          <HiddenCardPlaceholder
            screenId={screenId}
            cardId="focus"
            label="Focus task"
            onToggle={onCardVisibleChange}
          />
        )
      )}

      {(actualAgendaVisible || isEdit) && (
        actualAgendaVisible ? (
          <SmartTextCard
            mode={mode}
            model={{
              title: content.agendaTitle,
              blocks: [
                {
                  kind: 'bullets',
                  items: content.agenda,
                },
                {
                  kind: 'note',
                  text: content.teacherHint,
                  visibility: 'teacherOnly',
                },
              ],
            }}
            editSlot={
              <EditableList
                mode={mode}
                label="Agenda"
                items={content.agenda}
                onChange={(agenda) => onContentChange({ ...content, agenda })}
                helperText="One agenda step per line. Keep it short for projector readability."
              />
            }
          />
        ) : (
          <HiddenCardPlaceholder
            screenId={screenId}
            cardId="agenda"
            label="Agenda"
            onToggle={onCardVisibleChange}
          />
        )
      )}

      {(actualMaterialsVisible || isEdit) && (
        actualMaterialsVisible ? (
          <div className="flex min-h-0 flex-col gap-3">
            <MaterialsCard
              title={content.materialsTitle}
              materials={content.materials}
              mode={mode}
              onMaterialsChange={(materials) =>
                onContentChange({ ...content, materials })
              }
            />
            <TeacherHint mode={mode} text={content.teacherHint} />
          </div>
        ) : (
          <HiddenCardPlaceholder
            screenId={screenId}
            cardId="materials"
            label="Materials"
            onToggle={onCardVisibleChange}
          />
        )
      )}

      {noiseTracker && actualNoiseVisible && (
        <VoiceLevelWidget
          level={noiseTracker.voiceLevel}
          mode={mode}
          className={noiseCardOverlayClass(mode)}
        />
      )}
    </section>
  )
}
