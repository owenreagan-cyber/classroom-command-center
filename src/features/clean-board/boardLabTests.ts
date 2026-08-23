/**
 * DB-1 — Clean Board Lab pure-logic tests.
 *
 * Run via: bash scripts/test-clean-board.sh
 * No React/DOM — pure logic only (geometry, safety projection, seed data).
 */

declare const process: { exit(code?: number): never }

import {
  BOARD_ASPECT_RATIO,
  fitBoardToContainer,
  isAspect16by9,
} from './boardGeometry'
import {
  hasForbiddenBoardKey,
  pageHasKind,
  safeBoardPageHasNoForbiddenKeys,
  showTeacherControls,
  sortByLayer,
  toSafeBoardPage,
} from './boardSafety'
import {
  BOARD_SCHEMA_VERSION,
  boardStateHasNoForbiddenKeys,
  createEmptyBoardState,
  parseBoardStateJson,
  sanitizeBackground,
  sanitizeSavedLayout,
  sanitizeTheme,
  serializeBoardState,
} from './storage/boardSerialization'
import {
  BACKGROUND_PRESET_IDS,
  BACKGROUND_PRESETS,
  DEFAULT_BACKGROUND,
  effectiveOverlay,
  isBackgroundPresetId,
  overlayScrimCss,
  textToneForBackground,
} from './backgrounds'
import { BOARD_THEME_IDS, DEFAULT_THEME, getTheme, isBoardThemeId } from './themes'
import {
  DEFAULT_MESSAGE_CARD_KIND,
  MESSAGE_CARD_KIND_LABELS,
  MESSAGE_CARD_KINDS,
  MESSAGE_CARD_PRESETS,
  MESSAGE_CARD_TEXT_SIZES,
  MESSAGE_CARD_TONES,
  defaultMessageCardConfig,
  getMessageCardPreset,
  isMessageCardKind,
  isMessageCardTextSize,
  isMessageCardTone,
  sanitizeMessageCardConfig,
  sanitizePlainText,
} from './messageCards'
import { migrateBoardState } from './storage/boardMigrations'
import {
  DEFAULT_TIMER_PRESET_ID,
  TIMER_MAX_MINUTES,
  TIMER_PRESET_IDS,
  TIMER_PRESETS,
  TIMER_TONES,
  clampTimerMinutes,
  defaultTimerConfig,
  formatTimerDuration,
  isTimerPresetId,
  isTimerTone,
  sanitizeTimerConfig,
  sanitizeTimerPresetId,
  timerConfigFromPreset,
} from './timerPresets'
import {
  deleteLayout,
  deleteScene,
  layoutFromPage,
  renameLayout,
  saveLayout,
  saveScene,
  setActiveLayout,
  setActiveScene,
} from './storage/boardStorage'
import { createSeedBoard } from './seedBoard'
import { BOARD_OBJECT_KINDS } from './types'
import type {
  BoardObject,
  BoardPage,
  BoardScene,
  MessageCardConfig,
  SavedLayout,
  TimerConfig,
  TimerPresetId,
} from './types'
import {
  describeWakeLockStatus,
  isWakeLockSupported,
  shouldReacquire,
} from './wakeLockState'
import {
  CLEAN_BOARD_EDIT_BREAKPOINT,
  EDIT_DRAWER_TAB_LABELS,
  getCleanBoardEditLayoutMode,
  getCleanBoardEditTabs,
} from './editLayout'

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    passed++
  } catch (e) {
    failed++
    console.error(`FAIL: ${name}`)
    console.error(e instanceof Error ? e.message : String(e))
  }
}

function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) throw new Error(message ?? 'Assertion failed')
}

function obj(id: string, layer: number, visible = true): BoardObject {
  return {
    id,
    kind: 'text',
    x: 0,
    y: 0,
    w: 10,
    h: 10,
    rotation: 0,
    locked: false,
    visible,
    layer,
    config: { kind: 'text', text: 'x', fontSize: 16, color: '#fff', align: 'left' },
  }
}

const solidBackground = { type: 'solid', color: '#000000' } as const

// ── Geometry ──

test('fitBoardToContainer produces 16:9 dimensions at 1440x900', () => {
  const fit = fitBoardToContainer(1440, 900)
  assert(isAspect16by9(fit.width, fit.height), 'fit dims are 16:9')
  assert(fit.width <= 1440 && fit.height <= 900, 'fit stays within container')
  assert(fit.scale > 0)
})

test('fitBoardToContainer produces 16:9 dimensions at 1024x768', () => {
  const fit = fitBoardToContainer(1024, 768)
  assert(isAspect16by9(fit.width, fit.height))
  assert(fit.width <= 1024 && fit.height <= 768)
})

test('fitBoardToContainer letterboxes and centers vertically at 16:9 container', () => {
  const fit = fitBoardToContainer(1440, 900)
  assert(Math.abs(fit.width - 1440) < 0.001, 'width fills container')
  assert(Math.abs(fit.height - 810) < 0.001, 'height is 16:9 of width')
  assert(Math.abs(fit.offsetY - 45) < 0.001, `expected 45px letterbox, got ${fit.offsetY}`)
  assert(Math.abs(fit.offsetX) < 0.001, 'no horizontal letterbox')
})

test('board aspect ratio constant is 16:9', () => {
  assert(Math.abs(BOARD_ASPECT_RATIO - 16 / 9) < 1e-9)
})

test('isAspect16by9 rejects non-positive dimensions', () => {
  assert(!isAspect16by9(0, 0))
  assert(!isAspect16by9(-16, -9))
})

// ── Object ordering ──

test('sortByLayer orders objects by ascending layer', () => {
  const a = obj('a', 2)
  const b = obj('b', 1)
  const sorted = sortByLayer([a, b])
  assert(sorted[0].id === 'b' && sorted[1].id === 'a', 'lower layer first')
})

