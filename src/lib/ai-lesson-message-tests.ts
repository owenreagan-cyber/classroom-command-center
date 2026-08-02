// AI lesson message generator tests.
// Run via: npm run test:display-composer

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import { generateDeterministicLessonMessageDraft } from '../features/display-composer/aiLessonMessageFallbacks'
import { generateLessonMessageDraft } from '../features/display-composer/aiLessonMessageGenerator'
import { mapLessonMessageDraftToScreenPatch } from '../features/display-composer/aiLessonMessageMapping'
import { buildLessonMessagePrompt } from '../features/display-composer/aiLessonMessagePrompt'
import { defaultLessonMessageInput, type LessonMessageInput, type LessonMessageProvider } from '../features/display-composer/aiLessonMessageTypes'
import { toDisplaySafeScreen } from '../features/display-composer/displaySafe'
import type { DisplayScreen } from '../features/display-composer/types'

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`)
}

async function main() {
  // --- Deterministic draft: math lesson launch ---

  const mathLaunch: LessonMessageInput = {
    subject: 'math',
    lessonTitle: 'Fractions',
    lessonNumber: '5',
    objective: 'practice solving problems carefully and show our thinking.',
    materials: ['Math notebook', 'Pencil'],
    activityType: 'lessonLaunch',
    gradeBand: 'upperElementary',
    tone: 'calm',
  }
  const mathDraft = generateDeterministicLessonMessageDraft(mathLaunch)
  assert(mathDraft.title === 'Math Lesson 5', `math lesson launch title uses lesson number, got "${mathDraft.title}"`)
  assert(mathDraft.studentMessage.toLowerCase().includes('practice solving problems'), 'student message reflects the objective')
  assert(!mathDraft.studentMessage.includes('Scholars will'), 'no inflated teacher-register language in student message')
  assert(mathDraft.materialsCard !== undefined, 'materials card present when materials provided')
  assert(mathDraft.warnings.length === 0, 'no warnings when objective and materials are both provided')

  const mathDraftAgain = generateDeterministicLessonMessageDraft(mathLaunch)
  assert(JSON.stringify(mathDraft) === JSON.stringify(mathDraftAgain), 'deterministic generation is repeatable for identical input')

  // --- Deterministic draft: transition ---

  const transitionInput: LessonMessageInput = {
    ...defaultLessonMessageInput(),
    subject: 'reading',
    lessonTitle: '',
    activityType: 'transition',
    tone: 'routine',
  }
  const transitionDraft = generateDeterministicLessonMessageDraft(transitionInput)
  assert(transitionDraft.title === 'Get Ready For Reading', `transition title, got "${transitionDraft.title}"`)
  assert(transitionDraft.suggestedTimer.kind === 'transition', 'transition activity suggests a transition timer')
  assert(transitionDraft.suggestedTimer.minutes === 4, 'transition activity suggests a short timer duration')

  // --- Missing objective falls back to generic routine wording ---

  const noObjectiveInput: LessonMessageInput = {
    ...defaultLessonMessageInput(),
    subject: 'science',
    lessonTitle: 'Rocks and Minerals',
    activityType: 'lessonLaunch',
  }
  const noObjectiveDraft = generateDeterministicLessonMessageDraft(noObjectiveInput)
  assert(
    noObjectiveDraft.warnings.some((w) => w.toLowerCase().includes('no objective')),
    'missing objective produces a teacher-only warning',
  )
  assert(noObjectiveDraft.studentMessage.length > 0, 'a generic message is still produced without an objective')

  // --- Checklist item count is always 3–5 ---

  for (const activityType of ['arrival', 'lessonLaunch', 'transition', 'workTime', 'lunch', 'custom'] as const) {
    const draft = generateDeterministicLessonMessageDraft({ ...defaultLessonMessageInput(), activityType })
    assert(
      draft.checklistCard.items.length >= 3 && draft.checklistCard.items.length <= 5,
      `${activityType} checklist has 3–5 items, got ${draft.checklistCard.items.length}`,
    )
  }

  const withMustInclude = generateDeterministicLessonMessageDraft({
    ...defaultLessonMessageInput(),
    activityType: 'lunch',
    mustInclude: ['Say thank you to the lunch staff', 'Recycle your tray', 'Extra item that should not fit'],
  })
  assert(withMustInclude.checklistCard.items.length <= 5, 'checklist never exceeds 5 items even with extra mustInclude entries')
  assert(
    withMustInclude.warnings.some((w) => w.includes('did not fit')),
    'overflowing mustInclude items produce a teacher-only warning',
  )

  // --- Teacher notes are never copied verbatim into student-facing output ---

  const secretNote = 'Class was wild yesterday, watch table 3 closely and do not mention this to anyone'
  const notesInput: LessonMessageInput = {
    ...defaultLessonMessageInput(),
    subject: 'homeroom',
    lessonTitle: 'Morning Routine',
    activityType: 'arrival',
    teacherNotes: secretNote,
  }
  const notesDraft = generateDeterministicLessonMessageDraft(notesInput)
  assert(!notesDraft.studentMessage.includes(secretNote), 'teacher notes are not copied into the student message')
  assert(!notesDraft.title.includes(secretNote), 'teacher notes are not copied into the title')
  assert(
    !(notesDraft.checklistCard.items.join(' ').includes(secretNote)),
    'teacher notes are not copied into the checklist',
  )
  assert(
    notesDraft.teacherRationale.includes('not shown to students'),
    'teacherRationale acknowledges notes exist without quoting them',
  )
  assert(!notesDraft.teacherRationale.includes(secretNote), 'teacherRationale does not quote teacher notes verbatim either')

  // --- Prompt builder: safety instructions present ---

  const prompt = buildLessonMessagePrompt(mathLaunch)
  assert(prompt.system.toLowerCase().includes('4th grade'), 'prompt states the audience is 4th grade')
  assert(prompt.system.toLowerCase().includes('do not invent'), 'prompt instructs the model not to invent curriculum facts')
  assert(prompt.system.toLowerCase().includes('never include private teacher notes'), 'prompt forbids leaking teacher notes verbatim')
  assert(prompt.system.toLowerCase().includes('do not publish') || prompt.system.toLowerCase().includes('automatically'), 'prompt forbids auto-publishing')

  // --- Prompt builder: preserves subject/title/materials, excludes teacherNotes verbatim ---

  const promptWithNotes = buildLessonMessagePrompt(notesInput)
  assert(promptWithNotes.user.includes('Homeroom'), 'prompt user context includes the subject label')
  assert(promptWithNotes.user.includes('Morning Routine'), 'prompt user context includes the lesson title')
  const materialsPrompt = buildLessonMessagePrompt(mathLaunch)
  assert(materialsPrompt.user.includes('Math notebook'), 'prompt user context includes provided materials')
  assert(!promptWithNotes.user.includes(secretNote), 'prompt never includes teacher notes verbatim')

  // --- Draft maps cleanly to a Display Composer screen patch ---

  const patch = mapLessonMessageDraftToScreenPatch(mathDraft, 'demo-screen')
  assert(patch.title === mathDraft.title, 'mapped patch title matches draft title')
  assert(patch.checklistCard?.items.length === mathDraft.checklistCard.items.length, 'mapped checklist item count matches draft')
  assert(patch.timerWidget?.kind === 'general', 'mapped timer kind matches draft suggestion')
  assert(!('teacherRationale' in patch), 'mapped screen patch has no teacherRationale field')
  assert(!('warnings' in patch), 'mapped screen patch has no warnings field')

  const lunchDraft = generateDeterministicLessonMessageDraft({ ...defaultLessonMessageInput(), activityType: 'lunch' })
  const lunchPatch = mapLessonMessageDraftToScreenPatch(lunchDraft, 'lunch-screen')
  assert(lunchPatch.timerWidget?.timerId === 'lunch-routine', 'lunch draft maps onto the real existing lunch-routine timer, not a synthetic id')

  // --- teacherRationale/warnings never reach the student-safe projection ---

  const baseScreen: DisplayScreen = {
    id: 'demo-screen',
    title: 'placeholder',
    mode: 'custom',
    background: { type: 'gradient', token: 'calm-focus' },
    showClock: true,
    timerWidget: { kind: 'none' },
    studentSafe: true,
    updatedAt: 0,
    version: 1,
  }
  const appliedScreen: DisplayScreen = { ...baseScreen, ...patch }
  const safe = toDisplaySafeScreen(appliedScreen)
  assert(safe !== null, 'applied screen still produces a display-safe payload')
  assert(!('teacherRationale' in (safe as object)), 'display-safe payload never includes teacherRationale')
  assert(!('warnings' in (safe as object)), 'display-safe payload never includes warnings')
  assert(JSON.stringify(safe).includes(mathDraft.title), 'display-safe payload does still include the applied student-facing title')

  // --- Orchestrator: deterministic by default (no provider configured anywhere in this repo) ---

  const orchestrated = await generateLessonMessageDraft(mathLaunch)
  assert(orchestrated.title === mathDraft.title, 'generateLessonMessageDraft defaults to the deterministic draft with no provider')

  // --- Orchestrator: gracefully falls back if a provider throws/rejects/times out ---

  const failingProvider: LessonMessageProvider = {
    generateLessonMessageDraft: () => Promise.reject(new Error('simulated provider outage')),
  }
  const fallenBack = await generateLessonMessageDraft(mathLaunch, { provider: failingProvider })
  assert(fallenBack.title === mathDraft.title, 'falls back to deterministic draft content when provider fails')
  assert(
    fallenBack.warnings.some((w) => w.toLowerCase().includes('provider unavailable')),
    'fallback surfaces a teacher-only warning explaining the provider was unavailable',
  )

  const workingProvider: LessonMessageProvider = {
    generateLessonMessageDraft: (input) => Promise.resolve(generateDeterministicLessonMessageDraft(input)),
  }
  const viaProvider = await generateLessonMessageDraft(mathLaunch, { provider: workingProvider })
  assert(viaProvider.title === mathDraft.title, 'a working provider result is passed through')

  console.log('All AI lesson message generator tests passed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
