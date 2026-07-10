export type AppMode = 'edit' | 'display'

export type ScreenId =
  | 'homeroom'
  | 'math'
  | 'reading'
  | 'snack-lunch'
  | 'ready-position'

export type BackgroundAssetId =
  | 'homeroom-morning-briefing'
  | 'math-training-lab'
  | 'reading-sky-book-world'
  | 'snack-lunch-flow-control'
  | 'ready-position-expectations'

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

export interface ScreenContents {
  homeroom: HomeroomContent
  math: MathContent
  reading: ReadingContent
  'snack-lunch': SnackLunchContent
  'ready-position': ReadyPositionContent
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

export interface BoardState {
  mode: AppMode
  activeScreen: ScreenId
  backgroundId: BackgroundAssetId
  contents: ScreenContents
}

export interface ScreenMeta {
  id: ScreenId
  label: string
}

export interface SmartTextBlock {
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
