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

import { DEFAULT_PRIZE_BANK } from '../prize-board/defaultPrizes'
import { generateBoardOutcomes, generateBoardTiles } from './outcomeGenerator'
import { useHundredBoardStore } from './hundredBoardStore'
import type { PrizeSettingsOverride } from '../prize-board/types'

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

const overrides: Record<string, PrizeSettingsOverride> = {}

function runTests() {
  // ═══ Outcome Generation ═══

  const outcomes = generateBoardOutcomes({ prizeBank: DEFAULT_PRIZE_BANK, prizeOverrides: overrides })
  assertEq('HB-01: generates 100 outcomes', outcomes.length, 100)

  // Outcome distribution
  const prizes = outcomes.filter((o) => o.kind === 'prize')
  const tryAgains = outcomes.filter((o) => o.kind === 'tryAgain')
  const whammys = outcomes.filter((o) => o.kind === 'whammy')
  const bonuses = outcomes.filter((o) => o.kind === 'bonus')

  assert('HB-02: has prize outcomes', prizes.length >= 40)
  assert('HB-03: has try-again outcomes', tryAgains.length >= 20)
  assert('HB-04: has whammy outcomes', whammys.length >= 2)
  assert('HB-05: has bonus outcomes', bonuses.length >= 1)

  // No homework pass in outcomes
  const homeworkPassOutcome = outcomes.find((o) =>
    o.prizeId === 'prize-whammy-bait' || o.label.toLowerCase().includes('homework'),
  )
  assert('HB-06: no homework pass outcome', !homeworkPassOutcome)

  // Premium Ultra Rare
  const premiumOutcomes = outcomes.filter((o) => o.rarity === 'premiumUltraRare')
  assert('HB-07: has premiumUltraRare outcomes', premiumOutcomes.length > 0)
  assert('HB-08: premium count <= 4', premiumOutcomes.length <= 4)

  const lunchWithFriend = premiumOutcomes.find((o) => o.prizeId === 'prize-lunch-friend')
  assert('HB-09: Lunch with Friend is premiumUltraRare', Boolean(lunchWithFriend))

  // Very Rare
  const veryRareOutcomes = outcomes.filter((o) => o.rarity === 'veryRare')
  assert('HB-10: has veryRare outcomes', veryRareOutcomes.length > 0)

  const medium3d = outcomes.find((o) => o.prizeId === 'prize-medium-3d')
  assert('HB-11: Medium 3D Print is veryRare', medium3d?.rarity === 'veryRare')

  const teacherChair = outcomes.find((o) => o.prizeId === 'prize-teacher-chair')
  assert('HB-12: Teacher Chair is veryRare', teacherChair?.rarity === 'veryRare')

  // Rare outcomes
  const small3d = outcomes.find((o) => o.prizeId === 'prize-small-3d')
  assert('HB-13: Small 3D Print is rare', small3d?.rarity === 'rare')

  // Common prizes present
  const common = outcomes.filter((o) => o.rarity === 'common')
  assert('HB-14: common prizes present', common.length > 0)

  // Try-again label safety
  for (const ta of tryAgains) {
    assert('HB-15: tryAgain label safe', !ta.displayLabel.toLowerCase().includes('fail')
      && !ta.displayLabel.toLowerCase().includes('bad')
      && !ta.displayLabel.toLowerCase().includes('lose'))
  }

  // Whammy label safety
  for (const wh of whammys) {
    assert('HB-16: whammy label not punitive', !wh.displayLabel.toLowerCase().includes('failure')
      && !wh.displayLabel.toLowerCase().includes('terrible'))
  }

  // No duplicate outcome IDs
  const ids = new Set(outcomes.map((o) => o.id))
  assertEq('HB-17: no duplicate outcome IDs', ids.size, outcomes.length)

  // All outcomes have student-safe displayLabel
  for (const o of outcomes) {
    assert('HB-18: outcome has displayLabel', Boolean(o.displayLabel))
    assert('HB-19: outcome has displayEmoji', Boolean(o.displayEmoji))
  }

  // ═══ Board Tile Generation ═══

  const { tiles } = generateBoardTiles(outcomes)
  assertEq('HB-20: 100 tiles', tiles.length, 100)

  const numbered = tiles.filter((t) => t.outcomeIndex !== null)
  assert('HB-21: all tiles have outcomes', numbered.length === 100)

  // No duplicate tile numbers
  const tileNums = new Set(tiles.map((t) => t.tileNumber))
  assertEq('HB-22: no duplicate tile numbers', tileNums.size, 100)

  // All tiles 1-100
  for (let i = 1; i <= 100; i++) {
    assert('HB-23: tile numbering 1-100', tiles.some((t) => t.tileNumber === i))
  }

  // ═══ Store Integration ═══

  useHundredBoardStore.setState({
    boardId: 'test',
    tiles: Array.from({ length: 100 }, (_, i) => ({
      tileNumber: i + 1, state: 'unopened' as const, outcomeIndex: null, revealedAt: null,
    })),
    outcomes: [],
    activeTileNumber: null,
    revealState: 'idle',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    completedCount: 0,
  })

  // newBoard
  useHundredBoardStore.getState().newBoard(DEFAULT_PRIZE_BANK, {})
  const board = useHundredBoardStore.getState()
  assertEq('HB-24: new board has 100 tiles', board.tiles.length, 100)
  assertEq('HB-25: new board has 100 outcomes', board.outcomes.length, 100)
  assert('HB-26: tiles have outcome indices', board.tiles.every((t) => t.outcomeIndex !== null))
  assertEq('HB-27: no active tile after new', board.activeTileNumber, null)
  assertEq('HB-28: reset completed count', board.completedCount, 0)

  // selectTile
  useHundredBoardStore.getState().selectTile(1)
  assertEq('HB-29: tile 1 selected', useHundredBoardStore.getState().activeTileNumber, 1)
  assertEq('HB-30: tile 1 state is selected', useHundredBoardStore.getState().tiles[0]!.state, 'selected')

  // Deselect by clicking again
  useHundredBoardStore.getState().selectTile(1)
  assertEq('HB-31: deselect sets null', useHundredBoardStore.getState().activeTileNumber, null)

  // Select different tile
  useHundredBoardStore.getState().selectTile(50)
  assertEq('HB-32: tile 50 selected', useHundredBoardStore.getState().activeTileNumber, 50)

  // Cannot select already revealed tile
  // First reveal it
  useHundredBoardStore.getState().revealSelectedTile()
  const revealed = useHundredBoardStore.getState()
  assertEq('HB-33: reveal sets tile 50 to revealed', revealed.tiles[49]!.state, 'revealed')
  assertEq('HB-34: reveal sets completed count', revealed.completedCount, 1)

  // Try selecting revealed tile — should not change state
  useHundredBoardStore.getState().selectTile(50)
  assertEq('HB-35: revealed tile stays revealed', useHundredBoardStore.getState().tiles[49]!.state, 'revealed')

  // markTileClaimed
  useHundredBoardStore.getState().markTileClaimed(50)
  assertEq('HB-36: tile 50 is claimed', useHundredBoardStore.getState().tiles[49]!.state, 'claimed')

  // undoLastReveal
  useHundredBoardStore.getState().selectTile(42)
  useHundredBoardStore.getState().revealSelectedTile()
  assertEq('HB-37: tile 42 revealed', useHundredBoardStore.getState().tiles[41]!.state, 'revealed')

  useHundredBoardStore.getState().undoLastReveal()
  assertEq('HB-38: undo reverts tile 42', useHundredBoardStore.getState().tiles[41]!.state, 'unopened')

  // resetBoard
  useHundredBoardStore.getState().resetBoard(DEFAULT_PRIZE_BANK, {})
  const reset = useHundredBoardStore.getState()
  assertEq('HB-39: reset has 100 tiles', reset.tiles.length, 100)
  assert('HB-40: reset generates new boardId', reset.boardId !== board.boardId)
  assertEq('HB-41: reset clears active tile', reset.activeTileNumber, null)
  assertEq('HB-42: reset zero completed', reset.completedCount, 0)

  // ═══ Display Safe ═══

  useHundredBoardStore.getState().newBoard(DEFAULT_PRIZE_BANK, {})
  useHundredBoardStore.getState().selectTile(25)
  useHundredBoardStore.getState().revealSelectedTile()

  const displayBoard = useHundredBoardStore.getState().getDisplaySafeBoard()
  assertEq('HB-43: display board has 100 tiles', displayBoard.tiles.length, 100)
  assert('HB-44: display board has revealed count', displayBoard.revealedCount >= 1)

  const revealedTile = displayBoard.tiles[24]!
  assertEq('HB-45: revealed tile state is revealed', revealedTile.state, 'revealed')
  assert('HB-46: revealed tile has label', Boolean(revealedTile.label))
  assert('HB-47: revealed tile has displayEmoji', Boolean(revealedTile.displayEmoji))

  // No teacher-only data leaks
  const json = JSON.stringify(displayBoard)
  assert('HB-48: no teacherNote in display board', !json.includes('teacherNote'))
  assert('HB-49: no outcomeKind internals', !json.includes('outcomeKind'))

  // Unrevealed tiles are safe
  const unrevealed = displayBoard.tiles[0]!
  assertEq('HB-50: unrevealed tile is unopened', unrevealed.state, 'unopened')
  assert('HB-51: unrevealed tile has no label', !unrevealed.label)
  assert('HB-52: unrevealed tile has no rarity', !unrevealed.rarity)

  console.log(`\nHundred Board tests: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

runTests()
