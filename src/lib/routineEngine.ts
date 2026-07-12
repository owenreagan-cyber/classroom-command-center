import type {
  BlockRoutineWindow,
  DailyBlockDefinition,
  DailyBlockState,
  RoutineControlState,
  RoutinePhaseDefinition,
  RoutinePhaseState,
  RoutineSchedule,
  RoutineSuggestion,
} from '../data/routineTypes'
import {
  CANONICAL_DAILY_BLOCKS,
  getDateTimeForMinutes,
  getDayKey,
  getRoutineScheduleById,
  isWeekdayEnabled,
  makeDailyBlockState,
  makeManualRoutineControl,
  phaseDurationMs,
  normalizeRoutineSuggestion,
  BLOCK_ROUTINE_WINDOWS,
  timeToMinutes,
} from '../data/routineSchedule'

export interface RoutineTimeline {
  schedule: RoutineSchedule | null
  phase: RoutinePhaseState | null
  nextPhase: RoutinePhaseState | null
  status: 'idle' | 'active' | 'paused' | 'manual' | 'finished'
  suggestion?: RoutineSuggestion
}

export interface DailyBlockTimeline {
  currentBlock: DailyBlockState | null
  nextBlock: DailyBlockState | null
}

export interface BlockRoutineTimeline {
  currentWindow: (BlockRoutineWindow & { startsAt: number; endsAt: number; remainingMs: number; dateKey: string }) | null
  nextWindow: (BlockRoutineWindow & { startsAt: number; endsAt: number; remainingMs: number; dateKey: string }) | null
}

function buildPhaseState(phase: RoutinePhaseDefinition, now: Date): RoutinePhaseState {
  const startsAt = getDateTimeForMinutes(now, timeToMinutes(phase.startTime))
  const endsAt = getDateTimeForMinutes(now, timeToMinutes(phase.endTime))
  return {
    ...phase,
    dateKey: getDayKey(now),
    startsAt,
    endsAt,
    remainingMs: Math.max(0, endsAt - now.getTime()),
    isActive: false,
    isPaused: false,
    isManualOverride: false,
  }
}

export function getDailyBlockTimeline(
  now = new Date(),
  blocks: DailyBlockDefinition[] = CANONICAL_DAILY_BLOCKS,
): DailyBlockTimeline {
  const eligible = blocks.filter(
    (block) => block.enabled && isWeekdayEnabled(block.weekdays, now),
  )

  const states = eligible.map((block) => makeDailyBlockState(block, now))
  const currentBlock = states.find((block) => now.getTime() >= block.startsAt && now.getTime() < block.endsAt) ?? null
  const nextBlock =
    states.find((block) => block.startsAt > now.getTime()) ??
    null

  return { currentBlock, nextBlock }
}

export function getRoutineTimeline(
  scheduleId: string,
  now = new Date(),
  controls?: Record<string, RoutineControlState>,
): RoutineTimeline {
  const schedule = getRoutineScheduleById(scheduleId)
  if (!schedule || !schedule.enabled || !isWeekdayEnabled(schedule.weekdays, now)) {
    return { schedule: null, phase: null, nextPhase: null, status: 'idle' }
  }

  const control = controls?.[scheduleId]
  const todayKey = getDayKey(now)
  const activePhases = schedule.phases.filter(
    (phase) => phase.enabled && isWeekdayEnabled(phase.weekdays, now),
  )

  const nextPhase = activePhases
    .map((phase) => buildPhaseState(phase, now))
    .find((phase) => phase.startsAt > now.getTime()) ?? null

  if (control?.dateKey === todayKey && control.mode === 'paused' && control.phaseId) {
    const pausedPhase = activePhases.find((phase) => phase.id === control.phaseId)
    if (pausedPhase) {
      const pausedState = buildPhaseState(pausedPhase, now)
      return {
        schedule,
        phase: {
          ...pausedState,
          remainingMs: Math.max(0, control.remainingMs ?? pausedState.remainingMs),
          endsAt: now.getTime() + Math.max(0, control.remainingMs ?? pausedState.remainingMs),
          isActive: true,
          isPaused: true,
          isManualOverride: true,
        },
        nextPhase,
        status: 'paused',
        suggestion: normalizeRoutineSuggestion(control.suggestion) ?? normalizeRoutineSuggestion(pausedPhase.nextPageSuggestion),
      }
    }
  }

  if (control?.dateKey === todayKey && control.mode === 'manual' && control.phaseId) {
    const manualPhase = activePhases.find((phase) => phase.id === control.phaseId)
    if (manualPhase) {
      const manualState = buildPhaseState(manualPhase, now)
      const remainingMs = Math.max(0, control.remainingMs ?? manualState.remainingMs)
      return {
        schedule,
        phase: {
          ...manualState,
          remainingMs,
          endsAt: control.endsAt ?? now.getTime() + remainingMs,
          isActive: true,
          isPaused: false,
          isManualOverride: true,
        },
        nextPhase,
        status: 'manual',
        suggestion: normalizeRoutineSuggestion(control.suggestion) ?? normalizeRoutineSuggestion(manualPhase.nextPageSuggestion),
      }
    }
  }

  const current = activePhases
    .map((phase) => buildPhaseState(phase, now))
    .find((phase) => now.getTime() >= phase.startsAt && now.getTime() < phase.endsAt) ?? null

  if (current) {
    return {
      schedule,
      phase: {
        ...current,
        remainingMs: Math.max(0, current.endsAt - now.getTime()),
        isActive: true,
      },
      nextPhase,
      status: 'active',
      suggestion: normalizeRoutineSuggestion(current.nextPageSuggestion),
    }
  }

  const lastPhase = activePhases[activePhases.length - 1]
  if (lastPhase && now.getTime() >= buildPhaseState(lastPhase, now).endsAt) {
    return {
      schedule,
      phase: null,
      nextPhase,
      status: 'finished',
      suggestion: normalizeRoutineSuggestion(lastPhase.nextPageSuggestion),
    }
  }

  return {
    schedule,
    phase: null,
    nextPhase,
    status: 'idle',
  }
}

