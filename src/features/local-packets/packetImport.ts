import type {
  DailyBriefPacketPayload,
  FullBackupPacketPayload,
  LocalPacketEnvelope,
} from './types'
import { migratePacketPayload } from './packetVersion'
import { validatePacket } from './packetValidation'
import type { ApplyResult, ResolvedPlan } from './packetApplyPlan'

export interface ParseResult {
  success: boolean
  envelope?: LocalPacketEnvelope
  migratedPayload?: DailyBriefPacketPayload | FullBackupPacketPayload
  errors: string[]
}

export interface UndoSnapshot {
  label: string
  timestamp: number
  categories: string[]
  // Snapshots of the modified data: these are stored as structured clones
  board?: unknown
  timers?: unknown
  rosters?: unknown[]
  pickerHistory?: unknown[]
  coachingConfig?: unknown
  archivedStudents?: unknown[]
  pickerSettings?: unknown
  activeMysterySessions?: unknown
}

let undoSnapshot: UndoSnapshot | null = null

export function getUndoSnapshot(): UndoSnapshot | null {
  return undoSnapshot
}

export function clearUndo() {
  undoSnapshot = null
}

// ── Parse file ────────────────────────────────────────────────────────

export function parsePacketFile(raw: string): ParseResult {
  const validation = validatePacket(raw)
  if (!validation.valid) {
    return { success: false, errors: validation.errors.map((e) => `${e.field}: ${e.message}`) }
  }

  let parsed: LocalPacketEnvelope
  try {
    parsed = JSON.parse(raw) as LocalPacketEnvelope
  } catch {
    return { success: false, errors: ['Failed to parse JSON.'] }
  }

  // Migrate payload if needed
  let migratedPayload: DailyBriefPacketPayload | FullBackupPacketPayload
  try {
    const migrated = migratePacketPayload(parsed.kind, parsed.version, parsed.payload)
    migratedPayload = migrated as DailyBriefPacketPayload | FullBackupPacketPayload
  } catch (e) {
    return { success: false, errors: [(e as Error).message] }
  }

  return { success: true, envelope: parsed, migratedPayload, errors: [] }
}

// ── Take undo snapshot ────────────────────────────────────────────────

export function takeUndoSnapshot(
  label: string,
  categories: string[],
  currentState: {
    board?: unknown
    timers?: unknown
    rosters?: unknown[]
    pickerHistory?: unknown[]
    coachingConfig?: unknown
    archivedStudents?: unknown[]
    pickerSettings?: unknown
    activeMysterySessions?: unknown
  },
) {
  clearUndo()
  const snapshot: UndoSnapshot = {
    label,
    timestamp: Date.now(),
    categories,
  }
  for (const cat of categories) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const src = currentState as any
    if (src[cat] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(snapshot as any)[cat] = structuredClone(src[cat])
    }
  }
  undoSnapshot = snapshot
}

// ── Apply Daily Brief packet ──────────────────────────────────────────

export interface ApplyDailyBriefInput {
  packet: DailyBriefPacketPayload
  resolvedPlan: ResolvedPlan
  // Current board state (for undo snapshot + conflict resolution)
  getCurrentBoard: () => unknown
  getCurrentTimers: () => { simpleTimers?: Record<string, { status: string }>; phaseTimer?: { status: string } }
  getCurrentMysterySessions: () => Record<string, { status: string } | null | undefined>
  getCurrentCoachingConfig?: () => unknown
  getCurrentRosters?: () => unknown[]
  // Apply functions
  applyBoardChanges?: (changes: Partial<Record<string, { [key: string]: unknown }>>) => void
  applyTimerChanges?: (changes: unknown) => void
  applyCoachingChanges?: (changes: unknown) => void
  applyTimerRuntimeReplacement?: boolean
  applyMysteryRuntimeReplacement?: boolean
}

