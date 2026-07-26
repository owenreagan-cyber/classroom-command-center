/**
 * Shared helpers for Prize Board projector E2E tests.
 */

import { expect, type Page } from '@playwright/test'

export const PRIZE_BOARD_STORAGE_KEY = 'classroom-prize-board-storage-v1'
export const PRESS_YOUR_LUCK_STORAGE_KEY = 'classroom-press-your-luck-v1'

export const SNAPSHOT_OPTIONS = {
  animations: 'disabled' as const,
  maxDiffPixelRatio: 0.02,
}

/** Classroom iPad landscape — representative teacher control viewport */
export const IPAD_LANDSCAPE_VIEWPORT = { width: 1366, height: 1024 }

const PRIVATE_PATTERNS = [
  'studentId',
  'prizeId',
  'prize-whammy-bait',
  'prize-stamps-3',
  'prize-medium-3d',
  'stu-fix-',
  'SecretStop',
  'data-control-id="secret-stop"',
]

export async function enterEditMode(page: Page) {
  await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Enter edit mode"]') as HTMLButtonElement | null
    btn?.click()
  })
  await expect(page.getByLabel('Studio Canvas toolbar')).toBeVisible()
}

export async function generateHomeroomBoard(page: Page) {
  await page.goto('/control')
  await enterEditMode(page)
  const { openDockTool } = await import('./teacher-dock-e2e')
  await openDockTool(page, 'Prize Board')
  await page.getByRole('button', { name: 'Generate Board' }).click()
  await page.waitForTimeout(200)
}

/** Fixed tile pattern so control-panel snapshots are stable across runs. */
export async function generateDeterministicHomeroomBoard(page: Page) {
  await generateHomeroomBoard(page)
  await page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
    const parsed = JSON.parse(raw) as {
      state?: { boards?: { homeroom?: { tiles?: Array<{ index: number; kind: string; prizeId?: string }> } } }
    }
    const board = parsed.state?.boards?.homeroom
    if (!board?.tiles) return
    board.tiles = board.tiles.map((_, i) => ({
      index: i,
      kind: i % 23 === 0 ? 'prize' : 'empty',
      ...(i % 23 === 0 ? { prizeId: 'prize-stamps-3' } : {}),
    }))
    localStorage.setItem(storageKey, JSON.stringify(parsed))
  }, PRIZE_BOARD_STORAGE_KEY)
  await page.reload()
  await enterEditMode(page)
  await scrollPrizeBoardPanelIntoView(page)
}

export async function seedPressYourLuckState(
  page: Page,
  partial: Record<string, unknown>,
) {
  await page.evaluate(({ key, patch }) => {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) as { state: Record<string, unknown>; version: number } : { state: {}, version: 1 }
    parsed.state = {
      soundEnabled: false,
      remainingSpins: 3,
      maxSpins: 3,
      whammyConfig: { consequence: 'loseSpin', fakeRewardLabel: 'Homework Pass' },
      activePoolKey: 'homeroom',
      phase: 'idle',
      currentSpinCount: 0,
      highlightedTileId: null,
      finalTileId: null,
      spinStartTime: null,
      spinDurationMs: 12000,
      selectedStudentId: null,
      selectedPrizeId: null,
      outcome: null,
      revealExperience: null,
      mysteryPhase: null,
      mysteryInnerPrizeId: null,
      whammyPhase: null,
      testCelebrationRarity: null,
      ...parsed.state,
      ...patch,
      soundEnabled: false,
    }
    localStorage.setItem(key, JSON.stringify(parsed))
  }, { key: PRESS_YOUR_LUCK_STORAGE_KEY, patch: partial })
}

export async function getPressYourLuckPhase(page: Page): Promise<string> {
  return page.evaluate(() => {
    const getter = (window as unknown as { __getPylState?: () => { phase?: string } }).__getPylState
    if (getter) return getter().phase ?? 'idle'
    const raw = localStorage.getItem('classroom-press-your-luck-v1')
    if (!raw) return 'idle'
    const parsed = JSON.parse(raw) as { state?: { phase?: string } }
    return parsed.state?.phase ?? 'idle'
  })
}

export async function getBoardTileKinds(page: Page): Promise<string[]> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as {
      state?: { boards?: { homeroom?: { tiles?: Array<{ kind: string }> } } }
    }
    const tiles = parsed.state?.boards?.homeroom?.tiles ?? []
    return tiles.map((t) => t.kind)
  }, PRIZE_BOARD_STORAGE_KEY)
}

export async function prepareStableProjector(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  })
  await page.evaluate(async () => {
    await document.fonts.ready
  })
}

