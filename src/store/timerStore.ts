import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_PHASE_TIMER,
  DEFAULT_ROUTINE_TIMERS,
  DEFAULT_SIMPLE_TIMERS,
  DEFAULT_ROUTINE_CONTROLS,
  DEFAULT_TASK_TIMER,
  DEFAULT_TIMER_DURATION_MS,
  DEFAULT_TRANSITION_TIMERS,
  TIMER_PRESETS,
} from '../data/timerDefaults'
import type {
  PhaseDefinition,
  PhaseTimerState,
  RoutineStepDefinition,
  RoutineTimerState,
  SimpleTimerScreenId,
  SimpleTimerState,
  TaskTimerState,
  TimerPresetId,
  TransitionTimerState,
} from '../data/timerTypes'
import type { RoutineControlState } from '../data/routineTypes'
import { minutesToMs } from '../lib/timerFormat'
import {
  recoverRoutine,
  recoverSimple,
  recoverTask,
  recoverTransition,
} from './timerRecovery'
import {
  advanceRoutineControlToNextPhase,
  buildManualRoutineControl,
  buildPausedRoutineControl,
  getRoutineTimeline,
  restartRoutineControl,
} from '../lib/routineEngine'
import { normalizeRoutineControlState } from '../data/routineSchedule'

const ONE_MINUTE_MS = 60_000

interface TimerStore {
  simpleTimers: Record<SimpleTimerScreenId, SimpleTimerState>
  phaseTimer: PhaseTimerState
  transitionTimers: Record<string, TransitionTimerState>
  taskTimers: Record<string, TaskTimerState>
  routineTimers: Record<string, RoutineTimerState>
  routineControls: Record<string, RoutineControlState>

  setSimpleLabel: (screenId: SimpleTimerScreenId, label: string) => void
  setSimplePreset: (
    screenId: SimpleTimerScreenId,
    presetId: TimerPresetId,
  ) => void
  setSimpleCustomMinutes: (
    screenId: SimpleTimerScreenId,
    minutes: number,
  ) => void
  setSimpleAppearance: (
    screenId: SimpleTimerScreenId,
    appearance: 'calm' | 'bold' | 'minimal',
  ) => void
  setSimpleChimeEnabled: (
    screenId: SimpleTimerScreenId,
    enabled: boolean,
  ) => void
  startSimple: (screenId: SimpleTimerScreenId) => void
  pauseSimple: (screenId: SimpleTimerScreenId) => void
  resumeSimple: (screenId: SimpleTimerScreenId) => void
  resetSimple: (screenId: SimpleTimerScreenId) => void
  addMinuteSimple: (screenId: SimpleTimerScreenId) => void
  subtractMinuteSimple: (screenId: SimpleTimerScreenId) => void
  /** Recompute remaining from endsAt; call on tick / hydrate. */
  syncSimple: (screenId: SimpleTimerScreenId) => void

  setPhaseTitle: (title: string) => void
  setPhaseAppearance: (
    appearance: 'calm' | 'bold' | 'minimal',
  ) => void
  setPhaseChimeEnabled: (
    enabled: boolean,
  ) => void
  updatePhase: (phaseId: string, patch: Partial<PhaseDefinition>) => void
  startPhase: () => void
  pausePhase: () => void
  resumePhase: () => void
  resetPhase: () => void
  syncPhase: () => void

  setTransitionLabel: (pageId: string, label: string) => void
  setTransitionDuration: (pageId: string, minutes: number) => void
  startTransition: (pageId: string) => void
  pauseTransition: (pageId: string) => void
  resumeTransition: (pageId: string) => void
  resetTransition: (pageId: string) => void
  syncTransition: (pageId: string) => void

  setTaskTitle: (taskId: string, title: string) => void
  setTaskGroups: (taskId: string, groups: string[]) => void
  setTaskAutoAdvance: (taskId: string, autoAdvance: boolean) => void
  startTask: (taskId: string) => void
  pauseTask: (taskId: string) => void
  resumeTask: (taskId: string) => void
  resetTask: (taskId: string) => void
  nextGroupTask: (taskId: string) => void
  syncTask: (taskId: string) => void

  setRoutineTitle: (routineId: string, title: string) => void
  setRoutineAutoAdvance: (routineId: string, autoAdvance: boolean) => void
  setRoutineChimeBetweenSteps: (routineId: string, enabled: boolean) => void
  updateRoutineStep: (routineId: string, stepId: string, patch: Partial<RoutineStepDefinition>) => void
  startRoutine: (routineId: string) => void
  pauseRoutineTimer: (routineId: string) => void
  resumeRoutineTimer: (routineId: string) => void
  resetRoutineTimer: (routineId: string) => void
  syncRoutineTimer: (routineId: string) => void

