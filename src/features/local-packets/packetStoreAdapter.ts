import type { ScreenContents, BoardState, ScreenCardVisibility, TeacherNote, TodayPrepState, CustomBoardPreset, ScreenId } from '../../data/types'
import type { SimpleTimerState, SimpleTimerScreenId, PhaseTimerState } from '../../data/timerTypes'
import type { RoutineControlState } from '../../data/routineTypes'
import type { DailyBriefPacketPayload, FullBackupPacketPayload } from './types'
import type { Student, FairnessEntry, PickerClassId, MysterySession, CoachingState, PickerSettings } from '../../features/student-picker/types'
import { useBoardStore } from '../../store/boardStore'
import { useTimerStore } from '../../store/timerStore'
import { usePickerStore } from '../../features/student-picker/pickerStore'
import { normalizeNoiseTrackerMap } from '../../lib/noiseTowers'
import { normalizeClassWorkspacesGeometry } from '../../lib/studioCanvasMigration'

// ── Undo ──────────────────────────────────────────────────────────────

interface InternalUndoState {
  label: string
  timestamp: number
  categories: string[]
  board?: Pick<BoardState, 'mode' | 'activeScreen' | 'backgroundId' | 'contents' | 'teacherNotes' | 'todayPrep' | 'cardVisibility' | 'customPresets' | 'noiseTrackers' | 'activePageId' | 'classWorkspaces'> & { beautifyUndo: ScreenContents | null }
  timers?: { simpleTimers: Record<SimpleTimerScreenId, SimpleTimerState>; phaseTimer: PhaseTimerState; routineControls?: Record<string, RoutineControlState> }
  rosters?: Student[]
  pickerHistory?: FairnessEntry[]
  coachingConfig?: CoachingState
  pickerSettings?: PickerSettings
  activeMysterySessions?: Record<PickerClassId, MysterySession | null>
  archivedStudents?: Student[]
}

let undoSlot: InternalUndoState | null = null

export function getUndoSlot(): InternalUndoState | null {
  return undoSlot
}

export function clearUndoSlot() {
  undoSlot = null
}

export function snapshotCategory(cat: string): unknown {
  switch (cat) {
    case 'board': {
      const bs = useBoardStore.getState()
      return {
        mode: bs.mode,
        activeScreen: bs.activeScreen,
        activePageId: bs.activePageId,
        classWorkspaces: structuredClone(bs.classWorkspaces),
        backgroundId: bs.backgroundId,
        contents: structuredClone(bs.contents),
        teacherNotes: structuredClone(bs.teacherNotes),
        todayPrep: structuredClone(bs.todayPrep),
        cardVisibility: structuredClone(bs.cardVisibility),
        customPresets: structuredClone(bs.customPresets),
        noiseTrackers: structuredClone(bs.noiseTrackers),
        beautifyUndo: bs.beautifyUndo ? structuredClone(bs.beautifyUndo) : null
      }
    }
    case 'timers': {
      const ts = useTimerStore.getState()
      return structuredClone({ simpleTimers: ts.simpleTimers, phaseTimer: ts.phaseTimer, routineControls: ts.routineControls })
    }
    case 'rosters': return structuredClone(usePickerStore.getState().students.filter((s: Student) => s.isActive))
    case 'archivedStudents': return structuredClone(usePickerStore.getState().students.filter((s: Student) => !s.isActive))
    case 'pickerHistory': return structuredClone(usePickerStore.getState().fairnessHistory)
    case 'coachingConfig': return structuredClone(usePickerStore.getState().coachingConfig)
    case 'pickerSettings': return structuredClone(usePickerStore.getState().settings)
    case 'activeMysterySessions': return structuredClone(usePickerStore.getState().activeMysterySessions)
    default: return undefined
  }
}

// ── Snapshot before import ────────────────────────────────────────────

