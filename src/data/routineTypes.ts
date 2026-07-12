import type { ScreenId, VibePageId } from './types'

export const ROUTINE_WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const

export type RoutineWeekday = (typeof ROUTINE_WEEKDAYS)[number]

export type ClassVibeId = ScreenId

export type FocusedPageId = VibePageId

export interface RoutineSuggestion {
  label: string
  screenId?: ScreenId
  pageId?: FocusedPageId
}

export interface RoutinePhaseDefinition {
  id: string
  label: string
  instructions?: string[]
  startTime: string
  endTime: string
  weekdays?: RoutineWeekday[]
  enabled: boolean
  transitionChime?: boolean
  pageId?: FocusedPageId
  nextPageSuggestion?: RoutineSuggestion
}

export interface RoutineSchedule {
  id: string
  classVibeId: ClassVibeId
  pageId: FocusedPageId
  label: string
  enabled: boolean
  weekdays: RoutineWeekday[]
  phases: RoutinePhaseDefinition[]
}

export interface DailyBlockDefinition {
  id: string
  label: string
  startTime: string
  endTime: string
  weekdays?: RoutineWeekday[]
  enabled: boolean
  screenId?: ScreenId
  nextScreenId?: ScreenId
  pageSuggestion?: RoutineSuggestion
}

export interface RoutinePhaseState extends RoutinePhaseDefinition {
  dateKey: string
  startsAt: number
  endsAt: number
  remainingMs: number
  isActive: boolean
  isPaused: boolean
  isManualOverride: boolean
}

export interface DailyBlockState extends DailyBlockDefinition {
  dateKey: string
  startsAt: number
  endsAt: number
  remainingMs: number
}

export interface BlockRoutineWindow {
  id: string
  blockId: string
  label: string
  startTime: string
  endTime: string
  instructions: string[]
  enabled: boolean
  suggestion?: RoutineSuggestion
}

export interface RoutineControlState {
  mode: 'auto' | 'paused' | 'manual'
  dateKey: string | null
  phaseId: string | null
  phaseLabel?: string
  remainingMs?: number
  endsAt?: number | null
  pageId?: FocusedPageId
  suggestion?: RoutineSuggestion
}
