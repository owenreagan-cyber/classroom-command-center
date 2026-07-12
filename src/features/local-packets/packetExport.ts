import type {
  DailyBriefPacketPayload,
  DailyBriefScreenContent,
  FullBackupPacketPayload,
  FullBackupCategories,
  LocalPacketEnvelope,
  PacketKind,
} from './types'
import type { PickerClassId, MysterySession } from '../student-picker/types'
import { CURRENT_PACKET_VERSION } from './packetVersion'
import { VALID_SCREEN_IDS } from './packetValidation'

// ── Envelope creation ─────────────────────────────────────────────────

export function createEnvelope<P>(kind: PacketKind, payload: P): LocalPacketEnvelope<P> {
  return {
    format: 'classroom-command-center',
    kind,
    version: CURRENT_PACKET_VERSION,
    exportedAt: new Date().toISOString(),
    payload,
  }
}

// ── Daily Brief export ────────────────────────────────────────────────

export interface ExportSource {
  // Screen contents in the format used by DailyBriefScreenContent
  screenContents: Partial<Record<string, Partial<DailyBriefScreenContent>>>
  // Metadata
  title: string
  source?: string
  intendedDate?: string
  templateId?: string
  templateName?: string
  // Coaching
  coachingBehaviors?: string[]
  coachingStage?: string
  // Timer presets
  timerPresets?: { screenId: string; label?: string; durationMinutes?: number }[]
  // Teacher notes
  teacherNotes?: string
  // Which screens to include
  targetScreens: string[]
}

/**
 * Create a Daily Brief packet payload from source data.
 * This function explicitly strips any private data and only includes
 * reviewed instructional content.
 */
export function createDailyBriefPayload(source: ExportSource): DailyBriefPacketPayload {
  const content: DailyBriefPacketPayload['content'] = {}

  for (const screenId of source.targetScreens) {
    if (!VALID_SCREEN_IDS.includes(screenId as never)) continue
    const sc = source.screenContents[screenId]
    if (sc) {
      content[screenId as keyof typeof content] = sanitizeDailyBriefScreenContent(sc)
    }
  }

  return {
    metadata: {
      packetId: generatePacketId(),
      title: source.title,
      source: source.source,
      createdAt: new Date().toISOString(),
      intendedDate: source.intendedDate,
      templateId: source.templateId,
      templateName: source.templateName,
    },
    targetScreens: source.targetScreens.filter((s) => VALID_SCREEN_IDS.includes(s as never)),
    content,
    coaching: source.coachingBehaviors || source.coachingStage
      ? {
          visibleBehaviors: source.coachingBehaviors,
          stage: source.coachingStage,
        }
      : undefined,
    timerPresets: source.timerPresets?.length ? source.timerPresets : undefined,
    teacherNotes: source.teacherNotes?.trim() || undefined,
  }
}