export function takePreImportSnapshot(label: string, categories: string[]) {
  const slots: Record<string, unknown> = { label, timestamp: Date.now(), categories }
  for (const cat of categories) {
    const val = snapshotCategory(cat)
    if (val !== undefined) slots[cat] = val
  }
  undoSlot = slots as unknown as InternalUndoState
}

// ── Undo apply ────────────────────────────────────────────────────────

export function applyUndo(): { restored: string[]; errors: string[] } {
  if (!undoSlot) return { restored: [], errors: ['No undo data available.'] }

  const restored: string[] = []
  const errors: string[] = []

  const slots = undoSlot as unknown as Record<string, unknown>
  for (const cat of undoSlot.categories) {
    const val = slots[cat]
    if (val === undefined) continue
    const ok = restoreCategory(cat, val)
    if (ok) restored.push(cat)
    else errors.push(`Failed to restore ${cat}`)
  }

  if (errors.length === 0) undoSlot = null
  return { restored, errors }
}

function restoreCategory(cat: string, snapshot: unknown): boolean {
  if (snapshot === undefined) return false
  try {
    switch (cat) {
      case 'board': {
        const s = snapshot as InternalUndoState['board']
        if (!s) return false
        const classWorkspaces = normalizeClassWorkspacesGeometry(s.classWorkspaces as never)
        useBoardStore.setState({
          mode: s.mode,
          activeScreen: s.activeScreen,
          activePageId: s.activePageId ?? classWorkspaces[s.activeScreen]?.activePageId ?? null,
          classWorkspaces,
          backgroundId: s.backgroundId,
          contents: structuredClone(s.contents),
          teacherNotes: structuredClone(s.teacherNotes),
          todayPrep: structuredClone(s.todayPrep ?? { checklistItems: [], resourceLinks: [] }) as TodayPrepState,
          cardVisibility: structuredClone(s.cardVisibility),
          customPresets: structuredClone(s.customPresets),
          noiseTrackers: normalizeNoiseTrackerMap(s.noiseTrackers),
          beautifyUndo: s.beautifyUndo,
          canvasHistoryPast: [],
          canvasHistoryFuture: [],
        })
        return true
      }
      case 'timers': {
        const s = snapshot as { simpleTimers: Record<SimpleTimerScreenId, SimpleTimerState>; phaseTimer: PhaseTimerState; routineControls?: Record<string, RoutineControlState> }
        useTimerStore.setState({
          simpleTimers: structuredClone(s.simpleTimers),
          phaseTimer: structuredClone(s.phaseTimer),
          routineControls: structuredClone(s.routineControls ?? {}),
        })
        return true
      }
      case 'rosters': {
        const currentStudents = usePickerStore.getState().students
        const currentArchived = currentStudents.filter((s: Student) => !s.isActive)
        const snapActive = (snapshot as Student[]).map((s: Student) => ({ ...s, isActive: true }))
        usePickerStore.setState({ students: [...snapActive, ...currentArchived] })
        return true
      }
      case 'archivedStudents': {
        const currentStudents = usePickerStore.getState().students
        const currentActive = currentStudents.filter((s: Student) => s.isActive)
        const snapArchived = (snapshot as Student[]).map((s: Student) => ({ ...s, isActive: false }))
        usePickerStore.setState({ students: [...currentActive, ...snapArchived] })
        return true
      }
      case 'pickerHistory': {
        usePickerStore.setState({ fairnessHistory: structuredClone(snapshot as FairnessEntry[]) })
        return true
      }
      case 'coachingConfig': {
        usePickerStore.getState().updateCoachingConfig(structuredClone(snapshot as Partial<CoachingState>))
        return true
      }
      case 'pickerSettings': {
        usePickerStore.getState().updateSettings(structuredClone(snapshot as Partial<PickerSettings>))
        return true
      }
      case 'activeMysterySessions': {
        usePickerStore.setState({ activeMysterySessions: structuredClone(snapshot as Record<PickerClassId, MysterySession | null>) })
        return true
      }
      default:
        return false
    }
  } catch {
    return false
  }
}

// ── Active state check ────────────────────────────────────────────────

