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
  DEFAULT_IMAGE_FIT,
  IMAGE_ALLOWED_MIME_TYPES,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_DIMENSION,
  createImageObjectFromSafeImage,
  dataUrlByteSize,
  detectImageMimeType,
  imageRejectMessage,
  isAllowedImageMimeType,
  isImageFit,
  isSafeImageDataUrl,
  sanitizeImageAltText,
  sanitizeImageObjectConfig,
  sanitizeLocalImage,
  validateImageFileMetadata,
} from './images'
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
  ImageObjectConfig,
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
import {
  DEFAULT_DISPLAY_MODE_ID,
  DISPLAY_MODE_IDS,
  DISPLAY_MODES,
  getDisplayModeConfig,
  isDisplayModeId,
  projectObjectsForDisplayMode,
  projectPageForDisplayMode,
  sanitizeDisplayModeId,
} from './displayModes'
import {
  DEFAULT_TEMPLATE_ID,
  TEMPLATE_CATEGORIES,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_PACK_IDS,
  TEMPLATE_PACKS,
  createTemplateObjects,
  getTemplatePack,
  isTemplateId,
  sanitizeTemplateId,
  templateToBoardPage,
  templateToSavedLayout,
  templateToScene,
} from './templatePacks'
import type { ClassroomTemplateId } from './templatePacks'

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
    displayModeId: 'custom',
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
    displayModeId: 'focus',
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
  assert(scene.displayModeId === 'focus')
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
    displayModeId: 'custom',
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

// ── DB-4E — safe local image insert + wallpaper upload ──

const VALID_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

function validImageRaw(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: 'localData',
    mimeType: 'image/png',
    dataUrl: VALID_PNG_DATA_URL,
    altText: 'Class mascot',
    byteSize: 68,
    width: 64,
    height: 64,
    ...overrides,
  }
}

function validImageObjectRaw(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: 'image',
    image: validImageRaw(),
    fit: 'contain',
    opacity: 1,
    ...overrides,
  }
}

function imageObj(id: string, raw: Record<string, unknown>): BoardObject {
  return {
    id,
    kind: 'image',
    x: 0,
    y: 0,
    w: 200,
    h: 200,
    rotation: 0,
    locked: false,
    visible: true,
    layer: 5,
    config: raw as unknown as ImageObjectConfig,
  }
}

test('allowed image MIME types pass', () => {
  assert(IMAGE_ALLOWED_MIME_TYPES.length === 3, 'png/jpeg/webp only')
  assert(isAllowedImageMimeType('image/png') === true)
  assert(isAllowedImageMimeType('image/jpeg') === true)
  assert(isAllowedImageMimeType('image/webp') === true)
})

test('disallowed image MIME types fail: SVG, HTML, PDF, HEIC, unknown', () => {
  for (const m of [
    'image/svg+xml',
    'text/html',
    'application/pdf',
    'image/heic',
    'application/octet-stream',
    'image/gif',
    '',
  ]) {
    assert(isAllowedImageMimeType(m) === false, `rejects ${m}`)
  }
  const svg = validateImageFileMetadata({ type: 'image/svg+xml', size: 100 })
  assert(!svg.ok && svg.reason === 'unsupported-type')
  const heic = validateImageFileMetadata({ type: 'image/heic', size: 100 })
  assert(!heic.ok && heic.reason === 'unsupported-type')
})

test('oversized and empty image files are rejected', () => {
  const over = validateImageFileMetadata({ type: 'image/png', size: IMAGE_MAX_BYTES + 1 })
  assert(!over.ok && over.reason === 'oversized')
  const empty = validateImageFileMetadata({ type: 'image/png', size: 0 })
  assert(!empty.ok && empty.reason === 'empty')
  const ok = validateImageFileMetadata({ type: 'image/png', size: 1024 })
  assert(ok.ok === true)
})

