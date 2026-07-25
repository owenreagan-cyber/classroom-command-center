export type PacketKind = 'daily-brief' | 'full-backup'

/** Current packet format version. Increment on any breaking change. */
export const CURRENT_PACKET_VERSION = 1

/** Minimum supported version for migration. */
export const MIN_SUPPORTED_PACKET_VERSION = 1

// ── Envelope ──────────────────────────────────────────────────────────

export interface LocalPacketEnvelope<P = unknown> {
  format: 'classroom-command-center'
  kind: PacketKind
  version: number
  exportedAt: string // ISO 8601
  appVersion?: string
  payload: P
}

// ── Daily Brief Packet ────────────────────────────────────────────────

export interface DailyBriefTimerPreset {
  screenId: string
  label?: string
  durationMinutes?: number
}

export interface DailyBriefCoaching {
  visibleBehaviors?: string[]
  stage?: string
}

export interface DailyBriefLesson {
  title?: string
  objective?: string
  successCriteria?: string[]
  reminder?: string
}

export interface DailyBriefVocabularyEntry {
  term: string
  definition?: string
}

export interface DailyBriefVocabulary {
  title?: string
  entries?: DailyBriefVocabularyEntry[]
}

export interface DailyBriefScreenContent {
  lesson?: DailyBriefLesson
  vocabulary?: DailyBriefVocabulary
  doNowTitle?: string
  doNow?: string
  remindersTitle?: string
  reminders?: string[]
  materialsTitle?: string
  materialsOut?: string[]
  materialsAway?: string[]
  readyPositionTitle?: string
  readyPositionSteps?: string[]
  readyPositionCompactLine?: string
  focusTitle?: string
  focusTask?: string
  agendaTitle?: string
  agenda?: string[]
  smartTvReminder?: string
  voiceLevel?: string
}

export interface DailyBriefPacketPayload {
  metadata: {
    packetId: string
    title: string
    source?: string
    createdAt: string
    intendedDate?: string
    templateId?: string
    templateName?: string
  }
  targetScreens: string[]
  content: {
    homeroom?: DailyBriefScreenContent
    math?: DailyBriefScreenContent
    reading?: DailyBriefScreenContent
    'snack-lunch'?: DailyBriefScreenContent
    'ready-position'?: DailyBriefScreenContent
    recess?: DailyBriefScreenContent
    writing?: DailyBriefScreenContent
    science?: DailyBriefScreenContent
    'social-studies'?: DailyBriefScreenContent
    assessment?: DailyBriefScreenContent
    centers?: DailyBriefScreenContent
    'homework-packup'?: DailyBriefScreenContent
  }
  coaching?: DailyBriefCoaching
  timerPresets?: DailyBriefTimerPreset[]
  teacherNotes?: string
}

import type { PickerClassId, MysterySession } from '../student-picker/types'

// ── Full Local Backup ─────────────────────────────────────────────────

export interface BackupBoardContent {
  mode?: string
  activeScreen?: string
  activePageId?: string | null
  /** Per-class ordered pages, including Studio Canvas widget geometry
   * (position/size/zIndex/locked/visible). Selection, transient drag
   * state, alignment guides, and undo/redo history are never included. */
  classWorkspaces?: Record<string, unknown>
  backgroundId?: string
  contents?: Record<string, unknown>
  teacherNotes?: unknown[]
  todayPrep?: unknown
  morningMessage?: unknown
  cardVisibility?: Record<string, unknown>
  customPresets?: unknown[]
  noiseTrackers?: Record<string, unknown>
}

export interface BackupTimerContent {
  simpleTimers?: Record<string, unknown>
  phaseTimer?: unknown
  routineControls?: Record<string, unknown>
}

export interface BackupPickerContent {
  students?: unknown[]
  fairnessHistory?: unknown[]
  coachingConfig?: unknown
  settings?: unknown
}

export interface BackupMysterySessions {
  activeSessions?: Record<PickerClassId, MysterySession | null>
}

export interface FullBackupCategories {
  board?: BackupBoardContent
  timers?: BackupTimerContent
  rosters?: unknown[]
  pickerHistory?: unknown[]
  archivedStudents?: unknown[]
  coachingConfig?: unknown
  pickerSettings?: unknown
  activeMysterySessions?: BackupMysterySessions
  schemaVersions?: Record<string, number>
}

export interface FullBackupPacketPayload {
  categories: FullBackupCategories
  exportedCategories: string[]
}

export type PacketPayload = DailyBriefPacketPayload | FullBackupPacketPayload
