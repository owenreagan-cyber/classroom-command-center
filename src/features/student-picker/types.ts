import type { ScreenId } from '../../data/types'

export type StudentId = string
export type PickerClassId = 'homeroom' | 'math' | 'reading' | string

export interface Student {
  id: StudentId
  displayName: string
  isActive: boolean
  classes: PickerClassId[]
  isAbsent: boolean
  note?: string // Teacher distinguishing label/note (e.g. for duplicate names)
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
  observations: ObservationRecord[]
}

export interface MysterySession {
  id: string
  classId: PickerClassId
  date: string // YYYY-MM-DD
  status: 'active' | 'revealed-1' | 'revealed-2' | 'revealed-3' | 'completed'
  currentContext?: string
  slots: {
    'high-flier-1': MysterySlot | null
    'high-flier-2': MysterySlot | null
    'star': MysterySlot | null
  }
}

export interface FairnessEntry {
  id: string
  studentId: StudentId
  studentDisplayName?: string // Snapshot for history reliability
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
  visibleBehaviors: string[] // array of BehaviorLookFor ids
  customBehaviors: BehaviorLookFor[]
  primaryFocusId?: string // highlights one specific behavior
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
  activeMysterySessions: Record<PickerClassId, MysterySession | null>
  coachingConfig: CoachingState
  settings: PickerSettings

  // actions
  addStudent: (displayName: string, classIds: PickerClassId[], note?: string) => void
  addStudentsBulk: (names: string, classId: PickerClassId) => void
  updateStudent: (id: StudentId, updates: Partial<Student>) => void
  markAbsent: (id: StudentId, absent: boolean) => void
  markAllPresent: () => void

  startMysterySession: (classId: PickerClassId, date: string, studentIds: StudentId[]) => void
  updateMysterySlot: (classId: PickerClassId, slotId: MysterySlotId, status: MysterySlotStatus, reason?: string) => void
  updateSlotObservation: (classId: PickerClassId, slotId: MysterySlotId, behaviorId: string, value: ObservationValue, context?: string) => void
  replaceAbsentMysteryStudent: (classId: PickerClassId, slotId: MysterySlotId, newStudentId: StudentId) => void

  canStartReveal: (classId: PickerClassId) => boolean
  advanceMysteryReveal: (classId: PickerClassId) => void
  replayReveal: (classId: PickerClassId) => void
  cancelMysterySession: (classId: PickerClassId) => void
  commitMysterySession: (classId: PickerClassId) => void

  updateSessionContext: (classId: PickerClassId, context: string) => void

  recordQuickPick: (classId: PickerClassId, studentId: StudentId) => void
  clearQuickPickHistory: (classId: PickerClassId) => void
  correctOutcome: (classId: PickerClassId, eventId: string, nextOutcome: 'earned' | 'did-not-earn') => void

  updateCoachingConfig: (updates: Partial<CoachingState>) => void
  updateSettings: (updates: Partial<PickerSettings>) => void
}