// ── Present projection ──

test('hidden objects are dropped from present projection', () => {
  const page: BoardPage = {
    id: 'p1',
    title: 'T',
    background: solidBackground,
    theme: DEFAULT_THEME,
    objects: [obj('a', 1, true), obj('b', 1, false)],
  }
  const safe = toSafeBoardPage(page)
  assert(safe.objects.length === 1)
  assert(safe.objects[0].id === 'a')
})

test('teacherNotes is stripped from present projection', () => {
  const page: BoardPage = {
    id: 'p1',
    title: 'T',
    background: solidBackground,
    theme: DEFAULT_THEME,
    objects: [],
    teacherNotes: 'secret note',
  }
  const safe = toSafeBoardPage(page)
  assert(!('teacherNotes' in safe))
  assert(safeBoardPageHasNoForbiddenKeys(safe))
})

test('spotify placeholder config is sanitized to label-only', () => {
  const withSecret = {
    ...obj('s', 1),
    kind: 'spotifyNowPlayingPlaceholder' as const,
    config: {
      kind: 'spotifyNowPlayingPlaceholder',
      label: 'Now Playing',
      accessToken: 'SECRET',
    } as unknown as BoardObject['config'],
  }
  const page: BoardPage = {
    id: 'p1',
    title: 'T',
    background: solidBackground,
    theme: DEFAULT_THEME,
    objects: [withSecret],
  }
  const safe = toSafeBoardPage(page)
  const keys = Object.keys(safe.objects[0].config)
  assert(keys.includes('kind') && keys.includes('label'), 'keeps kind and label')
  assert(!keys.includes('accessToken'), 'drops accessToken')
})

test('hasForbiddenBoardKey flags teacher/secret keys and passes clean objects', () => {
  assert(hasForbiddenBoardKey({ teacherNotes: 'x' }))
  assert(hasForbiddenBoardKey({ accessToken: 'x' }))
  assert(hasForbiddenBoardKey({ clientSecret: 'x' }))
  assert(!hasForbiddenBoardKey({ id: 'a', title: 'T' }))
})

// ── Seed data ──

test('seed board has valid unique page and object ids', () => {
  const deck = createSeedBoard()
  const pageIds = deck.pages.map((p) => p.id)
  assert(new Set(pageIds).size === pageIds.length, 'page ids are unique')
  for (const page of deck.pages) {
    const objIds = page.objects.map((o) => o.id)
    assert(new Set(objIds).size === objIds.length, `${page.id} object ids are unique`)
    assert(objIds.every((id) => id.length > 0))
  }
  assert(deck.activePageId === deck.pages[0].id)
})

test('seed board only uses allowed object kinds', () => {
  const deck = createSeedBoard()
  const allowed = BOARD_OBJECT_KINDS as readonly string[]
  for (const page of deck.pages) {
    for (const o of page.objects) {
      assert(allowed.includes(o.kind), `unexpected kind ${o.kind}`)
    }
  }
})

test('seed board pages project to student-safe pages', () => {
  const deck = createSeedBoard()
  for (const page of deck.pages) {
    const safe = toSafeBoardPage(page)
    assert(safeBoardPageHasNoForbiddenKeys(safe), `${page.id} is clean`)
    assert(!('teacherNotes' in safe))
  }
})

test('seed board objects are within the 1920x1080 canvas bounds', () => {
  const deck = createSeedBoard()
  for (const page of deck.pages) {
    for (const o of page.objects) {
      assert(o.x >= 0 && o.y >= 0, `${o.id} has non-negative origin`)
      assert(o.x + o.w <= 1920.01, `${o.id} within canvas width`)
      assert(o.y + o.h <= 1080.01, `${o.id} within canvas height`)
    }
  }
})

// ── Spotify tile singularity ──

test('seed board page 1 has exactly one Spotify now-playing tile', () => {
  const deck = createSeedBoard()
  const page = deck.pages[0]
  const spots = page.objects.filter((o) => o.kind === 'spotifyNowPlayingPlaceholder')
  assert(spots.length === 1, `expected 1 spotify tile, got ${spots.length}`)
})

test('pageHasKind detects an existing spotify tile', () => {
  const deck = createSeedBoard()
  assert(pageHasKind(deck.pages[0].objects, 'spotifyNowPlayingPlaceholder') === true)
  assert(pageHasKind(deck.pages[1].objects, 'spotifyNowPlayingPlaceholder') === false)
})

// ── Board-embedded teacher controls gating ──

test('showTeacherControls allows edit mode only, never present', () => {
  assert(showTeacherControls('edit') === true)
  assert(showTeacherControls('present') === false)
})

// ── Keep Awake (wake lock) ──

test('isWakeLockSupported requires a callable request function', () => {
  assert(isWakeLockSupported(null) === false)
  assert(isWakeLockSupported(undefined) === false)
  assert(isWakeLockSupported({}) === false)
  assert(isWakeLockSupported({ wakeLock: null }) === false)
  assert(isWakeLockSupported({ wakeLock: {} }) === false)
  assert(isWakeLockSupported({ wakeLock: { request: () => Promise.resolve(null) } }) === true)
})

test('describeWakeLockStatus matches the required labels', () => {
  assert(describeWakeLockStatus('active') === 'Keep Awake active')
  assert(describeWakeLockStatus('unsupported') === 'Wake Lock unsupported in this browser')
  assert(describeWakeLockStatus('released') === 'Wake Lock released; click to re-enable')
  assert(describeWakeLockStatus('reacquiring') === 'Reacquiring…')
  assert(describeWakeLockStatus('disabled') === 'Keep Awake off')
})

