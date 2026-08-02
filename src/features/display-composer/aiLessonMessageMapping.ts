import type { DisplayScreen } from './types'
import type { LessonMessageDraft } from './aiLessonMessageTypes'

/**
 * One-way, explicit mapping from a generated draft into a DisplayScreen patch.
 * Deliberately excludes teacherRationale/warnings — those fields do not exist
 * on DisplayScreen at all, so there is no code path by which they could reach
 * displaySafe.ts or /display. This is the only place a draft ever touches a
 * DisplayScreen, and it is only ever invoked by an explicit teacher action
 * ("Apply Draft to Current Screen" / "Save as New Screen") — never automatically.
 */
export function mapLessonMessageDraftToScreenPatch(
  draft: LessonMessageDraft,
  screenId: string,
): Partial<Omit<DisplayScreen, 'id'>> {
  const timerId =
    draft.suggestedTimer.kind === 'none'
      ? undefined
      : draft.suggestedTimer.kind === 'routine'
        ? 'lunch-routine'
        : `dc-${screenId}-lesson`

  return {
    title: draft.title,
    studentMessage: draft.studentMessage,
    materialsCard: draft.materialsCard,
    checklistCard: {
      heading: draft.checklistCard.heading,
      items: draft.checklistCard.items.map((text, index) => ({
        id: `step-${index + 1}`,
        icon: '✔',
        text,
        checked: false,
      })),
    },
    timerWidget: { kind: draft.suggestedTimer.kind, timerId },
    ...(draft.suggestedBackground ? { background: draft.suggestedBackground } : {}),
  }
}
