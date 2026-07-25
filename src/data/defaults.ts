import type {
  CardVisibilityOption,
  MorningMessageState,
  NoiseTrackerId,
  NoiseTrackerState,
  ReadyPositionContent,
  ScreenCardVisibility,
  ScreenContents,
  ScreenMeta,
  TeacherNote,
  TodayPrepState,
  LessonContent,
  VocabularyContent,
} from './types'
import { DEFAULT_BACKGROUND_ID } from './backgroundAssets'
import { createDefaultMorningMessageState } from './morningMessage'
import { createDefaultNoiseTrackers } from '../lib/noiseTowers'

export const SCREEN_META: ScreenMeta[] = [
  { id: 'homeroom', label: 'Homeroom' },
  { id: 'math', label: 'Math' },
  { id: 'reading', label: 'Reading' },
  { id: 'writing', label: 'Writing' },
  { id: 'science', label: 'Science' },
  { id: 'social-studies', label: 'Social Studies' },
  { id: 'spelling', label: 'Spelling' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'centers', label: 'Group Work', navLabel: 'Groups' },
  { id: 'snack', label: 'Snack' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'recess', label: 'Recess' },
  { id: 'ready-position', label: 'Ready Position' },
  { id: 'homework', label: 'Homework' },
  { id: 'pack-up', label: 'Pack Up' },
]

export const CARD_VISIBILITY_OPTIONS: Record<string, CardVisibilityOption[]> = {
  homeroom: [
    { id: 'do-now', label: 'Do Now', helperText: 'Student opening task' },
    { id: 'reminders', label: 'Reminders', isOptional: true },
    { id: 'materials', label: 'Materials', isOptional: true },
    { id: 'ready', label: 'Ready Position', isOptional: true },
    { id: 'timer', label: 'Timer', isOptional: true },
    { id: 'noise', label: 'Noise tracker', helperText: 'Manual voice level tracker', isOptional: true },
  ],
  math: [
    { id: 'lesson', label: 'Lesson' },
    { id: 'lesson-card', label: 'Lesson Card', isOptional: true },
    { id: 'vocabulary-card', label: 'Vocabulary Card', isOptional: true },
    { id: 'materials', label: 'Materials', isOptional: true },
    { id: 'timer', label: 'Timer', isOptional: true },
    { id: 'noise', label: 'Noise tracker', helperText: 'Math voice level tracker', isOptional: true },
  ],
  reading: [
    { id: 'lesson', label: 'Reading focus' },
    { id: 'lesson-card', label: 'Lesson Card', isOptional: true },
    { id: 'vocabulary-card', label: 'Vocabulary Card', isOptional: true },
    { id: 'materials', label: 'Materials', isOptional: true },
    { id: 'ready', label: 'Ready Position', isOptional: true },
    { id: 'timer', label: 'Timer', isOptional: true },
    { id: 'noise', label: 'Noise tracker', helperText: 'Reading voice level tracker', isOptional: true },
  ],
  writing: [
    { id: 'focus', label: 'Focus task' },
    { id: 'lesson-card', label: 'Lesson Card', isOptional: true },
    { id: 'vocabulary-card', label: 'Vocabulary Card', isOptional: true },
    { id: 'agenda', label: 'Agenda', isOptional: true },
    { id: 'materials', label: 'Materials', isOptional: true },
    { id: 'noise', label: 'Noise tracker', helperText: 'Homeroom voice level tracker', isOptional: true },
  ],
  science: [
    { id: 'focus', label: 'Focus task' },
    { id: 'lesson-card', label: 'Lesson Card', isOptional: true },
    { id: 'vocabulary-card', label: 'Vocabulary Card', isOptional: true },
    { id: 'agenda', label: 'Agenda', isOptional: true },
    { id: 'materials', label: 'Materials', isOptional: true },
    { id: 'noise', label: 'Noise tracker', helperText: 'Homeroom voice level tracker', isOptional: true },
  ],
  'social-studies': [
    { id: 'focus', label: 'Focus task' },
    { id: 'lesson-card', label: 'Lesson Card', isOptional: true },
    { id: 'vocabulary-card', label: 'Vocabulary Card', isOptional: true },
    { id: 'agenda', label: 'Agenda', isOptional: true },
    { id: 'materials', label: 'Materials', isOptional: true },
    { id: 'noise', label: 'Noise tracker', helperText: 'Homeroom voice level tracker', isOptional: true },
  ],
  assessment: [
    { id: 'focus', label: 'Focus task' },
    { id: 'lesson-card', label: 'Lesson Card', isOptional: true },
    { id: 'vocabulary-card', label: 'Vocabulary Card', isOptional: true },
    { id: 'agenda', label: 'Agenda', isOptional: true },
    { id: 'materials', label: 'Materials', isOptional: true },
    { id: 'noise', label: 'Noise tracker', helperText: 'Homeroom voice level tracker', isOptional: true },
  ],
  centers: [
    { id: 'focus', label: 'Focus task' },
    { id: 'lesson-card', label: 'Lesson Card', isOptional: true },
    { id: 'vocabulary-card', label: 'Vocabulary Card', isOptional: true },
    { id: 'agenda', label: 'Agenda', isOptional: true },
    { id: 'materials', label: 'Materials', isOptional: true },
    { id: 'noise', label: 'Noise tracker', helperText: 'Homeroom voice level tracker', isOptional: true },
  ],
  recess: [
    { id: 'ready', label: 'Recess expectations', helperText: 'Play safely and line up quickly' },
    { id: 'compact-cue', label: 'Compact cue', isOptional: true },
    { id: 'noise', label: 'Noise tracker', helperText: 'Homeroom voice level tracker', isOptional: true },
  ],
  snack: [
    { id: 'cleanup', label: 'Cleanup reminders' },
    { id: 'routine', label: 'Routine' },
    { id: 'phase-timer', label: 'Phase timer' },
    { id: 'noise', label: 'Noise tracker', isOptional: true },
  ],
  lunch: [
    { id: 'cleanup', label: 'Cleanup reminders' },
    { id: 'routine', label: 'Routine' },
    { id: 'phase-timer', label: 'Phase timer' },
    { id: 'noise', label: 'Noise tracker', isOptional: true },
  ],
  homework: [
    { id: 'focus', label: 'Focus task' },
    { id: 'materials', label: 'Materials', isOptional: true },
    { id: 'noise', label: 'Noise tracker', isOptional: true },
  ],
  'pack-up': [
    { id: 'focus', label: 'Focus task' },
    { id: 'materials', label: 'Materials', isOptional: true },
    { id: 'ready', label: 'Ready Position', isOptional: true },
    { id: 'noise', label: 'Noise tracker', isOptional: true },
  ],
  spelling: [
    { id: 'focus', label: 'Focus task' },
    { id: 'vocabulary-card', label: 'Vocabulary Card', isOptional: true },
    { id: 'materials', label: 'Materials', isOptional: true },
    { id: 'timer', label: 'Timer', isOptional: true },
    { id: 'noise', label: 'Noise tracker', isOptional: true },
  ],
  'ready-position': [
    { id: 'ready', label: 'Ready Position checklist' },
    { id: 'compact-cue', label: 'Compact cue', isOptional: true },
    { id: 'noise', label: 'Noise tracker', helperText: 'Homeroom voice level tracker', isOptional: true },
  ],
}