test('magic bytes sniff PNG, JPEG, WebP and reject SVG/GIF/HTML', () => {
  assert(detectImageMimeType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) === 'image/png')
  assert(detectImageMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])) === 'image/jpeg')
  const webp = new Uint8Array(12)
  ;[0x52, 0x49, 0x46, 0x46].forEach((b, i) => (webp[i] = b))
  ;[0x57, 0x45, 0x42, 0x50].forEach((b, i) => (webp[8 + i] = b))
  assert(detectImageMimeType(webp) === 'image/webp')
  assert(detectImageMimeType(new Uint8Array([0x3c, 0x73, 0x76, 0x67])) === null, 'rejects <svg')
  assert(detectImageMimeType(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) === null, 'rejects GIF')
  assert(detectImageMimeType(new Uint8Array([0x25, 0x50, 0x44, 0x46])) === null, 'rejects %PDF')
})

test('valid base64 raster data URL is accepted', () => {
  assert(isSafeImageDataUrl(VALID_PNG_DATA_URL) === true)
  const img = sanitizeLocalImage(validImageRaw())
  assert(img !== null)
  assert(img.mimeType === 'image/png')
  assert(img.dataUrl === VALID_PNG_DATA_URL)
  assert(img.altText === 'Class mascot')
  assert(img.byteSize > 0)
  assert(dataUrlByteSize(VALID_PNG_DATA_URL) > 0)
})

test('remote URLs are rejected and dropped', () => {
  assert(isSafeImageDataUrl('https://evil.example/x.png') === false)
  assert(isSafeImageDataUrl('http://evil.example/x.png') === false)
  assert(sanitizeLocalImage(validImageRaw({ dataUrl: 'https://evil.example/x.png' })) === null)
  assert(sanitizeImageObjectConfig({ kind: 'image', image: validImageRaw({ dataUrl: 'https://evil.example/x.png' }) }) === null)
})

test('file paths and asset paths are rejected and dropped', () => {
  assert(isSafeImageDataUrl('/local/photo.png') === false)
  assert(isSafeImageDataUrl('file:///local/photo.png') === false)
  assert(isSafeImageDataUrl('assets/wallpaper.png') === false)
  assert(sanitizeLocalImage(validImageRaw({ dataUrl: '/local/photo.png' })) === null)
})