export interface ActiveState {
  activeTimers: string[]
  activeMysterySessions: string[]
  revealInProgress: boolean
  quickPickPending: boolean
}

export function getActiveState(): ActiveState {
  const ts = useTimerStore.getState()
  const ps = usePickerStore.getState()

  const activeTimers: string[] = []
  for (const [id, t] of Object.entries(ts.simpleTimers)) {
    if (t.status === 'running' || t.status === 'paused') activeTimers.push(`simple-timer:${id}`)
  }
  if (ts.phaseTimer.status === 'running' || ts.phaseTimer.status === 'paused') {
    activeTimers.push('phase-timer')
  }

  const activeMysterySessions: string[] = []
  for (const [classId, session] of Object.entries(ps.activeMysterySessions)) {
    if (session && (session.status === 'active' || session.status.startsWith('revealed-'))) {
      activeMysterySessions.push(classId)
    }
  }
  const revealInProgress = Object.values(ps.activeMysterySessions).some(
    (s) => s && s.status.startsWith('revealed-'),
  )

  return { activeTimers, activeMysterySessions, revealInProgress, quickPickPending: false }
}

// ── Daily Brief Apply ─────────────────────────────────────────────────

export interface DailyBriefApplyInput {
  packet: DailyBriefPacketPayload
  selectedFieldGroups: { screenId: string; groupId: string }[]
}

export interface ApplyResult {
  success: boolean
  errors: string[]
  restored?: string[]
  skipped?: string[]
  rollbackFailed?: boolean
  rollbackFailedCategories?: string[]
}

