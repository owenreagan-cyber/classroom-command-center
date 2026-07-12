import type {
  CardVisibilityOption,
  NoiseTrackerId,
  NoiseTrackerState,
  ReadyPositionContent,
  ScreenCardVisibility,
  ScreenContents,
  ScreenMeta,
  TeacherNote,
  LessonContent,
  VocabularyContent,
} from './types'
import { DEFAULT_BACKGROUND_ID } from './backgroundAssets'
import { createDefaultNoiseTrackers } from '../lib/noiseTowers'

export const SCREEN_META: ScreenMeta[] = [
  { id: 'homeroom', label: 'Homeroom' },
  { id: 'math', label: 'Math' },
  { id: 'reading', label: 'Reading' },
  { id: 'writing', label: 'Writing' },
  { id: 'science', label: 'Science' },
  { id: 'social-studies', label: 'Social Studies' },
  { id: 'intervention', label: 'Intervention' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'flexible-groups', label: 'Flexible Groups' },
  { id: 'centers', label: 'Centers / Rotations' },
  { id: 'homework-packup', label: 'Homework / Pack-Up' },
  { id: 'snack-lunch', label: 'Snack / Lunch' },
  { id: 'ready-position', label: 'Ready Position' },
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
  intervention: [
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
  'flexible-groups': [
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
  'homework-packup': [
    { id: 'focus', label: 'Focus task' },
    { id: 'lesson-card', label: 'Lesson Card', isOptional: true },
    { id: 'vocabulary-card', label: 'Vocabulary Card', isOptional: true },
    { id: 'agenda', label: 'Agenda', isOptional: true },
    { id: 'materials', label: 'Materials', isOptional: true },
    { id: 'noise', label: 'Noise tracker', helperText: 'Homeroom voice level tracker', isOptional: true },
  ],
  'snack-lunch': [
    { id: 'cleanup', label: 'Cleanup reminders' },
    { id: 'routine', label: 'Routine' },
    { id: 'phase-timer', label: 'Phase timer' },
    { id: 'noise', label: 'Noise tracker', helperText: 'Homeroom voice level tracker', isOptional: true },
  ],
  'ready-position': [
    { id: 'ready', label: 'Ready Position checklist' },
    { id: 'compact-cue', label: 'Compact cue', isOptional: true },
    { id: 'noise', label: 'Noise tracker', helperText: 'Homeroom voice level tracker', isOptional: true },
  ],
}

export const DEFAULT_CARD_VISIBILITY: ScreenCardVisibility = {
  homeroom: {
    'do-now': true,
    reminders: true,
    materials: true,
    ready: true,
    timer: true,
  },
  math: { lesson: true, materials: true, timer: true, 'lesson-card': false, 'vocabulary-card': false },
  reading: { lesson: true, materials: true, ready: true, timer: true, 'lesson-card': false, 'vocabulary-card': false },
  writing: { focus: true, agenda: true, materials: true, 'lesson-card': false, 'vocabulary-card': false },
  science: { focus: true, agenda: true, materials: true, 'lesson-card': false, 'vocabulary-card': false },
  'social-studies': { focus: true, agenda: true, materials: true, 'lesson-card': false, 'vocabulary-card': false },
  intervention: { focus: true, agenda: true, materials: true, 'lesson-card': false, 'vocabulary-card': false },
  assessment: { focus: true, agenda: true, materials: true, 'lesson-card': false, 'vocabulary-card': false },
  'flexible-groups': { focus: true, agenda: true, materials: true, 'lesson-card': false, 'vocabulary-card': false },
  centers: { focus: true, agenda: true, materials: true, 'lesson-card': false, 'vocabulary-card': false },
  'homework-packup': { focus: true, agenda: true, materials: true, 'lesson-card': false, 'vocabulary-card': false },
  'snack-lunch': { cleanup: true, routine: true, 'phase-timer': true },
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
    reminders: [
      'Hang up backpack',
      'Put away jacket',
      'Turn in homework',
    ],
    doNowTitle: 'Do Now',
    doNow: 'Write today’s date and one goal for the morning.',
    materialsTitle: 'Arrival Materials',
    materials: {
      haveOut: ['Morning folder', 'Pencil', 'Homework'],
      putAway: ['Backpack', 'Everything else'],
    },
    readyPosition: {
      ...DEFAULT_READY_POSITION,
      useCompact: true,
      compactLine: 'Seated, silent, ready to learn.',
    },
  },
  math: {
    lessonTitle: 'Math Lesson',
    materialsTitle: 'Materials',
    materials: {
      haveOut: ['Power Up Packet', 'Pen', 'Pencil', 'Homework'],
      putAway: ['Everything else'],
    },
    timerNote: 'Use the timer presets or custom minutes in edit mode.',
    lesson: {
      title: "Today's Math Goal",
      objective: 'Solve today’s problem carefully.',
      successCriteria: ['I can identify the problem type.', 'I can show my work.'],
    },
    vocabulary: {
      title: 'Vocabulary',
      entries: [
        { term: 'equation' },
        { term: 'strategy' },
        { term: 'explain' },
      ],
    },
  },
  reading: {
    lessonTitle: 'Reading Class',
    materialsTitle: 'Materials',
    materials: {
      haveOut: ['Homework', 'Pen', 'Pencil', 'Reading book'],
      putAway: ['Everything else'],
    },
    readyPosition: { ...DEFAULT_READY_POSITION },
    timerNote: 'Use the timer presets or custom minutes in edit mode.',
    lesson: {
      title: "Today's Reading Goal",
      objective: 'Read closely and support my answer.',
      successCriteria: ['I can find text evidence.', 'I can summarize the plot.'],
    },
    vocabulary: {
      title: 'Vocabulary',
      entries: [
        { term: 'character' },
        { term: 'evidence' },
        { term: 'summarize' },
      ],
    },
  },
  writing: {
    title: 'Writing Workshop',
    focusTitle: 'Writing Focus',
    focusTask: 'Open your notebook and begin with today’s writing prompt.',
    agendaTitle: 'Workshop Flow',
    agenda: ['Mini lesson', 'Independent writing', 'Teacher conference', 'Share'],
    materialsTitle: 'Writing Materials',
    materials: {
      haveOut: ['Writing notebook', 'Pencil', 'Draft folder'],
      putAway: ['Unneeded books', 'Loose materials'],
    },
    teacherHint: 'Keep exemplar drafts and conference notes on the teacher screen.',
    lesson: {
      title: "Today's Focus",
      objective: 'I can explain today’s skill.',
      successCriteria: ['I can use the skill in my writing.'],
    },
    vocabulary: {
      title: 'Vocabulary',
      entries: [{ term: 'draft' }, { term: 'revise' }, { term: 'edit' }],
    },
  },
  science: {
    title: 'Science Lab',
    focusTitle: 'Investigation Question',
    focusTask: 'Read the question, make a prediction, and be ready to explain your evidence.',
    agendaTitle: 'Lab Flow',
    agenda: ['Question', 'Prediction', 'Investigation', 'Evidence', 'Conclusion'],
    materialsTitle: 'Science Materials',
    materials: {
      haveOut: ['Science notebook', 'Pencil', 'Lab sheet'],
      putAway: ['Food and drinks', 'Extra supplies'],
    },
    teacherHint: 'Check safety reminders and materials before moving to display mode.',
    lesson: {
      title: 'Investigation Goal',
      objective: 'Observe and record data accurately.',
      successCriteria: ['I can label my diagrams.', 'I can explain my results.'],
    },
    vocabulary: {
      title: 'Scientific Terms',
      entries: [{ term: 'hypothesis' }, { term: 'variable' }, { term: 'evidence' }],
    },
  },
  'social-studies': {
    title: 'Social Studies',
    focusTitle: 'History / Civics Focus',
    focusTask: 'Look at the source or question and write one observation.',
    agendaTitle: 'Class Flow',
    agenda: ['Source study', 'Partner talk', 'Class notes', 'Exit response'],
    materialsTitle: 'Social Studies Materials',
    materials: {
      haveOut: ['Notebook', 'Pencil', 'Class handout'],
      putAway: ['Everything else'],
    },
    teacherHint: 'Keep answer keys and discussion prompts private until ready.',
    lesson: {
      title: 'Today’s Focus',
      objective: 'Analyze primary and secondary sources.',
      successCriteria: ['I can identify the source type.', 'I can find the main point.'],
    },
    vocabulary: {
      title: 'Key Terms',
      entries: [{ term: 'primary source' }, { term: 'timeline' }, { term: 'context' }],
    },
  },
  intervention: {
    title: 'Intervention',
    focusTitle: 'Small-Group Focus',
    focusTask: 'Begin the warm-up quietly while groups get set.',
    agendaTitle: 'Rotation Plan',
    agenda: ['Warm-up', 'Teacher table', 'Practice task', 'Check-in'],
    materialsTitle: 'Intervention Materials',
    materials: {
      haveOut: ['Intervention folder', 'Pencil', 'Practice page'],
      putAway: ['Unneeded subject materials'],
    },
    teacherHint: 'Confirm group list privately before calling groups.',
    lesson: {
      title: 'Target Skill',
      objective: 'Practice and master the focus skill.',
      successCriteria: ['I can complete the practice task.'],
    },
    vocabulary: {
      title: 'Vocabulary',
      entries: [{ term: 'practice' }, { term: 'mastery' }],
    },
  },
  assessment: {
    title: 'Assessment',
    focusTitle: 'Assessment Mode',
    focusTask: 'Clear your desk and wait silently for directions.',
    agendaTitle: 'Assessment Expectations',
    agenda: ['Clear desk', 'Listen for directions', 'Work independently', 'Check work'],
    materialsTitle: 'Assessment Materials',
    materials: {
      haveOut: ['Pencil', 'Approved materials only'],
      putAway: ['Books', 'Notes', 'Devices unless approved'],
    },
    teacherHint: 'Do not project answers, scoring notes, or accommodation details.',
    lesson: {
      title: 'Assessment Goal',
      objective: 'Show what you have learned.',
      successCriteria: ['I can stay focused.', 'I can check my answers.'],
    },
    vocabulary: {
      title: 'Terms',
      entries: [{ term: 'independent' }, { term: 'accurate' }],
    },
  },
  'flexible-groups': {
    title: 'Flexible Groups',
    focusTitle: 'Group Work Focus',
    focusTask: 'Check your group and begin the first task quietly.',
    agendaTitle: 'Group Flow',
    agenda: ['Find group', 'Review role', 'Complete task', 'Share out'],
    materialsTitle: 'Group Materials',
    materials: {
      haveOut: ['Group folder', 'Pencil', 'Assigned materials'],
      putAway: ['Everything not needed for group work'],
    },
    teacherHint: 'Group membership notes stay teacher-only.',
    lesson: {
      title: 'Collaboration Goal',
      objective: 'Work effectively with your group.',
      successCriteria: ['I can contribute ideas.', 'I can listen to others.'],
    },
    vocabulary: {
      title: 'Group Roles',
      entries: [{ term: 'facilitator' }, { term: 'recorder' }, { term: 'reporter' }],
    },
  },
  centers: {
    title: 'Centers / Rotations',
    focusTitle: 'Center Start',
    focusTask: 'Go to your assigned center and begin the posted task.',
    agendaTitle: 'Rotation Flow',
    agenda: ['Start center', 'Work quietly', 'Clean up', 'Rotate when called'],
    materialsTitle: 'Center Materials',
    materials: {
      haveOut: ['Center folder', 'Pencil', 'Assigned center tools'],
      putAway: ['Unneeded materials'],
    },
    teacherHint: 'Rotation timing and group adjustments stay private.',
    lesson: {
      title: 'Center Focus',
      objective: 'Complete center tasks independently.',
      successCriteria: ['I can manage my time.', 'I can clean up my center.'],
    },
    vocabulary: {
      title: 'Station Vocabulary',
      entries: [{ term: 'rotation' }, { term: 'independent' }],
    },
  },
  'homework-packup': {
    title: 'Homework / Pack-Up',
    focusTitle: 'Pack-Up Focus',
    focusTask: 'Copy homework, pack materials, and wait for dismissal directions.',
    agendaTitle: 'Pack-Up Flow',
    agenda: ['Copy homework', 'Pack backpack', 'Clean area', 'Wait quietly'],
    materialsTitle: 'Pack-Up Materials',
    materials: {
      haveOut: ['Planner', 'Homework folder', 'Pencil'],
      putAway: ['Class materials', 'Trash'],
    },
    teacherHint: 'Dismissal notes and family reminders stay teacher-only.',
    lesson: {
      title: 'Evening Goal',
      objective: 'Be prepared for tomorrow.',
      successCriteria: ['I have my homework.', 'I have my folders.'],
    },
    vocabulary: {
      title: 'Organization',
      entries: [{ term: 'planner' }, { term: 'checklist' }],
    },
  },
  'snack-lunch': {
    title: 'Snack / Lunch',
    cleanupTitle: 'Cleanup Reminders',
    cleanupReminders: [
      'Clear your table space',
      'Throw away trash',
      'Wipe crumbs if needed',
      'Push in chairs',
    ],
    routineTitle: 'Routine',
    routine: [
      'Wash hands',
      'Get snack / lunch and sit at your table',
      'Quiet voices while eating',
      'Clean up and line up when called',
    ],
    phaseNote:
      'Phase durations are editable presets — not snack/lunch bell times.',
  },
  'ready-position': { ...DEFAULT_READY_POSITION },
}

export const DEFAULT_TEACHER_NOTES: TeacherNote[] = [
  {
    id: 'prep-homeroom',
    screenId: 'homeroom',
    visibility: 'teacherOnly',
    text: 'Check attendance folder and morning announcements before display mode.',
  },
  {
    id: 'prep-math',
    screenId: 'math',
    visibility: 'teacherOnly',
    text: 'Power Up answer key stays on teacher screen — never project solutions.',
  },
  {
    id: 'prep-reading',
    screenId: 'reading',
    visibility: 'teacherOnly',
    text: 'Confirm small-group rotation list before starting the timer.',
  },
  {
    id: 'prep-snack',
    screenId: 'snack-lunch',
    visibility: 'teacherOnly',
    text: 'Phase durations are editable presets — not bell schedule times.',
  },
  {
    id: 'prep-writing',
    screenId: 'writing',
    visibility: 'teacherOnly',
    text: 'Review conference targets before writing workshop.',
  },
  {
    id: 'prep-science',
    screenId: 'science',
    visibility: 'teacherOnly',
    text: 'Check materials and safety reminders before the investigation.',
  },
  {
    id: 'prep-social-studies',
    screenId: 'social-studies',
    visibility: 'teacherOnly',
    text: 'Keep discussion prompts and source notes private until needed.',
  },
  {
    id: 'prep-intervention',
    screenId: 'intervention',
    visibility: 'teacherOnly',
    text: 'Confirm group list and target skill before calling students.',
  },
  {
    id: 'prep-assessment',
    screenId: 'assessment',
    visibility: 'teacherOnly',
    text: 'Keep scoring notes and accommodations off the student display.',
  },
  {
    id: 'prep-flexible-groups',
    screenId: 'flexible-groups',
    visibility: 'teacherOnly',
    text: 'Group membership and changes are teacher-only.',
  },
  {
    id: 'prep-centers',
    screenId: 'centers',
    visibility: 'teacherOnly',
    text: 'Review center order and timer plan before display mode.',
  },
  {
    id: 'prep-homework-packup',
    screenId: 'homework-packup',
    visibility: 'teacherOnly',
    text: 'Check dismissal notes before pack-up begins.',
  },
]

export const DEFAULT_SCREEN_ID = SCREEN_META[0].id
export const DEFAULT_MODE = 'edit' as const
export { DEFAULT_BACKGROUND_ID }