test('script-looking and HTML/SVG data URLs are rejected', () => {
  assert(isSafeImageDataUrl('data:text/html;base64,PGh0bWw+PC9odG1sPg==') === false)
  assert(isSafeImageDataUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=') === false)
  assert(isSafeImageDataUrl('data:image/png;base64,<script>alert(1)</script>') === false)
  assert(isSafeImageDataUrl('data:image/png,<svg onload=alert(1)>') === false)
  assert(isSafeImageDataUrl('javascript:alert(1)') === false)
})

test('image object config sanitizes to only whitelisted fields', () => {
  const cfg = sanitizeImageObjectConfig(validImageObjectRaw())
  assert(cfg !== null)
  assert(Object.keys(cfg).sort().join(',') === ['fit', 'image', 'kind', 'opacity'].join(','))
  assert(
    Object.keys(cfg.image).sort().join(',') ===
      ['altText', 'byteSize', 'dataUrl', 'height', 'kind', 'mimeType', 'width'].join(','),
  )
})

test('unknown image keys are removed', () => {
  const cfg = sanitizeImageObjectConfig(validImageObjectRaw({ extra: 'nope', another: 1 }))
  assert(cfg !== null)
  assert(!('extra' in cfg) && !('another' in cfg))
  const img = sanitizeLocalImage(validImageRaw({ extra: 'nope' }))
  assert(img !== null && !('extra' in img))
})

test('token/secret-looking fields cannot survive image serialization', () => {
  const cfg = sanitizeImageObjectConfig(
    validImageObjectRaw({ accessToken: 'SECRET', refreshToken: 'SECRET2', email: 'x@y.z' }),
  )
  assert(cfg !== null)
  assert(!('accessToken' in cfg) && !('refreshToken' in cfg) && !('email' in cfg))
  const img = sanitizeLocalImage(validImageRaw({ accessToken: 'SECRET', deviceId: 'd1' }))
  assert(img !== null && !('accessToken' in img) && !('deviceId' in img))
})

test('oversized dimensions are sanitized away', () => {
  const img = sanitizeLocalImage(validImageRaw({ width: IMAGE_MAX_DIMENSION + 1, height: 99999 }))
  assert(img !== null)
  assert(!('width' in img) && !('height' in img), 'out-of-range dimensions dropped')
})

test('image object survives saved layout serialization round-trip', () => {
  let state = createEmptyBoardState()
  state = saveLayout(state, {
    ...layoutFixture('Image Board', 'l1'),
    objects: [imageObj('img1', validImageObjectRaw())],
  })
  const migrated = migrateBoardState(parseBoardStateJson(serializeBoardState(state)))
  assert(migrated !== null)
  const obj = migrated.layouts[0].objects[0]
  assert(obj.kind === 'image')
  const cfg = obj.config as unknown as ImageObjectConfig
  assert(cfg.image.dataUrl === VALID_PNG_DATA_URL)
  assert(cfg.image.altText === 'Class mascot')
  assert(cfg.fit === 'contain')
  assert(cfg.opacity === 1)
})

test('local wallpaper survives background serialization', () => {
  const bg = sanitizeBackground({
    type: 'localImage',
    image: validImageRaw(),
    readabilityOverlay: 'strong',
  })
  assert(bg.type === 'localImage')
  assert(bg.image.dataUrl === VALID_PNG_DATA_URL)
  assert(bg.readabilityOverlay === 'strong')
  assert(effectiveOverlay(bg) === 'strong')
})

test('corrupt local wallpaper falls back to safe preset background', () => {
  const badUrl = sanitizeBackground({ type: 'localImage', image: validImageRaw({ dataUrl: 'https://evil.example/x.png' }) })
  assert(badUrl.type === 'preset' && badUrl.presetId === DEFAULT_BACKGROUND.presetId)
  const badPayload = sanitizeBackground({ type: 'localImage', image: { kind: 'localData', dataUrl: 'data:text/html;base64,PGg=' } })
  assert(badPayload.type === 'preset' && badPayload.presetId === DEFAULT_BACKGROUND.presetId)
  const notImage = sanitizeBackground({ type: 'localImage' })
  assert(notImage.type === 'preset' && notImage.presetId === DEFAULT_BACKGROUND.presetId)
})

test('present projection includes safe image objects', () => {
  const page: BoardPage = {
    id: 'p1',
    title: 'T',
    background: solidBackground,
    theme: DEFAULT_THEME,
    objects: [imageObj('img1', validImageObjectRaw())],
  }
  const safe = toSafeBoardPage(page)
  assert(safe.objects.length === 1)
  assert(safe.objects[0].kind === 'image')
  assert(safeBoardPageHasNoForbiddenKeys(safe))
})

test('present projection strips private fields from image objects', () => {
  const contaminated = imageObj('img1', validImageObjectRaw({ accessToken: 'SECRET', email: 'x@y.z' }))
  const page: BoardPage = {
    id: 'p1',
    title: 'T',
    background: solidBackground,
    theme: DEFAULT_THEME,
    objects: [contaminated],
  }
  const safe = toSafeBoardPage(page)
  const cfg = safe.objects[0].config as Record<string, unknown>
  assert(!('accessToken' in cfg) && !('email' in cfg), 'drops token/email in present projection')
  assert(cfg.kind === 'image')
  const image = cfg.image as Record<string, unknown>
  assert(!('accessToken' in image) && !('email' in image), 'nested image is clean')
})

test('createImageObjectFromSafeImage produces a centered, sized image object', () => {
  const img = sanitizeLocalImage(validImageRaw())
  assert(img !== null)
  const obj = createImageObjectFromSafeImage(img, 'img-x')
  assert(obj.kind === 'image')
  assert(obj.id === 'img-x')
  assert(obj.w > 0 && obj.h > 0)
  assert(obj.x >= 0 && obj.y >= 0)
  assert(obj.x + obj.w <= 1920.01 && obj.y + obj.h <= 1080.01, 'object within canvas bounds')
  assert(obj.config.kind === 'image')
  assert((obj.config as ImageObjectConfig).fit === DEFAULT_IMAGE_FIT)
})

test('image fit and reject-message helpers behave', () => {
  assert(isImageFit('contain') && isImageFit('cover') && isImageFit('fill'))
  assert(!isImageFit('stretch') && !isImageFit(''))
  assert(imageRejectMessage('unsupported-type').length > 0)
  assert(sanitizeImageAltText('Mascot <script>alert(1)</script> https://x.example/y.png') === 'Mascot')
})

test('image object never leaks forbidden keys after round-trip', () => {
  let state = createEmptyBoardState()
  const contaminated = imageObj('img1', validImageObjectRaw({ accessToken: 'SECRET' }))
  state = saveLayout(state, { ...layoutFixture('Img', 'l1'), objects: [contaminated] })
  assert(boardStateHasNoForbiddenKeys(state) === true, 'image payload carries no top-level forbidden keys')
  const migrated = migrateBoardState(parseBoardStateJson(serializeBoardState(state)))
  assert(migrated !== null)
  const cfg = migrated.layouts[0].objects[0].config as Record<string, unknown>
  assert(!('accessToken' in cfg), 'token dropped after round-trip')
})

// ── DB-4F — classroom display modes ──

function kindObj(kind: BoardObject['kind'], id: string): BoardObject {
  return { ...obj(id, 1), kind, config: { kind } as unknown as BoardObject['config'] }
}

test('all display mode presets exist with full config', () => {
  assert(DISPLAY_MODE_IDS.length === 7, 'seven modes: morning, focus, reading, transition, cleanup, assessment, custom')
  for (const id of DISPLAY_MODE_IDS) {
    const cfg = DISPLAY_MODES[id]
    assert(cfg !== undefined, `preset ${id} exists`)
    assert(cfg.id === id)
    assert(typeof cfg.name === 'string' && cfg.name.length > 0)
    assert(typeof cfg.description === 'string' && cfg.description.length > 0)
    assert(typeof cfg.showSpotify === 'boolean')
    assert(typeof cfg.showTimer === 'boolean')
    assert(typeof cfg.showMessageCards === 'boolean')
    assert(typeof cfg.showImages === 'boolean')
    assert(typeof cfg.keepAwakeDefault === 'boolean')
  }
})

test('unknown display mode falls back to custom', () => {
  assert(sanitizeDisplayModeId('bogus') === 'custom')
  assert(sanitizeDisplayModeId(undefined) === 'custom')
  assert(sanitizeDisplayModeId(null) === 'custom')
  assert(sanitizeDisplayModeId(42) === 'custom')
  assert(sanitizeDisplayModeId('assessment') === 'assessment')
  assert(DEFAULT_DISPLAY_MODE_ID === 'custom')
})

test('isDisplayModeId recognizes only known ids', () => {
  for (const id of DISPLAY_MODE_IDS) assert(isDisplayModeId(id) === true, `accepts ${id}`)
  assert(isDisplayModeId('legacyDefault') === false)
  assert(isDisplayModeId('') === false)
  assert(isDisplayModeId(null) === false)
})

test('display mode survives layout save/load round-trip', () => {
  let state = createEmptyBoardState()
  state = saveLayout(state, { ...layoutFixture('Morning', 'l1'), displayModeId: 'morningArrival' })
  const migrated = migrateBoardState(parseBoardStateJson(serializeBoardState(state)))
  assert(migrated !== null)
  assert(migrated.layouts[0].displayModeId === 'morningArrival')
})

test('scene preserves display mode and sanitizes unknown ids', () => {
  let state = createEmptyBoardState()
  state = saveLayout(state, layoutFixture('A', 'l1'))
  state = saveScene(state, { ...sceneFixture('S', 's1', 'l1'), displayModeId: 'assessment' })
  const migrated = migrateBoardState(parseBoardStateJson(serializeBoardState(state)))
  assert(migrated !== null)
  assert(migrated.scenes[0].displayModeId === 'assessment')
  // Unknown id recovers to custom through the scene sanitizer (via round-trip).
  let state2 = createEmptyBoardState()
  state2 = saveLayout(state2, layoutFixture('B', 'l2'))
  state2 = saveScene(state2, { ...sceneFixture('U', 's2', 'l2'), displayModeId: 'bogus' as never })
  const migrated2 = migrateBoardState(parseBoardStateJson(serializeBoardState(state2)))
  assert(migrated2 !== null)
  assert(migrated2.scenes[0].displayModeId === 'custom')
})

test('legacy displayMode placeholder migrates to displayModeId', () => {
  const legacy = sanitizeSavedLayout({
    schemaVersion: BOARD_SCHEMA_VERSION,
    id: 'l1',
    name: 'L',
    kind: 'layout',
    background: { type: 'solid', color: '#000' },
    theme: DEFAULT_THEME,
    objects: [obj('a', 1)],
    displayMode: 'focus',
    createdAt: 1,
    updatedAt: 1,
  })
  assert(legacy !== null)
  assert(legacy.displayModeId === 'focus')
  const legacyDefault = sanitizeSavedLayout({
    schemaVersion: BOARD_SCHEMA_VERSION,
    id: 'l2',
    name: 'L2',
    kind: 'layout',
    background: { type: 'solid', color: '#000' },
    theme: DEFAULT_THEME,
    objects: [obj('a', 1)],
    displayMode: 'default',
    createdAt: 1,
    updatedAt: 1,
  })
  assert(legacyDefault !== null && legacyDefault.displayModeId === 'custom')
})

test('display mode state cannot carry Spotify tokens or private keys', () => {
  const clean = sanitizeSavedLayout({
    schemaVersion: BOARD_SCHEMA_VERSION,
    id: 'l1',
    name: 'L',
    kind: 'layout',
    background: { type: 'solid', color: '#000' },
    theme: DEFAULT_THEME,
    objects: [obj('a', 1)],
    displayModeId: 'morningArrival',
    accessToken: 'SECRET',
    refreshToken: 'SECRET2',
    email: 'x@y.z',
    createdAt: 1,
    updatedAt: 1,
  })
  assert(clean !== null)
  assert(!('accessToken' in clean))
  assert(!('refreshToken' in clean))
  assert(!('email' in clean))
  assert(clean.displayModeId === 'morningArrival')
})

test('Morning Arrival projects spotify/timer/message/image visibility', () => {
  const objs = [
    kindObj('text', 't'),
    kindObj('spotifyNowPlayingPlaceholder', 's'),
    kindObj('timer', 'tm'),
    kindObj('messageCard', 'm'),
    kindObj('image', 'i'),
    kindObj('clock', 'c'),
  ]
  const out = projectObjectsForDisplayMode(objs, 'morningArrival')
  const kinds = out.map((o) => o.kind)
  const expected: BoardObject['kind'][] = [
    'spotifyNowPlayingPlaceholder',
    'timer',
    'messageCard',
    'image',
    'text',
    'clock',
  ]
  for (const k of expected) {
    assert(kinds.includes(k), `morning shows ${k}`)
  }
  assert(out.length === 6)
})

test('Assessment disables Spotify visibility and reduces distractions', () => {
  const objs = [
    kindObj('spotifyNowPlayingPlaceholder', 's'),
    kindObj('timer', 'tm'),
    kindObj('messageCard', 'm'),
    kindObj('image', 'i'),
    kindObj('text', 't'),
  ]
  const out = projectObjectsForDisplayMode(objs, 'assessment')
  assert(!out.some((o) => o.kind === 'spotifyNowPlayingPlaceholder'), 'no spotify in assessment')
  assert(!out.some((o) => o.kind === 'image'), 'no images in assessment')
  assert(out.some((o) => o.kind === 'timer'), 'quiet timer still shown')
  assert(out.some((o) => o.kind === 'messageCard'), 'focus message still shown')
})

test('Transition shows directions and timer, hides spotify/images', () => {
  const objs = [
    kindObj('messageCard', 'm'),
    kindObj('timer', 'tm'),
    kindObj('spotifyNowPlayingPlaceholder', 's'),
    kindObj('image', 'i'),
  ]
  const out = projectObjectsForDisplayMode(objs, 'transition')
  const kinds = out.map((o) => o.kind)
  assert(kinds.includes('messageCard'), 'directions visible')
  assert(kinds.includes('timer'), 'short timer visible')
  assert(!kinds.includes('spotifyNowPlayingPlaceholder'))
  assert(!kinds.includes('image'))
})

test('custom mode shows everything and projection does not mutate input', () => {
  const objs = [
    kindObj('text', 't'),
    kindObj('spotifyNowPlayingPlaceholder', 's'),
    kindObj('image', 'i'),
  ]
  const out = projectObjectsForDisplayMode(objs, 'custom')
  assert(out.length === 3)
  assert(objs.length === 3, 'input array not mutated')
})

test('projectPageForDisplayMode applies recommended background and is teacher-field-free', () => {
  const page: BoardPage = {
    id: 'p1',
    title: 'T',
    background: solidBackground,
    theme: DEFAULT_THEME,
    objects: [obj('a', 1)],
  }
  const projected = projectPageForDisplayMode(toSafeBoardPage(page), 'morningArrival')
  assert(projected.background.type === 'preset')
  assert((projected.background as { presetId: string }).presetId === 'morning-glow')
  assert(!('teacherNotes' in projected))
  assert(!('displayModeId' in projected))
  assert(safeBoardPageHasNoForbiddenKeys(projected))
  const custom = projectPageForDisplayMode(toSafeBoardPage(page), 'custom')
  assert(custom.background.type === 'solid', 'custom preserves authored background')
})

test('display mode config drives scene keep-awake default', () => {
  assert(getDisplayModeConfig('morningArrival').keepAwakeDefault === true)
  assert(getDisplayModeConfig('assessment').keepAwakeDefault === false)
  assert(getDisplayModeConfig('custom').recommendedSceneType === undefined)
  assert(getDisplayModeConfig('transition').recommendedSceneType === 'transition')
})

// ── DB-5A — classroom template packs ──

function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) for (const v of value) collectStrings(v, out)
  else if (value && typeof value === 'object')
    for (const v of Object.values(value as Record<string, unknown>)) collectStrings(v, out)
}