export function applyDailyBriefToStores(input: DailyBriefApplyInput): ApplyResult {
  const { packet, selectedFieldGroups } = input

  if (selectedFieldGroups.length === 0) {
    return { success: false, errors: ['No field groups selected.'] }
  }

  // Snapshot affected categories
  const affectedCats = new Set<string>(['board'])
  if (packet.coaching) affectedCats.add('coachingConfig')

  const backup: Record<string, unknown> = {}
  for (const cat of affectedCats) {
    backup[cat] = snapshotCategory(cat)
  }

  const errors: string[] = []

  try {
    // Build board content changes
    const bs = useBoardStore.getState()
    const nextContents = structuredClone(bs.contents)
    let contentsChanged = false

    for (const fg of selectedFieldGroups) {
      const sid = fg.screenId as keyof typeof nextContents
      if (!(sid in nextContents)) {
        errors.push(`Screen "${sid}" not found in board contents.`)
        continue
      }
      const sc = packet.content[fg.screenId as keyof typeof packet.content]
      if (!sc) {
        errors.push(`Screen "${sid}" has no content in packet.`)
        continue
      }

      // Convert to Record for dynamic field access
      const target = nextContents[sid] as unknown as Record<string, unknown>

      switch (fg.groupId) {
        case 'lesson':
          if (sc.lesson) { target.lesson = structuredClone(sc.lesson); contentsChanged = true }
          break
        case 'vocabulary':
          if (sc.vocabulary) { target.vocabulary = structuredClone(sc.vocabulary); contentsChanged = true }
          break
        case 'doNow':
          if (sc.doNow !== undefined) { target.doNow = sc.doNow; contentsChanged = true }
          if (sc.doNowTitle !== undefined) { target.doNowTitle = sc.doNowTitle; contentsChanged = true }
          break
        case 'reminders':
          if (sc.reminders !== undefined) { target.reminders = structuredClone(sc.reminders); contentsChanged = true }
          if (sc.remindersTitle !== undefined) { target.remindersTitle = sc.remindersTitle; contentsChanged = true }
          break
        case 'materials':
          {
            const mats = structuredClone((target.materials || {}) as { haveOut?: string[]; putAway?: string[] })
            if (sc.materialsOut !== undefined) { mats.haveOut = structuredClone(sc.materialsOut); contentsChanged = true }
            if (sc.materialsAway !== undefined) { mats.putAway = structuredClone(sc.materialsAway); contentsChanged = true }
            target.materials = mats
          }
          if (sc.materialsTitle !== undefined) { target.materialsTitle = sc.materialsTitle; contentsChanged = true }
          break
        case 'readyPosition':
          {
            const rp = structuredClone((target.readyPosition || {}) as Record<string, unknown>)
            if (sc.readyPositionSteps !== undefined) { rp.steps = structuredClone(sc.readyPositionSteps); contentsChanged = true }
            if (sc.readyPositionTitle !== undefined) { rp.title = sc.readyPositionTitle; contentsChanged = true }
            if (sc.readyPositionCompactLine !== undefined) { rp.compactLine = sc.readyPositionCompactLine; contentsChanged = true }
            target.readyPosition = rp
          }
          break
        case 'focus':
          if (sc.focusTask !== undefined) { target.focusTask = sc.focusTask; contentsChanged = true }
          if (sc.focusTitle !== undefined) { target.focusTitle = sc.focusTitle; contentsChanged = true }
          if (sc.agenda !== undefined) { target.agenda = structuredClone(sc.agenda); contentsChanged = true }
          if (sc.agendaTitle !== undefined) { target.agendaTitle = sc.agendaTitle; contentsChanged = true }
          break
        case 'smartTv':
          if (sc.smartTvReminder !== undefined) { target.smartTvReminder = sc.smartTvReminder; contentsChanged = true }
          break
        case 'voiceLevel':
          if (sc.voiceLevel !== undefined) {
            const sid = fg.screenId
            const trackerId = (['homeroom', 'math', 'reading'] as const).includes(sid as 'homeroom' | 'math' | 'reading')
              ? sid as 'homeroom' | 'math' | 'reading'
              : 'homeroom'
            useBoardStore.getState().setNoiseVoiceLevel(trackerId, sc.voiceLevel as 'silent' | 'whisper' | 'normal' | 'off')
          }
          break
      }
    }

    if (contentsChanged) {
      useBoardStore.getState().updateContents(nextContents)
    }

    // Apply coaching config
    if (packet.coaching) {
      const ps = usePickerStore.getState()
      const update: Record<string, unknown> = {}
      if (packet.coaching.stage) update.stage = packet.coaching.stage
      if (packet.coaching.visibleBehaviors) update.visibleBehaviors = structuredClone(packet.coaching.visibleBehaviors)
      if (Object.keys(update).length > 0) {
        ps.updateCoachingConfig(update as Partial<CoachingState>)
      }
    }
  } catch (e) {
    errors.push((e as Error).message)
  }

  if (errors.length > 0) {
    // Failure rollback: restore original state
    const rollbackFailedCats: string[] = []
    for (const cat of affectedCats) {
      const ok = restoreCategory(cat, backup[cat])
      if (!ok) rollbackFailedCats.push(cat)
    }
    // DO NOT clear undoSlot on failure, retain prior successful one if any
    return { success: false, errors, rollbackFailed: rollbackFailedCats.length > 0, rollbackFailedCategories: rollbackFailedCats }
  }

  // Success: create the Undo snapshot
  const slots: Record<string, unknown> = {
    label: 'Daily Brief Import',
    timestamp: Date.now(),
    categories: Array.from(affectedCats),
  }
  for (const cat of affectedCats) {
    slots[cat] = backup[cat]
  }
  undoSlot = slots as unknown as InternalUndoState

  return { success: true, errors: [], restored: Array.from(affectedCats) }
}

// ── Full Backup Restore ───────────────────────────────────────────────

export interface BackupRestoreInput {
  packet: FullBackupPacketPayload
  selectedCategories: string[]
  replaceTimerRuntime: boolean
  replaceActiveMystery: boolean
}

