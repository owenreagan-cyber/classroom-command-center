// Maps a (screenId, widget.type) pair to the underlying content field(s) in
// ScreenContents / VibePage, plus a change handler that writes back through
// the same `onContentsChange(contents)` callback every legacy screen editor
// already uses. Kept separate from the rendering component so the mapping
// rules are easy to audit and extend.

import type {
  LessonContent,
  MaterialsLists,
  ReadyPositionContent,
  ScreenContents,
  ScreenId,
  VocabularyContent,
} from '../../data/types'

/** The eight "subject-like" screens share an identical field shape even
 * though they use three distinct named interfaces (SubjectContent,
 * HomeworkContent, PackUpContent). */
export interface SubjectLikeContent {
  title: string
  focusTitle: string
  focusTask: string
  agendaTitle: string
  agenda: string[]
  materialsTitle: string
  materials: MaterialsLists
  teacherHint: string
  lesson?: LessonContent
  vocabulary?: VocabularyContent
}

const SUBJECT_LIKE_SCREENS = new Set<ScreenId>([
  'writing',
  'science',
  'social-studies',
  'assessment',
  'centers',
  'homework',
  'pack-up',
  'spelling',
])

export function isSubjectLikeScreen(screenId: ScreenId): boolean {
  return SUBJECT_LIKE_SCREENS.has(screenId)
}

export function getSubjectLikeContent(screenId: ScreenId, contents: ScreenContents): SubjectLikeContent | undefined {
  switch (screenId) {
    case 'writing':
    case 'science':
    case 'social-studies':
    case 'assessment':
    case 'centers':
    case 'homework':
    case 'pack-up':
    case 'spelling':
      return contents[screenId] as unknown as SubjectLikeContent
    default:
      return undefined
  }
}

export function updateSubjectLikeContent(
  contents: ScreenContents,
  screenId: ScreenId,
  patch: Partial<SubjectLikeContent>,
): ScreenContents {
  const current = getSubjectLikeContent(screenId, contents)
  if (!current) return contents
  return { ...contents, [screenId]: { ...current, ...patch } }
}

export interface MaterialsSlot {
  title: string
  materials: MaterialsLists
  onChange: (materials: MaterialsLists, title?: string) => ScreenContents
}

export function getMaterialsSlot(screenId: ScreenId, contents: ScreenContents): MaterialsSlot | undefined {
  if (screenId === 'homeroom') {
    const c = contents.homeroom
    return {
      title: c.materialsTitle,
      materials: c.materials,
      onChange: (materials) => ({ ...contents, homeroom: { ...c, materials } }),
    }
  }
  if (screenId === 'math') {
    const c = contents.math
    return {
      title: c.materialsTitle,
      materials: c.materials,
      onChange: (materials) => ({ ...contents, math: { ...c, materials } }),
    }
  }
  if (screenId === 'reading') {
    const c = contents.reading
    return {
      title: c.materialsTitle,
      materials: c.materials,
      onChange: (materials) => ({ ...contents, reading: { ...c, materials } }),
    }
  }
  if (isSubjectLikeScreen(screenId)) {
    const c = getSubjectLikeContent(screenId, contents)
    if (!c) return undefined
    return {
      title: c.materialsTitle,
      materials: c.materials,
      onChange: (materials) => updateSubjectLikeContent(contents, screenId, { materials }),
    }
  }
  return undefined
}

export interface ReadyPositionSlot {
  content: ReadyPositionContent
  onChange: (content: ReadyPositionContent) => ScreenContents
  /** True when this slot is sourced from a different screen's content
   * because the current screen has no dedicated Ready Position field
   * (see docs/status/studio-canvas-foundation.md limitations). */
  isSharedFallback: boolean
}

export function getReadyPositionSlot(screenId: ScreenId, contents: ScreenContents): ReadyPositionSlot {
  if (screenId === 'homeroom') {
    const c = contents.homeroom
    return {
      content: c.readyPosition,
      onChange: (readyPosition) => ({ ...contents, homeroom: { ...c, readyPosition } }),
      isSharedFallback: false,
    }
  }
  if (screenId === 'reading') {
    const c = contents.reading
    return {
      content: c.readyPosition,
      onChange: (readyPosition) => ({ ...contents, reading: { ...c, readyPosition } }),
      isSharedFallback: false,
    }
  }
  if (screenId === 'recess') {
    return {
      content: contents.recess,
      onChange: (recess) => ({ ...contents, recess }),
      isSharedFallback: false,
    }
  }
  if (screenId === 'movement') {
    return {
      content: contents.movement,
      onChange: (movement) => ({ ...contents, movement }),
      isSharedFallback: false,
    }
  }
  if (screenId === 'ready-position') {
    return {
      content: contents['ready-position'],
      onChange: (rp) => ({ ...contents, 'ready-position': rp }),
      isSharedFallback: false,
    }
  }
  // No dedicated field (e.g. Pack Up "Ready Position" page) — share the
  // Ready Position screen's content rather than inventing a duplicate.
  return {
    content: contents['ready-position'],
    onChange: (rp) => ({ ...contents, 'ready-position': rp }),
    isSharedFallback: true,
  }
}