function rectsOverlap(a: BoardObject, b: BoardObject): boolean {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  )
}

const REQUIRED_TEMPLATE_IDS: ClassroomTemplateId[] = [
  'morningArrival',
  'mathWorkshop',
  'readingBlock',
  'writingBlock',
  'independentWork',
  'assessmentMode',
  'cleanup',
  'dismissal',
]

test('all required templates exist with complete, coherent config', () => {
  assert(TEMPLATE_PACK_IDS.length === 8, 'eight templates defined')
  for (const id of REQUIRED_TEMPLATE_IDS) {
    assert((TEMPLATE_PACK_IDS as readonly string[]).includes(id), `catalog includes ${id}`)
    const t = TEMPLATE_PACKS[id]
    assert(t !== undefined, `pack ${id} exists`)
    assert(t.id === id)
    assert(t.name.length > 0 && t.heading.length > 0)
    assert(t.description.length > 0)
    assert(TEMPLATE_CATEGORIES.includes(t.category), `${id} category valid`)
    assert(isDisplayModeId(t.displayModeId), `${id} display mode valid`)
    assert(isBackgroundPresetId(t.backgroundPresetId), `${id} background valid`)
    assert(isBoardThemeId(t.themeId), `${id} theme valid`)
    assert(isMessageCardKind(t.messageCardKind), `${id} message kind valid`)
    assert(t.messageTitle.length > 0 && t.messageBody.length > 0)
    assert(isTimerPresetId(t.timerPresetId), `${id} timer valid`)
    assert(typeof t.includeSpotify === 'boolean')
    assert(typeof t.keepAwakeRecommended === 'boolean')
  }
})

