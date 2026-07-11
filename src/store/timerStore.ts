import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DEFAULT_PHASE_TIMER,
  DEFAULT_SIMPLE_TIMERS,
  DEFAULT_TIMER_DURATION_MS,
  TIMER_PRESETS,
} from '../data/timerDefaults'
import type {
  PhaseDefinition,
  PhaseTimerState,
  SimpleTimerScreenId,
  SimpleTimerState,
  TimerPresetId,
} from '../data/timerTypes'
import { minutesToMs, remainingFromEndsAt } from '../lib/timerFormat'

const ONE_MINUTE_MS = 60_000

interface TimerStore {
  simpleTimers: Record<SimpleTimerScreenId, SimpleTimerState>
  phaseTimer: PhaseTimerState

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

function recoverSimple(timer: SimpleTimerState, now = Date.now()): SimpleTimerState {
  if (timer.status !== 'running' || timer.endsAt === null) {
    return {
      ...timer,
      remainingMs: Math.max(0, timer.remainingMs),
      endsAt: timer.status === 'running' ? timer.endsAt : null,
    }
  }

  const remainingMs = remainingFromEndsAt(timer.endsAt, now)
  if (remainingMs <= 0) {
    return {
      ...timer,
      status: 'finished',
      remainingMs: 0,
      endsAt: null,
    }
  }

  return {
    ...timer,
    remainingMs,
  }
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

      resetAllTimers: () =>
        set({
          simpleTimers: structuredClone(DEFAULT_SIMPLE_TIMERS),
          phaseTimer: structuredClone(DEFAULT_PHASE_TIMER),
        }),
    }),
    {
      name: 'classroom-command-center-timers',
      version: 1,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<TimerStore>
        return {
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
        }
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

        return {
          ...current,
          simpleTimers: recoveredSimple,
          phaseTimer,
        }
      },
      partialize: (state) => ({
        simpleTimers: state.simpleTimers,
        phaseTimer: state.phaseTimer,
      }),
    },
  ),
)
