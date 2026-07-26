import type { ScreenId } from '../../data/types'
import type { ClassGroup, PickerPoolKey, ReadingSection } from '../roster/types'

export type StudentId = string
export type PickerClassId = ClassGroup | string

export interface Student {
  id: StudentId
  firstName: string
  lastName: string
  preferredName?: string
  displayName: string
  isActive: boolean
  classes: PickerClassId[]
  section?: ReadingSection
  isAbsent: boolean
  note?: string
}

export type MysterySlotId = 'high-flier-1' | 'high-flier-2' | 'star'

export type MysterySlotStatus = 'hidden' | 'earned' | 'did-not-earn'

export type ObservationValue = 'not-observed' | 'positive' | 'needs-attention'

export interface ObservationRecord {
  behaviorId: string
  value: ObservationValue
  context?: string
}

export interface MysterySlot {
  studentId: StudentId
  status: MysterySlotStatus
  reason?: string
  /** Recognition title label shown on reveal (preferred over generic role label) */
  assignedTitle?: string
  assignedTitleId?: string
  observations: ObservationRecord[]
}

export type MysteryRevealStatus =
  | 'active'
  | 'revealed-1'
  | 'revealed-2'
  | 'revealed-3'
  | 'completed'

export interface MysterySession {
  id: string
  poolKey: PickerPoolKey
  classId: PickerClassId
  readingSection?: ReadingSection
  date: string
  status: MysteryRevealStatus
  currentContext?: string
  createdAt: number
  updatedAt: number
  slots: {
    'high-flier-1': MysterySlot | null
    'high-flier-2': MysterySlot | null
    star: MysterySlot | null
  }
}

export interface FairnessEntry {
  id: string
  studentId: StudentId
  studentDisplayName?: string
  poolKey: PickerPoolKey
  classId: PickerClassId
  timestamp: number
  role: 'quick-pick' | 'mystery-high-flier' | 'mystery-star' | 'absent-replacement'
  outcome: 'earned' | 'did-not-earn' | 'quick-picked' | 'absent-replaced'
  date?: string
  reason?: string
  originalOutcome?: 'earned' | 'did-not-earn' | 'quick-picked' | 'absent-replaced'
  correctedAt?: number
}

export interface BehaviorLookFor {
  id: string
  label: string
  isCustom?: boolean
}

export type CoachingStage = 'teach' | 'practice' | 'reinforce' | 'maintain' | 'reteach'
export type CoachingDisplayMode = 'compact' | 'expanded' | 'hidden'

export interface CoachingState {
  enabled: boolean
  visibleBehaviors: string[]
  customBehaviors: BehaviorLookFor[]
  primaryFocusId?: string
  showOnScreens: ScreenId[]
  stage: CoachingStage
  displayMode: CoachingDisplayMode
}

export interface PickerSettings {
  reducedMotion: boolean
  skipAnimation: boolean
}

export interface PickerStoreState {
  students: Student[]
  fairnessHistory: FairnessEntry[]
  titleUsageHistory: import('../titles/types').TitleUsageEntry[]
  activeMysterySessions: Record<string, MysterySession | null>
  coachingConfig: CoachingState
  settings: PickerSettings
  importedRosterMeta?: {
    schoolYear?: string
    importedAt: number
    sectionsFound: ReadingSection[]
  }

  addStudent: (displayName: string, classIds: PickerClassId[], note?: string) => void
  addStudentsBulk: (names: string, classId: PickerClassId) => void
  importRosterStudents: (
    students: Student[],
    meta?: { schoolYear?: string; sectionsFound?: ReadingSection[] },
  ) => void
  updateStudent: (id: StudentId, updates: Partial<Student>) => void
  markAbsent: (id: StudentId, absent: boolean) => void
  markAllPresent: () => void

  startMysterySession: (
    poolKey: PickerPoolKey,
    classId: PickerClassId,
    date: string,
    studentIds: StudentId[],
    readingSection?: ReadingSection,
  ) => void
  updateMysterySlot: (
    poolKey: PickerPoolKey,
    slotId: MysterySlotId,
    status: MysterySlotStatus,
    reason?: string,
  ) => void
  clearMysterySlotOutcome: (poolKey: PickerPoolKey, slotId: MysterySlotId) => void
  updateSlotObservation: (
    poolKey: PickerPoolKey,
    slotId: MysterySlotId,
    behaviorId: string,
    value: ObservationValue,
    context?: string,
  ) => void
  replaceAbsentMysteryStudent: (
    poolKey: PickerPoolKey,
    classId: PickerClassId,
    slotId: MysterySlotId,
    newStudentId: StudentId,
  ) => void

  canStartReveal: (poolKey: PickerPoolKey) => boolean
  advanceMysteryReveal: (poolKey: PickerPoolKey) => void
  revealMysteryStep: (poolKey: PickerPoolKey, step: 'revealed-1' | 'revealed-2' | 'revealed-3') => void
  replayReveal: (poolKey: PickerPoolKey) => void
  cancelMysterySession: (poolKey: PickerPoolKey) => void
  commitMysterySession: (poolKey: PickerPoolKey) => void

  updateSessionContext: (poolKey: PickerPoolKey, context: string) => void
  resetPool: (poolKey: PickerPoolKey) => void

  recordQuickPick: (poolKey: PickerPoolKey, classId: PickerClassId, studentId: StudentId) => void
  clearQuickPickHistory: (poolKey: PickerPoolKey) => void
  correctOutcome: (
    poolKey: PickerPoolKey,
    eventId: string,
    nextOutcome: 'earned' | 'did-not-earn',
  ) => void

  updateCoachingConfig: (updates: Partial<CoachingState>) => void
  updateSettings: (updates: Partial<PickerSettings>) => void
}

export type { PickerPoolKey, ReadingSection, ClassGroup }