test('template ids sanitize safely and unknown ids fall back', () => {
  assert(isTemplateId('morningArrival') === true)
  assert(isTemplateId('dismissal') === true)
  assert(isTemplateId('bogus') === false)
  assert(isTemplateId('') === false)
  assert(isTemplateId(null) === false)
  assert(sanitizeTemplateId('bogus') === DEFAULT_TEMPLATE_ID)
  assert(sanitizeTemplateId(42) === DEFAULT_TEMPLATE_ID)
  assert(sanitizeTemplateId(undefined) === DEFAULT_TEMPLATE_ID)
  assert(sanitizeTemplateId('assessmentMode') === 'assessmentMode')
  assert(getTemplatePack(sanitizeTemplateId('bogus')).id === DEFAULT_TEMPLATE_ID)
})

test('each template produces a valid BoardPage and SavedLayout', () => {
  for (const id of REQUIRED_TEMPLATE_IDS) {
    const page = templateToBoardPage(getTemplatePack(id))
    assert(page.id.length > 0 && page.title.length > 0, `${id} page id/title`)
    assert(page.background.type === 'preset', `${id} background is preset`)
    assert(isBoardThemeId(page.theme.id), `${id} theme valid`)
    assert(page.objects.length >= 3, `${id} has heading + message + timer`)
    assert(!('teacherNotes' in page), `${id} page has no teacher notes`)

    const layout = templateToSavedLayout(getTemplatePack(id))
    assert(layout.kind === 'layout', `${id} layout kind`)
    assert(layout.schemaVersion === BOARD_SCHEMA_VERSION, `${id} schema version`)
    assert(layout.displayModeId === getTemplatePack(id).displayModeId, `${id} layout mode`)
    assert(layout.objects.length === page.objects.length)
  }
})

