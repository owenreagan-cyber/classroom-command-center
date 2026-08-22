import type {
  BoardPage,
  BoardScene,
  BoardState,
  SavedLayout,
} from '../types'
import {
  BOARD_SCHEMA_VERSION,
  parseBoardStateJson,
  sanitizeSavedLayout,
  serializeBoardState,
} from './boardSerialization'
import { migrateBoardState } from './boardMigrations'

/**
 * DB-4A — board persistence (localStorage only).
 *
 * Namespaced under `clean-board.board.*` (mirroring `clean-board.spotify.*`).
 * Two keys:
 *   - `state`     → the named layouts + scenes library (`BoardState`)
 *   - `autosave`  → the current active page, debounce-written so the display
 *                   survives refresh.
 *
 * Pure CRUD helpers operate on a `BoardState` (no DOM) so they are unit-tested
 * without a browser; the load/save functions are thin localStorage adapters
 * with graceful recovery from corruption.
 */

const STORAGE_PREFIX = 'clean-board.board.'
const KEY_STATE = `${STORAGE_PREFIX}state`
const KEY_AUTOSAVE = `${STORAGE_PREFIX}autosave`

function getStore(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

// ── pure CRUD (no DOM) ──

/** Snapshot a page into a persisted `SavedLayout` (used by save + autosave). */
export function layoutFromPage(page: BoardPage, name: string): SavedLayout {
  const now = Date.now()
  return {
    schemaVersion: BOARD_SCHEMA_VERSION,
    id: `layout-${now}`,
    name,
    kind: 'layout',
    background: page.background,
    objects: page.objects,
    displayMode: 'default',
    createdAt: now,
    updatedAt: now,
  }
}

function stamp(state: BoardState): BoardState {
  return { ...state, updatedAt: Date.now() }
}

/** Insert or replace a layout (matched by id). */
export function saveLayout(state: BoardState, layout: SavedLayout): BoardState {
  const existing = state.layouts.some((l) => l.id === layout.id)
  return stamp({
    ...state,
    layouts: existing
      ? state.layouts.map((l) => (l.id === layout.id ? layout : l))
      : [...state.layouts, layout],
  })
}

export function renameLayout(state: BoardState, id: string, name: string): BoardState {
  const trimmed = name.trim()
  if (!trimmed) return state
  return stamp({
    ...state,
    layouts: state.layouts.map((l) => (l.id === id ? { ...l, name: trimmed, updatedAt: Date.now() } : l)),
  })
}

/** Delete a layout and any scenes that reference it. */
export function deleteLayout(state: BoardState, id: string): BoardState {
  return stamp({
    ...state,
    layouts: state.layouts.filter((l) => l.id !== id),
    scenes: state.scenes.filter((s) => s.layoutId !== id),
    ...(state.activeLayoutId === id ? { activeLayoutId: null } : {}),
  })
}

/** Insert or replace a scene (matched by id). */
export function saveScene(state: BoardState, scene: BoardScene): BoardState {
  const existing = state.scenes.some((s) => s.id === scene.id)
  return stamp({
    ...state,
    scenes: existing
      ? state.scenes.map((s) => (s.id === scene.id ? scene : s))
      : [...state.scenes, scene],
  })
}

export function deleteScene(state: BoardState, id: string): BoardState {
  return stamp({
    ...state,
    scenes: state.scenes.filter((s) => s.id !== id),
    ...(state.activeSceneId === id ? { activeSceneId: null } : {}),
  })
}

export function setActiveLayout(state: BoardState, id: string | null): BoardState {
  return stamp({ ...state, activeLayoutId: id })
}

export function setActiveScene(state: BoardState, id: string | null): BoardState {
  return stamp({ ...state, activeSceneId: id })
}

// ── localStorage adapters ──

function readKey(key: string): string | null {
  return getStore()?.getItem(key) ?? null
}

function writeKey(key: string, value: string): void {
  getStore()?.setItem(key, value)
}

function removeKey(key: string): void {
  getStore()?.removeItem(key)
}

/** Load the layouts/scenes library; null on corruption/missing (caller falls back). */
export function loadPersistedBoardState(): BoardState | null {
  const raw = readKey(KEY_STATE)
  if (!raw) return null
  return migrateBoardState(parseBoardStateJson(raw))
}

export function persistBoardState(state: BoardState): void {
  writeKey(KEY_STATE, serializeBoardState(state))
}

export function clearPersistedBoardState(): void {
  removeKey(KEY_STATE)
}

// ── autosave (current page) ──

/** A reserved, filtered-from-list layout id used only for the autosave slot. */
export const AUTOSAVE_LAYOUT_ID = '__autosave__'

/** Load the autosaved current page; null on corruption/missing. */
export function loadAutosaveLayout(): SavedLayout | null {
  const raw = readKey(KEY_AUTOSAVE)
  if (!raw) return null
  const parsed = parseBoardStateJson(raw)
  return parsed ? sanitizeSavedLayout(parsed) : null
}

export function saveAutosaveLayout(layout: SavedLayout): void {
  const normalized: SavedLayout = { ...layout, schemaVersion: BOARD_SCHEMA_VERSION, id: AUTOSAVE_LAYOUT_ID }
  writeKey(KEY_AUTOSAVE, JSON.stringify(normalized))
}

export function clearAutosaveLayout(): void {
  removeKey(KEY_AUTOSAVE)
}