/** Privacy checks required before every projector snapshot. */
export async function assertProjectorDisplayPrivacy(page: Page) {
  await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Teacher Dock' })).toHaveCount(0)
  await expect(page.getByText('Prize Settings')).toHaveCount(0)
  await expect(page.getByLabel('Stop spin')).toHaveCount(0)
  await expect(page.locator('[data-control-id="secret-stop"]')).toHaveCount(0)
  await expect(page.locator('[data-control-id="start-spin"]')).toHaveCount(0)
  await expect(page.locator('[data-control-id="prize-settings"]')).toHaveCount(0)
  await expect(page.getByText('Mystery Star & Picker')).toHaveCount(0)
  await expect(page.getByLabel('Enter edit mode')).toHaveCount(0)

  const html = await page.content()
  for (const pattern of PRIVATE_PATTERNS) {
    expect(html.includes(pattern), `Display leaked private pattern: ${pattern}`).toBe(false)
  }
}

export async function assertProjectorReadyForSnapshot(page: Page) {
  await expect(page.locator('[data-projector-mode="prize-board"]')).toBeVisible()
  await assertProjectorDisplayPrivacy(page)
  await prepareStableProjector(page)
}

export async function seedPressYourLuckStateLive(
  page: Page,
  partial: Record<string, unknown>,
) {
  await page.evaluate((patch) => {
    const setter = (window as unknown as { __setPylState?: (p: Record<string, unknown>) => void }).__setPylState
    if (!setter) throw new Error('__setPylState dev hook unavailable')
    setter({
      soundEnabled: false,
      remainingSpins: 3,
      maxSpins: 3,
      whammyConfig: { consequence: 'loseSpin', fakeRewardLabel: 'Homework Pass' },
      activePoolKey: 'homeroom',
      phase: 'idle',
      currentSpinCount: 0,
      highlightedTileId: null,
      finalTileId: null,
      spinStartTime: null,
      spinDurationMs: 12000,
      selectedStudentId: null,
      selectedPrizeId: null,
      outcome: null,
      revealExperience: null,
      mysteryPhase: null,
      mysteryInnerPrizeId: null,
      whammyPhase: null,
      testCelebrationRarity: null,
      ...patch,
      soundEnabled: false,
    })
  }, partial)
}

export async function openProjectorDisplay(page: Page, pylPatch: Record<string, unknown>) {
  await generateHomeroomBoard(page)
  await page.goto('/display')
  await page.waitForLoadState('domcontentloaded')
  await seedPressYourLuckStateLive(page, pylPatch)
  await expect(page.locator('[data-projector-mode="prize-board"]')).toBeVisible({ timeout: 10000 })
}

export async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth > doc.clientWidth + 2
  })
  expect(overflow).toBe(false)
}

export function prizeBoardPanelLocator(page: Page) {
  return page.locator('[data-teacher-tool="prize-board"] section').first()
}

export async function scrollPrizeBoardPanelIntoView(page: Page) {
  const { openDockTool } = await import('./teacher-dock-e2e')
  await openDockTool(page, 'Prize Board')
  await expect(prizeBoardPanelLocator(page)).toBeVisible()
}

export async function prepareStableControl(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  })
  await page.evaluate(async () => {
    await document.fonts.ready
  })
}

/** Teacher control Prize Board usability checks for iPad landscape. */
export async function assertControlPrizeBoardUsability(page: Page) {
  await expect(page.locator('[data-teacher-command-dock]')).toBeVisible()
  await scrollPrizeBoardPanelIntoView(page)

  const startSpin = page.locator('[data-control-id="start-spin"]')
  const soundToggle = page.locator('[data-control-id="sound-toggle"]')
  const remainingSpins = page.getByRole('spinbutton')

  await expect(startSpin).toBeVisible()
  await expect(soundToggle).toBeVisible()
  await expect(remainingSpins).toBeVisible()

  await expect(startSpin).toBeEnabled()

  const startBox = await startSpin.boundingBox()
  const soundBox = await soundToggle.boundingBox()
  expect(startBox, 'Start Spin should have layout box').not.toBeNull()
  expect(soundBox, 'Sound toggle should have layout box').not.toBeNull()

  if (startBox && soundBox) {
    expect(startBox.width).toBeGreaterThan(0)
    expect(startBox.height).toBeGreaterThan(0)
    expect(soundBox.width).toBeGreaterThan(0)
    expect(soundBox.height).toBeGreaterThan(0)
  }
}

export async function assertSecretStopZoneReachable(page: Page) {
  const stopBtn = page.getByLabel('Stop spin')
  await expect(stopBtn).toBeAttached()
  const box = await stopBtn.boundingBox()
  expect(box, 'Secret stop zone should be positioned').not.toBeNull()
  if (!box) return

  const viewport = page.viewportSize()
  expect(viewport).not.toBeNull()
  if (!viewport) return

  expect(box.x + box.width).toBeGreaterThan(viewport.width * 0.7)
  expect(box.y + box.height).toBeGreaterThan(viewport.height * 0.7)
}

export async function assertControlReadyForSnapshot(page: Page) {
  await scrollPrizeBoardPanelIntoView(page)
  await assertNoHorizontalOverflow(page)
  await prepareStableControl(page)
}
