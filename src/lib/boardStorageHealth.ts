import type { BoardExportPayload, BoardState } from '../data/types'
import { SCREEN_META } from '../data/defaults'

export const BOARD_STORAGE_KEY = 'classroom-command-center-lite'
export const BOARD_STORAGE_VERSION = 5

export interface BoardStorageHealth {
  storageKey: string
  storageVersion: number
  persistedBytes: number
  persistedKb: string
  customPresetCount: number
  teacherNoteCount: number
  screenCount: number
  activeScreen: string
  hasPersistedState: boolean
}

export interface BoardExportSummary {
  exportedAt: string
  activeScreen: string
  customPresetCount: number
  teacherNoteCount: number
  screenCount: number
}

export function getBoardStorageHealth(state: BoardState): BoardStorageHealth {
  const persisted = window.localStorage.getItem(BOARD_STORAGE_KEY) ?? ''
  const persistedBytes = new Blob([persisted]).size

  return {
    storageKey: BOARD_STORAGE_KEY,
    storageVersion: BOARD_STORAGE_VERSION,
    persistedBytes,
    persistedKb: `${(persistedBytes / 1024).toFixed(1)} KB`,
    customPresetCount: state.customPresets.length,
    teacherNoteCount: state.teacherNotes.length,
    screenCount: SCREEN_META.length,
    activeScreen: state.activeScreen,
    hasPersistedState: persisted.length > 0,
  }
}

export function summarizeBoardExport(
  payload: BoardExportPayload,
): BoardExportSummary {
  return {
    exportedAt: payload.exportedAt,
    activeScreen: payload.state.activeScreen,
    customPresetCount: payload.state.customPresets.length,
    teacherNoteCount: payload.state.teacherNotes.length,
    screenCount: SCREEN_META.length,
  }
}