test('shouldReacquire requires enabled + visible + no sentinel', () => {
  assert(shouldReacquire(true, true, false) === true)
  assert(shouldReacquire(false, true, false) === false, 'disabled toggle never reacquires')
  assert(shouldReacquire(true, false, false) === false, 'hidden tab never reacquires')
  assert(shouldReacquire(true, true, true) === false, 'existing sentinel blocks reacquire')
})

// ── DB-4A — saved layouts / scenes / persistence ──

function layoutFixture(name: string, id: string): SavedLayout {
  return {
    schemaVersion: BOARD_SCHEMA_VERSION,
    id,
    name,
    kind: 'layout',
    background: { type: 'solid', color: '#000000' },
    theme: DEFAULT_THEME,
    objects: [obj('a', 1)],
    displayMode: 'default',
    createdAt: 1,
    updatedAt: 1,
  }
}

function sceneFixture(name: string, id: string, layoutId: string): BoardScene {
  return {
    schemaVersion: BOARD_SCHEMA_VERSION,
    id,
    name,
    kind: 'scene',
    type: 'math',
    layoutId,
    displayMode: 'focus',
    spotifyPresetRef: 'spotify:playlist:abc',
    timerPresetRef: 'timer-5',
    keepAwake: true,
    studentSafe: true,
    createdAt: 1,
    updatedAt: 1,
  }
}

test('schema version constant exists and is a positive number', () => {
  assert(typeof BOARD_SCHEMA_VERSION === 'number')
  assert(BOARD_SCHEMA_VERSION >= 1)
  assert(createEmptyBoardState().schemaVersion === BOARD_SCHEMA_VERSION)
})

test('saveLayout inserts and replaces by id', () => {
  let state = createEmptyBoardState()
  state = saveLayout(state, layoutFixture('Morning', 'l1'))
  assert(state.layouts.length === 1)
  state = saveLayout(state, layoutFixture('Morning v2', 'l1'))
  assert(state.layouts.length === 1, 'replace by id, not append')
  assert(state.layouts[0].name === 'Morning v2')
})

test('renameLayout updates only the target layout', () => {
  let state = createEmptyBoardState()
  state = saveLayout(state, layoutFixture('A', 'l1'))
  state = saveLayout(state, layoutFixture('B', 'l2'))
  state = renameLayout(state, 'l1', 'Renamed')
  assert(state.layouts.find((l) => l.id === 'l1')?.name === 'Renamed')
  assert(state.layouts.find((l) => l.id === 'l2')?.name === 'B')
})

test('deleteLayout removes the layout and its scenes', () => {
  let state = createEmptyBoardState()
  state = saveLayout(state, layoutFixture('Morning', 'l1'))
  state = saveScene(state, sceneFixture('Math Scene', 's1', 'l1'))
  state = setActiveLayout(state, 'l1')
  state = deleteLayout(state, 'l1')
  assert(state.layouts.length === 0)
  assert(state.scenes.length === 0, 'scene referencing deleted layout is removed')
  assert(state.activeLayoutId === null)
})

test('layout survives serialize → parse → migrate round-trip', () => {
  let state = createEmptyBoardState()
  state = saveLayout(state, layoutFixture('Math Block', 'l1'))
  const json = serializeBoardState(state)
  const parsed = parseBoardStateJson(json)
  const migrated = migrateBoardState(parsed)
  assert(migrated !== null)
  assert(migrated.layouts.length === 1)
  assert(migrated.layouts[0].name === 'Math Block')
  assert(migrated.layouts[0].objects.length === 1)
})

test('scene creation preserves metadata through round-trip', () => {
  let state = createEmptyBoardState()
  state = saveLayout(state, layoutFixture('Reading', 'l1'))
  state = saveScene(state, sceneFixture('Reading Scene', 's1', 'l1'))
  state = setActiveScene(state, 's1')
  const migrated = migrateBoardState(parseBoardStateJson(serializeBoardState(state)))
  assert(migrated !== null)
  const scene = migrated.scenes[0]
  assert(scene.type === 'math')
  assert(scene.displayMode === 'focus')
  assert(scene.keepAwake === true)
  assert(scene.studentSafe === true)
  assert(scene.spotifyPresetRef === 'spotify:playlist:abc')
  assert(scene.layoutId === 'l1')
  assert(migrated.activeSceneId === 's1')
})

test('load scene resolves its referenced layout', () => {
  let state = createEmptyBoardState()
  state = saveLayout(state, layoutFixture('Pack Up', 'l1'))
  state = saveScene(state, sceneFixture('Pack Up Scene', 's1', 'l1'))
  const scene = state.scenes[0]
  const layout = state.layouts.find((l) => l.id === scene.layoutId)
  assert(layout !== undefined, 'scene layoutId resolves to a saved layout')
  assert(layout.name === 'Pack Up')
})

test('deleteScene removes only the scene, keeps the layout', () => {
  let state = createEmptyBoardState()
  state = saveLayout(state, layoutFixture('Morning', 'l1'))
  state = saveScene(state, sceneFixture('Scene', 's1', 'l1'))
  state = deleteScene(state, 's1')
  assert(state.scenes.length === 0)
  assert(state.layouts.length === 1)
})

test('corrupted storage recovers gracefully to null', () => {
  assert(parseBoardStateJson('not json{{{') === null)
  assert(migrateBoardState(parseBoardStateJson('{bad')) === null)
  assert(migrateBoardState(null) === null)
  assert(migrateBoardState({}) === null, 'missing schemaVersion is rejected')
  assert(migrateBoardState({ schemaVersion: 999, layouts: [] }) === null, 'future version rejected')
})

