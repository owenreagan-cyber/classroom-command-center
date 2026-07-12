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

export type CardId =
  | 'do-now'
  | 'reminders'
  | 'materials'
  | 'ready'
  | 'timer'
  | 'lesson'
  | 'cleanup'
  | 'routine'
  | 'phase-timer'
  | 'compact-cue'
  | 'focus'
  | 'agenda'
  | 'lesson-card'
  | 'vocabulary-card'
  | 'noise'

export type ScreenCardVisibility = Record<
  ScreenId,
  Partial<Record<CardId, boolean>>
>

export interface CardVisibilityOption {
  id: CardId
  label: string
  helperText?: string
  isOptional?: boolean
}

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

export interface LessonContent {
  title: string
  objective: string
  successCriteria: string[]
  reminder?: string
}

export interface VocabularyEntry {
  term: string
  definition?: string
}

export interface VocabularyContent {
  title: string
  entries: VocabularyEntry[]
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
  lesson?: LessonContent
  vocabulary?: VocabularyContent
}

export interface ReadingContent {
  lessonTitle: string
  materialsTitle: string
  materials: MaterialsLists
  readyPosition: ReadyPositionContent
  timerNote: string
  lesson?: LessonContent
  vocabulary?: VocabularyContent
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
  lesson?: LessonContent
  vocabulary?: VocabularyContent
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


export type BoardPresetId =
  | 'morning-arrival'
  | 'math-warm-up'
  | 'reading-rotation'
  | 'pack-up'
  | 'assessment-mode'
  | 'snack-lunch-routine'
  | 'ready-position-reset'

export interface BoardPreset {
  id: BoardPresetId
  label: string
  helperText: string
  screenId: ScreenId
}

export interface CustomBoardPreset {
  id: string
  label: string
  helperText: string
  screenId: ScreenId
  content: ScreenContents[ScreenId]
  createdAt: string
}

export interface BoardExportPayload {
  app: 'classroom-command-center'
  version: 1
  exportedAt: string
  state: BoardState
}


export type NoiseTrackerId = 'homeroom' | 'math' | 'reading'

export type VoiceLevel = 'silent' | 'whisper' | 'normal' | 'off'

export type NoiseTowerLetter = 'N' | 'O' | 'I' | 'S' | 'E'

export interface NoiseTowerState {
  letter: NoiseTowerLetter
  hp: number
  maxHp: number
}

export interface NoiseTrackerState {
  id: NoiseTrackerId
  label: string
  voiceLevel: VoiceLevel
  noisyPoints: number
  lapMinutes: number
  meterLevel: number
  isPaused: boolean
  towers: NoiseTowerState[]
}

export interface BoardState {
  mode: AppMode
  activeScreen: ScreenId
  backgroundId: BackgroundAssetId
  contents: ScreenContents
  teacherNotes: TeacherNote[]
  cardVisibility: ScreenCardVisibility
  customPresets: CustomBoardPreset[]
  noiseTrackers: Record<NoiseTrackerId, NoiseTrackerState>
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

export interface DailyBriefTemplate {
  id: string
  name: string
  displayTitle: string
  voiceLevel: VoiceLevel
  mainInstruction?: string
  checklist?: string[]
  materialsOut?: string[]
  materialsAway?: string[]
  smartTvReminder?: string
  lessonObjective?: string
  successCriteria?: string[]
  vocabularyTerms?: string[]
  optionalRotationGroups?: string[]
  optionalTeacherNote?: string
  optionalTargetScreenSuggestion?: ScreenId
}