export function applyDailyBriefPacket(input: ApplyDailyBriefInput): ApplyResult {
  const { packet, resolvedPlan } = input
  const updatedCategories: string[] = []
  const skippedCategories: string[] = []
  const errors: string[] = []

  // Validate the resolved plan has accepted groups
  const acceptedScreens = new Set(
    (resolvedPlan.acceptedFieldGroups || []).map((g: { screenId: string }) => g.screenId),
  )

  // Build a snapshot of what we're about to modify
  const snapshotCategories: string[] = []
  if (input.applyBoardChanges && acceptedScreens.size > 0) snapshotCategories.push('board')
  if (input.applyCoachingChanges && packet.coaching) snapshotCategories.push('coachingConfig')

  if (snapshotCategories.length > 0) {
    takeUndoSnapshot('Daily Brief Import', snapshotCategories, {
      board: input.getCurrentBoard(),
      coachingConfig: input.getCurrentCoachingConfig?.(),
    })
  }

  // Apply board content changes per accepted field groups
  if (input.applyBoardChanges) {
    const changes: Record<string, { [key: string]: unknown }> = {}

    for (const fg of resolvedPlan.acceptedFieldGroups) {
      const sc = packet.content[fg.screenId as keyof typeof packet.content]
      if (!sc) {
        skippedCategories.push(`${fg.screenId}/${fg.groupId}`)
        continue
      }

      if (!changes[fg.screenId]) changes[fg.screenId] = {}

      switch (fg.groupId) {
        case 'lesson':
          if (sc.lesson) changes[fg.screenId].lesson = sc.lesson
          break
        case 'vocabulary':
          if (sc.vocabulary) changes[fg.screenId].vocabulary = sc.vocabulary
          break
        case 'doNow':
          if (sc.doNow !== undefined) changes[fg.screenId].doNow = sc.doNow
          if (sc.doNowTitle !== undefined) changes[fg.screenId].doNowTitle = sc.doNowTitle
          break
        case 'reminders':
          if (sc.reminders !== undefined) changes[fg.screenId].reminders = sc.reminders
          if (sc.remindersTitle !== undefined) changes[fg.screenId].remindersTitle = sc.remindersTitle
          break
        case 'materials':
          if (sc.materialsOut !== undefined) changes[fg.screenId].materialsOut = sc.materialsOut
          if (sc.materialsAway !== undefined) changes[fg.screenId].materialsAway = sc.materialsAway
          if (sc.materialsTitle !== undefined) changes[fg.screenId].materialsTitle = sc.materialsTitle
          break
        case 'readyPosition':
          if (sc.readyPositionSteps !== undefined) changes[fg.screenId].readyPositionSteps = sc.readyPositionSteps
          if (sc.readyPositionTitle !== undefined) changes[fg.screenId].readyPositionTitle = sc.readyPositionTitle
          if (sc.readyPositionCompactLine !== undefined) changes[fg.screenId].readyPositionCompactLine = sc.readyPositionCompactLine
          break
        case 'focus':
          if (sc.focusTask !== undefined) changes[fg.screenId].focusTask = sc.focusTask
          if (sc.focusTitle !== undefined) changes[fg.screenId].focusTitle = sc.focusTitle
          if (sc.agenda !== undefined) changes[fg.screenId].agenda = sc.agenda
          if (sc.agendaTitle !== undefined) changes[fg.screenId].agendaTitle = sc.agendaTitle
          break
        case 'smartTv':
          if (sc.smartTvReminder !== undefined) changes[fg.screenId].smartTvReminder = sc.smartTvReminder
          break
        case 'voiceLevel':
          if (sc.voiceLevel !== undefined) changes[fg.screenId].voiceLevel = sc.voiceLevel
          break
      }
    }

    if (Object.keys(changes).length > 0) {
      input.applyBoardChanges(changes)
      updatedCategories.push('board')
    }
  }

  // Apply coaching changes
  if (input.applyCoachingChanges && packet.coaching) {
    input.applyCoachingChanges(packet.coaching)
    updatedCategories.push('coachingConfig')
  }

  return { applied: true, updatedCategories, skippedCategories, errors }
}