export function getCurrentDailyBlockLabel(
  now = new Date(),
  blocks: DailyBlockDefinition[] = CANONICAL_DAILY_BLOCKS,
): string | null {
  return getDailyBlockTimeline(now, blocks).currentBlock?.label ?? null
}

export function getBlockRoutineTimeline(
  blockId: string,
  now = new Date(),
): BlockRoutineTimeline {
  const windows = BLOCK_ROUTINE_WINDOWS.filter((window) => window.enabled && window.blockId === blockId)
  const currentWindow =
    windows
      .map((window) => {
        const startsAt = getDateTimeForMinutes(now, timeToMinutes(window.startTime))
        const endsAt = getDateTimeForMinutes(now, timeToMinutes(window.endTime))
        return {
          ...window,
          dateKey: getDayKey(now),
          startsAt,
          endsAt,
          remainingMs: Math.max(0, endsAt - now.getTime()),
        }
      })
      .find((window) => now.getTime() >= window.startsAt && now.getTime() < window.endsAt) ?? null

  const nextWindow =
    windows
      .map((window) => {
        const startsAt = getDateTimeForMinutes(now, timeToMinutes(window.startTime))
        const endsAt = getDateTimeForMinutes(now, timeToMinutes(window.endTime))
        return {
          ...window,
          dateKey: getDayKey(now),
          startsAt,
          endsAt,
          remainingMs: Math.max(0, endsAt - now.getTime()),
        }
      })
      .find((window) => window.startsAt > now.getTime()) ?? null

  return { currentWindow, nextWindow }
}

export function getNextDailyBlockLabel(
  now = new Date(),
  blocks: DailyBlockDefinition[] = CANONICAL_DAILY_BLOCKS,
): string | null {
  return getDailyBlockTimeline(now, blocks).nextBlock?.label ?? null
}

export function buildPausedRoutineControl(
  scheduleId: string,
  controls: Record<string, RoutineControlState> | undefined,
  now = new Date(),
): RoutineControlState | null {
  const schedule = getRoutineScheduleById(scheduleId)
  if (!schedule) return null
  const timeline = getRoutineTimeline(scheduleId, now, controls)
  if (!timeline.phase) return null

  return {
    mode: 'paused',
    dateKey: getDayKey(now),
    phaseId: timeline.phase.id,
    phaseLabel: timeline.phase.label,
    remainingMs: timeline.phase.remainingMs,
    endsAt: now.getTime() + timeline.phase.remainingMs,
    pageId: timeline.phase.pageId,
    suggestion: normalizeRoutineSuggestion(timeline.suggestion),
  }
}

export function buildManualRoutineControl(
  scheduleId: string,
  phaseId: string,
  _controls: Record<string, RoutineControlState> | undefined,
  now = new Date(),
): RoutineControlState | null {
  const schedule = getRoutineScheduleById(scheduleId)
  if (!schedule) return null
  const phase = schedule.phases.find((item) => item.id === phaseId)
  if (!phase) return null
  return makeManualRoutineControl(phase, now)
}

export function advanceRoutineControlToNextPhase(
  scheduleId: string,
  controls: Record<string, RoutineControlState> | undefined,
  now = new Date(),
): RoutineControlState | null {
  const timeline = getRoutineTimeline(scheduleId, now, controls)
  if (!timeline.schedule || !timeline.phase) return null
  const currentStartMinutes = timeToMinutes(timeline.phase.startTime)
  const next = timeline.schedule.phases.find(
    (phase) => timeToMinutes(phase.startTime) > currentStartMinutes,
  )
  if (!next) return null
  const nextState = buildPhaseState(next, now)
  return {
    mode: 'manual',
    dateKey: getDayKey(now),
    phaseId: nextState.id,
    phaseLabel: nextState.label,
    remainingMs: nextState.remainingMs,
    endsAt: nextState.endsAt,
    pageId: nextState.pageId,
    suggestion: normalizeRoutineSuggestion(nextState.nextPageSuggestion),
  }
}

export function restartRoutineControl(
  scheduleId: string,
  controls: Record<string, RoutineControlState> | undefined,
  now = new Date(),
): RoutineControlState | null {
  const timeline = getRoutineTimeline(scheduleId, now, controls)
  if (!timeline.schedule || !timeline.phase) return null
  const restarted = buildPhaseState(timeline.phase, now)
  return {
    mode: 'manual',
    dateKey: getDayKey(now),
    phaseId: restarted.id,
    phaseLabel: restarted.label,
    remainingMs: phaseDurationMs(restarted),
    endsAt: now.getTime() + phaseDurationMs(restarted),
    pageId: restarted.pageId,
    suggestion: normalizeRoutineSuggestion(restarted.nextPageSuggestion),
  }
}