export const DEFAULT_CARD_VISIBILITY: ScreenCardVisibility = {
  homeroom: { 'do-now': true, reminders: true, materials: true, ready: true, timer: true },
  math: { lesson: true, materials: true, timer: true, 'lesson-card': false, 'vocabulary-card': false },
  reading: { lesson: true, materials: true, ready: true, timer: true, 'lesson-card': false, 'vocabulary-card': false },
  writing: { focus: true, agenda: true, materials: true, 'lesson-card': false, 'vocabulary-card': false },
  science: { focus: true, agenda: true, materials: true, 'lesson-card': false, 'vocabulary-card': false },
  'social-studies': { focus: true, agenda: true, materials: true, 'lesson-card': false, 'vocabulary-card': false },
  assessment: { focus: true, agenda: true, materials: true, 'lesson-card': false, 'vocabulary-card': false },
  centers: { focus: true, agenda: true, materials: true, 'lesson-card': false, 'vocabulary-card': false },
  recess: { ready: true, 'compact-cue': true },
  snack: { cleanup: true, routine: true, 'phase-timer': true },
  lunch: { cleanup: true, routine: true, 'phase-timer': true },
  homework: { focus: true, materials: true },
  'pack-up': { focus: true, materials: true, ready: true },
  spelling: { focus: true, materials: true, timer: true, 'vocabulary-card': false },
  'ready-position': { ready: true, 'compact-cue': true },
}

export const DEFAULT_NOISE_TRACKERS: Record<NoiseTrackerId, NoiseTrackerState> =
  createDefaultNoiseTrackers()

