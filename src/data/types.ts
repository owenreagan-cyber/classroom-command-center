export type AppMode = 'edit' | 'display'

import type { MorningMessageState } from './morningMessage'

/** Who may see a piece of board content. */
export type Visibility = 'student' | 'teacherOnly' | 'hidden'

export interface WithVisibility {
  visibility?: Visibility
}

// ── Screen IDs with splits ────────────────────────────────────────────

export type ScreenId =
  | 'homeroom'
  | 'math'
  | 'reading'
  | 'snack'
  | 'lunch'
  | 'recess'
  | 'ready-position'
  | 'writing'
  | 'science'
  | 'social-studies'
  | 'assessment'
  | 'centers'
  | 'homework'
  | 'pack-up'
  | 'spelling'
  | 'movement'

/** Legacy screen IDs that still need migration support. */
export type LegacyScreenId =
  | 'snack-lunch'
  | 'homework-packup'
  | 'intervention'
  | 'flexible-groups'

// ── Vibe Page Architecture ────────────────────────────────────────────

export type VibePageId =
  | 'homeroom-morning-arrival'
  | 'homeroom-silent-work'
  | 'homeroom-clean-up-math'
  | 'homeroom-morning-message'
  | 'homeroom-announcements'
  | 'math-get-ready'
  | 'math-warm-up'
  | 'math-lesson'
  | 'math-guided-practice'
  | 'math-independent-work'
  | 'math-wrap-up'
  | 'reading-get-ready'
  | 'reading-focus'
  | 'reading-random-reader'
  | 'reading-independent'
  | 'reading-response-prompt'
  | 'reading-wrap-up'
  | 'snack-quiet-snack'
  | 'snack-silent-clean-up'
  | 'lunch-quiet-lunch-a'
  | 'lunch-silent-chew'
  | 'lunch-quiet-lunch-b'
  | 'lunch-silent-clean-up'
  | 'homework-copy-homework'
  | 'homework-check-planner'
  | 'homework-pack-materials'
  | 'pack-up-pack-up'
  | 'pack-up-ready-position'
  | 'pack-up-dismissal'
  | 'history-science-get-ready'
  | 'history-science-lesson-focus'
  | 'history-science-activity'
  | 'history-science-wrap-up'
  | 'spelling-get-ready'
  | 'spelling-focus'
  | 'spelling-practice'
  | 'shurley-get-ready'
  | 'shurley-writing-focus'
  | 'shurley-independent-work'
  | 'shurley-wrap-up'
  | 'recess-play'
  | 'ready-position-default'
  | 'movement-default'
  | 'social-studies-focus'
  | 'assessment-default'
  | 'centers-default'

export type PageLayoutPreset =
  | 'centered-message'
  | 'message-plus-timer'
  | 'message-plus-materials'
  | 'split-content'
  | 'full-focus'
  | 'cleanup-checklist'

export interface PageWidget {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  locked: boolean
  visible: boolean
  snapRegion?: string
  contentRef?: string
}

export interface VibePage {
  id: VibePageId
  title: string
  subtitle?: string
  backgroundId: BackgroundAssetId
  primaryMessage: string
  supportingContent?: string[]
  widgetIds: string[]
  layoutPreset: PageLayoutPreset
  widgets: PageWidget[]
  previousPageId: VibePageId | null
  nextPageId: VibePageId | null
  routinePhaseIds: string[]
  visibleInStudio: boolean
  visibleInClassroom: boolean
}

export interface ClassWorkspace {
  classId: ScreenId
  title: string
  pages: VibePage[]
  activePageId: VibePageId | null
  previousPageId: VibePageId | null
  nextPageId: VibePageId | null
  routinePhaseAssociations?: Record<string, VibePageId>
}

// ── Background ─────────────────────────────────────────────────────────

export type BackgroundAssetId =
  | 'homeroom-morning-briefing'
  | 'math-training-lab'
  | 'reading-sky-book-world'
  | 'snack-flow-control'
  | 'lunch-flow-control'
  | 'ready-position-expectations'
  | 'writing-workshop'
  | 'science-lab'
  | 'social-studies-map'
  | 'assessment-mode'
  | 'centers-rotations'
  | 'recess-play'
  | 'homework-station'
  | 'pack-up-station'

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

// ── Screen Contents (flat per class, vibe pages reference these) ───────

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

export interface SnackContent {
  title: string
  cleanupTitle: string
  cleanupReminders: string[]
  routineTitle: string
  routine: string[]
  phaseNote: string
}

export interface LunchContent {
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

export interface HomeworkContent {
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

export interface PackUpContent {
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
  snack: SnackContent
  lunch: LunchContent
  recess: ReadyPositionContent
  movement: ReadyPositionContent
  'ready-position': ReadyPositionContent
  writing: SubjectContent
  science: SubjectContent
  'social-studies': SubjectContent
  assessment: SubjectContent
  centers: SubjectContent
  homework: HomeworkContent
  'pack-up': PackUpContent
  spelling: SubjectContent
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
  screenId?: ScreenId
}

export interface TeacherResourceLink extends WithVisibility {
  id: string
  label: string
  url: string
}

/** Teacher Open With preset for Material Launcher links (control route only). */
export type ResourceOpenPreset =
  | 'google-slides'
  | 'google-docs'
  | 'google-drive'
  | 'youtube'
  | 'pdf'
  | 'website'
  | 'other'

/** Manual teacher resource link for the Material Launcher (control route only). */
export interface TeacherMaterialLink extends WithVisibility {
  id: string
  label: string
  url: string
  /** Open With preset — defaults to website when missing from older backups. */
  preset?: ResourceOpenPreset
  note?: string
  screenId?: ScreenId
  pageId?: VibePageId
}

export interface PrepChecklistItem {
  id: string
  text: string
  completed: boolean
  screenId?: ScreenId
  pageId?: VibePageId
}

export interface TodayPrepState {
  checklistItems: PrepChecklistItem[]
  resourceLinks: TeacherMaterialLink[]
  /** Id of the Material Launcher resource shown on /display (label only). */
  nowShowingResourceId?: string | null
}

export type BoardPresetId =
  | 'morning-arrival'
  | 'math-warm-up'
  | 'reading-rotation'
  | 'pack-up'
  | 'assessment-mode'
  | 'snack-routine'
  | 'lunch-routine'
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

export type {
  MorningMessageSectionId,
  MorningMessageSectionVisibility,
  MorningMessageContent,
  MorningMessageTemplate,
  MorningMessageState,
} from './morningMessage'

export interface BoardState {
  mode: AppMode
  activeScreen: ScreenId
  activePageId: VibePageId | null
  classWorkspaces: Record<ScreenId, ClassWorkspace | undefined>
  backgroundId: BackgroundAssetId
  contents: ScreenContents
  teacherNotes: TeacherNote[]
  todayPrep: TodayPrepState
  morningMessage: MorningMessageState
  cardVisibility: ScreenCardVisibility
  customPresets: CustomBoardPreset[]
  noiseTrackers: Record<NoiseTrackerId, NoiseTrackerState>
}

export interface ScreenMeta {
  id: ScreenId
  label: string
  navLabel?: string
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