test('sanitizeSavedLayout drops forbidden keys and secret-bearing config', () => {
  const contaminated = {
    schemaVersion: BOARD_SCHEMA_VERSION,
    id: 'l1',
    name: 'Layout',
    kind: 'layout',
    background: { type: 'solid', color: '#000' },
    displayMode: 'default',
    createdAt: 1,
    updatedAt: 1,
    accessToken: 'SECRET_TOKEN',
    refreshToken: 'SECRET_REFRESH',
    email: 'teacher@school.edu',
    objects: [
      {
        id: 'a',
        kind: 'spotifyNowPlayingPlaceholder',
        x: 0, y: 0, w: 100, h: 100, rotation: 0, locked: false, visible: true, layer: 1,
        config: {
          kind: 'spotifyNowPlayingPlaceholder',
          label: 'Now Playing',
          accessToken: 'SECRET_TOKEN',
          deviceId: 'device-123',
        },
      },
    ],
  }
  const clean = sanitizeSavedLayout(contaminated)
  assert(clean !== null)
  assert(!('accessToken' in clean), 'token key dropped from layout')
  assert(!('email' in clean))
  const cfg = clean.objects[0].config as Record<string, unknown>
  assert(cfg.kind === 'spotifyNowPlayingPlaceholder')
  assert(!('accessToken' in cfg), 'token dropped from object config')
  assert(!('deviceId' in cfg), 'device id dropped from object config')
})

test('boardStateHasNoForbiddenKeys rejects contaminated state', () => {
  let state = createEmptyBoardState()
  state = saveLayout(state, layoutFixture('Clean', 'l1'))
  assert(boardStateHasNoForbiddenKeys(state) === true)
  const contaminated = { ...state, accessToken: 'x' } as unknown as Parameters<typeof boardStateHasNoForbiddenKeys>[0]
  assert(boardStateHasNoForbiddenKeys(contaminated) === false)
})

test('present mode does not expose save/scene controls', () => {
  // Save/scene UI is gated behind edit mode only.
  assert(showTeacherControls('present') === false)
  assert(showTeacherControls('edit') === true)
})

test('persisted scene projection never leaks teacher notes', () => {
  // The safety projection path already strips teacherNotes; a scene with a
  // teacher note must not serialize private data into its projected page.
  const page: BoardPage = {
    id: 'p1',
    title: 'T',
    background: { type: 'solid', color: '#000' },
    theme: DEFAULT_THEME,
    objects: [obj('a', 1)],
    teacherNotes: 'private',
  }
  const safe = toSafeBoardPage(page)
  assert(!('teacherNotes' in safe))
  assert(safeBoardPageHasNoForbiddenKeys(safe))
})

// ── DB-4B — backgrounds and themes ──

test('background preset catalog is complete and valid', () => {
  assert(BACKGROUND_PRESET_IDS.length === 10, 'ten presets defined')
  const categories = ['calm', 'focus', 'morning', 'reading', 'math', 'transition', 'neutral']
  const seen = new Set<string>()
  for (const preset of BACKGROUND_PRESETS) {
    assert(!seen.has(preset.id), `preset id ${preset.id} is unique`)
    seen.add(preset.id)
    assert(preset.name.length > 0, `${preset.id} has a name`)
    assert(categories.includes(preset.category), `${preset.id} category is valid`)
    assert(preset.textTone === 'dark' || preset.textTone === 'light', `${preset.id} textTone valid`)
    assert(
      preset.overlay === 'none' || preset.overlay === 'soft' || preset.overlay === 'strong',
      `${preset.id} overlay valid`,
    )
    assert(preset.css.length > 0, `${preset.id} has css`)
    assert(!preset.css.includes('url('), `${preset.id} css has no external url`)
  }
})

test('isBackgroundPresetId validates ids and rejects remote urls', () => {
  assert(isBackgroundPresetId('calm-blue') === true)
  assert(isBackgroundPresetId('math-grid-subtle') === true)
  assert(isBackgroundPresetId('nope') === false)
  assert(isBackgroundPresetId('https://evil.example/x.png') === false)
  assert(isBackgroundPresetId(42) === false)
})

test('valid preset background serializes', () => {
  const bg = sanitizeBackground({ type: 'preset', presetId: 'soft-green' })
  assert(bg.type === 'preset')
  assert(bg.presetId === 'soft-green')
})

test('invalid preset recovers to default background', () => {
  const bg = sanitizeBackground({ type: 'preset', presetId: 'not-a-real-preset' })
  assert(bg.type === 'preset' && bg.presetId === DEFAULT_BACKGROUND.presetId)
  const nonRecord = sanitizeBackground('garbage')
  assert(nonRecord.type === 'preset' && nonRecord.presetId === DEFAULT_BACKGROUND.presetId)
})

test('background sanitization rejects remote URLs, image paths, and blobs', () => {
  const withUrl = sanitizeBackground({
    type: 'preset',
    presetId: 'calm-blue',
    url: 'https://evil.example/x.png',
    assetPath: '/local/photo.png',
  })
  assert(!('url' in withUrl), 'drops remote url')
  assert(!('assetPath' in withUrl), 'drops file path')
  const imageShape = sanitizeBackground({ type: 'image', assetPath: '/local/photo.png' })
  assert(imageShape.type === 'preset' && imageShape.presetId === DEFAULT_BACKGROUND.presetId)
})

test('background sanitization strips private keys', () => {
  const bg = sanitizeBackground({
    type: 'preset',
    presetId: 'calm-blue',
    accessToken: 'SECRET',
  } as unknown)
  assert(!('accessToken' in bg), 'drops accessToken from background')
  assert(bg.type === 'preset' && bg.presetId === 'calm-blue')
})

