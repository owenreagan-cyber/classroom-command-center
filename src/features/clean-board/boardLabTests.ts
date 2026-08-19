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
  sortByLayer,
  toSafeBoardPage,
} from './boardSafety'
import { createSeedBoard } from './seedBoard'
import { BOARD_OBJECT_KINDS } from './types'
import type { BoardObject, BoardPage } from './types'

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

// ── Summary ──

console.log(`\nClean Board Tests: ${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
