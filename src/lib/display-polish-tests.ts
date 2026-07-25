// Phase 9A display polish invariants.
// Run via: bash scripts/test-display-polish.sh

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import { DISPLAY_DESIGN } from '../lib/displayLayout'
import { buildClassWorkspaces } from '../data/pageSequences'
import {
  FULLSCREEN_DENIED_MESSAGE,
  FULLSCREEN_UNAVAILABLE_MESSAGE,
  isBrowserFullscreen,
  requestBrowserFullscreen,
} from '../app/displayFullscreen'

let passed = 0
let failed = 0

function assert(label: string, condition: boolean) {
  if (condition) {
    passed += 1
  } else {
    failed += 1
    console.error(`FAIL: ${label}`)
  }
}

// ── Design tokens ──────────────────────────────────────────
assert('DISPLAY_DESIGN defines title range', DISPLAY_DESIGN.titleRangePx[0] >= 42)
assert('DISPLAY_DESIGN timer minimum', DISPLAY_DESIGN.timerRangePx[0] >= 64)
assert('DISPLAY_DESIGN label minimum', DISPLAY_DESIGN.labelMinPx >= 18)
assert('DISPLAY_DESIGN max primary cards', DISPLAY_DESIGN.maxPrimaryCards >= 3)

// ── Homeroom density ───────────────────────────────────────
const workspaces = buildClassWorkspaces()
const arrival = workspaces.homeroom?.pages.find((p) => p.id === 'homeroom-morning-arrival')
assert('Morning arrival prioritizes do-now only', arrival?.widgets.length === 1)
assert('Morning arrival do-now widget', arrival?.widgets[0]?.type === 'do-now')
assert('Morning arrival uses full-focus layout', arrival?.layoutPreset === 'full-focus')

const silentWork = workspaces.homeroom?.pages.find((p) => p.id === 'homeroom-silent-work')
assert('Silent work keeps timer and materials', silentWork?.widgets.length === 2)

// ── Fullscreen helpers ─────────────────────────────────────
assert('Fullscreen unavailable message documented', FULLSCREEN_UNAVAILABLE_MESSAGE.length > 10)
assert('Fullscreen denied message documented', FULLSCREEN_DENIED_MESSAGE.length > 10)

async function runAsyncTests() {
  const state = { active: false }
  const mockDoc = {
    get fullscreenElement() {
      return state.active ? (mockDoc.documentElement as unknown as Element) : null
    },
    documentElement: {
      requestFullscreen: async () => {
        state.active = true
      },
    },
    exitFullscreen: async () => {
      state.active = false
    },
  } as unknown as Document

  assert('isBrowserFullscreen false initially', !isBrowserFullscreen(mockDoc))
  const result = await requestBrowserFullscreen(mockDoc)
  assert('requestBrowserFullscreen succeeds with API', result.ok === true)
  assert('isBrowserFullscreen true after request', isBrowserFullscreen(mockDoc))

  const noApiDoc = { fullscreenElement: null, documentElement: {} } as unknown as Document
  const unavailable = await requestBrowserFullscreen(noApiDoc)
  assert('requestBrowserFullscreen unavailable without API', !unavailable.ok)

  // Privacy: page model unchanged
  const pageJson = JSON.stringify(workspaces.homeroom?.pages ?? [])
  assert('Pages do not expose activeMysterySessions', !pageJson.includes('activeMysterySessions'))

  console.log(`Display polish tests: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

void runAsyncTests()