export const DEFAULT_READY_POSITION: ReadyPositionContent = {
  title: 'Ready Position',
  steps: [
    'Seated',
    'Silent',
    'Sitting up',
    'Hands on desk',
    'Alert',
    'Eyes on me',
    'Ready to learn',
  ],
  compactLine: 'Seated, silent, ready to learn.',
  useCompact: false,
}

export const DEFAULT_LESSON: LessonContent = {
  title: "Today's Lesson",
  objective: 'Learning Objective',
  successCriteria: ['I can explain the main idea.'],
}

export const DEFAULT_VOCABULARY: VocabularyContent = {
  title: 'Vocabulary',
  entries: [{ term: 'keyword', definition: 'A significant word.' }],
}

export const DEFAULT_CONTENTS: ScreenContents = {
  homeroom: {
    remindersTitle: 'Homeroom Reminders',
    reminders: ['Hang up backpack', 'Put away jacket', 'Turn in homework'],
    doNowTitle: 'Do Now',
    doNow: 'Write today\'s date and one goal for the morning.',
    materialsTitle: 'Arrival Materials',
    materials: {
      haveOut: ['Morning folder', 'Pencil', 'Homework'],
      putAway: ['Backpack', 'Everything else'],
    },
    readyPosition: { ...DEFAULT_READY_POSITION, useCompact: true, compactLine: 'Seated, silent, ready to learn.' },
  },
  math: {
    lessonTitle: 'Math Lesson',
    materialsTitle: 'Materials',
    materials: { haveOut: ['Power Up Packet', 'Pen', 'Pencil', 'Homework'], putAway: ['Everything else'] },
    timerNote: 'Use the timer presets or custom minutes in edit mode.',
    lesson: { title: "Today's Math Goal", objective: 'Solve today\'s problem carefully.', successCriteria: ['I can identify the problem type.', 'I can show my work.'] },
    vocabulary: { title: 'Vocabulary', entries: [{ term: 'equation' }, { term: 'strategy' }, { term: 'explain' }] },
  },
  reading: {
    lessonTitle: 'Reading Class',
    materialsTitle: 'Materials',
    materials: { haveOut: ['Homework', 'Pen', 'Pencil', 'Reading book'], putAway: ['Everything else'] },
    readyPosition: { ...DEFAULT_READY_POSITION },
    timerNote: 'Use the timer presets or custom minutes in edit mode.',
    lesson: { title: "Today's Reading Goal", objective: 'Read closely and support my answer.', successCriteria: ['I can find text evidence.', 'I can summarize the plot.'] },
    vocabulary: { title: 'Vocabulary', entries: [{ term: 'character' }, { term: 'evidence' }, { term: 'summarize' }] },
  },
  writing: {
    title: 'Writing Workshop',
    focusTitle: 'Writing Focus',
    focusTask: 'Open your notebook and begin with today\'s writing prompt.',
    agendaTitle: 'Workshop Flow',
    agenda: ['Mini lesson', 'Independent writing', 'Teacher conference', 'Share'],
    materialsTitle: 'Writing Materials',
    materials: { haveOut: ['Writing notebook', 'Pencil', 'Draft folder'], putAway: ['Unneeded books', 'Loose materials'] },
    teacherHint: 'Keep exemplar drafts and conference notes on the teacher screen.',
    lesson: { title: "Today's Focus", objective: 'I can explain today\'s skill.', successCriteria: ['I can use the skill in my writing.'] },
    vocabulary: { title: 'Vocabulary', entries: [{ term: 'draft' }, { term: 'revise' }, { term: 'edit' }] },
  },
  science: {
    title: 'Science Lab',
    focusTitle: 'Investigation Question',
    focusTask: 'Read the question, make a prediction, and be ready to explain your evidence.',
    agendaTitle: 'Lab Flow',
    agenda: ['Question', 'Prediction', 'Investigation', 'Evidence', 'Conclusion'],
    materialsTitle: 'Science Materials',
    materials: { haveOut: ['Science notebook', 'Pencil', 'Lab sheet'], putAway: ['Food and drinks', 'Extra supplies'] },
    teacherHint: 'Check safety reminders and materials before moving to display mode.',
    lesson: { title: 'Investigation Goal', objective: 'Observe and record data accurately.', successCriteria: ['I can label my diagrams.', 'I can explain my results.'] },
    vocabulary: { title: 'Scientific Terms', entries: [{ term: 'hypothesis' }, { term: 'variable' }, { term: 'evidence' }] },
  },
  'social-studies': {
    title: 'Social Studies',
    focusTitle: 'History / Civics Focus',
    focusTask: 'Look at the source or question and write one observation.',
    agendaTitle: 'Class Flow',
    agenda: ['Source study', 'Partner talk', 'Class notes', 'Exit response'],
    materialsTitle: 'Social Studies Materials',
    materials: { haveOut: ['Notebook', 'Pencil', 'Class handout'], putAway: ['Everything else'] },
    teacherHint: 'Keep answer keys and discussion prompts private until ready.',
    lesson: { title: 'Today\'s Focus', objective: 'Analyze primary and secondary sources.', successCriteria: ['I can identify the source type.', 'I can find the main point.'] },
    vocabulary: { title: 'Key Terms', entries: [{ term: 'primary source' }, { term: 'timeline' }, { term: 'context' }] },
  },
  assessment: {
    title: 'Assessment',
    focusTitle: 'Assessment Mode',
    focusTask: 'Clear your desk and wait silently for directions.',
    agendaTitle: 'Assessment Expectations',
    agenda: ['Clear desk', 'Listen for directions', 'Work independently', 'Check work'],
    materialsTitle: 'Assessment Materials',
    materials: { haveOut: ['Pencil', 'Approved materials only'], putAway: ['Books', 'Notes', 'Devices unless approved'] },
    teacherHint: 'Do not project answers, scoring notes, or accommodation details.',
    lesson: { title: 'Assessment Goal', objective: 'Show what you have learned.', successCriteria: ['I can stay focused.', 'I can check my answers.'] },
    vocabulary: { title: 'Terms', entries: [{ term: 'independent' }, { term: 'accurate' }] },
  },
  centers: {
    title: 'Group Work',
    focusTitle: 'Center Start',
    focusTask: 'Go to your assigned center and begin the posted task.',
    agendaTitle: 'Rotation Flow',
    agenda: ['Start center', 'Work quietly', 'Clean up', 'Rotate when called'],
    materialsTitle: 'Center Materials',
    materials: { haveOut: ['Center folder', 'Pencil', 'Assigned center tools'], putAway: ['Unneeded materials'] },
    teacherHint: 'Rotation timing and group adjustments stay private.',
    lesson: { title: 'Center Focus', objective: 'Complete center tasks independently.', successCriteria: ['I can manage my time.', 'I can clean up my center.'] },
    vocabulary: { title: 'Station Vocabulary', entries: [{ term: 'rotation' }, { term: 'independent' }] },
  },
  recess: {
    title: 'Recess',
    steps: ['Play safely', 'Keep hands and feet to yourself', 'Line up quickly', 'Return ready to learn'],
    compactLine: 'Play safely, line up quickly, and listen for the signal.',
    useCompact: false,
  },
  snack: {
    title: 'Snack',
    cleanupTitle: 'Cleanup Reminders',
    cleanupReminders: ['Clear your table space', 'Throw away trash', 'Wipe crumbs if needed', 'Push in chairs'],
    routineTitle: 'Routine',
    routine: ['Wash hands', 'Get snack and sit at your table', 'Quiet voices while eating', 'Clean up when called'],
    phaseNote: 'Phase durations are editable presets.',
  },
  lunch: {
    title: 'Lunch',
    cleanupTitle: 'Cleanup Reminders',
    cleanupReminders: ['Clear your table space', 'Throw away trash', 'Wipe crumbs if needed', 'Push in chairs'],
    routineTitle: 'Routine',
    routine: ['Wash hands', 'Get lunch and sit at your table', 'Quiet voices while eating', 'Clean up and line up when called'],
    phaseNote: 'Phase durations are editable presets.',
  },
  'ready-position': { ...DEFAULT_READY_POSITION },
  homework: {
    title: 'Homework',
    focusTitle: 'Copy Homework',
    focusTask: 'Copy all homework assignments into your planner.',
    agendaTitle: 'Homework Flow',
    agenda: ['Copy homework', 'Check planner', 'Pack materials'],
    materialsTitle: 'Homework Materials',
    materials: { haveOut: ['Planner', 'Homework folder', 'Pencil'], putAway: ['Other materials'] },
    teacherHint: 'Remind students to check for signed forms.',
    lesson: { title: 'Homework Goal', objective: 'Be prepared for tomorrow.', successCriteria: ['I have my homework.', 'I have my folders.'] },
    vocabulary: { title: 'Organization', entries: [{ term: 'planner' }, { term: 'checklist' }] },
  },
  'pack-up': {
    title: 'Pack Up',
    focusTitle: 'Pack Up Focus',
    focusTask: 'Pack your materials and clean your area.',
    agendaTitle: 'Pack-Up Flow',
    agenda: ['Pack backpack', 'Clean area', 'Ready Position', 'Wait for dismissal'],
    materialsTitle: 'Pack-Up Materials',
    materials: { haveOut: ['Homework folder', 'Take-home materials'], putAway: ['Class materials', 'Trash'] },
    teacherHint: 'Dismissal notes stay teacher-only.',
    lesson: { title: 'End of Day Goal', objective: 'Be ready to leave.', successCriteria: ['I have my belongings.', 'I cleaned my area.'] },
    vocabulary: { title: 'Organization', entries: [{ term: 'dismissal' }, { term: 'checklist' }] },
  },
  spelling: {
    title: 'Spelling',
    focusTitle: 'Spelling Focus',
    focusTask: 'Open your spelling notebook and review this week\'s words.',
    agendaTitle: 'Spelling Flow',
    agenda: ['Review words', 'Practice spelling', 'Write sentences', 'Check work'],
    materialsTitle: 'Spelling Materials',
    materials: { haveOut: ['Spelling notebook', 'Pencil', 'Spelling list'], putAway: ['Other materials'] },
    teacherHint: 'Keep the word list visible throughout practice.',
    lesson: { title: 'Spelling Goal', objective: 'Spell words correctly.', successCriteria: ['I can spell each word.', 'I can use words in sentences.'] },
    vocabulary: { title: 'Word Parts', entries: [{ term: 'vowel' }, { term: 'consonant' }, { term: 'syllable' }] },
  },
}