function sanitizeDailyBriefScreenContent(
  sc: Partial<DailyBriefScreenContent>,
): DailyBriefScreenContent {
  // Only include explicitly allowed fields — strip any unknown properties
  const allowed: DailyBriefScreenContent = {}
  if (sc.lesson) {
    allowed.lesson = {
      title: sc.lesson.title?.slice(0, 500),
      objective: sc.lesson.objective?.slice(0, 2000),
      successCriteria: sc.lesson.successCriteria?.slice(0, 10).map((s) => s.slice(0, 500)),
      reminder: sc.lesson.reminder?.slice(0, 1000),
    }
  }
  if (sc.vocabulary) {
    allowed.vocabulary = {
      title: sc.vocabulary.title?.slice(0, 200),
      entries: sc.vocabulary.entries?.slice(0, 20).map((e) => ({
        term: e.term.slice(0, 200),
        definition: e.definition?.slice(0, 500),
      })),
    }
  }
  if (sc.doNowTitle !== undefined) allowed.doNowTitle = String(sc.doNowTitle).slice(0, 200)
  if (sc.doNow !== undefined) allowed.doNow = String(sc.doNow).slice(0, 2000)
  if (sc.remindersTitle !== undefined) allowed.remindersTitle = String(sc.remindersTitle).slice(0, 200)
  if (sc.reminders !== undefined) allowed.reminders = sc.reminders.slice(0, 20).map((r) => String(r).slice(0, 500))
  if (sc.materialsTitle !== undefined) allowed.materialsTitle = String(sc.materialsTitle).slice(0, 200)
  if (sc.materialsOut !== undefined) allowed.materialsOut = sc.materialsOut.slice(0, 20).map((m) => String(m).slice(0, 200))
  if (sc.materialsAway !== undefined) allowed.materialsAway = sc.materialsAway.slice(0, 20).map((m) => String(m).slice(0, 200))
  if (sc.readyPositionSteps !== undefined) allowed.readyPositionSteps = sc.readyPositionSteps.slice(0, 10).map((s) => String(s).slice(0, 200))
  if (sc.readyPositionTitle !== undefined) allowed.readyPositionTitle = String(sc.readyPositionTitle).slice(0, 200)
  if (sc.readyPositionCompactLine !== undefined) allowed.readyPositionCompactLine = String(sc.readyPositionCompactLine).slice(0, 200)
  if (sc.focusTitle !== undefined) allowed.focusTitle = String(sc.focusTitle).slice(0, 200)
  if (sc.focusTask !== undefined) allowed.focusTask = String(sc.focusTask).slice(0, 2000)
  if (sc.agendaTitle !== undefined) allowed.agendaTitle = String(sc.agendaTitle).slice(0, 200)
  if (sc.agenda !== undefined) allowed.agenda = sc.agenda.slice(0, 20).map((a) => String(a).slice(0, 500))
  if (sc.smartTvReminder !== undefined) allowed.smartTvReminder = String(sc.smartTvReminder).slice(0, 2000)
  if (sc.voiceLevel !== undefined) allowed.voiceLevel = String(sc.voiceLevel).slice(0, 20)
  return allowed
}

// ── Full Backup export ────────────────────────────────────────────────

export interface BackupSource {
  board?: unknown
  timers?: unknown
  rosters?: unknown[]
  pickerHistory?: unknown[]
  archivedStudents?: unknown[]
  coachingConfig?: unknown
  pickerSettings?: unknown
  activeMysterySessions?: unknown
  schemaVersions?: Record<string, number>
}

/**
 * Create a full backup packet from source data, selecting only the
 * categories specified in `selectedCategories`.
 */
export function createBackupPayload(
  source: BackupSource,
  selectedCategories: string[],
): FullBackupPacketPayload {
  const catSet = new Set(selectedCategories)

  const categories: FullBackupCategories = {}

  if (catSet.has('board') && source.board) categories.board = source.board as FullBackupCategories['board']
  if (catSet.has('timers') && source.timers) categories.timers = source.timers as FullBackupCategories['timers']
  if (catSet.has('rosters') && source.rosters) categories.rosters = source.rosters
  if (catSet.has('pickerHistory') && source.pickerHistory) categories.pickerHistory = source.pickerHistory
  if (catSet.has('archivedStudents') && source.archivedStudents) categories.archivedStudents = source.archivedStudents
  if (catSet.has('coachingConfig') && source.coachingConfig) categories.coachingConfig = source.coachingConfig
  if (catSet.has('pickerSettings') && source.pickerSettings) categories.pickerSettings = source.pickerSettings
  if (catSet.has('activeMysterySessions') && source.activeMysterySessions) {
    categories.activeMysterySessions = { activeSessions: source.activeMysterySessions as Record<PickerClassId, MysterySession | null> }
  }

  // Always store schema versions if available
  if (source.schemaVersions) categories.schemaVersions = source.schemaVersions

  return {
    categories,
    exportedCategories: Object.keys(categories),
  }
}

// ── Helpers ───────────────────────────────────────────────────────────

function generatePacketId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 8)
  return `cc-${timestamp}-${random}`
}

// ── Download ──────────────────────────────────────────────────────────

export function downloadPacket(envelope: LocalPacketEnvelope, filename: string) {
  const encoded = JSON.stringify(envelope, null, 2)
  const blob = new Blob([encoded], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function generateDailyBriefFilename(packet: DailyBriefPacketPayload): string {
  const date = packet.metadata.intendedDate || packet.metadata.createdAt.slice(0, 10)
  const slug = packet.metadata.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `command-center-daily-brief-${date}${slug ? '-' + slug : ''}.json`
}

export function generateBackupFilename(): string {
  const now = new Date()
  const iso = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `command-center-backup-${iso}.json`
}
