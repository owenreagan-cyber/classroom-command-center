import type { TimerConfig, TimerPresetId, TimerTone } from './types'
import { sanitizePlainText } from './messageCards'

/**
 * DB-4D — Classroom timer presets.
 *
 * A small, fixed set of teacher-friendly classroom routines. Each preset is
 * pure data (a semantic id, a label, a duration in whole minutes, and a visual
 * tone). The catalog is the single source of truth for the "Add Timer" default,
 * the preset selector, and sanitization.
 */

export const TIMER_PRESET_IDS: readonly TimerPresetId[] = [
  'morningWork',
  'mathSprint',
  'independentWork',
  'readingStamina',
  'cleanup',
  'transition',
  'exitTicket',
  'brainBreak',
  'partnerTalk',
  'quietWriting',
  'custom',
]

export const TIMER_TONES: readonly TimerTone[] = [
  'neutral',
  'calm',
  'focus',
  'urgent',
  'success',
]

export interface TimerPresetConfig {
  presetId: TimerPresetId
  label: string
  durationMinutes: number
  tone: TimerTone
}

/** Classroom-safe maximum timer duration in minutes. */
export const TIMER_MAX_MINUTES = 120

export const TIMER_PRESETS: Record<TimerPresetId, TimerPresetConfig> = {
  morningWork: { presetId: 'morningWork', label: 'Morning Work', durationMinutes: 10, tone: 'calm' },
  mathSprint: { presetId: 'mathSprint', label: 'Math Sprint', durationMinutes: 5, tone: 'focus' },
  independentWork: { presetId: 'independentWork', label: 'Independent Work', durationMinutes: 20, tone: 'focus' },
  readingStamina: { presetId: 'readingStamina', label: 'Reading Stamina', durationMinutes: 15, tone: 'calm' },
  cleanup: { presetId: 'cleanup', label: 'Cleanup', durationMinutes: 3, tone: 'urgent' },
  transition: { presetId: 'transition', label: 'Transition', durationMinutes: 2, tone: 'neutral' },
  exitTicket: { presetId: 'exitTicket', label: 'Exit Ticket', durationMinutes: 5, tone: 'urgent' },
  brainBreak: { presetId: 'brainBreak', label: 'Brain Break', durationMinutes: 3, tone: 'calm' },
  partnerTalk: { presetId: 'partnerTalk', label: 'Partner Talk', durationMinutes: 2, tone: 'neutral' },
  quietWriting: { presetId: 'quietWriting', label: 'Quiet Writing', durationMinutes: 12, tone: 'calm' },
  custom: { presetId: 'custom', label: 'Custom', durationMinutes: 5, tone: 'neutral' },
}

/** Default routine used by the "Add Timer" button. */
export const DEFAULT_TIMER_PRESET_ID: TimerPresetId = 'morningWork'

export function isTimerPresetId(v: unknown): v is TimerPresetId {
  return typeof v === 'string' && (TIMER_PRESET_IDS as readonly string[]).includes(v)
}

export function isTimerTone(v: unknown): v is TimerTone {
  return typeof v === 'string' && (TIMER_TONES as readonly string[]).includes(v)
}

/** Catalog lookup; an unknown id recovers to the default preset. */
export function getTimerPreset(id: TimerPresetId): TimerPresetConfig {
  return TIMER_PRESETS[id] ?? TIMER_PRESETS[DEFAULT_TIMER_PRESET_ID]
}

/** Unknown preset ids recover to the custom bucket (data-preserving). */
export function sanitizeTimerPresetId(v: unknown): TimerPresetId {
  return isTimerPresetId(v) ? v : 'custom'
}

/**
 * Clamp a duration (in minutes) to classroom-safe bounds. Non-numeric or
 * non-positive values recover to the default preset duration; over-long values
 * are capped at `TIMER_MAX_MINUTES`.
 */
export function clampTimerMinutes(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) {
    return TIMER_PRESETS[DEFAULT_TIMER_PRESET_ID].durationMinutes
  }
  return Math.min(Math.round(v), TIMER_MAX_MINUTES)
}

/** Format whole minutes as `M:SS` (e.g. 10 → "10:00"). */
export function formatTimerDuration(minutes: number): string {
  const whole = Math.max(0, Math.floor(minutes))
  const seconds = Math.round((minutes - whole) * 60)
  return `${whole}:${String(seconds).padStart(2, '0')}`
}

/** Build a full timer config from a preset. */
export function timerConfigFromPreset(presetId: TimerPresetId): TimerConfig {
  const preset = getTimerPreset(presetId)
  return {
    kind: 'timer',
    presetId: preset.presetId,
    title: preset.label,
    durationMinutes: preset.durationMinutes,
    tone: preset.tone,
    label: formatTimerDuration(preset.durationMinutes),
  }
}

/** The timer created by "Add Timer". */
export function defaultTimerConfig(): TimerConfig {
  return timerConfigFromPreset(DEFAULT_TIMER_PRESET_ID)
}

/**
 * Whitelist-validate a timer config. Unknown/private keys are dropped, invalid
 * enums/durations recover to safe defaults, and `label` is re-derived from the
 * sanitized duration. A single bad record can never reject a layout or leak
 * private data.
 */
export function sanitizeTimerConfig(raw: unknown): TimerConfig {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  const presetId = sanitizeTimerPresetId(r.presetId)
  const durationMinutes = clampTimerMinutes(r.durationMinutes)
  const titleRaw = typeof r.title === 'string' ? sanitizePlainText(r.title, 120) : ''
  const title = titleRaw.length > 0 ? titleRaw : getTimerPreset(presetId).label
  const tone = isTimerTone(r.tone) ? r.tone : getTimerPreset(presetId).tone
  return {
    kind: 'timer',
    presetId,
    title,
    durationMinutes,
    tone,
    label: formatTimerDuration(durationMinutes),
  }
}
