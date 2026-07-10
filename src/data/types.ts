export type AppMode = 'edit' | 'display'

/** Who may see a piece of board content. */
export type Visibility = 'student' | 'teacherOnly' | 'hidden'

export interface WithVisibility {
  visibility?: Visibility
}

export type ScreenId =
  | 'homeroom'
  | 'math'
  | 'reading'
  | 'snack-lunch'
  | 'ready-position'
  | 'writing'
  | 'science'
  | 'social-studies'
  | 'intervention'
  | 'assessment'
  | 'flexible-groups'
  | 'centers'
  | 'homework-packup'

export type BackgroundAssetId =
  | 'homeroom-morning-briefing'
  | 'math-training-lab'
  | 'reading-sky-book-world'
  | 'snack-lunch-flow-control'
  | 'ready-position-expectations'
  | 'writing-workshop'
  | 'science-lab'
  | 'social-studies-map'
  | 'intervention-focus'
  | 'assessment-mode'
  | 'flexible-groups'
  | 'centers-rotations'
  | 'homework-packup'

export type SafeZoneId =
  | 'left-main'
  | 'center-card'
  | 'right-timer'
  | 'right-utility'
  | 'center-main'

export type TextAlign = 'left' | 'center'

export interface MaterialsLists {
  haveOut: string[]
  putAway: string[]
}

export interface ReadyPositionContent {
  title: string
  steps: string[]
  compactLine: string
  useCompact: boolean
}

export interface HomeroomContent {
  remindersTitle: string
  reminders: string[]
  doNowTitle: string
  doNow: string
  materialsTitle: string
  materials: MaterialsLists
  readyPosition: ReadyPositionContent
}

export interface MathContent {
  lessonTitle: string
  materialsTitle: string
  materials: MaterialsLists
  timerNote: string
}

export interface ReadingContent {
  lessonTitle: string
  materialsTitle: string
  materials: MaterialsLists
  readyPosition: ReadyPositionContent
  timerNote: string
}

export interface SnackLunchContent {
  title: string
  cleanupTitle: string
  cleanupReminders: string[]
  routineTitle: string
  routine: string[]
  phaseNote: string
}

export interface SubjectContent {
  title: string
  focusTitle: string
  focusTask: string
  agendaTitle: string
  agenda: string[]
  materialsTitle: string
  materials: MaterialsLists
  teacherHint: string
}

export interface ScreenContents {
  homeroom: HomeroomContent
  math: MathContent
  reading: ReadingContent
  'snack-lunch': SnackLunchContent
  'ready-position': ReadyPositionContent
  writing: SubjectContent
  science: SubjectContent
  'social-studies': SubjectContent
  intervention: SubjectContent
  assessment: SubjectContent
  'flexible-groups': SubjectContent
  centers: SubjectContent
  'homework-packup': SubjectContent
}

export interface BackgroundAsset {
  id: BackgroundAssetId
  screenId: ScreenId
  label: string
  path: string
  fallbackGradient: string
  safeZones: SafeZoneId[]
  mood: string
  notes: string
}

export interface TeacherNote extends WithVisibility {
  id: string
  text: string
  /** When set, note is scoped to a screen; omitted notes appear on all screens. */
  screenId?: ScreenId
}

export interface TeacherResourceLink extends WithVisibility {
  id: string
  label: string
  url: string
}

export interface BoardState {
  mode: AppMode
  activeScreen: ScreenId
  backgroundId: BackgroundAssetId
  contents: ScreenContents
  teacherNotes: TeacherNote[]
}

export interface ScreenMeta {
  id: ScreenId
  label: string
}

export interface SmartTextBlock extends WithVisibility {
  kind: 'paragraph' | 'bullets' | 'note'
  text?: string
  items?: string[]
  emphasis?: boolean
}

export interface SmartCardModel {
  title: string
  subtitle?: string
  blocks: SmartTextBlock[]
  footer?: string
  align?: TextAlign
}
