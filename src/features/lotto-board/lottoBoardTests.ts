// Mock localStorage for Node environment
const storage: Record<string, string> = {}
const globalObj = globalThis as Record<string, unknown>
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

import { drawUniqueNumbers, createInitialNumbers, shuffleNumbers } from './drawLogic'
import { useLottoBoardStore } from './lottoBoardStore'

let passed = 0
let failed = 0

function assert(label: string, condition: boolean) {
  if (condition) passed++
  else { failed++; console.error(`FAIL: ${label}`) }
}

function assertEq(label: string, a: unknown, b: unknown) {
  if (a === b) passed++
  else { failed++; console.error(`FAIL: ${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`) }
}

function assertGte(label: string, a: number, b: number) {
  if (a >= b) passed++
  else { failed++; console.error(`FAIL: ${label} — expected >= ${b}, got ${a}`) }
}

function runTests() {
  // ═══ Draw Logic ═══

  const all100 = createInitialNumbers(1, 100)
  assertEq('LB-01: range 1-100 length', all100.length, 100)
  assertEq('LB-02: first number is 1', all100[0], 1)
  assertEq('LB-03: last number is 100', all100[99], 100)

  // Draw unique numbers
  const rng = (() => { let v = 0.1; return () => { v += 0.01; return v % 1 } })()
  const result = drawUniqueNumbers(all100, 5, rng)
  assert('LB-04: draw succeeds', result.ok)
  assertEq('LB-05: draws 5 numbers', result.numbers.length, 5)
  assertEq('LB-06: remaining after 5', result.remainingAfter, 95)
  // All numbers unique
  const unique = new Set(result.numbers)
  assertEq('LB-07: no duplicates in draw', unique.size, result.numbers.length)
  // All in range
  assert('LB-08: numbers in range', result.numbers.every((n) => n >= 1 && n <= 100))

  // Draw from empty pool
  const emptyResult = drawUniqueNumbers([], 5)
  assert('LB-09: draw from empty fails', !emptyResult.ok)
  assertEq('LB-10: empty draw message', emptyResult.message, 'No numbers remaining. Reset the board to draw again.')

  // Draw count <= 0
  const zeroResult = drawUniqueNumbers(all100, 0)
  assert('LB-11: draw 0 fails', !zeroResult.ok)

  // Draw more than available
  const smallPool = [1, 2, 3]
  const overdrawResult = drawUniqueNumbers(smallPool, 10)
  assert('LB-12: overdraw succeeds with available', overdrawResult.ok)
  assertEq('LB-13: overdraw count', overdrawResult.numbers.length, 3)
  assertEq('LB-14: remaining 0 after overdraw', overdrawResult.remainingAfter, 0)

  // Deterministic draw with fixed RNG
  const fixedRng = (() => [0.99, 0.5, 0.01])()
  let fi = 0
  const fixedRngFn = () => { const v = fixedRng[fi % 3]!; fi++; return v }
  const detResult = drawUniqueNumbers([10, 20, 30, 40, 50], 3, fixedRngFn)
  assert('LB-15: deterministic draw', detResult.ok)
  assertEq('LB-16: deterministic count', detResult.numbers.length, 3)

  // shuffle preserves all elements
  const shuffled = shuffleNumbers(all100)
  assertEq('LB-17: shuffle preserves count', shuffled.length, 100)
  const sorted = [...shuffled].sort((a, b) => a - b)
  for (let i = 0; i < 100; i++) assertEq('LB-18: shuffle has all numbers', sorted[i], all100[i])

  // ═══ Store ═══

  useLottoBoardStore.setState({
    boardId: 'test',
    rangeStart: 1, rangeEnd: 100,
    availableNumbers: createInitialNumbers(1, 100),
    pendingNumbers: [],
    usedNumbers: [],
    drawHistory: [],
    weeklyDrawCount: 5,
    lastDrawAt: null,
    updatedAt: Date.now(),
    createdAt: Date.now(),
  })

  // Initialize
  const initial = useLottoBoardStore.getState()
  assertEq('LB-19: initial available count', initial.availableNumbers.length, 100)
  assertEq('LB-20: initial pending empty', initial.pendingNumbers.length, 0)
  assertEq('LB-21: initial used empty', initial.usedNumbers.length, 0)

  // Set weekly draw count
  useLottoBoardStore.getState().setWeeklyDrawCount(8)
  assertEq('LB-22: set draw count to 8', useLottoBoardStore.getState().weeklyDrawCount, 8)

  // Invalid draw count
  const badSet = useLottoBoardStore.getState().setWeeklyDrawCount(0)
  assert('LB-23: draw count 0 fails', !badSet.ok)
  const badSet2 = useLottoBoardStore.getState().setWeeklyDrawCount(101)
  assert('LB-24: draw count 101 fails', !badSet2.ok)

  // Draw numbers
  useLottoBoardStore.getState().setWeeklyDrawCount(5)
  const draw = useLottoBoardStore.getState().drawNumbers()
  assert('LB-25: draw succeeds', draw.ok)
  assertEq('LB-26: draw returns 5 numbers', draw.numbers!.length, 5)
  assertEq('LB-27: pending has 5', useLottoBoardStore.getState().pendingNumbers.length, 5)
  // Available unchanged (pending not confirmed)
  assertEq('LB-28: available still 100', useLottoBoardStore.getState().availableNumbers.length, 100)

  // Draw again without confirming — replaces pending
  useLottoBoardStore.getState().drawNumbers()
  assertEq('LB-29: new pending replaces old', useLottoBoardStore.getState().pendingNumbers.length, 5)

  // Clear pending
  useLottoBoardStore.getState().clearPendingDraw()
  assertEq('LB-30: pending cleared', useLottoBoardStore.getState().pendingNumbers.length, 0)
  assertEq('LB-31: available still 100', useLottoBoardStore.getState().availableNumbers.length, 100)

  // Confirm pending
  useLottoBoardStore.getState().drawNumbers()
  useLottoBoardStore.getState().confirmPendingDraw()
  assertEq('LB-32: pending cleared after confirm', useLottoBoardStore.getState().pendingNumbers.length, 0)
  assert('LB-33: used has numbers', useLottoBoardStore.getState().usedNumbers.length >= 5)
  assertEq('LB-34: available reduced', useLottoBoardStore.getState().availableNumbers.length, 95)
  assertEq('LB-35: history has record', useLottoBoardStore.getState().drawHistory.length, 1)

  // Confirm empty pending does nothing
  useLottoBoardStore.getState().confirmPendingDraw()
  assertEq('LB-36: confirm empty does nothing', useLottoBoardStore.getState().drawHistory.length, 1)

  // Undo last confirm
  useLottoBoardStore.getState().undoLastConfirm()
  assertEq('LB-37: available restored after undo', useLottoBoardStore.getState().availableNumbers.length, 100)
  assertEq('LB-38: used empty after undo', useLottoBoardStore.getState().usedNumbers.length, 0)
  assertEq('LB-39: history empty after undo', useLottoBoardStore.getState().drawHistory.length, 0)

  // Undo when no history
  useLottoBoardStore.getState().undoLastConfirm()
  assertEq('LB-40: undo no history safe', useLottoBoardStore.getState().drawHistory.length, 0)

  // Multiple confirms
  useLottoBoardStore.getState().drawNumbers()
  useLottoBoardStore.getState().confirmPendingDraw()
  useLottoBoardStore.getState().drawNumbers()
  useLottoBoardStore.getState().confirmPendingDraw()
  assertEq('LB-41: 2 confirmations', useLottoBoardStore.getState().drawHistory.length, 2)
  assertEq('LB-42: 10 used', useLottoBoardStore.getState().usedNumbers.length, 10)
  assertEq('LB-43: 90 remaining', useLottoBoardStore.getState().availableNumbers.length, 90)

  // Undo last of two
  useLottoBoardStore.getState().undoLastConfirm()
  assertEq('LB-44: undo one of two', useLottoBoardStore.getState().drawHistory.length, 1)
  assertEq('LB-45: 95 remaining after undo', useLottoBoardStore.getState().availableNumbers.length, 95)

  // Reset
  useLottoBoardStore.getState().resetBoard()
  assertEq('LB-46: reset restores 100', useLottoBoardStore.getState().availableNumbers.length, 100)
  assertEq('LB-47: reset clears used', useLottoBoardStore.getState().usedNumbers.length, 0)
  assertEq('LB-48: reset clears pending', useLottoBoardStore.getState().pendingNumbers.length, 0)
  assertEq('LB-49: reset clears history', useLottoBoardStore.getState().drawHistory.length, 0)

  // All numbers used state
  useLottoBoardStore.setState({
    availableNumbers: [],
    usedNumbers: createInitialNumbers(1, 100),
    pendingNumbers: [],
    drawHistory: [{ id: 'test', numbers: [1], confirmedAt: 0, drawCount: 1, remainingAfter: 0 }],
  })
  const exhausted = useLottoBoardStore.getState().drawNumbers()
  assert('LB-50: draw from empty fails', !exhausted.ok)
  assertEq('LB-51: draw from empty safe msg', exhausted.message, 'No numbers remaining. Reset the board to draw again.')

  useLottoBoardStore.getState().resetBoard()

  // ═══ Display Safety ═══

  useLottoBoardStore.getState().drawNumbers()
  const displaySafe = useLottoBoardStore.getState().getDisplaySafeBoard()
  assert('LB-52: pending in display', displaySafe.pendingNumbers.length > 0)
  assertGte('LB-53: remaining count', displaySafe.remainingCount, 90)
  assertEq('LB-54: drawing status', displaySafe.status, 'drawing')

  // No teacher-only data in display safe
  const json = JSON.stringify(displaySafe)
  assert('LB-55: no boardId in display', !json.includes('boardId'))
  assert('LB-56: no drawHistory in display', !json.includes('drawHistory'))
  assert('LB-57: no availableNumbers in display', !json.includes('availableNumbers'))
  assert('LB-58: no usedNumbers array in display', !json.includes('usedNumbers'))

  // Ready state
  useLottoBoardStore.getState().clearPendingDraw()
  const readyDisplay = useLottoBoardStore.getState().getDisplaySafeBoard()
  assertEq('LB-59: ready status', readyDisplay.status, 'ready')

  // Complete state
  useLottoBoardStore.setState({
    availableNumbers: [],
    usedNumbers: createInitialNumbers(1, 100),
    pendingNumbers: [],
  })
  const completeDisplay = useLottoBoardStore.getState().getDisplaySafeBoard()
  assertEq('LB-60: complete status', completeDisplay.status, 'complete')

  // No private data in display
  const completeJson = JSON.stringify(completeDisplay)
  assert('LB-61: display safe no internal fields teacherNote', !completeJson.includes('teacherNote'))
  assert('LB-62: display safe no draw history', !completeJson.includes('drawHistory'))
  assert('LB-63: display safe no boardId', !completeJson.includes('boardId'))

  // ═══ Integration — Display Studio Widget ═══
  // Verify the widget renderer receives safe data
  const safeBoard = useLottoBoardStore.getState().getDisplaySafeBoard()
  assert('LB-64: display pending numbers', Array.isArray(safeBoard.pendingNumbers))
  assert('LB-65: display remaining count', typeof safeBoard.remainingCount === 'number')
  assert('LB-66: display used count', typeof safeBoard.usedCount === 'number')
  assert('LB-67: display weekly draw count', typeof safeBoard.weeklyDrawCount === 'number')

  console.log(`\nLotto Board tests: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

runTests()
