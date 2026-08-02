export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

export type TimerPresetId = '2' | '5' | '10' | '15' | '20' | 'custom'

/** Screens that host a simple countdown TimerWidget. */
export type SimpleTimerScreenId = 'homeroom' | 'math' | 'reading' | 'spelling'

export interface TimerPreset {
  id: TimerPresetId
  label: string
  /** Duration in minutes; null means teacher enters a custom value. */
  minutes: number | null
}

export interface SimpleTimerConfig {
  label: string
  presetId: TimerPresetId
  /** Selected / custom duration in milliseconds. */
  durationMs: number
  appearance?: 'calm' | 'bold' | 'minimal'
  chimeEnabled?: boolean
}

export interface SimpleTimerRuntime {
  status: TimerStatus
  remainingMs: number
  /** Wall-clock end time while running; null when not running. */
  endsAt: number | null
}

export interface SimpleTimerState extends SimpleTimerConfig, SimpleTimerRuntime {}

export type PhaseStyleToken =
  | 'calm'
  | 'focus'
  | 'cleanup'
  | 'transition'
  | 'default'

export interface PhaseDefinition {
  id: string
  label: string
  durationMinutes: number
  instructions: string
  styleToken: PhaseStyleToken
}

export interface PhaseTimerConfig {
  title: string
  phases: PhaseDefinition[]
  appearance?: 'calm' | 'bold' | 'minimal'
  chimeEnabled?: boolean
}

export interface PhaseTimerRuntime {
  status: TimerStatus
  currentPhaseIndex: number
  remainingMs: number
  endsAt: number | null
}

export interface PhaseTimerState extends PhaseTimerConfig, PhaseTimerRuntime {}

/** Per-page transition countdown (e.g. Math → Snack and Shurley). Keyed by VibePageId. */
export interface TransitionTimerConfig {
  label: string
  presetId: TimerPresetId
  durationMs: number
  appearance?: 'calm' | 'bold' | 'minimal'
  chimeEnabled?: boolean
}

export interface TransitionTimerState
  extends TransitionTimerConfig,
    SimpleTimerRuntime {}

/** Group rotation timer (e.g. Bathroom & Water). Keyed by task id. */
export interface TaskTimerConfig {
  title: string
  groups: string[]
  durationPerGroupMs: number
  autoAdvance: boolean
  appearance?: 'calm' | 'bold' | 'minimal'
  chimeEnabled?: boolean
}

export interface TaskTimerRuntime {
  status: TimerStatus
  currentGroupIndex: number
  remainingMs: number
  endsAt: number | null
}

export interface TaskTimerState extends TaskTimerConfig, TaskTimerRuntime {}

export interface RoutineStepDefinition {
  id: string
  label: string
  durationMinutes: number
  instructions?: string
  styleToken?: PhaseStyleToken
}

/** Auto-run step sequence (e.g. Lunch Routine). Keyed by routine id. */
export interface RoutineTimerConfig {
  title: string
  steps: RoutineStepDefinition[]
  autoAdvance: boolean
  chimeBetweenSteps: boolean
  appearance?: 'calm' | 'bold' | 'minimal'
}

export interface RoutineTimerRuntime {
  status: TimerStatus
  currentStepIndex: number
  remainingMs: number
  endsAt: number | null
}

export interface RoutineTimerState extends RoutineTimerConfig, RoutineTimerRuntime {}