export interface DoNowSlot {
  title: string
  prompt: string
  onChange: (prompt: string) => ScreenContents
}

export function getDoNowSlot(screenId: ScreenId, contents: ScreenContents): DoNowSlot | undefined {
  if (screenId !== 'homeroom') return undefined
  const c = contents.homeroom
  return {
    title: c.doNowTitle,
    prompt: c.doNow,
    onChange: (doNow) => ({ ...contents, homeroom: { ...c, doNow } }),
  }
}

export interface RemindersSlot {
  title: string
  reminders: string[]
  onChange: (reminders: string[]) => ScreenContents
}

export function getRemindersSlot(screenId: ScreenId, contents: ScreenContents): RemindersSlot | undefined {
  if (screenId !== 'homeroom') return undefined
  const c = contents.homeroom
  return {
    title: c.remindersTitle,
    reminders: c.reminders,
    onChange: (reminders) => ({ ...contents, homeroom: { ...c, reminders } }),
  }
}

export function getLessonTitleSlot(
  screenId: ScreenId,
  contents: ScreenContents,
): { lessonTitle: string; onChange: (lessonTitle: string) => ScreenContents } | undefined {
  if (screenId === 'math') {
    const c = contents.math
    return { lessonTitle: c.lessonTitle, onChange: (lessonTitle) => ({ ...contents, math: { ...c, lessonTitle } }) }
  }
  if (screenId === 'reading') {
    const c = contents.reading
    return { lessonTitle: c.lessonTitle, onChange: (lessonTitle) => ({ ...contents, reading: { ...c, lessonTitle } }) }
  }
  return undefined
}

export interface LessonCardSlot {
  lesson?: LessonContent
  onChange: (lesson: LessonContent) => ScreenContents
}

export function getLessonCardSlot(screenId: ScreenId, contents: ScreenContents): LessonCardSlot | undefined {
  if (screenId === 'math') {
    const c = contents.math
    return { lesson: c.lesson, onChange: (lesson) => ({ ...contents, math: { ...c, lesson } }) }
  }
  if (screenId === 'reading') {
    const c = contents.reading
    return { lesson: c.lesson, onChange: (lesson) => ({ ...contents, reading: { ...c, lesson } }) }
  }
  if (isSubjectLikeScreen(screenId)) {
    const c = getSubjectLikeContent(screenId, contents)
    if (!c) return undefined
    return { lesson: c.lesson, onChange: (lesson) => updateSubjectLikeContent(contents, screenId, { lesson }) }
  }
  return undefined
}

export interface VocabularySlot {
  vocabulary?: VocabularyContent
  onChange: (vocabulary: VocabularyContent) => ScreenContents
}

export function getVocabularySlot(screenId: ScreenId, contents: ScreenContents): VocabularySlot | undefined {
  if (screenId === 'math') {
    const c = contents.math
    return { vocabulary: c.vocabulary, onChange: (vocabulary) => ({ ...contents, math: { ...c, vocabulary } }) }
  }
  if (screenId === 'reading') {
    const c = contents.reading
    return { vocabulary: c.vocabulary, onChange: (vocabulary) => ({ ...contents, reading: { ...c, vocabulary } }) }
  }
  if (isSubjectLikeScreen(screenId)) {
    const c = getSubjectLikeContent(screenId, contents)
    if (!c) return undefined
    return { vocabulary: c.vocabulary, onChange: (vocabulary) => updateSubjectLikeContent(contents, screenId, { vocabulary }) }
  }
  return undefined
}

export interface FocusSlot {
  focusTitle: string
  focusTask: string
  agendaTitle: string
  agenda: string[]
  onChangeTask: (focusTask: string) => ScreenContents
  onChangeAgenda: (agenda: string[]) => ScreenContents
}

export function getFocusSlot(screenId: ScreenId, contents: ScreenContents): FocusSlot | undefined {
  const c = getSubjectLikeContent(screenId, contents)
  if (!c) return undefined
  return {
    focusTitle: c.focusTitle,
    focusTask: c.focusTask,
    agendaTitle: c.agendaTitle,
    agenda: c.agenda,
    onChangeTask: (focusTask) => updateSubjectLikeContent(contents, screenId, { focusTask }),
    onChangeAgenda: (agenda) => updateSubjectLikeContent(contents, screenId, { agenda }),
  }
}

/** Simple-timer screens are the only ones with an interactive TimerWidget
 * in this phase — see docs/status/studio-canvas-foundation.md limitations. */
export const TIMER_CAPABLE_SCREENS = new Set<ScreenId>(['homeroom', 'math', 'reading', 'spelling'])

export function getTimerNote(screenId: ScreenId, contents: ScreenContents): string | undefined {
  if (screenId === 'math') return contents.math.timerNote
  if (screenId === 'reading') return contents.reading.timerNote
  return undefined
}