test('Morning Arrival creates expected mode, background, message, and timer', () => {
  const t = getTemplatePack('morningArrival')
  const layout = templateToSavedLayout(t)
  assert(layout.displayModeId === 'morningArrival')
  assert(layout.background.type === 'preset' && layout.background.presetId === 'morning-glow')
  const kinds = layout.objects.map((o) => o.kind)
  assert(kinds.includes('messageCard'), 'has message card')
  assert(kinds.includes('timer'), 'has timer')
  assert(kinds.includes('spotifyNowPlayingPlaceholder'), 'has spotify placeholder')
  const card = layout.objects.find((o) => o.kind === 'messageCard')!
  const cfg = card.config as MessageCardConfig
  assert(cfg.cardKind === 'doNow')
  assert(cfg.title === 'Welcome')
  assert(cfg.message.includes('Unpack your bag'))
  const timer = layout.objects.find((o) => o.kind === 'timer')!
  const tcfg = timer.config as TimerConfig
  assert(tcfg.presetId === 'morningWork')
  assert(tcfg.durationMinutes === 10)
  assert(t.keepAwakeRecommended === true)
})

test('Assessment hides distracting elements through its display mode', () => {
  const t = getTemplatePack('assessmentMode')
  const objs = createTemplateObjects(t)
  assert(!objs.some((o) => o.kind === 'spotifyNowPlayingPlaceholder'), 'assessment has no spotify object')
  const projected = projectObjectsForDisplayMode(objs, 'assessment')
  assert(!projected.some((o) => o.kind === 'spotifyNowPlayingPlaceholder'), 'no spotify projected')
  assert(!projected.some((o) => o.kind === 'image'), 'no images projected')
  assert(projected.some((o) => o.kind === 'timer'), 'quiet timer remains')
  assert(projected.some((o) => o.kind === 'messageCard'), 'expectations card remains')
})