test('theme catalog exposes valid ids and lookups', () => {
  assert(BOARD_THEME_IDS.length >= 2)
  for (const id of BOARD_THEME_IDS) {
    assert(isBoardThemeId(id) === true)
    const t = getTheme(id)
    assert(t.id === id && t.name.length > 0)
    assert(t.textTone === 'dark' || t.textTone === 'light')
    assert(t.surface === 'glass' || t.surface === 'solid' || t.surface === 'minimal')
    assert(t.accent.length > 0)
  }
})

test('valid theme serializes', () => {
  const theme = sanitizeTheme({ id: 'glass-dark' })
  assert(theme.id === 'glass-dark')
  assert(theme.name === 'Glass Dark')
})

test('invalid theme recovers to default', () => {
  const theme = sanitizeTheme({ id: 'bogus-theme' })
  assert(theme.id === DEFAULT_THEME.id)
  assert(sanitizeTheme(null).id === DEFAULT_THEME.id)
})

test('theme sanitization strips unknown/private keys', () => {
  const theme = sanitizeTheme({ id: 'minimal-dark', accessToken: 'SECRET', email: 'x@y.z' })
  assert(!('accessToken' in theme), 'drops accessToken from theme')
  assert(!('email' in theme), 'drops email from theme')
  assert(theme.id === 'minimal-dark')
})

test('saved layout preserves background through round-trip', () => {
  let state = createEmptyBoardState()
  state = saveLayout(
    state,
    {
      ...layoutFixture('Green Board', 'l1'),
      background: { type: 'preset', presetId: 'soft-green' },
    },
  )
  const migrated = migrateBoardState(parseBoardStateJson(serializeBoardState(state)))
  assert(migrated !== null)
  const bg = migrated.layouts[0].background
  assert(bg.type === 'preset' && bg.presetId === 'soft-green', 'preset background survives round-trip')
})

test('saved layout preserves theme through round-trip', () => {
  let state = createEmptyBoardState()
  state = saveLayout(
    state,
    { ...layoutFixture('Glass', 'l1'), theme: getTheme('glass-dark') },
  )
  const migrated = migrateBoardState(parseBoardStateJson(serializeBoardState(state)))
  assert(migrated !== null)
  assert(migrated.layouts[0].theme.id === 'glass-dark', 'theme survives round-trip')
})

test('autosave carries background and theme', () => {
  const page = createSeedBoard().pages[0]
  const layout = layoutFromPage(page, 'Autosave')
  assert(layout.background.type === 'preset')
  assert(layout.theme.id === page.theme.id)
  // loadAutosaveLayout passes through sanitizeSavedLayout; validate that path.
  const sanitized = sanitizeSavedLayout(layout)
  assert(sanitized !== null)
  assert(sanitized.background.type === 'preset')
  assert(sanitized.theme.id === page.theme.id)
})

test('present projection keeps background/theme but never teacher notes', () => {
  const page = createSeedBoard().pages[0]
  const safe = toSafeBoardPage(page)
  assert(safe.background.type === 'preset')
  assert(safe.theme.id === page.theme.id)
  assert(!('teacherNotes' in safe))
  assert(safeBoardPageHasNoForbiddenKeys(safe))
})

test('present mode never exposes board look controls', () => {
  assert(showTeacherControls('present') === false)
  assert(showTeacherControls('edit') === true)
})

test('effective overlay and scrim derive from preset defaults', () => {
  assert(effectiveOverlay({ type: 'preset', presetId: 'calm-blue' }) === 'soft')
  assert(effectiveOverlay({ type: 'preset', presetId: 'clean-white' }) === 'none')
  const scrim = overlayScrimCss({ type: 'preset', presetId: 'calm-blue' })
  assert(scrim !== null && typeof scrim.backgroundColor === 'string')
  assert(overlayScrimCss({ type: 'preset', presetId: 'clean-white' }) === null)
})

test('text tone resolves per background for scrim direction', () => {
  assert(textToneForBackground({ type: 'preset', presetId: 'calm-blue' }) === 'light')
  assert(textToneForBackground({ type: 'preset', presetId: 'clean-white' }) === 'dark')
  assert(textToneForBackground({ type: 'solid', color: '#ffffff' }) === 'dark')
  assert(textToneForBackground({ type: 'solid', color: '#0b1120' }) === 'light')
})

test('reset constants point at the default background and theme', () => {
  assert(DEFAULT_BACKGROUND.type === 'preset')
  assert(isBackgroundPresetId(DEFAULT_BACKGROUND.presetId))
  assert(isBoardThemeId(DEFAULT_THEME.id))
})

// ── DB-4C — directions / message card widget ──

function messageCardObj(id: string, config: Record<string, unknown>): BoardObject {
  return {
    id,
    kind: 'messageCard',
    x: 0,
    y: 0,
    w: 720,
    h: 360,
    rotation: 0,
    locked: false,
    visible: true,
    layer: 1,
    config: config as unknown as MessageCardConfig,
  }
}

function validMessageCardRaw(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: 'messageCard',
    title: 'Do Now',
    message: '1. Take out your materials.\n2. Begin the first task.',
    cardKind: 'doNow',
    tone: 'focus',
    textSize: 'medium',
    checklistStyle: true,
    ...overrides,
  }
}

test('message card preset catalog is complete and valid', () => {
  assert(MESSAGE_CARD_KINDS.length === 7, 'seven card kinds defined')
  assert(MESSAGE_CARD_TONES.length === 5, 'five tones defined')
  assert(MESSAGE_CARD_TEXT_SIZES.length === 3, 'three text sizes defined')
  const seen = new Set<string>()
  for (const kind of MESSAGE_CARD_KINDS) {
    assert(!seen.has(kind), `kind ${kind} unique`)
    seen.add(kind)
    const preset = MESSAGE_CARD_PRESETS[kind]
    assert(preset.title.length > 0, `${kind} has title`)
    assert(preset.message.length > 0, `${kind} has message`)
    assert(MESSAGE_CARD_TONES.includes(preset.tone), `${kind} tone valid`)
    assert(MESSAGE_CARD_TEXT_SIZES.includes(preset.textSize), `${kind} textSize valid`)
    assert(MESSAGE_CARD_KIND_LABELS[kind].length > 0, `${kind} has label`)
  }
})

