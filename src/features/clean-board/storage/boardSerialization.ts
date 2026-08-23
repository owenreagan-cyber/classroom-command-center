import { BOARD_OBJECT_KINDS } from '../types'
import { DEFAULT_BACKGROUND, isBackgroundPresetId, isReadabilityOverlay } from '../backgrounds'
import { DEFAULT_THEME, getTheme, isBoardThemeId } from '../themes'
import { sanitizeMessageCardConfig } from '../messageCards'
import { sanitizeTimerConfig } from '../timerPresets'
import type {
  BoardBackground,
  BoardObject,
  BoardObjectConfig,
  BoardObjectKind,
  BoardScene,
  BoardState,
  BoardTheme,
  DisplayMode,
  ReadabilityOverlay,
  SavedLayout,
  SceneType,
} from '../types'

/**
 * DB-4A — board serialization + validation (pure, no DOM).
 *
 * The single place where board content is converted to/from JSON and
 * whitelist-validated. Every persisted record is sanitized so tokens, secrets,
 * and unknown keys never enter board state. All functions are side-effect free.
 */

export const BOARD_SCHEMA_VERSION = 1

/** Keys that must never be persisted into board state. */
const FORBIDDEN_PERSIST_KEYS = [
  'accessToken',
  'refreshToken',
  'clientSecret',
  'token',
  'secret',
  'authorization',
  'email',
  'accountId',
  'deviceId',
  'userId',
] as const

