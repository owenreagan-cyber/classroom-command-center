// Mock localStorage for Node environment
const storage: Record<string, string> = {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalObj = globalThis as any
globalObj.window = globalObj
globalObj.localStorage = {
  getItem: (key: string) => storage[key] || null,
  setItem: (key: string, value: string) => { storage[key] = value },
  removeItem: (key: string) => { delete storage[key] },
  clear: () => { for (const key in storage) delete storage[key] },
  length: 0,
  key: (index: number) => Object.keys(storage)[index] || null,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any

import {
  drawRandomNumber,
  getAvailableValues,
  hydrateRandomNumberState,
  isRangeExhausted,
  parseBoundInput,
  undoLastDraw,
  validateRange,
} from './randomNumberLogic'
import { toDisplaySafeRandomNumberSnapshot, shouldShowRandomNumberDisplay } from './displaySafe'
import { useRandomNumberStore, RANDOM_NUMBER_STORAGE_KEY } from './randomNumberStore'

let passed = 0
let failed = 0

function assert(label: string, condition: boolean) {
  if (condition) passed++
  else {
    failed++
    console.error(`FAIL: ${label}`)
  }
}

function assertEq(label: string, a: unknown, b: unknown) {
  if (a === b) passed++
  else {
    failed++
    console.error(`FAIL: ${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`)
  }
}

function resetStore() {
  localStorage.removeItem(RANDOM_NUMBER_STORAGE_KEY)
  useRandomNumberStore.setState({
    min: 1,
    max: 100,
    preventRepeat: false,
    history: [],
    lastResult: null,
    showOnDisplay: false,
  })
}

function runTests() {
  resetStore()

  // Bounds validation
  assert('RN-01: default range valid', validateRange(1, 100).valid)
  assert('RN-02: min exceeds max invalid', !validateRange(10, 5).valid)
  assertEq('RN-03: empty min parse', parseBoundInput(''), null)
  assertEq('RN-04: non-numeric parse', parseBoundInput('abc'), null)
  assertEq('RN-05: negative parse', parseBoundInput('-3'), -3)
  assertEq('RN-06: truncates decimal', parseBoundInput('3.9'), 3)

  // Single-number range
  const single = drawRandomNumber(5, 5, [], false, () => 0)
  assert('RN-07: single range draws', single.ok && single.value === 5)

  // Draw with repeats
  let seq = 0
  const rng = () => { seq = (seq + 0.37) % 1; return seq }
  const draw1 = drawRandomNumber(1, 3, [], false, rng)
  assert('RN-08: draw succeeds', draw1.ok)
  if (draw1.ok) {
    const history = [{ value: draw1.value, drawnAt: 1 }]
    const draw2 = drawRandomNumber(1, 3, history, false, rng)
    assert('RN-09: repeat mode allows redraw', draw2.ok)
  }

  // No-repeat mode
  const noRepeatHistory = [
    { value: 1, drawnAt: 1 },
    { value: 2, drawnAt: 2 },
  ]
  assert('RN-10: not exhausted yet', !isRangeExhausted(1, 3, noRepeatHistory, true))
  assertEq('RN-11: one remaining', getAvailableValues(1, 3, noRepeatHistory, true).length, 1)
  const exhaustedDraw = drawRandomNumber(1, 2, [
    { value: 1, drawnAt: 1 },
    { value: 2, drawnAt: 2 },
  ], true)
  assert('RN-12: exhausted range blocks draw', !exhaustedDraw.ok)

  // Undo
  const undoResult = undoLastDraw([
    { value: 4, drawnAt: 1 },
    { value: 7, drawnAt: 2 },
  ])
  assertEq('RN-13: undo last result', undoResult.lastResult, 4)
  assertEq('RN-14: undo shortens history', undoResult.history.length, 1)

  // Store integration
  const setBounds = useRandomNumberStore.getState().setBounds
  assert('RN-15: store rejects invalid bounds', !setBounds(50, 10).ok)
  setBounds(1, 5)
  const drawResult = useRandomNumberStore.getState().drawNumber(() => 0)
  assert('RN-16: store draw works', drawResult.ok)
  useRandomNumberStore.getState().setPreventRepeat(true)
  for (let i = 0; i < 5; i++) {
    useRandomNumberStore.getState().drawNumber(() => i / 5)
  }
  assertEq('RN-17: no-repeat fills range', useRandomNumberStore.getState().history.length, 5)
  const blocked = useRandomNumberStore.getState().drawNumber()
  assert('RN-18: store blocks when exhausted', !blocked.ok)

  useRandomNumberStore.getState().undoDraw()
  const afterUndo = useRandomNumberStore.getState().drawNumber(() => 0.99)
  assert('RN-19: undo allows draw again', afterUndo.ok)

  useRandomNumberStore.getState().resetHistory()
  assertEq('RN-20: reset clears history', useRandomNumberStore.getState().history.length, 0)
  assertEq('RN-21: reset clears last result', useRandomNumberStore.getState().lastResult, null)

  // Persistence
  useRandomNumberStore.getState().setBounds(2, 8)
  useRandomNumberStore.getState().drawNumber(() => 0.5)
  const raw = localStorage.getItem(RANDOM_NUMBER_STORAGE_KEY)
  assert('RN-22: persisted to localStorage', Boolean(raw))
  resetStore()
  const hydrated = hydrateRandomNumberState(JSON.parse(raw!).state)
  assertEq('RN-23: hydrate min', hydrated.min, 2)
  assertEq('RN-24: hydrate history length', hydrated.history.length, 1)

  // Display privacy
  assert('RN-25: hidden when not showing', toDisplaySafeRandomNumberSnapshot(42, false) === null)
  assertEq('RN-26: safe snapshot value', toDisplaySafeRandomNumberSnapshot(42, true)?.value, 42)
  assert('RN-27: should show when active', shouldShowRandomNumberDisplay(7, true))
  assert('RN-28: should not show without result', !shouldShowRandomNumberDisplay(null, true))

  // Toggle prevent-repeat does not corrupt history
  useRandomNumberStore.getState().setBounds(1, 10)
  useRandomNumberStore.getState().drawNumber(() => 0.1)
  useRandomNumberStore.getState().drawNumber(() => 0.2)
  const histBefore = useRandomNumberStore.getState().history.length
  useRandomNumberStore.getState().setPreventRepeat(true)
  useRandomNumberStore.getState().setPreventRepeat(false)
  assertEq('RN-29: toggle preserve history', useRandomNumberStore.getState().history.length, histBefore)

  console.log(`Random number tests: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

runTests()