test('valid message card serializes', () => {
  const cfg = sanitizeMessageCardConfig(validMessageCardRaw())
  assert(cfg.kind === 'messageCard')
  assert(cfg.title === 'Do Now')
  assert(cfg.message.includes('Take out your materials'))
  assert(cfg.cardKind === 'doNow')
  assert(cfg.tone === 'focus')
  assert(cfg.textSize === 'medium')
  assert(cfg.checklistStyle === true)
})

test('invalid cardKind recovers to default', () => {
  const cfg = sanitizeMessageCardConfig(validMessageCardRaw({ cardKind: 'notReal' }))
  assert(cfg.cardKind === DEFAULT_MESSAGE_CARD_KIND)
})

test('invalid tone recovers to default', () => {
  const cfg = sanitizeMessageCardConfig(validMessageCardRaw({ tone: 'loud' }))
  assert(cfg.tone === 'neutral')
})

test('invalid textSize recovers to default', () => {
  const cfg = sanitizeMessageCardConfig(validMessageCardRaw({ textSize: 'huge' }))
  assert(cfg.textSize === 'medium')
})

test('HTML and script content is neutralized', () => {
  const cleaned = sanitizePlainText('<script>alert(1)</script><b>Hello</b> world')
  assert(!cleaned.includes('<script'), 'script block removed')
  assert(!cleaned.includes('<b>'), 'tag removed')
  assert(cleaned.includes('Hello world'), 'keeps text')
})

test('remote URLs are stripped', () => {
  const cleaned = sanitizePlainText('Go to https://evil.example/x.png now')
  assert(!cleaned.includes('https://'), 'scheme url removed')
  assert(cleaned.includes('Go to') && cleaned.includes('now'), 'surrounding text kept')
  const wwwCleaned = sanitizePlainText('See www.example.com for details')
  assert(!wwwCleaned.includes('www.example.com'), 'bare www url removed')
})

test('sanitizePlainText preserves plain math comparison', () => {
  assert(sanitizePlainText('x < 5') === 'x < 5')
  assert(sanitizePlainText('3 > 2') === '3 > 2')
})

test('token and unknown keys are stripped from message card config', () => {
  const cfg = sanitizeMessageCardConfig(
    validMessageCardRaw({ accessToken: 'SECRET', email: 'x@y.z', extra: 'nope' }),
  )
  assert(!('accessToken' in cfg), 'drops accessToken')
  assert(!('email' in cfg), 'drops email')
  assert(!('extra' in cfg), 'drops unknown key')
  const keys = Object.keys(cfg).sort()
  assert(
    keys.join(',') ===
      ['cardKind', 'checklistStyle', 'kind', 'message', 'textSize', 'title', 'tone'].join(','),
    `whitelist keys only, got ${keys.join(',')}`,
  )
})

test('saved layout preserves message cards through round-trip', () => {
  let state = createEmptyBoardState()
  state = saveLayout(state, {
    ...layoutFixture('Do Now Board', 'l1'),
    objects: [messageCardObj('m1', validMessageCardRaw())],
  })
  const migrated = migrateBoardState(parseBoardStateJson(serializeBoardState(state)))
  assert(migrated !== null)
  const obj = migrated.layouts[0].objects[0]
  assert(obj.kind === 'messageCard')
  const cfg = obj.config as unknown as MessageCardConfig
  assert(cfg.cardKind === 'doNow')
  assert(cfg.message.includes('Take out your materials'))
})

test('autosave preserves message cards', () => {
  const page = createSeedBoard().pages[0]
  const hasCard = page.objects.some((o) => o.kind === 'messageCard')
  assert(hasCard, 'seed page has a message card')
  const layout = layoutFromPage(page, 'Autosave')
  const sanitized = sanitizeSavedLayout(layout)
  assert(sanitized !== null)
  const card = sanitized.objects.find((o) => o.kind === 'messageCard')
  assert(card !== undefined, 'message card survives autosave sanitization')
  const cfg = card.config as unknown as MessageCardConfig
  assert(cfg.title === 'Do Now')
})

test('message card appears in safe board projection', () => {
  const page: BoardPage = {
    id: 'p1',
    title: 'T',
    background: solidBackground,
    theme: DEFAULT_THEME,
    objects: [messageCardObj('m1', validMessageCardRaw())],
  }
  const safe = toSafeBoardPage(page)
  assert(safe.objects.length === 1)
  assert(safe.objects[0].kind === 'messageCard')
  const cfg = safe.objects[0].config as unknown as MessageCardConfig
  assert(cfg.title === 'Do Now')
  assert(safeBoardPageHasNoForbiddenKeys(safe))
})

test('message card present projection strips private/unknown keys', () => {
  const contaminated = messageCardObj('m1', validMessageCardRaw({ accessToken: 'SECRET' }))
  const page: BoardPage = {
    id: 'p1',
    title: 'T',
    background: solidBackground,
    theme: DEFAULT_THEME,
    objects: [contaminated],
  }
  const safe = toSafeBoardPage(page)
  const cfg = safe.objects[0].config as Record<string, unknown>
  assert(!('accessToken' in cfg), 'drops token in present projection')
})

test('edit controls are gated to edit mode only', () => {
  assert(showTeacherControls('present') === false)
  assert(showTeacherControls('edit') === true)
})