export function restoreBackupToStores(input: BackupRestoreInput): ApplyResult {
  const { packet, selectedCategories, replaceTimerRuntime, replaceActiveMystery } = input
  const cats = packet.categories

  // Filter for categories actually present in the packet
  const effectiveCategories = selectedCategories.filter(id => (cats as Record<string, unknown>)[id] !== undefined)
  const skipped: string[] = selectedCategories.filter(id => (cats as Record<string, unknown>)[id] === undefined)

  if (effectiveCategories.length === 0) {
    return { success: false, errors: ['No valid categories selected for restoration.'], skipped }
  }

  const catSet = new Set(effectiveCategories)
  // No longer needed to recalculate skipped here

  // Local backups for atomic rollback
  const backup: Record<string, unknown> = {}
  for (const cat of effectiveCategories) {
    backup[cat] = snapshotCategory(cat)
  }

  const errors: string[] = []

  try {
    // Board
    if (catSet.has('board') && cats.board) {
      const b = cats.board
      const next: Partial<BoardState> & { beautifyUndo: null; canvasHistoryPast: []; canvasHistoryFuture: [] } = {
        beautifyUndo: null,
        canvasHistoryPast: [],
        canvasHistoryFuture: [],
      }
      if (b.mode !== undefined) next.mode = b.mode as BoardState['mode']
      if (b.activeScreen !== undefined) next.activeScreen = b.activeScreen as BoardState['activeScreen']
      if (b.backgroundId !== undefined) next.backgroundId = b.backgroundId as BoardState['backgroundId']
      if (b.contents !== undefined) next.contents = structuredClone(b.contents as unknown as ScreenContents)
      if (b.teacherNotes !== undefined) next.teacherNotes = structuredClone(b.teacherNotes) as TeacherNote[]
      if (b.todayPrep !== undefined) next.todayPrep = structuredClone(b.todayPrep) as TodayPrepState
      if (b.cardVisibility !== undefined) next.cardVisibility = structuredClone(b.cardVisibility) as ScreenCardVisibility
      if (b.customPresets !== undefined) next.customPresets = structuredClone(b.customPresets) as CustomBoardPreset[]
      if (b.noiseTrackers !== undefined) next.noiseTrackers = normalizeNoiseTrackerMap(b.noiseTrackers as never)
      if (b.classWorkspaces !== undefined) {
        const classWorkspaces = normalizeClassWorkspacesGeometry(b.classWorkspaces as never)
        next.classWorkspaces = classWorkspaces
        next.activePageId =
          (b.activePageId as BoardState['activePageId'] | undefined) ??
          classWorkspaces[(next.activeScreen ?? useBoardStore.getState().activeScreen) as ScreenId]?.activePageId ??
          null
      } else if (b.activePageId !== undefined) {
        next.activePageId = b.activePageId as BoardState['activePageId']
      }
      useBoardStore.setState(next)
    }

    // Timers — merge config without replacing runtime unless confirmed
    if (catSet.has('timers') && cats.timers) {
      const current = useTimerStore.getState() // Read current at apply time
      const incoming = cats.timers as {
        simpleTimers?: Partial<Record<SimpleTimerScreenId, SimpleTimerState>>
        phaseTimer?: Partial<PhaseTimerState>
      }
      const mergedSimple = structuredClone(current.simpleTimers)

      if (incoming.simpleTimers) {
        for (const [id, ts] of Object.entries(incoming.simpleTimers) as [SimpleTimerScreenId, SimpleTimerState][]) {
          const existing = mergedSimple[id]
          const isRuntimeProtected = existing && (existing.status === 'running' || existing.status === 'paused') && !replaceTimerRuntime

          if (isRuntimeProtected) {
            // Preserve running state — only update config fields
            mergedSimple[id] = { ...existing, ...ts, status: existing.status, remainingMs: existing.remainingMs, endsAt: existing.endsAt }
          } else {
            mergedSimple[id] = structuredClone(ts)
          }
        }
      }

      let mergedPhase = structuredClone(current.phaseTimer)
      if (incoming.phaseTimer) {
        const ip = incoming.phaseTimer
        const isRuntimeProtected = (mergedPhase.status === 'running' || mergedPhase.status === 'paused') && !replaceTimerRuntime

        if (isRuntimeProtected) {
          mergedPhase = {
            ...mergedPhase,
            title: ip.title ?? mergedPhase.title,
            phases: ip.phases?.length ? structuredClone(ip.phases) : mergedPhase.phases,
            appearance: ip.appearance ?? mergedPhase.appearance,
            chimeEnabled: ip.chimeEnabled ?? mergedPhase.chimeEnabled,
          }
        } else {
          mergedPhase = {
            ...mergedPhase,
            ...ip,
            phases: ip.phases?.length ? structuredClone(ip.phases) : mergedPhase.phases,
          }
        }
      }

      useTimerStore.setState({ simpleTimers: mergedSimple, phaseTimer: mergedPhase })
    }

    // Rosters
    if (catSet.has('rosters') && cats.rosters) {
      const currentStudents = usePickerStore.getState().students
      const currentArchived = currentStudents.filter((s: Student) => !s.isActive)
      const snapActive = (cats.rosters as Student[]).map((s: Student) => ({ ...s, isActive: true }))
      usePickerStore.setState({ students: [...snapActive, ...currentArchived] })
    }

    // Archived Students
    if (catSet.has('archivedStudents') && cats.archivedStudents) {
      const currentStudents = usePickerStore.getState().students
      const currentActive = currentStudents.filter((s: Student) => s.isActive)
      const snapArchived = (cats.archivedStudents as Student[]).map((s: Student) => ({ ...s, isActive: false }))
      usePickerStore.setState({ students: [...currentActive, ...snapArchived] })
    }

    // Picker history — REPLACEMENT semantics
    if (catSet.has('pickerHistory') && cats.pickerHistory) {
      usePickerStore.setState({ fairnessHistory: structuredClone(cats.pickerHistory as FairnessEntry[]) })
    }

    // Coaching config
    if (catSet.has('coachingConfig') && cats.coachingConfig) {
      usePickerStore.getState().updateCoachingConfig(structuredClone(cats.coachingConfig as Partial<CoachingState>))
    }

    // Picker settings
    if (catSet.has('pickerSettings') && cats.pickerSettings) {
      usePickerStore.getState().updateSettings(structuredClone(cats.pickerSettings as Partial<PickerSettings>))
    }

    // Active Mystery Sessions
    if (catSet.has('activeMysterySessions') && cats.activeMysterySessions) {
      const current = usePickerStore.getState().activeMysterySessions // Read current at apply time
      const incoming = cats.activeMysterySessions.activeSessions as Record<PickerClassId, MysterySession | null>

      const merged = structuredClone(current)
      for (const [classId, session] of Object.entries(incoming) as [PickerClassId, MysterySession | null][]) {
        const existing = current[classId]
        const isProtected = existing && (existing.status === 'active' || existing.status.startsWith('revealed-')) && !replaceActiveMystery

        if (!isProtected) {
          merged[classId] = structuredClone(session)
        }
      }

      usePickerStore.setState({ activeMysterySessions: merged })
    }
  } catch (e) {
    errors.push((e as Error).message)
  }

  if (errors.length > 0) {
    // Failure rollback: restore original state
    const rollbackFailedCats: string[] = []
    for (const cat of effectiveCategories) {
      const ok = restoreCategory(cat, backup[cat])
      if (!ok) rollbackFailedCats.push(cat)
    }
    // DO NOT clear undoSlot on failure, retain prior successful one if any
    return { success: false, errors, rollbackFailed: rollbackFailedCats.length > 0, rollbackFailedCategories: rollbackFailedCats }
  }

  // Success: create the Undo snapshot
  const slots: Record<string, unknown> = {
    label: 'Full Backup Restore',
    timestamp: Date.now(),
    categories: effectiveCategories,
  }
  for (const cat of effectiveCategories) {
    slots[cat] = backup[cat]
  }
  undoSlot = slots as unknown as InternalUndoState

  return { success: true, errors: [], restored: effectiveCategories, skipped }
}