  pauseRoutine: (scheduleId: string) => void
  resumeRoutine: (scheduleId: string) => void
  skipRoutinePhase: (scheduleId: string) => void
  restartRoutinePhase: (scheduleId: string) => void
  setRoutineManualOverride: (scheduleId: string, phaseId: string) => void
  clearRoutineControl: (scheduleId: string) => void
  resetAllTimers: () => void
}

function clampDurationMs(ms: number): number {
  return Math.max(0, Math.min(ms, 99 * 60 * 1000))
}

function resolvePresetDurationMs(presetId: TimerPresetId): number | null {
  const preset = TIMER_PRESETS.find((item) => item.id === presetId)
  if (!preset || preset.minutes === null) return null
  return minutesToMs(preset.minutes)
}

function ensureTransitionTimer(
  timers: Record<string, TransitionTimerState>,
  pageId: string,
): TransitionTimerState {
  return timers[pageId] ?? {
    label: 'Transition',
    presetId: '5',
    durationMs: DEFAULT_TIMER_DURATION_MS,
    status: 'idle',
    remainingMs: DEFAULT_TIMER_DURATION_MS,
    endsAt: null,
    appearance: 'calm',
    chimeEnabled: false,
  }
}

function ensureTaskTimer(
  timers: Record<string, TaskTimerState>,
  taskId: string,
): TaskTimerState {
  return timers[taskId] ?? structuredClone(DEFAULT_TASK_TIMER)
}

function ensureRoutineTimer(
  timers: Record<string, RoutineTimerState>,
  routineId: string,
): RoutineTimerState {
  return timers[routineId] ?? structuredClone(
    DEFAULT_ROUTINE_TIMERS[routineId] ?? {
      title: 'Routine',
      steps: [{ id: 'step-1', label: 'Step 1', durationMinutes: 2 }],
      autoAdvance: true,
      chimeBetweenSteps: false,
      status: 'idle',
      currentStepIndex: 0,
      remainingMs: 2 * 60 * 1000,
      endsAt: null,
      appearance: 'calm',
    },
  )
}

function routineStepDurationMs(timer: RoutineTimerState, index: number): number {
  const step = timer.steps[index]
  if (!step) return 0
  return minutesToMs(step.durationMinutes)
}

function recoverPhase(timer: PhaseTimerState, now = Date.now()): PhaseTimerState {
  if (timer.phases.length === 0) {
    return {
      ...timer,
      status: 'finished',
      currentPhaseIndex: 0,
      remainingMs: 0,
      endsAt: null,
    }
  }

  const status = timer.status
  let currentPhaseIndex = Math.min(
    Math.max(0, timer.currentPhaseIndex),
    timer.phases.length - 1,
  )
  let remainingMs = Math.max(0, timer.remainingMs)
  let endsAt = timer.endsAt

  if (status === 'running' && endsAt !== null) {
    // Signed remaining preserves overrun so multi-phase skips stay accurate.
    let signedRemaining = endsAt - now

    while (signedRemaining <= 0) {
      const nextIndex = currentPhaseIndex + 1
      if (nextIndex >= timer.phases.length) {
        return {
          ...timer,
          status: 'finished',
          currentPhaseIndex: timer.phases.length - 1,
          remainingMs: 0,
          endsAt: null,
        }
      }

      const overrun = -signedRemaining
      currentPhaseIndex = nextIndex
      const nextDuration = minutesToMs(timer.phases[nextIndex].durationMinutes)
      signedRemaining = nextDuration - overrun
    }

    remainingMs = Math.max(0, signedRemaining)
    endsAt = now + remainingMs
  }

  if (status === 'running' && remainingMs <= 0) {
    return {
      ...timer,
      status: 'finished',
      currentPhaseIndex: timer.phases.length - 1,
      remainingMs: 0,
      endsAt: null,
    }
  }

  return {
    ...timer,
    status,
    currentPhaseIndex,
    remainingMs,
    endsAt: status === 'running' ? endsAt : null,
  }
}

function phaseDurationMs(timer: PhaseTimerState, index: number): number {
  const phase = timer.phases[index]
  if (!phase) return 0
  return minutesToMs(phase.durationMinutes)
}

