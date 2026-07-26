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

import { filterTitlesForPool, getRecentTitleIds, pickTitleForPool } from '../titles/titleBank'
import { DEFAULT_TITLE_BANK, HOMEROOM_TITLES, MATH_TITLES, READING_TITLES, SHARED_TITLES } from '../titles/defaultTitles'
import type { TitleUsageEntry } from '../titles/types'
import { DEFAULT_PRIZE_BANK, MYSTERY_BOX_PRIZE_ID, OMITTED_PRIZE_IDS } from '../prize-board/defaultPrizes'
import {
  getActivePrizes,
  getMysteryEligiblePrizes,
  isMysteryBoxPrize,
  isValidPrizeRarity,
} from '../prize-board/prizeBank'
import { boardUsesStableIds, createEmptyBoardSession, generateBoardTiles } from '../prize-board/boardGenerator'
import { boardSnapshotHasNoStudentIds, toDisplaySafeBoardSnapshot } from '../prize-board/displaySafe'
import { PRIZE_BOARD_SIZE } from '../prize-board/types'
import { generateBoardForPool, PRIZE_BOARD_STORAGE_KEY, usePrizeBoardStore } from '../prize-board/prizeBoardStore'
import type { PrizeBoardSession, PrizeBoardTile } from '../prize-board/types'
import { usePickerStore } from '../student-picker/pickerStore'
import { displaySnapshotIsPrivateFree, getDisplayGameStatus } from '../prize-board/pressYourLuck/displayPrivacy'
import {
  advanceRevealState,
  createInitialPressYourLuckState,
  PRESS_YOUR_LUCK_STORAGE_KEY,
  recoverInterruptedSpin,
  resetSpinState,
  startSpinTransition,
  transitionAfterSpinComplete,
} from '../prize-board/pressYourLuck/pressYourLuckLogic'
import { usePressYourLuckStore } from '../prize-board/pressYourLuck/pressYourLuckStore'
import {
  buildSpinPath,
  highlightAtElapsed,
  resolveSpinOutcome,
  shouldShowProjectorMode,
} from '../prize-board/pressYourLuck/spinEngine'
import { nextMysteryPhase, isMysteryComplete } from '../prize-board/pressYourLuck/mysteryReveal'
import { nextWhammyPhase, applyWhammyConsequence } from '../prize-board/pressYourLuck/whammyState'
import { rarityToRevealExperience } from '../prize-board/pressYourLuck/types'

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

const FAKE_PREFERRED_STUDENTS = [
  { id: 'stu-fix-ren', displayName: 'Ren' },
  { id: 'stu-fix-jo', displayName: 'Jo' },
  { id: 'stu-fix-sam', displayName: 'Sam' },
] as const

function reloadPrizeBoardFromStorage() {
  const raw = localStorage.getItem(PRIZE_BOARD_STORAGE_KEY)
  if (!raw) return
  const parsed = JSON.parse(raw) as { state?: Record<string, unknown> }
  const restored = (parsed.state ?? parsed) as Record<string, unknown>

  usePrizeBoardStore.setState({
    prizeBank: DEFAULT_PRIZE_BANK,
    prizeOverrides: {},
    boards: { homeroom: null, math: null, reading: null, 'reading:RM4': null, 'reading:SM5': null },
  })
  if (restored.prizeBank) {
    usePrizeBoardStore.setState({ prizeBank: restored.prizeBank as typeof DEFAULT_PRIZE_BANK })
  }
  if (restored.prizeOverrides) {
    usePrizeBoardStore.setState({ prizeOverrides: restored.prizeOverrides as Record<string, { active?: boolean }> })
  }
  if (restored.boards) {
    usePrizeBoardStore.setState({ boards: restored.boards as Record<string, PrizeBoardSession | null> })
  }
}

function tileSnapshot(tiles: PrizeBoardTile[]) {
  return tiles.map((t) => ({
    index: t.index,
    kind: t.kind,
    studentId: t.studentId,
    studentDisplayName: t.studentDisplayName,
    prizeId: t.prizeId,
    revealedPrizeId: t.revealedPrizeId,
    revealedAt: t.revealedAt,
  }))
}