test('default message card is predictable', () => {
  const cfg = defaultMessageCardConfig()
  assert(cfg.kind === 'messageCard')
  assert(cfg.cardKind === DEFAULT_MESSAGE_CARD_KIND)
  assert(isMessageCardKind(cfg.cardKind))
  assert(isMessageCardTone(cfg.tone))
  assert(isMessageCardTextSize(cfg.textSize))
})

test('switching card kind preset updates title/message/cardKind', () => {
  const preset = getMessageCardPreset('objective')
  assert(preset.cardKind === 'objective')
  assert(preset.title === 'Objective')
  assert(preset.message === 'I can explain my thinking clearly and use evidence.')
})

// ── DB-4C follow-up — responsive edit layout ──

test('getCleanBoardEditLayoutMode picks sidePanels at desktop and responsivePanels on iPad', () => {
  assert(getCleanBoardEditLayoutMode(1440) === 'sidePanels')
  assert(getCleanBoardEditLayoutMode(1180) === 'responsivePanels', 'iPad landscape uses the drawer')
  assert(getCleanBoardEditLayoutMode(820) === 'responsivePanels', 'iPad portrait uses the drawer')
  assert(getCleanBoardEditLayoutMode(390) === 'responsivePanels', 'phone width uses the drawer')
})

test('getCleanBoardEditLayoutMode breakpoint boundary is exclusive', () => {
  assert(getCleanBoardEditLayoutMode(CLEAN_BOARD_EDIT_BREAKPOINT - 1) === 'responsivePanels')
  assert(getCleanBoardEditLayoutMode(CLEAN_BOARD_EDIT_BREAKPOINT) === 'sidePanels')
  assert(CLEAN_BOARD_EDIT_BREAKPOINT > 1180, 'breakpoint is above iPad landscape width')
})

test('responsive drawer always exposes Saved Boards and Board Look', () => {
  const tabs = getCleanBoardEditTabs({ showSpotify: false, showMessageCard: false, showTimer: false })
  assert(tabs.includes('saved'), 'saved boards tab present')
  assert(tabs.includes('look'), 'board look tab present')
  assert(!tabs.includes('spotify'), 'no spotify tab without a selected tile')
  assert(!tabs.includes('messageCard'), 'no message card tab without a selected card')
  assert(!tabs.includes('timer'), 'no timer tab without a selected timer')
})

test('responsive drawer adds Spotify, Message Card, and Timer tabs conditionally', () => {
  const withSpotify = getCleanBoardEditTabs({ showSpotify: true, showMessageCard: false, showTimer: false })
  assert(withSpotify.includes('spotify'))
  const withCard = getCleanBoardEditTabs({ showSpotify: false, showMessageCard: true, showTimer: false })
  assert(withCard.includes('messageCard'))
  const withTimer = getCleanBoardEditTabs({ showSpotify: false, showMessageCard: false, showTimer: true })
  assert(withTimer.includes('timer'))
  const both = getCleanBoardEditTabs({ showSpotify: true, showMessageCard: true, showTimer: true })
  assert(both.includes('spotify') && both.includes('messageCard') && both.includes('timer'))
})

test('drawer tab labels cover all five teacher panels', () => {
  const labels = Object.values(EDIT_DRAWER_TAB_LABELS)
  assert(labels.includes('Saved Boards'))
  assert(labels.includes('Board Look'))
  assert(labels.includes('Spotify'))
  assert(labels.includes('Message Card'))
  assert(labels.includes('Timer'))
})

test('present mode never renders teacher panels regardless of layout mode', () => {
  // Layout selection is edit-mode-only; present mode is gated by
  // showTeacherControls, which already returns false for present.
  assert(showTeacherControls('present') === false)
  assert(showTeacherControls('edit') === true)
})

// ── DB-4D — classroom timer presets ──

const TIMER_REQUIRED: Record<string, { label: string; durationMinutes: number }> = {
  morningWork: { label: 'Morning Work', durationMinutes: 10 },
  mathSprint: { label: 'Math Sprint', durationMinutes: 5 },
  independentWork: { label: 'Independent Work', durationMinutes: 20 },
  readingStamina: { label: 'Reading Stamina', durationMinutes: 15 },
  cleanup: { label: 'Cleanup', durationMinutes: 3 },
  transition: { label: 'Transition', durationMinutes: 2 },
  exitTicket: { label: 'Exit Ticket', durationMinutes: 5 },
  brainBreak: { label: 'Brain Break', durationMinutes: 3 },
  partnerTalk: { label: 'Partner Talk', durationMinutes: 2 },
  quietWriting: { label: 'Quiet Writing', durationMinutes: 12 },
}

function timerObj(id: string, config: Record<string, unknown>): BoardObject {
  return {
    id,
    kind: 'timer',
    x: 0,
    y: 0,
    w: 280,
    h: 150,
    rotation: 0,
    locked: false,
    visible: true,
    layer: 1,
    config: config as unknown as TimerConfig,
  }
}

function validTimerRaw(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: 'timer',
    presetId: 'mathSprint',
    title: 'Math Sprint',
    durationMinutes: 5,
    tone: 'focus',
    label: '5:00',
    ...overrides,
  }
}

test('timer preset catalog contains all required classroom routines', () => {
  for (const [id, expected] of Object.entries(TIMER_REQUIRED)) {
    const preset = TIMER_PRESETS[id as TimerPresetId]
    assert(preset !== undefined, `preset ${id} exists`)
    assert(preset.label === expected.label, `${id} label`)
    assert(preset.durationMinutes === expected.durationMinutes, `${id} duration`)
  }
  assert(TIMER_TONES.length === 5, 'five tones defined')
  assert(TIMER_PRESET_IDS.length === 11, 'ten routines plus custom')
  assert(isTimerPresetId('morningWork') === true)
  assert(isTimerTone('urgent') === true)
  assert(isTimerTone('loud') === false)
})