export const useTimerStore = create<TimerStore>()(
  persist(
    (set) => ({
      simpleTimers: structuredClone(DEFAULT_SIMPLE_TIMERS),
      phaseTimer: structuredClone(DEFAULT_PHASE_TIMER),
      transitionTimers: structuredClone(DEFAULT_TRANSITION_TIMERS),
      taskTimers: { 'bathroom-water': structuredClone(DEFAULT_TASK_TIMER) } as Record<string, TaskTimerState>,
      routineTimers: structuredClone(DEFAULT_ROUTINE_TIMERS),
      routineControls: structuredClone(DEFAULT_ROUTINE_CONTROLS),

      setSimpleLabel: (screenId, label) =>
        set((state) => ({
          simpleTimers: {
            ...state.simpleTimers,
            [screenId]: { ...state.simpleTimers[screenId], label },
          },
        })),

      setSimplePreset: (screenId, presetId) =>
        set((state) => {
          const current = state.simpleTimers[screenId]
          const presetMs = resolvePresetDurationMs(presetId)
          const durationMs =
            presetMs ??
            (current.presetId === 'custom'
              ? current.durationMs
              : DEFAULT_TIMER_DURATION_MS)

          return {
            simpleTimers: {
              ...state.simpleTimers,
              [screenId]: {
                ...current,
                presetId,
                durationMs: clampDurationMs(durationMs),
                status: 'idle',
                remainingMs: clampDurationMs(durationMs),
                endsAt: null,
              },
            },
          }
        }),

      setSimpleCustomMinutes: (screenId, minutes) =>
        set((state) => {
          const durationMs = clampDurationMs(minutesToMs(minutes))
          const current = state.simpleTimers[screenId]
          return {
            simpleTimers: {
              ...state.simpleTimers,
              [screenId]: {
                ...current,
                presetId: 'custom',
                durationMs,
                status: 'idle',
                remainingMs: durationMs,
                endsAt: null,
              },
            },
          }
        }),

      setSimpleAppearance: (screenId, appearance) =>
        set((state) => ({
          simpleTimers: {
            ...state.simpleTimers,
            [screenId]: {
              ...state.simpleTimers[screenId],
              appearance,
            },
          },
        })),

      setSimpleChimeEnabled: (screenId, chimeEnabled) =>
        set((state) => ({
          simpleTimers: {
            ...state.simpleTimers,
            [screenId]: {
              ...state.simpleTimers[screenId],
              chimeEnabled,
            },
          },
        })),

      startSimple: (screenId) =>
        set((state) => {
          const current = state.simpleTimers[screenId]
          const remainingMs =
            current.status === 'finished' || current.remainingMs <= 0
              ? current.durationMs
              : current.remainingMs
          const now = Date.now()
          return {
            simpleTimers: {
              ...state.simpleTimers,
              [screenId]: {
                ...current,
                status: 'running',
                remainingMs,
                endsAt: now + remainingMs,
              },
            },
          }
        }),

      pauseSimple: (screenId) =>
        set((state) => {
          const current = recoverSimple(state.simpleTimers[screenId])
          if (current.status !== 'running') return state
          return {
            simpleTimers: {
              ...state.simpleTimers,
              [screenId]: {
                ...current,
                status: 'paused',
                endsAt: null,
              },
            },
          }
        }),

      resumeSimple: (screenId) =>
        set((state) => {
          const current = state.simpleTimers[screenId]
          if (current.status !== 'paused' || current.remainingMs <= 0) {
            return state
          }
          const now = Date.now()
          return {
            simpleTimers: {
              ...state.simpleTimers,
              [screenId]: {
                ...current,
                status: 'running',
                endsAt: now + current.remainingMs,
              },
            },
          }
        }),

      resetSimple: (screenId) =>
        set((state) => {
          const current = state.simpleTimers[screenId]
          return {
            simpleTimers: {
              ...state.simpleTimers,
              [screenId]: {
                ...current,
                status: 'idle',
                remainingMs: current.durationMs,
                endsAt: null,
              },
            },
          }
        }),

      addMinuteSimple: (screenId) =>
        set((state) => {
          const current = recoverSimple(state.simpleTimers[screenId])
          const nextRemaining = clampDurationMs(current.remainingMs + ONE_MINUTE_MS)
          const nextDuration =
            current.status === 'idle'
              ? clampDurationMs(current.durationMs + ONE_MINUTE_MS)
              : current.durationMs

          return {
            simpleTimers: {
              ...state.simpleTimers,
              [screenId]: {
                ...current,
                durationMs: nextDuration,
                remainingMs: nextRemaining,
                status:
                  current.status === 'finished' ? 'paused' : current.status,
                endsAt:
                  current.status === 'running'
                    ? Date.now() + nextRemaining
                    : null,
                presetId:
                  current.status === 'idle' ? 'custom' : current.presetId,
              },
            },
          }
        }),

      subtractMinuteSimple: (screenId) =>
        set((state) => {
          const current = recoverSimple(state.simpleTimers[screenId])
          const nextRemaining = Math.max(0, current.remainingMs - ONE_MINUTE_MS)
          const nextDuration =
            current.status === 'idle'
              ? Math.max(0, current.durationMs - ONE_MINUTE_MS)
              : current.durationMs

          if (nextRemaining <= 0 && current.status === 'running') {
            return {
              simpleTimers: {
                ...state.simpleTimers,
                [screenId]: {
                  ...current,
                  remainingMs: 0,
                  status: 'finished',
                  endsAt: null,
                },
              },
            }
          }

          return {
            simpleTimers: {
              ...state.simpleTimers,
              [screenId]: {
                ...current,
                durationMs: nextDuration,
                remainingMs: nextRemaining,
                endsAt:
                  current.status === 'running'
                    ? Date.now() + nextRemaining
                    : null,
                presetId:
                  current.status === 'idle' ? 'custom' : current.presetId,
              },
            },
          }
        }),

      syncSimple: (screenId) =>
        set((state) => {
          const recovered = recoverSimple(state.simpleTimers[screenId])
          const current = state.simpleTimers[screenId]
          if (
            recovered.status === current.status &&
            recovered.remainingMs === current.remainingMs &&
            recovered.endsAt === current.endsAt
          ) {
            return state
          }
          return {
            simpleTimers: {
              ...state.simpleTimers,
              [screenId]: recovered,
            },
          }
        }),

      setPhaseTitle: (title) =>
        set((state) => ({
          phaseTimer: { ...state.phaseTimer, title },
        })),

      setPhaseAppearance: (appearance) =>
        set((state) => ({
          phaseTimer: { ...state.phaseTimer, appearance },
        })),

      setPhaseChimeEnabled: (chimeEnabled) =>
        set((state) => ({
          phaseTimer: { ...state.phaseTimer, chimeEnabled },
        })),

      updatePhase: (phaseId, patch) =>
        set((state) => {
          const phases = state.phaseTimer.phases.map((phase) =>
            phase.id === phaseId ? { ...phase, ...patch } : phase,
          )
          const current = state.phaseTimer
          const editedIndex = phases.findIndex((phase) => phase.id === phaseId)
          const isEditingCurrent = editedIndex === current.currentPhaseIndex
          const active = phases[current.currentPhaseIndex]

          let remainingMs = current.remainingMs
          let endsAt = current.endsAt
          let status = current.status

          if (
            isEditingCurrent &&
            active &&
            patch.durationMinutes !== undefined &&
            current.status !== 'running'
          ) {
            remainingMs = minutesToMs(active.durationMinutes)
            endsAt = null
            if (current.status === 'finished') {
              status = 'idle'
              // Safe reset: editing after complete returns to idle on that phase.
            }
          }

          return {
            phaseTimer: {
              ...current,
              phases,
              remainingMs,
              endsAt,
              status,
            },
          }
        }),

      startPhase: () =>
        set((state) => {
          const current = state.phaseTimer
          if (current.phases.length === 0) return state

          let index = current.currentPhaseIndex
          let remainingMs = current.remainingMs

          if (current.status === 'finished') {
            index = 0
            remainingMs = phaseDurationMs(current, 0)
          } else if (current.status === 'idle' || remainingMs <= 0) {
            remainingMs = phaseDurationMs(current, index)
          }

          const now = Date.now()
          return {
            phaseTimer: {
              ...current,
              status: 'running',
              currentPhaseIndex: index,
              remainingMs,
              endsAt: now + remainingMs,
            },
          }
        }),

      pausePhase: () =>
        set((state) => {
          const current = recoverPhase(state.phaseTimer)
          if (current.status !== 'running') return state
          return {
            phaseTimer: {
              ...current,
              status: 'paused',
              endsAt: null,
            },
          }
        }),

      resumePhase: () =>
        set((state) => {
          const current = state.phaseTimer
          if (current.status !== 'paused' || current.remainingMs <= 0) {
            return state
          }
          return {
            phaseTimer: {
              ...current,
              status: 'running',
              endsAt: Date.now() + current.remainingMs,
            },
          }
        }),

      resetPhase: () =>
        set((state) => {
          const current = state.phaseTimer
          const firstDuration = phaseDurationMs(current, 0)
          return {
            phaseTimer: {
              ...current,
              status: 'idle',
              currentPhaseIndex: 0,
              remainingMs: firstDuration,
              endsAt: null,
            },
          }
        }),

      syncPhase: () =>
        set((state) => {
          const recovered = recoverPhase(state.phaseTimer)
          const current = state.phaseTimer

          if (
            recovered.status === current.status &&
            recovered.remainingMs === current.remainingMs &&
            recovered.endsAt === current.endsAt &&
            recovered.currentPhaseIndex === current.currentPhaseIndex
          ) {
            return state
          }

          return { phaseTimer: recovered }
        }),

      setTransitionLabel: (pageId, label) =>
        set((state) => {
          const current = ensureTransitionTimer(state.transitionTimers, pageId)
          return {
            transitionTimers: {
              ...state.transitionTimers,
              [pageId]: { ...current, label },
            },
          }
        }),

      setTransitionDuration: (pageId, minutes) =>
        set((state) => {
          const current = ensureTransitionTimer(state.transitionTimers, pageId)
          const durationMs = clampDurationMs(minutesToMs(minutes))
          return {
            transitionTimers: {
              ...state.transitionTimers,
              [pageId]: {
                ...current,
                presetId: 'custom',
                durationMs,
                status: 'idle',
                remainingMs: durationMs,
                endsAt: null,
              },
            },
          }
        }),

      startTransition: (pageId) =>
        set((state) => {
          const current = ensureTransitionTimer(state.transitionTimers, pageId)
          const remainingMs =
            current.status === 'finished' || current.remainingMs <= 0
              ? current.durationMs
              : current.remainingMs
          const now = Date.now()
          return {
            transitionTimers: {
              ...state.transitionTimers,
              [pageId]: {
                ...current,
                status: 'running',
                remainingMs,
                endsAt: now + remainingMs,
              },
            },
          }
        }),

      pauseTransition: (pageId) =>
        set((state) => {
          const current = recoverTransition(
            ensureTransitionTimer(state.transitionTimers, pageId),
          )
          if (current.status !== 'running') return state
          return {
            transitionTimers: {
              ...state.transitionTimers,
              [pageId]: { ...current, status: 'paused', endsAt: null },
            },
          }
        }),

      resumeTransition: (pageId) =>
        set((state) => {
          const current = ensureTransitionTimer(state.transitionTimers, pageId)
          if (current.status !== 'paused' || current.remainingMs <= 0) return state
          const now = Date.now()
          return {
            transitionTimers: {
              ...state.transitionTimers,
              [pageId]: {
                ...current,
                status: 'running',
                endsAt: now + current.remainingMs,
              },
            },
          }
        }),

      resetTransition: (pageId) =>
        set((state) => {
          const current = ensureTransitionTimer(state.transitionTimers, pageId)
          return {
            transitionTimers: {
              ...state.transitionTimers,
              [pageId]: {
                ...current,
                status: 'idle',
                remainingMs: current.durationMs,
                endsAt: null,
              },
            },
          }
        }),

      syncTransition: (pageId) =>
        set((state) => {
          const current = ensureTransitionTimer(state.transitionTimers, pageId)
          const recovered = recoverTransition(current)
          if (
            recovered.status === current.status &&
            recovered.remainingMs === current.remainingMs &&
            recovered.endsAt === current.endsAt
          ) {
            return state
          }
          return {
            transitionTimers: {
              ...state.transitionTimers,
              [pageId]: recovered,
            },
          }
        }),

      setTaskTitle: (taskId, title) =>
        set((state) => {
          const current = ensureTaskTimer(state.taskTimers, taskId)
          return {
            taskTimers: {
              ...state.taskTimers,
              [taskId]: { ...current, title },
            },
          }
        }),

      setTaskGroups: (taskId, groups) =>
        set((state) => {
          const current = ensureTaskTimer(state.taskTimers, taskId)
          return {
            taskTimers: {
              ...state.taskTimers,
              [taskId]: {
                ...current,
                groups,
                currentGroupIndex: Math.min(current.currentGroupIndex, Math.max(0, groups.length - 1)),
              },
            },
          }
        }),

      setTaskAutoAdvance: (taskId, autoAdvance) =>
        set((state) => {
          const current = ensureTaskTimer(state.taskTimers, taskId)
          return {
            taskTimers: {
              ...state.taskTimers,
              [taskId]: { ...current, autoAdvance },
            },
          }
        }),

      startTask: (taskId) =>
        set((state) => {
          const current = ensureTaskTimer(state.taskTimers, taskId)
          if (current.groups.length === 0) return state
          const remainingMs =
            current.status === 'finished' || current.remainingMs <= 0
              ? current.durationPerGroupMs
              : current.remainingMs
          const now = Date.now()
          return {
            taskTimers: {
              ...state.taskTimers,
              [taskId]: {
                ...current,
                status: 'running',
                remainingMs,
                endsAt: now + remainingMs,
              },
            },
          }
        }),

      pauseTask: (taskId) =>
        set((state) => {
          const current = recoverTask(ensureTaskTimer(state.taskTimers, taskId))
          if (current.status !== 'running') return state
          return {
            taskTimers: {
              ...state.taskTimers,
              [taskId]: { ...current, status: 'paused', endsAt: null },
            },
          }
        }),

      resumeTask: (taskId) =>
        set((state) => {
          const current = ensureTaskTimer(state.taskTimers, taskId)
          if (current.status !== 'paused' || current.remainingMs <= 0) return state
          const now = Date.now()
          return {
            taskTimers: {
              ...state.taskTimers,
              [taskId]: {
                ...current,
                status: 'running',
                endsAt: now + current.remainingMs,
              },
            },
          }
        }),

      resetTask: (taskId) =>
        set((state) => {
          const current = ensureTaskTimer(state.taskTimers, taskId)
          return {
            taskTimers: {
              ...state.taskTimers,
              [taskId]: {
                ...current,
                status: 'idle',
                currentGroupIndex: 0,
                remainingMs: current.durationPerGroupMs,
                endsAt: null,
              },
            },
          }
        }),

      nextGroupTask: (taskId) =>
        set((state) => {
          const current = ensureTaskTimer(state.taskTimers, taskId)
          if (current.groups.length === 0) return state
          const nextIndex = current.currentGroupIndex + 1
          if (nextIndex >= current.groups.length) {
            return {
              taskTimers: {
                ...state.taskTimers,
                [taskId]: {
                  ...current,
                  status: 'finished',
                  currentGroupIndex: current.groups.length - 1,
                  remainingMs: 0,
                  endsAt: null,
                },
              },
            }
          }
          const now = Date.now()
          const remainingMs = current.durationPerGroupMs
          return {
            taskTimers: {
              ...state.taskTimers,
              [taskId]: {
                ...current,
                status: 'running',
                currentGroupIndex: nextIndex,
                remainingMs,
                endsAt: now + remainingMs,
              },
            },
          }
        }),

      syncTask: (taskId) =>
        set((state) => {
          const current = ensureTaskTimer(state.taskTimers, taskId)
          const recovered = recoverTask(current)
          if (
            recovered.status === current.status &&
            recovered.remainingMs === current.remainingMs &&
            recovered.endsAt === current.endsAt &&
            recovered.currentGroupIndex === current.currentGroupIndex
          ) {
            return state
          }
          return {
            taskTimers: {
              ...state.taskTimers,
              [taskId]: recovered,
            },
          }
        }),

      setRoutineTitle: (routineId, title) =>
        set((state) => {
          const current = ensureRoutineTimer(state.routineTimers, routineId)
          return {
            routineTimers: {
              ...state.routineTimers,
              [routineId]: { ...current, title },
            },
          }
        }),

      setRoutineAutoAdvance: (routineId, autoAdvance) =>
        set((state) => {
          const current = ensureRoutineTimer(state.routineTimers, routineId)
          return {
            routineTimers: {
              ...state.routineTimers,
              [routineId]: { ...current, autoAdvance },
            },
          }
        }),

      setRoutineChimeBetweenSteps: (routineId, enabled) =>
        set((state) => {
          const current = ensureRoutineTimer(state.routineTimers, routineId)
          return {
            routineTimers: {
              ...state.routineTimers,
              [routineId]: { ...current, chimeBetweenSteps: enabled },
            },
          }
        }),

      updateRoutineStep: (routineId, stepId, patch) =>
        set((state) => {
          const current = ensureRoutineTimer(state.routineTimers, routineId)
          const steps = current.steps.map((step) =>
            step.id === stepId ? { ...step, ...patch } : step,
          )
          return {
            routineTimers: {
              ...state.routineTimers,
              [routineId]: { ...current, steps },
            },
          }
        }),

      startRoutine: (routineId) =>
        set((state) => {
          const current = ensureRoutineTimer(state.routineTimers, routineId)
          if (current.steps.length === 0) return state
          let index = current.currentStepIndex
          let remainingMs = current.remainingMs
          if (current.status === 'finished') {
            index = 0
            remainingMs = routineStepDurationMs(current, 0)
          } else if (current.status === 'idle' || remainingMs <= 0) {
            remainingMs = routineStepDurationMs(current, index)
          }
          const now = Date.now()
          return {
            routineTimers: {
              ...state.routineTimers,
              [routineId]: {
                ...current,
                status: 'running',
                currentStepIndex: index,
                remainingMs,
                endsAt: now + remainingMs,
              },
            },
          }
        }),

      pauseRoutineTimer: (routineId) =>
        set((state) => {
          const current = recoverRoutine(ensureRoutineTimer(state.routineTimers, routineId))
          if (current.status !== 'running') return state
          return {
            routineTimers: {
              ...state.routineTimers,
              [routineId]: { ...current, status: 'paused', endsAt: null },
            },
          }
        }),

      resumeRoutineTimer: (routineId) =>
        set((state) => {
          const current = ensureRoutineTimer(state.routineTimers, routineId)
          if (current.status !== 'paused' || current.remainingMs <= 0) return state
          return {
            routineTimers: {
              ...state.routineTimers,
              [routineId]: {
                ...current,
                status: 'running',
                endsAt: Date.now() + current.remainingMs,
              },
            },
          }
        }),

      resetRoutineTimer: (routineId) =>
        set((state) => {
          const current = ensureRoutineTimer(state.routineTimers, routineId)
          return {
            routineTimers: {
              ...state.routineTimers,
              [routineId]: {
                ...current,
                status: 'idle',
                currentStepIndex: 0,
                remainingMs: routineStepDurationMs(current, 0),
                endsAt: null,
              },
            },
          }
        }),

      syncRoutineTimer: (routineId) =>
        set((state) => {
          const current = ensureRoutineTimer(state.routineTimers, routineId)
          const recovered = recoverRoutine(current)
          if (
            recovered.status === current.status &&
            recovered.remainingMs === current.remainingMs &&
            recovered.endsAt === current.endsAt &&
            recovered.currentStepIndex === current.currentStepIndex
          ) {
            return state
          }
          return {
            routineTimers: {
              ...state.routineTimers,
              [routineId]: recovered,
            },
          }
        }),

      pauseRoutine: (scheduleId) =>
        set((state) => {
          const timeline = getRoutineTimeline(scheduleId, new Date(), state.routineControls)
          if (!timeline.phase) return state
          const paused = buildPausedRoutineControl(scheduleId, state.routineControls)
          if (!paused) return state
          return {
            routineControls: {
              ...state.routineControls,
              [scheduleId]: paused,
            },
          }
        }),

      resumeRoutine: (scheduleId) =>
        set((state) => {
          const current = state.routineControls[scheduleId]
          if (!current || current.mode !== 'paused' || !current.phaseId) {
            return state
          }
          const schedule = buildManualRoutineControl(scheduleId, current.phaseId, state.routineControls)
          if (!schedule) return state
          return {
            routineControls: {
              ...state.routineControls,
              [scheduleId]: {
                ...schedule,
                remainingMs: current.remainingMs ?? schedule.remainingMs,
                endsAt: Date.now() + (current.remainingMs ?? schedule.remainingMs ?? 0),
              },
            },
          }
        }),

      skipRoutinePhase: (scheduleId) =>
        set((state) => {
          const next = advanceRoutineControlToNextPhase(scheduleId, state.routineControls)
          if (!next) return state
          return {
            routineControls: {
              ...state.routineControls,
              [scheduleId]: next,
            },
          }
        }),

      restartRoutinePhase: (scheduleId) =>
        set((state) => {
          const restarted = restartRoutineControl(scheduleId, state.routineControls)
          if (!restarted) return state
          return {
            routineControls: {
              ...state.routineControls,
              [scheduleId]: restarted,
            },
          }
        }),

      setRoutineManualOverride: (scheduleId, phaseId) =>
        set((state) => {
          const manual = buildManualRoutineControl(scheduleId, phaseId, state.routineControls)
          if (!manual) return state
          return {
            routineControls: {
              ...state.routineControls,
              [scheduleId]: manual,
            },
          }
        }),

      clearRoutineControl: (scheduleId) =>
        set((state) => ({
          routineControls: {
            ...state.routineControls,
            [scheduleId]: {
              mode: 'auto',
              dateKey: null,
              phaseId: null,
            },
          },
        })),

      resetAllTimers: () =>
        set({
          simpleTimers: structuredClone(DEFAULT_SIMPLE_TIMERS),
          phaseTimer: structuredClone(DEFAULT_PHASE_TIMER),
          transitionTimers: structuredClone(DEFAULT_TRANSITION_TIMERS),
          taskTimers: { 'bathroom-water': structuredClone(DEFAULT_TASK_TIMER) } as Record<string, TaskTimerState>,
          routineTimers: structuredClone(DEFAULT_ROUTINE_TIMERS),
          routineControls: structuredClone(DEFAULT_ROUTINE_CONTROLS),
        }),
    }),
    {
      name: 'classroom-command-center-timers',
      version: 2,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<TimerStore>
        const normalizedRoutineControls = state.routineControls
          ? Object.fromEntries(
              Object.entries(state.routineControls)
                .filter(([, control]) => control !== undefined)
                .map(([scheduleId, control]) => [
                  scheduleId,
                  normalizeRoutineControlState(control as RoutineControlState) ?? control,
                ]),
            )
          : undefined
        const base = {
          simpleTimers: state.simpleTimers
            ? {
                ...structuredClone(DEFAULT_SIMPLE_TIMERS),
                ...state.simpleTimers,
              }
            : structuredClone(DEFAULT_SIMPLE_TIMERS),
          phaseTimer: state.phaseTimer
            ? {
                ...structuredClone(DEFAULT_PHASE_TIMER),
                ...state.phaseTimer,
                phases:
                  state.phaseTimer.phases?.length
                    ? state.phaseTimer.phases
                    : structuredClone(DEFAULT_PHASE_TIMER.phases),
              }
            : structuredClone(DEFAULT_PHASE_TIMER),
          transitionTimers: {
            ...structuredClone(DEFAULT_TRANSITION_TIMERS),
            ...(state.transitionTimers ?? {}),
          },
          taskTimers: {
            'bathroom-water': structuredClone(DEFAULT_TASK_TIMER),
            ...(state.taskTimers ?? {}),
          },
          routineTimers: {
            ...structuredClone(DEFAULT_ROUTINE_TIMERS),
            ...(state.routineTimers ?? {}),
          },
          routineControls: normalizedRoutineControls
            ? {
                ...structuredClone(DEFAULT_ROUTINE_CONTROLS),
                ...normalizedRoutineControls,
              }
            : structuredClone(DEFAULT_ROUTINE_CONTROLS),
        }
        if (version < 2) {
          return base
        }
        return base
      },
      merge: (persisted, current) => {
        const raw = (persisted ?? {}) as Partial<TimerStore>
        const simpleTimers = {
          ...current.simpleTimers,
          ...(raw.simpleTimers ?? {}),
        } as Record<SimpleTimerScreenId, SimpleTimerState>

        const recoveredSimple = Object.fromEntries(
          (Object.keys(simpleTimers) as SimpleTimerScreenId[]).map((id) => [
            id,
            recoverSimple(simpleTimers[id]),
          ]),
        ) as Record<SimpleTimerScreenId, SimpleTimerState>

        const phaseTimer = recoverPhase({
          ...current.phaseTimer,
          ...(raw.phaseTimer ?? {}),
          phases:
            raw.phaseTimer?.phases?.length
              ? raw.phaseTimer.phases
              : current.phaseTimer.phases,
        })

        const transitionTimers = {
          ...current.transitionTimers,
          ...(raw.transitionTimers ?? {}),
        }
        const recoveredTransitionTimers = Object.fromEntries(
          Object.entries(transitionTimers).map(([pageId, timer]) => [
            pageId,
            recoverTransition(timer as TransitionTimerState),
          ]),
        ) as Record<string, TransitionTimerState>

        const taskTimers = {
          ...current.taskTimers,
          ...(raw.taskTimers ?? {}),
        }
        const recoveredTaskTimers = Object.fromEntries(
          Object.entries(taskTimers).map(([taskId, timer]) => [
            taskId,
            recoverTask(timer as TaskTimerState),
          ]),
        ) as Record<string, TaskTimerState>

        const routineTimers = {
          ...current.routineTimers,
          ...(raw.routineTimers ?? {}),
        }
        const recoveredRoutineTimers = Object.fromEntries(
          Object.entries(routineTimers).map(([routineId, timer]) => [
            routineId,
            recoverRoutine(timer as RoutineTimerState),
          ]),
        ) as Record<string, RoutineTimerState>

        const routineControls = {
          ...current.routineControls,
          ...(raw.routineControls ?? {}),
        } as Record<string, RoutineControlState>

        const recoveredRoutineControls = Object.fromEntries(
          Object.entries(routineControls).map(([scheduleId, control]) => [
            scheduleId,
            normalizeRoutineControlState(control) ?? control,
          ]),
        ) as Record<string, RoutineControlState>

        return {
          ...current,
          simpleTimers: recoveredSimple,
          phaseTimer,
          transitionTimers: recoveredTransitionTimers,
          taskTimers: recoveredTaskTimers,
          routineTimers: recoveredRoutineTimers,
          routineControls: recoveredRoutineControls,
        }
      },
      partialize: (state) => ({
        simpleTimers: state.simpleTimers,
        phaseTimer: state.phaseTimer,
        transitionTimers: state.transitionTimers,
        taskTimers: state.taskTimers,
        routineTimers: state.routineTimers,
        routineControls: state.routineControls,
      }),
    },
  ),
)

export {
  ensureTransitionTimer,
  ensureTaskTimer,
  ensureRoutineTimer,
}