const DISPLAY_MODES: readonly DisplayMode[] = ['default', 'focus', 'calm', 'transition']
const SCENE_TYPES: readonly SceneType[] = [
  'arrival',
  'math',
  'reading',
  'transition',
  'packUp',
  'custom',
]

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isStr(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function isBool(v: unknown): v is boolean {
  return typeof v === 'boolean'
}

// ── background / theme ──

function sanitizeOverlay(raw: unknown): ReadabilityOverlay | undefined {
  return isReadabilityOverlay(raw) ? raw : undefined
}

/**
 * Whitelist-validate a background. Never null: an invalid or unknown value
 * (including a removed `image`/`wallpaper` shape, remote URLs, or blobs)
 * recovers to the default preset so a single bad record can't reject a layout.
 */
export function sanitizeBackground(raw: unknown): BoardBackground {
  if (!isRecord(raw)) return DEFAULT_BACKGROUND
  const overlay = sanitizeOverlay(raw.readabilityOverlay)
  const type = raw.type
  if (type === 'gradient') {
    if (!isStr(raw.from) || !isStr(raw.to)) return DEFAULT_BACKGROUND
    return {
      type: 'gradient',
      from: raw.from,
      to: raw.to,
      ...(isNum(raw.angleDeg) ? { angleDeg: raw.angleDeg } : {}),
      ...(overlay ? { readabilityOverlay: overlay } : {}),
    }
  }
  if (type === 'solid') {
    if (!isStr(raw.color)) return DEFAULT_BACKGROUND
    return { type: 'solid', color: raw.color, ...(overlay ? { readabilityOverlay: overlay } : {}) }
  }
  if (type === 'preset') {
    if (!isBackgroundPresetId(raw.presetId)) return DEFAULT_BACKGROUND
    return {
      type: 'preset',
      presetId: raw.presetId,
      ...(overlay ? { readabilityOverlay: overlay } : {}),
    }
  }
  return DEFAULT_BACKGROUND
}

/**
 * Whitelist-validate a theme by id. Unknown ids recover to the default; the
 * returned object is always the fixed catalog entry, so unknown/private keys
 * can never enter board state.
 */
export function sanitizeTheme(raw: unknown): BoardTheme {
  if (isRecord(raw) && isBoardThemeId(raw.id)) return getTheme(raw.id)
  return DEFAULT_THEME
}

// ── object config (whitelist per kind) ──

function sanitizeConfig(kind: BoardObjectKind, raw: unknown): BoardObjectConfig | null {
  if (!isRecord(raw)) return null
  switch (kind) {
    case 'text':
      return isStr(raw.text) && isNum(raw.fontSize) && isStr(raw.color)
        ? {
            kind,
            text: raw.text,
            fontSize: raw.fontSize,
            color: raw.color,
            align: raw.align === 'right' || raw.align === 'left' ? raw.align : 'center',
          }
        : null
    case 'image':
      return {
        kind,
        src: isStr(raw.src) ? raw.src : '',
        alt: isStr(raw.alt) ? raw.alt : '',
        fit: raw.fit === 'contain' || raw.fit === 'fill' ? raw.fit : 'cover',
      }
    case 'link':
      return isStr(raw.url) && isStr(raw.label)
        ? { kind, url: raw.url, label: raw.label }
        : null
    case 'videoEmbed':
      return isStr(raw.src) && isStr(raw.label)
        ? { kind, src: raw.src, label: raw.label }
        : null
    case 'clock':
      return {
        kind,
        format: raw.format === '24h' ? '24h' : '12h',
        label: isStr(raw.label) ? raw.label : '8:00',
      }
    case 'timer':
      return sanitizeTimerConfig(raw)
    case 'spotifyNowPlayingPlaceholder':
      return { kind, label: isStr(raw.label) ? raw.label : 'Now Playing' }
    case 'messageCard':
      return sanitizeMessageCardConfig(raw)
    default:
      return null
  }
}

function sanitizeBoardObject(raw: unknown): BoardObject | null {
  if (!isRecord(raw)) return null
  const kind = raw.kind
  if (typeof kind !== 'string' || !(BOARD_OBJECT_KINDS as readonly string[]).includes(kind)) {
    return null
  }
  if (!isStr(raw.id)) return null
  const config = sanitizeConfig(kind as BoardObjectKind, raw.config)
  if (!config) return null
  return {
    id: raw.id,
    kind: kind as BoardObjectKind,
    x: isNum(raw.x) ? raw.x : 0,
    y: isNum(raw.y) ? raw.y : 0,
    w: isNum(raw.w) ? raw.w : 100,
    h: isNum(raw.h) ? raw.h : 100,
    rotation: isNum(raw.rotation) ? raw.rotation : 0,
    locked: isBool(raw.locked) ? raw.locked : false,
    visible: isBool(raw.visible) ? raw.visible : true,
    layer: isNum(raw.layer) ? raw.layer : 1,
    config,
  }
}

function sanitizeObjects(raw: unknown): BoardObject[] | null {
  if (!Array.isArray(raw)) return null
  const out: BoardObject[] = []
  for (const item of raw) {
    const obj = sanitizeBoardObject(item)
    if (!obj) return null
    out.push(obj)
  }
  return out
}

// ── saved layout ──

export function sanitizeSavedLayout(raw: unknown): SavedLayout | null {
  if (!isRecord(raw)) return null
  if (!isStr(raw.id) || !isStr(raw.name)) return null
  const background = sanitizeBackground(raw.background)
  const objects = sanitizeObjects(raw.objects)
  if (!objects) return null
  const displayMode = DISPLAY_MODES.includes(raw.displayMode as DisplayMode)
    ? (raw.displayMode as DisplayMode)
    : 'default'
  return {
    schemaVersion: BOARD_SCHEMA_VERSION,
    id: raw.id,
    name: raw.name,
    kind: 'layout',
    background,
    theme: sanitizeTheme(raw.theme),
    objects,
    displayMode,
    createdAt: isNum(raw.createdAt) ? raw.createdAt : 0,
    updatedAt: isNum(raw.updatedAt) ? raw.updatedAt : 0,
  }
}

// ── scene ──

export function sanitizeBoardScene(raw: unknown): BoardScene | null {
  if (!isRecord(raw)) return null
  if (!isStr(raw.id) || !isStr(raw.name) || !isStr(raw.layoutId)) return null
  const type = SCENE_TYPES.includes(raw.type as SceneType)
    ? (raw.type as SceneType)
    : 'custom'
  const displayMode = DISPLAY_MODES.includes(raw.displayMode as DisplayMode)
    ? (raw.displayMode as DisplayMode)
    : 'default'
  return {
    schemaVersion: BOARD_SCHEMA_VERSION,
    id: raw.id,
    name: raw.name,
    kind: 'scene',
    type,
    layoutId: raw.layoutId,
    displayMode,
    ...(isStr(raw.spotifyPresetRef) ? { spotifyPresetRef: raw.spotifyPresetRef } : {}),
    ...(isStr(raw.timerPresetRef) ? { timerPresetRef: raw.timerPresetRef } : {}),
    ...(isStr(raw.backgroundRef) ? { backgroundRef: raw.backgroundRef } : {}),
    ...(isBackgroundPresetId(raw.backgroundPresetId)
      ? { backgroundPresetId: raw.backgroundPresetId }
      : {}),
    keepAwake: isBool(raw.keepAwake) ? raw.keepAwake : false,
    studentSafe: isBool(raw.studentSafe) ? raw.studentSafe : true,
    createdAt: isNum(raw.createdAt) ? raw.createdAt : 0,
    updatedAt: isNum(raw.updatedAt) ? raw.updatedAt : 0,
  }
}

// ── board state (collection) ──

export function createEmptyBoardState(): BoardState {
  const now = Date.now()
  return {
    schemaVersion: BOARD_SCHEMA_VERSION,
    id: 'board-state',
    name: 'Clean Board',
    activeLayoutId: null,
    activeSceneId: null,
    layouts: [],
    scenes: [],
    createdAt: now,
    updatedAt: now,
  }
}

/** Whitelist-validate the full collection. Returns null if the shape is invalid. */
export function sanitizeBoardState(raw: unknown): BoardState | null {
  if (!isRecord(raw)) return null
  const layouts: SavedLayout[] = []
  if (raw.layouts !== undefined) {
    if (!Array.isArray(raw.layouts)) return null
    for (const item of raw.layouts) {
      const layout = sanitizeSavedLayout(item)
      if (!layout) return null
      layouts.push(layout)
    }
  }
  const scenes: BoardScene[] = []
  if (raw.scenes !== undefined) {
    if (!Array.isArray(raw.scenes)) return null
    for (const item of raw.scenes) {
      const scene = sanitizeBoardScene(item)
      if (!scene) return null
      scenes.push(scene)
    }
  }
  const activeLayoutId = raw.activeLayoutId == null || isStr(raw.activeLayoutId)
    ? (raw.activeLayoutId as string | null)
    : null
  const activeSceneId = raw.activeSceneId == null || isStr(raw.activeSceneId)
    ? (raw.activeSceneId as string | null)
    : null
  return {
    schemaVersion: BOARD_SCHEMA_VERSION,
    id: isStr(raw.id) ? raw.id : 'board-state',
    name: isStr(raw.name) ? raw.name : 'Clean Board',
    activeLayoutId,
    activeSceneId,
    layouts,
    scenes,
    createdAt: isNum(raw.createdAt) ? raw.createdAt : 0,
    updatedAt: isNum(raw.updatedAt) ? raw.updatedAt : 0,
  }
}

// ── serialization ──

/** Serialize a BoardState to a JSON string (atomic write payload). */
export function serializeBoardState(state: BoardState): string {
  return JSON.stringify(state)
}

/** Parse a JSON string into an unknown value; returns null on any error. */
export function parseBoardStateJson(json: string): unknown {
  try {
    return JSON.parse(json) as unknown
  } catch {
    return null
  }
}

/** Assert a board state (and its items) carry no forbidden/secret keys. */
export function boardStateHasNoForbiddenKeys(state: BoardState): boolean {
  const hasForbidden = (obj: object) =>
    FORBIDDEN_PERSIST_KEYS.some((k) => k in obj)
  if (hasForbidden(state)) return false
  return state.layouts.every((l) => !hasForbidden(l)) && state.scenes.every((s) => !hasForbidden(s))
}