test('unknown preset id falls back safely to custom', () => {
  assert(sanitizeTimerPresetId('bogus') === 'custom')
  assert(sanitizeTimerPresetId(42) === 'custom')
  assert(sanitizeTimerPresetId(undefined) === 'custom')
  assert(sanitizeTimerPresetId('mathSprint') === 'mathSprint')
  assert(isTimerPresetId('bogus') === false)
})

test('invalid duration falls back or clamps safely', () => {
  assert(clampTimerMinutes(-5) === 10, 'negative falls back to default')
  assert(clampTimerMinutes(0) === 10, 'zero falls back to default')
  assert(clampTimerMinutes('x' as unknown) === 10, 'non-number falls back to default')
  assert(clampTimerMinutes(Number.NaN) === 10)
  assert(clampTimerMinutes(999) === TIMER_MAX_MINUTES, 'over-long clamps to max')
  assert(clampTimerMinutes(5) === 5)
})

test('creating timer from preset produces correct title/duration/tone', () => {
  const cfg = timerConfigFromPreset('mathSprint')
  assert(cfg.kind === 'timer')
  assert(cfg.presetId === 'mathSprint')
  assert(cfg.title === 'Math Sprint')
  assert(cfg.durationMinutes === 5)
  assert(cfg.tone === 'focus')
  assert(cfg.label === '5:00')
})

test('Add Timer uses the default preset', () => {
  const cfg = defaultTimerConfig()
  assert(cfg.presetId === DEFAULT_TIMER_PRESET_ID)
  assert(cfg.title === 'Morning Work')
  assert(cfg.durationMinutes === 10)
  assert(cfg.label === '10:00')
})

test('applying a preset updates title/duration/tone', () => {
  const before = defaultTimerConfig()
  assert(before.title === 'Morning Work' && before.durationMinutes === 10)
  const after = timerConfigFromPreset('exitTicket')
  assert(after.title === 'Exit Ticket')
  assert(after.durationMinutes === 5)
  assert(after.tone !== before.tone)
  assert(after.label === '5:00')
})

test('formatTimerDuration formats whole minutes as M:SS', () => {
  assert(formatTimerDuration(10) === '10:00')
  assert(formatTimerDuration(2) === '2:00')
  assert(formatTimerDuration(12) === '12:00')
  assert(formatTimerDuration(120) === '120:00')
})

test('timer preset metadata serializes and parses safely', () => {
  const cfg = sanitizeTimerConfig(validTimerRaw())
  assert(cfg.presetId === 'mathSprint')
  assert(cfg.title === 'Math Sprint')
  assert(cfg.durationMinutes === 5)
  assert(cfg.tone === 'focus')
  assert(cfg.label === '5:00')
})

test('unknown timer keys are removed by sanitization', () => {
  const cfg = sanitizeTimerConfig(validTimerRaw({ extra: 'nope', another: 1 }))
  const keys = Object.keys(cfg).sort()
  assert(
    keys.join(',') ===
      ['durationMinutes', 'kind', 'label', 'presetId', 'title', 'tone'].join(','),
    `whitelist keys only, got ${keys.join(',')}`,
  )
})

test('token/secret-looking timer keys cannot survive sanitization', () => {
  const cfg = sanitizeTimerConfig(
    validTimerRaw({ accessToken: 'SECRET', refreshToken: 'SECRET2', email: 'x@y.z' }),
  )
  assert(!('accessToken' in cfg), 'drops accessToken')
  assert(!('refreshToken' in cfg), 'drops refreshToken')
  assert(!('email' in cfg), 'drops email')
})

test('saved layout carries timer preset fields through round-trip', () => {
  let state = createEmptyBoardState()
  state = saveLayout(state, {
    ...layoutFixture('Timer Board', 'l1'),
    objects: [timerObj('t1', validTimerRaw())],
  })
  const migrated = migrateBoardState(parseBoardStateJson(serializeBoardState(state)))
  assert(migrated !== null)
  const obj = migrated.layouts[0].objects[0]
  assert(obj.kind === 'timer')
  const cfg = obj.config as unknown as TimerConfig
  assert(cfg.presetId === 'mathSprint')
  assert(cfg.title === 'Math Sprint')
  assert(cfg.durationMinutes === 5)
  assert(cfg.tone === 'focus')
})

test('present mode keeps timer student-safe', () => {
  const contaminated = timerObj('t1', validTimerRaw({ accessToken: 'SECRET' }))
  const page: BoardPage = {
    id: 'p1',
    title: 'T',
    background: solidBackground,
    theme: DEFAULT_THEME,
    objects: [contaminated],
  }
  const safe = toSafeBoardPage(page)
  const cfg = safe.objects[0].config as Record<string, unknown>
  assert(!('accessToken' in cfg), 'drops token in present projection')
  assert(cfg.kind === 'timer')
  assert(cfg.title === 'Math Sprint')
  assert(cfg.label === '5:00')
  assert(safeBoardPageHasNoForbiddenKeys(safe))
})

test('corrupt saved timer recovers safely', () => {
  const cfg = sanitizeTimerConfig({
    kind: 'timer',
    presetId: 'bogus',
    durationMinutes: -3,
    tone: 'loud',
    title: '',
  })
  assert(cfg.presetId === 'custom')
  assert(cfg.durationMinutes === 10)
  assert(cfg.tone === 'neutral')
  assert(cfg.title === 'Custom')
  assert(cfg.label === '10:00')
})

// ── Summary ──

console.log(`\nClean Board Tests: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
