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
  sanitizeSavedLayout,
  serializeBoardState,
} from './storage/boardSerialization'
import { migrateBoardState } from './storage/boardMigrations'
import {
  deleteLayout,
  deleteScene,
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
  SavedLayout,
} from './types'
import {
  describeWakeLockStatus,
  isWakeLockSupported,
  shouldReacquire,
} from './wakeLockState'

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
    objects: [obj('a', 1)],
    teacherNotes: 'private',
  }
  const safe = toSafeBoardPage(page)
  assert(!('teacherNotes' in safe))
  assert(safeBoardPageHasNoForbiddenKeys(safe))
})

// ── Summary ──

console.log(`\nClean Board Tests: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