export const DEFAULT_TODAY_PREP: TodayPrepState = {
  checklistItems: [
    {
      id: 'prep-review-board',
      text: 'Review board content for the active screen before display mode.',
    },
    {
      id: 'prep-materials-ready',
      text: 'Confirm materials and links are ready for this block.',
    },
    {
      id: 'prep-display-check',
      text: 'Preview student display — no teacher-only notes visible.',
    },
  ].map((item) => ({ ...item, completed: false })),
  resourceLinks: [],
}

export const DEFAULT_MORNING_MESSAGE: MorningMessageState = createDefaultMorningMessageState()

export const DEFAULT_TEACHER_NOTES: TeacherNote[] = [
  { id: 'prep-homeroom', screenId: 'homeroom', visibility: 'teacherOnly', text: 'Check attendance folder and morning announcements before display mode.' },
  { id: 'prep-math', screenId: 'math', visibility: 'teacherOnly', text: 'Power Up answer key stays on teacher screen — never project solutions.' },
  { id: 'prep-reading', screenId: 'reading', visibility: 'teacherOnly', text: 'Confirm small-group rotation list before starting the timer.' },
  { id: 'prep-snack', screenId: 'snack', visibility: 'teacherOnly', text: 'Phase durations are editable presets — not bell schedule times.' },
  { id: 'prep-lunch', screenId: 'lunch', visibility: 'teacherOnly', text: 'Phase durations are editable presets — not bell schedule times.' },
  { id: 'prep-writing', screenId: 'writing', visibility: 'teacherOnly', text: 'Review conference targets before writing workshop.' },
  { id: 'prep-science', screenId: 'science', visibility: 'teacherOnly', text: 'Check materials and safety reminders before the investigation.' },
  { id: 'prep-social-studies', screenId: 'social-studies', visibility: 'teacherOnly', text: 'Keep discussion prompts and source notes private until needed.' },
  { id: 'prep-assessment', screenId: 'assessment', visibility: 'teacherOnly', text: 'Keep scoring notes and accommodations off the student display.' },
  { id: 'prep-centers', screenId: 'centers', visibility: 'teacherOnly', text: 'Review group order and timer plan before display mode.' },
  { id: 'prep-recess', screenId: 'recess', visibility: 'teacherOnly', text: 'Confirm recess expectations and return signal before display mode.' },
  { id: 'prep-homework', screenId: 'homework', visibility: 'teacherOnly', text: 'Check homework assignments before display mode.' },
  { id: 'prep-pack-up', screenId: 'pack-up', visibility: 'teacherOnly', text: 'Check dismissal notes before pack-up begins.' },
  { id: 'prep-spelling', screenId: 'spelling', visibility: 'teacherOnly', text: 'Review spelling list before practice begins.' },
]

export const DEFAULT_SCREEN_ID = SCREEN_META[0].id
export const DEFAULT_MODE = 'edit' as const
export { DEFAULT_BACKGROUND_ID }
