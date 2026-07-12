import type {
  DailyBriefPacketPayload,
  FullBackupPacketPayload,
} from './types'

/**
 * Represents a single field group that can be selected or skipped during import.
 */
export interface ApplyFieldGroup {
  screenId: string
  groupId: string
  label: string
  included: boolean
  selected: boolean
  conflict: boolean
  conflictMessage?: string
}

export interface ActiveStateInfo {
  activeTimers: string[]
  activeMysterySessions: string[]
  revealInProgress: boolean
  quickPickPending: boolean
}

export interface ApplyPlan {
  /** Which screens/field groups the import would touch. */
  fieldGroups: ApplyFieldGroup[]
  /** Screens that would be modified. */
  affectedScreens: string[]
  /** Active state that would be affected. */
  activeStateConflicts: ActiveStateInfo
  /** Whether any timer runtime would be overwritten. */
  affectsTimerRuntime: boolean
  /** Whether any active mystery session would be affected. */
  affectsActiveMystery: boolean
  /** Screens/fields that would be skipped. */
  skipped: string[]
  /** Summary for the teacher. */
  summary: string
}

export interface ResolvedPlan {
  acceptedFieldGroups: { screenId: string; groupId: string }[]
  replaceTimerRuntime: boolean
  replaceActiveMystery: boolean
  replaceQuickPick: boolean
}

export interface ApplyResult {
  applied: boolean
  updatedCategories: string[]
  skippedCategories: string[]
  errors: string[]
}

// ── Active state detection ────────────────────────────────────────────

export function detectActiveTimers(timerStore: {
  simpleTimers?: Record<string, { status: string }>
  phaseTimer?: { status: string }
}): string[] {
  const active: string[] = []
  if (timerStore.simpleTimers) {
    for (const [id, t] of Object.entries(timerStore.simpleTimers)) {
      if (t.status === 'running' || t.status === 'paused') {
        active.push(`simple-timer:${id}`)
      }
    }
  }
  if (timerStore.phaseTimer && (timerStore.phaseTimer.status === 'running' || timerStore.phaseTimer.status === 'paused')) {
    active.push('phase-timer')
  }
  return active
}

export function detectActiveMysterySessions(
  sessions: Record<string, { status: string } | null | undefined>,
): string[] {
  const active: string[] = []
  for (const [classId, session] of Object.entries(sessions)) {
    if (session && (session.status === 'active' || session.status.startsWith('revealed-'))) {
      active.push(classId)
    }
  }
  return active
}

// ── Apply plan for Daily Brief ────────────────────────────────────────

export function createDailyBriefPlan(
  packet: DailyBriefPacketPayload,
  currentTimers: { simpleTimers?: Record<string, { status: string }>; phaseTimer?: { status: string } },
  currentMysterySessions: Record<string, { status: string } | null | undefined>,
): ApplyPlan {
  const fieldGroups: ApplyFieldGroup[] = []
  const affectedScreens: string[] = []
  const skipped: string[] = []

  for (const screenId of packet.targetScreens) {
    const sc = packet.content[screenId as keyof typeof packet.content]
    if (!sc) {
      skipped.push(screenId)
      continue
    }
    affectedScreens.push(screenId)
    addFieldGroup(fieldGroups, screenId, 'lesson', 'Lesson Content', sc.lesson !== undefined)
    addFieldGroup(fieldGroups, screenId, 'vocabulary', 'Vocabulary', sc.vocabulary !== undefined)
    addFieldGroup(fieldGroups, screenId, 'doNow', 'Do Now', sc.doNow !== undefined)
    addFieldGroup(fieldGroups, screenId, 'reminders', 'Reminders', sc.reminders !== undefined)
    addFieldGroup(fieldGroups, screenId, 'materials', 'Materials', sc.materialsOut !== undefined)
    addFieldGroup(fieldGroups, screenId, 'readyPosition', 'Ready Position', sc.readyPositionSteps !== undefined)
    addFieldGroup(fieldGroups, screenId, 'focus', 'Focus/Agenda', sc.focusTask !== undefined)
    addFieldGroup(fieldGroups, screenId, 'smartTv', 'Smart TV Reminder', sc.smartTvReminder !== undefined)
    addFieldGroup(fieldGroups, screenId, 'voiceLevel', 'Voice Level', sc.voiceLevel !== undefined)
  }

  const activeTimers = detectActiveTimers(currentTimers)
  const activeMystery = detectActiveMysterySessions(currentMysterySessions)
  const revealInProgress = Object.values(currentMysterySessions).some(
    (s) => s && s.status.startsWith('revealed-'),
  )

  const activeState: ActiveStateInfo = {
    activeTimers,
    activeMysterySessions: activeMystery,
    revealInProgress,
    quickPickPending: false,
  }

  const affectsTimerRuntime = activeTimers.length > 0
  const affectsActiveMystery = activeMystery.length > 0

  return {
    fieldGroups,
    affectedScreens,
    activeStateConflicts: activeState,
    affectsTimerRuntime,
    affectsActiveMystery,
    skipped,
    summary: `This packet covers ${affectedScreens.length} screen(s) with ${fieldGroups.filter(f => f.included).length} field group(s).`,
  }
}