test('template-generated objects have unique ids and stay in-bounds', () => {
  for (const id of REQUIRED_TEMPLATE_IDS) {
    const objs = createTemplateObjects(getTemplatePack(id))
    const ids = objs.map((o) => o.id)
    assert(new Set(ids).size === ids.length, `${id} object ids unique`)
    for (const o of objs) {
      assert(o.x >= 0 && o.y >= 0, `${o.id} non-negative origin`)
      assert(o.x + o.w <= 1920.01 && o.y + o.h <= 1080.01, `${o.id} within canvas`)
    }
  }
})

test('template-generated objects do not overlap in default placement', () => {
  for (const id of REQUIRED_TEMPLATE_IDS) {
    const objs = createTemplateObjects(getTemplatePack(id))
    for (let i = 0; i < objs.length; i++) {
      for (let j = i + 1; j < objs.length; j++) {
        assert(!rectsOverlap(objs[i], objs[j]), `${id}: ${objs[i].id} and ${objs[j].id} do not overlap`)
      }
    }
  }
})

test('template state serializes and parses through boardSerialization', () => {
  let state = createEmptyBoardState()
  for (const id of REQUIRED_TEMPLATE_IDS) {
    const t = getTemplatePack(id)
    state = saveLayout(state, templateToSavedLayout(t))
    state = saveScene(state, templateToScene(t))
  }
  const migrated = migrateBoardState(parseBoardStateJson(serializeBoardState(state)))
  assert(migrated !== null)
  assert(migrated.layouts.length === 8)
  assert(migrated.scenes.length === 8)
  assert(boardStateHasNoForbiddenKeys(migrated), 'template state has no forbidden keys')
})

