export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

export type TimerPresetId = '2' | '5' | '10' | '15' | '20' | 'custom'

/** Screens that host a simple countdown TimerWidget. */
export type SimpleTimerScreenId = 'homeroom' | 'math' | 'reading'

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
}

export interface PhaseTimerRuntime {
  status: TimerStatus
  currentPhaseIndex: number
  remainingMs: number
  endsAt: number | null
}

export interface PhaseTimerState extends PhaseTimerConfig, PhaseTimerRuntime {}