function addFieldGroup(
  groups: ApplyFieldGroup[],
  screenId: string,
  groupId: string,
  label: string,
  included: boolean,
) {
  groups.push({
    screenId,
    groupId,
    label: `${screenId}: ${label}`,
    included,
    selected: included,
    conflict: false,
  })
}

// ── Apply plan for full backup ────────────────────────────────────────

export function createBackupPlan(
  packet: FullBackupPacketPayload,
  currentTimers: { simpleTimers?: Record<string, { status: string }>; phaseTimer?: { status: string } },
  currentMysterySessions: Record<string, { status: string } | null | undefined>,
): { categories: { id: string; label: string; present: boolean; selected: boolean; highRisk: boolean }[]; activeStateConflicts: ActiveStateInfo } {
  const activeTimers = detectActiveTimers(currentTimers)
  const activeMystery = detectActiveMysterySessions(currentMysterySessions)
  const revealInProgress = Object.values(currentMysterySessions).some(
    (s) => s && s.status.startsWith('revealed-'),
  )

  const highRiskCategories = ['activeMysterySessions', 'pickerHistory']

  const categoryMeta: { id: string; label: string }[] = [
    { id: 'board', label: 'Board Content' },
    { id: 'timers', label: 'Timer Preferences' },
    { id: 'rosters', label: 'Student Rosters' },
    { id: 'pickerHistory', label: 'Picker History' },
    { id: 'archivedStudents', label: 'Archived Students' },
    { id: 'coachingConfig', label: 'Coaching Configuration' },
    { id: 'pickerSettings', label: 'Picker Settings' },
    { id: 'activeMysterySessions', label: 'Active Mystery Sessions' },
  ]

  const cats = packet.categories

  const categories = categoryMeta.map((meta) => ({
    id: meta.id,
    label: meta.label,
    present: (cats as Record<string, unknown>)[meta.id] !== undefined,
    selected: !highRiskCategories.includes(meta.id),
    highRisk: highRiskCategories.includes(meta.id),
  }))

  return {
    categories,
    activeStateConflicts: {
      activeTimers,
      activeMysterySessions: activeMystery,
      revealInProgress,
      quickPickPending: false,
    },
  }
}

// ── Roster merge helpers ──────────────────────────────────────────────

export interface RosterEntry {
  id: string
  displayName: string
  isActive?: boolean
  isAbsent?: boolean
  classes?: string[]
  note?: string
}

/**
 * Merge incoming roster with existing roster using stable IDs.
 * If an ID matches an existing student, the existing record is preserved
 * unless the incoming has a different display name or isActive status.
 * Students missing from incoming are left untouched (not deleted).
 */
export function mergeRosters(
  existing: RosterEntry[],
  incoming: RosterEntry[],
): { merged: RosterEntry[]; conflicts: string[]; skipped: string[] } {
  const conflicts: string[] = []
  const skipped: string[] = []
  const mergedMap = new Map<string, RosterEntry>()

  for (const student of existing) {
    mergedMap.set(student.id, student)
  }

  for (const student of incoming) {
    if (mergedMap.has(student.id)) {
      const existing = mergedMap.get(student.id)!
      if (existing.displayName !== student.displayName) {
        conflicts.push(
          `Student "${student.id}" has display name "${student.displayName}" in import but "${existing.displayName}" locally. Local version preserved.`,
        )
      }
      // Preserve existing by not overwriting
    } else {
      // New student, check for duplicate display-name-only matches
      const nameMatch = Array.from(mergedMap.values()).find(
        (s) => s.displayName === student.displayName,
      )
      if (nameMatch) {
        // Flag but still add with a warning
        mergedMap.set(student.id, { ...student })
        skipped.push(
          `Student "${student.displayName}" (id: ${student.id}) may be a duplicate of "${nameMatch.displayName}" (id: ${nameMatch.id}) by name. Added with new ID.`,
        )
      } else {
        mergedMap.set(student.id, { ...student })
      }
    }
  }

  return { merged: Array.from(mergedMap.values()), conflicts, skipped }
}

// ── History merge ─────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string
  studentId: string
  [key: string]: unknown
}

/**
 * Merge incoming history with existing history, deduplicating by entry ID.
 */
export function mergeHistory(
  existing: HistoryEntry[],
  incoming: HistoryEntry[],
): HistoryEntry[] {
  const existingIds = new Set(existing.map((h) => h.id))
  const merged = [...existing]
  for (const entry of incoming) {
    if (!existingIds.has(entry.id)) {
      merged.push(entry)
      existingIds.add(entry.id)
    }
  }
  return merged
}

// ── Detect current board state (for preview) ──────────────────────────

export interface CurrentBoardSnapshot {
  screenContents: Record<string, unknown>
  timerState: {
    simpleTimers: Record<string, { status: string }>
    phaseTimerStatus: string
  }
  mysterySessions: Record<string, { status: string } | null | undefined>
}

export function createFieldGroupConflicts(
  fieldGroups: ApplyFieldGroup[],
  currentScreenIds: string[],
): ApplyFieldGroup[] {
  return fieldGroups.map((fg) => ({
    ...fg,
    conflict: !currentScreenIds.includes(fg.screenId),
    conflictMessage: !currentScreenIds.includes(fg.screenId)
      ? `Screen "${fg.screenId}" does not exist in current board state.`
      : undefined,
  }))
}