function runTests() {
  // Title bank counts
  assertEq('TB-01: homeroom title count', HOMEROOM_TITLES.length, 30)
  assertEq('TB-02: reading title count', READING_TITLES.length, 30)
  assertEq('TB-03: math title count', MATH_TITLES.length, 30)
  assertEq('TB-04: shared title count', SHARED_TITLES.length, 20)

  // Class lock filtering
  const hrEligible = filterTitlesForPool(DEFAULT_TITLE_BANK, 'homeroom')
  assert('TB-05: homeroom gets homeroom titles', hrEligible.some((t) => t.id === 'hr-morning-mvp'))
  assert('TB-06: homeroom gets shared titles', hrEligible.some((t) => t.id === 'shared-high-flier'))
  assert('TB-07: homeroom excludes reading-only', !hrEligible.some((t) => t.id === 'rd-word-wizard'))

  const mathEligible = filterTitlesForPool(DEFAULT_TITLE_BANK, 'math')
  assert('TB-08: math gets math titles', mathEligible.some((t) => t.id === 'math-ninja'))
  assert('TB-09: math excludes homeroom-only', !mathEligible.some((t) => t.id === 'hr-morning-mvp'))

  const readingEligible = filterTitlesForPool(DEFAULT_TITLE_BANK, 'reading:RM4')
  assert('TB-10: reading pool gets reading titles', readingEligible.some((t) => t.id === 'rd-word-wizard'))
  assert('TB-11: shared across reading section', readingEligible.some((t) => t.id === 'shared-super-scholar'))

  // Recent title avoidance
  const usage: TitleUsageEntry[] = [
    { titleId: 'hr-morning-mvp', titleLabel: 'Morning MVP', poolKey: 'homeroom', timestamp: Date.now() },
  ]
  const recent = getRecentTitleIds(usage, 'homeroom')
  assert('TB-12: recent title tracked', recent.has('hr-morning-mvp'))

  let avoidCount = 0
  for (let i = 0; i < 20; i++) {
    const picked = pickTitleForPool('homeroom', usage, { rng: () => 0.5 })
    if (picked?.id !== 'hr-morning-mvp') avoidCount++
  }
  assert('TB-13: recent titles avoided when alternatives exist', avoidCount >= 15)

  // Shared titles usable across pools
  const hrPick = pickTitleForPool('homeroom', [], { rng: () => 0.01 })
  const mathPick = pickTitleForPool('math', [], { rng: () => 0.01 })
  assert('TB-14: homeroom pick exists', hrPick !== null)
  assert('TB-15: math pick exists', mathPick !== null)

  // Prize bank
  assert('PB-01: default bank has prizes', DEFAULT_PRIZE_BANK.length >= 12)
  const active = getActivePrizes(DEFAULT_PRIZE_BANK, {})
  assert('PB-02: active prizes include Medium 3D Print', active.some((p) => p.id === 'prize-medium-3d'))
  assert('PB-03: active prizes include Mystery Box', active.some((p) => p.id === MYSTERY_BOX_PRIZE_ID))
  assert('PB-04: Teacher Chair inactive', !active.some((p) => p.id === 'prize-teacher-chair'))
  assert('PB-05: Teacher Chair in bank inactive', DEFAULT_PRIZE_BANK.find((p) => p.id === 'prize-teacher-chair')?.active === false)

  for (const omitted of OMITTED_PRIZE_IDS) {
    assert(`PB-06: omitted ${omitted}`, !DEFAULT_PRIZE_BANK.some((p) => p.id === omitted))
  }

  assert('PB-07: No Shoes Pass uncommon', DEFAULT_PRIZE_BANK.find((p) => p.id === 'prize-no-shoes')?.rarity === 'uncommon')

  for (const prize of DEFAULT_PRIZE_BANK) {
    assert(`PB-08: valid rarity ${prize.id}`, isValidPrizeRarity(prize.rarity))
  }

  // Mystery Box container
  assert('PB-09: Mystery Box is container category', DEFAULT_PRIZE_BANK.find((p) => p.id === MYSTERY_BOX_PRIZE_ID)?.category === 'container')
  assert('PB-10: isMysteryBoxPrize', isMysteryBoxPrize(MYSTERY_BOX_PRIZE_ID))
  const mysteryEligible = getMysteryEligiblePrizes(DEFAULT_PRIZE_BANK, {})
  assert('PB-11: mystery eligible excludes container', !mysteryEligible.some((p) => p.id === MYSTERY_BOX_PRIZE_ID))
  assert('PB-12: +3 Stamps mystery eligible', mysteryEligible.some((p) => p.id === 'prize-stamps-3'))
  assert('PB-13: Small 3D Print mystery eligible', mysteryEligible.some((p) => p.id === 'prize-small-3d'))

  // Board generation
  const empty = createEmptyBoardSession('homeroom')
  assertEq('BB-01: empty board 100 tiles', empty.tiles.length, PRIZE_BOARD_SIZE)

  const generated = generateBoardTiles(DEFAULT_PRIZE_BANK, {}, {
    studentIds: [
      { id: 'stu-a', displayName: 'Alex' },
      { id: 'stu-b', displayName: 'Jordan' },
    ],
    rng: () => 0.42,
  })
  assertEq('BB-02: generated board 100 tiles', generated.length, PRIZE_BOARD_SIZE)
  assert('BB-03: has prize tiles', generated.some((t) => t.kind === 'prize'))
  assert('BB-04: student tile uses displayName', generated.some((t) => t.studentDisplayName === 'Alex' || t.studentDisplayName === 'Jordan'))
  assert('BB-05: student tile uses stable id', generated.some((t) => t.studentId === 'stu-a' || t.studentId === 'stu-b'))
  assert('BB-06: stable ids on assigned tiles', boardUsesStableIds(generated))

  // Pool independence
  usePrizeBoardStore.setState({
    prizeBank: DEFAULT_PRIZE_BANK,
    prizeOverrides: {},
    boards: { homeroom: null, math: null, reading: null, 'reading:RM4': null, 'reading:SM5': null },
  })
  usePrizeBoardStore.getState().generateBoard('homeroom')
  usePrizeBoardStore.getState().generateBoard('math')
  const hrBoard = usePrizeBoardStore.getState().boards['homeroom']
  const mathBoard = usePrizeBoardStore.getState().boards['math']
  assert('BB-07: homeroom board exists', hrBoard !== null)
  assert('BB-08: math board exists', mathBoard !== null)
  assert('BB-09: boards are independent', hrBoard!.id !== mathBoard!.id)

  // Display safe
  const session = createEmptyBoardSession('homeroom')
  session.tiles[0] = {
    index: 0,
    kind: 'revealed',
    prizeId: 'prize-stamps-3',
    studentDisplayName: 'Alex',
    revealedAt: Date.now(),
  }
  const labels = new Map([['prize-stamps-3', { label: '+3 Stamps', rarity: 'common' }]])
  const snapshot = toDisplaySafeBoardSnapshot(session, labels)
  assert('DS-01: snapshot exists', snapshot !== null)
  assertEq('DS-02: revealed count', snapshot!.revealedTiles.length, 1)
  assert('DS-03: no student ids in snapshot', boardSnapshotHasNoStudentIds(snapshot))

  // Mystery Star title integration
  usePickerStore.setState({
    students: [],
    fairnessHistory: [],
    titleUsageHistory: [],
    activeMysterySessions: {
      homeroom: null, math: null, reading: null, 'reading:RM4': null, 'reading:SM5': null,
    },
    settings: { reducedMotion: false, skipAnimation: false },
  })
  usePickerStore.getState().addStudent('Alex', ['homeroom'])
  usePickerStore.getState().addStudent('Jordan', ['homeroom'])
  usePickerStore.getState().addStudent('Casey', ['homeroom'])
  const ids = usePickerStore.getState().students.map((s) => s.id)
  usePickerStore.getState().startMysterySession('homeroom', 'homeroom', '2026-07-25', ids)
  usePickerStore.getState().updateMysterySlot('homeroom', 'high-flier-1', 'earned', 'Great work')
  const slot = usePickerStore.getState().activeMysterySessions['homeroom']!.slots['high-flier-1']!
  assert('MS-01: title assigned on earned', Boolean(slot.assignedTitle))
  assert('MS-02: title id stored', Boolean(slot.assignedTitleId))
  assert('MS-03: title usage recorded', usePickerStore.getState().titleUsageHistory.length >= 1)

  // Prize toggle
  usePrizeBoardStore.getState().setPrizeActive('prize-no-shoes', false)
  const afterToggle = getActivePrizes(DEFAULT_PRIZE_BANK, usePrizeBoardStore.getState().prizeOverrides)
  assert('PB-14: toggle deactivates prize', !afterToggle.some((p) => p.id === 'prize-no-shoes'))

  // Board persistence across reload
  localStorage.clear()
  usePrizeBoardStore.setState({
    prizeBank: DEFAULT_PRIZE_BANK,
    prizeOverrides: {},
    boards: { homeroom: null, math: null, reading: null, 'reading:RM4': null, 'reading:SM5': null },
  })

  generateBoardForPool('homeroom', [], 20)
  const beforeBoard = usePrizeBoardStore.getState().boards['homeroom'] as PrizeBoardSession
  assertEq('BB-P01: generated board has 100 tiles', beforeBoard.tiles.length, PRIZE_BOARD_SIZE)

  const assignIndices = [12, 34, 56] as const
  FAKE_PREFERRED_STUDENTS.forEach((student, i) => {
    usePrizeBoardStore.getState().assignStudentToTile(
      'homeroom',
      assignIndices[i]!,
      student.id,
      student.displayName,
    )
  })

  const afterAssignBoard = usePrizeBoardStore.getState().boards['homeroom'] as PrizeBoardSession
  const prizeTileIndex = afterAssignBoard.tiles.findIndex((t) => t.kind === 'prize')
  assert('BB-P02: prize tile exists to reveal', prizeTileIndex >= 0)
  usePrizeBoardStore.getState().revealTile('homeroom', prizeTileIndex)

  const beforeReload = usePrizeBoardStore.getState().boards['homeroom'] as PrizeBoardSession
  const beforeTiles = tileSnapshot(beforeReload.tiles)
  const beforeRevealed = beforeReload.tiles[prizeTileIndex]!
  const beforeHistoryLen = beforeReload.revealHistory.length

  assert('BB-P03: state persisted to localStorage', localStorage.getItem(PRIZE_BOARD_STORAGE_KEY) !== null)
  reloadPrizeBoardFromStorage()

  const afterBoard = usePrizeBoardStore.getState().boards['homeroom'] as PrizeBoardSession
  const afterTiles = tileSnapshot(afterBoard.tiles)

  assertEq('BB-P04: tile count survives reload', afterBoard.tiles.length, PRIZE_BOARD_SIZE)
  assertEq('BB-P05: full tile snapshot matches', JSON.stringify(afterTiles), JSON.stringify(beforeTiles))

  FAKE_PREFERRED_STUDENTS.forEach((student, i) => {
    const tile = afterBoard.tiles[assignIndices[i]!]!
    assertEq(`BB-P06: student ${i + 1} id persisted`, tile.studentId, student.id)
    assertEq(`BB-P07: student ${i + 1} displayName persisted`, tile.studentDisplayName, student.displayName)
    assert(`BB-P08: student ${i + 1} uses preferred displayName`, tile.studentDisplayName !== student.id)
  })

  const afterRevealed = afterBoard.tiles[prizeTileIndex]!
  assertEq('BB-P09: revealed tile kind persisted', afterRevealed.kind, 'revealed')
  assertEq('BB-P10: revealed prize id persisted', afterRevealed.prizeId, beforeRevealed.prizeId)
  assertEq('BB-P11: reveal history length persisted', afterBoard.revealHistory.length, beforeHistoryLen)

  // ── Press Your Luck (Phase 12C) ─────────────────────────────────────

  // Spin engine
  const path = buildSpinPath(42, { rng: () => 0.5, totalDurationMs: 12000 })
  assert('PYL-01: spin path non-empty', path.length > 10)
  assertEq('PYL-02: path ends on final tile', path[path.length - 1], 42)
  const early = highlightAtElapsed(path, 0, 12000)
  const late = highlightAtElapsed(path, 12000, 12000)
  assertEq('PYL-03: highlight at end is final', late, 42)
  assert('PYL-04: highlight changes over time', early !== late || path.length === 1)

  // Outcome resolution
  const emptyOutcome = resolveSpinOutcome(
    { index: 0, kind: 'empty' },
    DEFAULT_PRIZE_BANK,
    {},
  )
  assertEq('PYL-05: empty tile outcome', emptyOutcome.kind, 'empty')

  const studentOutcome = resolveSpinOutcome(
    { index: 5, kind: 'student', studentId: 'stu-x', studentDisplayName: 'Alex' },
    DEFAULT_PRIZE_BANK,
    {},
  )
  assertEq('PYL-06: student tile outcome', studentOutcome.kind, 'student')
  assertEq('PYL-07: student display name', studentOutcome.studentDisplayName, 'Alex')

  const prizeOutcome = resolveSpinOutcome(
    { index: 10, kind: 'prize', prizeId: 'prize-stamps-3' },
    DEFAULT_PRIZE_BANK,
    {},
  )
  assertEq('PYL-08: prize tile outcome', prizeOutcome.kind, 'prize')
  assertEq('PYL-09: prize rarity mapped', prizeOutcome.prizeRarity, 'common')

  const mysteryOutcome = resolveSpinOutcome(
    { index: 11, kind: 'prize', prizeId: MYSTERY_BOX_PRIZE_ID },
    DEFAULT_PRIZE_BANK,
    {},
  )
  assertEq('PYL-10: mystery box routing', mysteryOutcome.kind, 'mysteryBox')

  const whammyOutcome = resolveSpinOutcome(
    { index: 12, kind: 'prize', prizeId: 'prize-whammy-bait' },
    DEFAULT_PRIZE_BANK,
    {},
  )
  assertEq('PYL-11: whammy routing', whammyOutcome.kind, 'whammy')

  // Rarity mapping
  assertEq('PYL-12: common reveal', rarityToRevealExperience('common'), 'common')
  assertEq('PYL-13: rare reveal', rarityToRevealExperience('rare'), 'rare')
  assertEq('PYL-14: veryRare reveal', rarityToRevealExperience('veryRare'), 'veryRare')
  assertEq('PYL-15: legendary reveal', rarityToRevealExperience('legendary'), 'legendary')

  // State transitions
  let pylState = createInitialPressYourLuckState()
  pylState.remainingSpins = 3
  const tiles = generateBoardTiles(DEFAULT_PRIZE_BANK, {}, { rng: () => 0.3 })
  const spinPatch = startSpinTransition(pylState, 'homeroom', tiles, () => 0.7)
  assert('PYL-16: start spin succeeds', spinPatch !== null)
  assertEq('PYL-17: phase becomes spinning', spinPatch!.phase, 'spinning')
  assertEq('PYL-18: spins decrement', spinPatch!.remainingSpins, 2)

  pylState = { ...pylState, ...spinPatch! }
  const emptyTile = { index: pylState.finalTileId!, kind: 'empty' as const }
  const missPatch = transitionAfterSpinComplete(pylState, emptyTile, DEFAULT_PRIZE_BANK, {})
  assertEq('PYL-19: empty -> miss', missPatch.phase, 'miss')

  const prizeTile = { index: 1, kind: 'prize' as const, prizeId: 'prize-lunch-friend' }
  const revealPatch = transitionAfterSpinComplete(pylState, prizeTile, DEFAULT_PRIZE_BANK, {})
  assertEq('PYL-20: prize -> revealing', revealPatch.phase, 'revealing')
  assertEq('PYL-21: rare experience', revealPatch.revealExperience, 'rare')

  // Mystery sequence
  assertEq('PYL-22: mystery starts announce', nextMysteryPhase(null), 'announce')
  assertEq('PYL-23: mystery -> shake', nextMysteryPhase('announce'), 'shake')
  assert('PYL-24: mystery completes at reveal', isMysteryComplete('reveal'))

  // Whammy sequence
  assertEq('PYL-25: whammy starts fakeReward', nextWhammyPhase(null), 'fakeReward')
  assertEq('PYL-26: whammy -> alarm', nextWhammyPhase('fakeReward'), 'alarm')
  const whammyResult = applyWhammyConsequence('loseSpin', 3)
  assertEq('PYL-27: lose spin consequence', whammyResult.remainingSpins, 2)

  // Projector mode
  assert('PYL-28: projector during spin', shouldShowProjectorMode('spinning'))
  assert('PYL-29: no projector when idle', !shouldShowProjectorMode('idle'))

  // Display privacy
  assert('PYL-30: display status safe', getDisplayGameStatus({ phase: 'spinning', remainingSpins: 2, currentSpinCount: 1 }).length > 0)
  const privateFree = displaySnapshotIsPrivateFree({
    poolKey: 'homeroom',
    tileCount: 100,
    revealedTiles: [{ index: 0, label: '+3 Stamps', isRevealed: true }],
  })
  assert('PYL-31: display snapshot private-free', privateFree)
  assert('PYL-32: snapshot with studentId fails privacy', !displaySnapshotIsPrivateFree({ studentId: 'hidden' }))

  // Store integration
  usePressYourLuckStore.setState(createInitialPressYourLuckState())
  usePressYourLuckStore.getState().setSoundEnabled(false)
  assertEq('PYL-33: sound disabled', usePressYourLuckStore.getState().soundEnabled, false)

  generateBoardForPool('homeroom', [], 20)
  usePressYourLuckStore.setState({ remainingSpins: 2, phase: 'ready' })
  const started = usePressYourLuckStore.getState().startSpin('homeroom', () => 0.5)
  assert('PYL-34: store start spin', started)
  assertEq('PYL-35: store phase spinning', usePressYourLuckStore.getState().phase, 'spinning')

  usePressYourLuckStore.getState().resetSpin()
  const reset = resetSpinState()
  assertEq('PYL-36: reset to idle', reset.phase, 'idle')

  // Advance reveal flow
  pylState = {
    ...createInitialPressYourLuckState(),
    phase: 'revealing',
    revealExperience: 'common',
    outcome: prizeOutcome,
  }
  const celebratePatch = advanceRevealState(pylState)
  assertEq('PYL-37: revealing -> celebrating', celebratePatch.phase, 'celebrating')

  pylState = { ...pylState, phase: 'celebrating' }
  const readyPatch = advanceRevealState(pylState)
  assertEq('PYL-38: celebrating -> ready', readyPatch.phase, 'ready')

  pylState = { ...createInitialPressYourLuckState(), phase: 'miss' }
  const missReadyPatch = advanceRevealState(pylState)
  assertEq('PYL-38b: miss -> ready', missReadyPatch.phase, 'ready')

  assert('PYL-39: pyl storage key set', PRESS_YOUR_LUCK_STORAGE_KEY.includes('press-your-luck'))

  // Interrupted spin recovery
  pylState = {
    ...createInitialPressYourLuckState(),
    phase: 'spinning',
    finalTileId: 42,
    highlightedTileId: 30,
    spinStartTime: Date.now(),
    currentSpinCount: 1,
    remainingSpins: 2,
  }
  const recovery = recoverInterruptedSpin(pylState)
  assert('PYL-40: recovery patch exists', recovery !== null)
  assertEq('PYL-41: recovery -> ready', recovery!.phase, 'ready')
  assertEq('PYL-42: recovery clears final tile', recovery!.finalTileId, null)
  assertEq('PYL-43: recovery refunds spin', recovery!.remainingSpins, 3)
  assertEq('PYL-44: recovery clears outcome', recovery!.outcome, null)
  assert('PYL-45: idle needs no recovery', recoverInterruptedSpin(createInitialPressYourLuckState()) === null)

  console.log(`\nPrize Board tests: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)
}

runTests()