// ── Apply full backup ─────────────────────────────────────────────────

export interface ApplyBackupInput {
  packet: FullBackupPacketPayload
  selectedCategories: string[]
  // Current state for undo
  getCurrentBoard: () => unknown
  getCurrentTimers: () => unknown
  getCurrentRosters: () => unknown[]
  getCurrentPickerHistory: () => unknown[]
  getCurrentCoachingConfig: () => unknown
  getCurrentArchivedStudents: () => unknown[]
  getCurrentPickerSettings: () => unknown
  getCurrentActiveMysterySessions: () => unknown
  // Apply functions
  applyBoardRestore?: (data: unknown) => void
  applyTimerRestore?: (data: unknown) => void
  applyRosterRestore?: (data: unknown[]) => void
  applyPickerHistoryRestore?: (data: unknown[]) => void
  applyCoachingConfigRestore?: (data: unknown) => void
  applyArchivedStudentsRestore?: (data: unknown[]) => void
  applyPickerSettingsRestore?: (data: unknown) => void
  applyActiveMysterySessionsRestore?: (data: unknown) => void
}

export function applyFullBackup(input: ApplyBackupInput): ApplyResult {
  const { packet, selectedCategories } = input
  const catSet = new Set(selectedCategories)
  const cats = packet.categories
  const updatedCategories: string[] = []
  const skippedCategories: string[] = []
  const errors: string[] = []

  // Take undo snapshot
  takeUndoSnapshot('Full Backup Restore', selectedCategories, {
    board: input.getCurrentBoard(),
    timers: input.getCurrentTimers(),
    rosters: input.getCurrentRosters(),
    pickerHistory: input.getCurrentPickerHistory(),
    coachingConfig: input.getCurrentCoachingConfig(),
    archivedStudents: input.getCurrentArchivedStudents(),
    pickerSettings: input.getCurrentPickerSettings(),
    activeMysterySessions: input.getCurrentActiveMysterySessions(),
  })

  const applyMap: [string, boolean, () => void][] = [
    ['board', catSet.has('board') && !!cats.board, () => input.applyBoardRestore?.(cats.board!)],
    ['timers', catSet.has('timers') && !!cats.timers, () => input.applyTimerRestore?.(cats.timers!)],
    ['rosters', catSet.has('rosters') && !!cats.rosters, () => input.applyRosterRestore?.(cats.rosters!)],
    ['pickerHistory', catSet.has('pickerHistory') && !!cats.pickerHistory, () => input.applyPickerHistoryRestore?.(cats.pickerHistory!)],
    ['coachingConfig', catSet.has('coachingConfig') && !!cats.coachingConfig, () => input.applyCoachingConfigRestore?.(cats.coachingConfig!)],
    ['archivedStudents', catSet.has('archivedStudents') && !!cats.archivedStudents, () => input.applyArchivedStudentsRestore?.(cats.archivedStudents!)],
    ['pickerSettings', catSet.has('pickerSettings') && !!cats.pickerSettings, () => input.applyPickerSettingsRestore?.(cats.pickerSettings!)],
    ['activeMysterySessions', catSet.has('activeMysterySessions') && !!cats.activeMysterySessions, () => input.applyActiveMysterySessionsRestore?.(cats.activeMysterySessions!)],
  ]

  for (const [name, shouldApply, applyFn] of applyMap) {
    if (shouldApply) {
      try {
        applyFn()
        updatedCategories.push(name)
      } catch (e) {
        errors.push(`Failed to restore "${name}": ${(e as Error).message}`)
      }
    } else if (catSet.has(name)) {
      skippedCategories.push(name)
    }
  }

  return { applied: true, updatedCategories, skippedCategories, errors }
}