test('template scene saves and restores displayModeId', () => {
  const t = getTemplatePack('assessmentMode')
  const scene = templateToScene(t)
  const layout = templateToSavedLayout(t)
  assert(scene.layoutId === layout.id, 'scene references its template layout')
  let state = createEmptyBoardState()
  state = saveLayout(state, layout)
  state = saveScene(state, scene)
  const migrated = migrateBoardState(parseBoardStateJson(serializeBoardState(state)))
  assert(migrated !== null)
  const restored = migrated.scenes.find((s) => s.id === scene.id)
  assert(restored !== undefined)
  assert(restored.displayModeId === 'assessment')
  assert(restored.keepAwake === false)
  assert(restored.studentSafe === true)
  assert(restored.backgroundPresetId === 'clean-white')
})

test('no template includes remote URLs, file paths, tokens, or secrets', () => {
  const forbidden = /https?:\/\/|file:\/\/|data:image\/svg|\bwww\.|accessToken|refreshToken|clientSecret|deviceId|accountId/i
  for (const id of REQUIRED_TEMPLATE_IDS) {
    const t = getTemplatePack(id)
    const strings: string[] = []
    collectStrings(t, strings)
    collectStrings(templateToBoardPage(t), strings)
    collectStrings(templateToSavedLayout(t), strings)
    collectStrings(templateToScene(t), strings)
    for (const s of strings) {
      assert(!forbidden.test(s), `${id}: no forbidden content in "${s.slice(0, 60)}"`)
    }
    assert(!strings.some((s) => s.startsWith('/') || s.includes('\\')), `${id}: no file paths`)
  }
})

test('present projection of a template board is student-safe', () => {
  for (const id of REQUIRED_TEMPLATE_IDS) {
    const page = templateToBoardPage(getTemplatePack(id))
    const safe = toSafeBoardPage(page)
    assert(safeBoardPageHasNoForbiddenKeys(safe), `${id} safe projection clean`)
    assert(!('teacherNotes' in safe), `${id} no teacher notes in present`)
  }
})

test('template picker is edit-only (gated behind Saved Boards panel)', () => {
  // The picker lives inside SavedBoardsPanel, which is edit-mode-only.
  assert(showTeacherControls('present') === false)
  assert(showTeacherControls('edit') === true)
})

test('iPad responsive layout keeps templates accessible via the Saved Boards tab', () => {
  assert(getCleanBoardEditLayoutMode(820) === 'responsivePanels', 'iPad portrait uses the drawer')
  assert(getCleanBoardEditLayoutMode(1180) === 'responsivePanels', 'iPad landscape uses the drawer')
  const tabs = getCleanBoardEditTabs({ showSpotify: false, showMessageCard: false, showTimer: false })
  assert(tabs.includes('saved'), 'Saved Boards (with templates) tab always present')
  assert(TEMPLATE_CATEGORY_LABELS.daily.length > 0)
})

// ── Summary ──

console.log(`\nClean Board Tests: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
