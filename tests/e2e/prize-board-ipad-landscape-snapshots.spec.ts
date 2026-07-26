/**
 * Phase 12C.1.1 — iPad landscape /control Prize Board snapshot baselines.
 *
 * Run: npm run test:prize-board-projector-snapshots
 * Update baselines: npx playwright test tests/e2e/prize-board-ipad-landscape-snapshots.spec.ts --update-snapshots
 */

import { test, expect } from '@playwright/test'
import {
  IPAD_LANDSCAPE_VIEWPORT,
  SNAPSHOT_OPTIONS,
  assertControlReadyForSnapshot,
  generateDeterministicHomeroomBoard,
  prizeBoardPanelLocator,
  seedPressYourLuckStateLive,
} from './helpers/prize-board-e2e'

test.describe('Phase 12C.1.1 iPad landscape /control Prize Board snapshots', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(IPAD_LANDSCAPE_VIEWPORT)
  })

  test('/control Prize Board idle landscape', async ({ page }) => {
    await generateDeterministicHomeroomBoard(page)
    await assertControlReadyForSnapshot(page)

    const panel = prizeBoardPanelLocator(page)
    await expect(panel).toBeVisible()
    await expect(panel).toHaveScreenshot('control-prize-board-idle-1366x1024.png', SNAPSHOT_OPTIONS)
  })

  test('/control Prize Board spinning landscape', async ({ page }) => {
    await generateDeterministicHomeroomBoard(page)

    await seedPressYourLuckStateLive(page, {
      phase: 'spinning',
      highlightedTileId: 46,
      finalTileId: 46,
      spinStartTime: Date.now(),
      spinDurationMs: 300_000,
      currentSpinCount: 1,
      remainingSpins: 2,
    })

    await assertControlReadyForSnapshot(page)

    const panel = prizeBoardPanelLocator(page)
    await expect(panel).toBeVisible()
    await expect(page.locator('[data-control-id="secret-stop"]')).toBeAttached()
    await expect(panel).toHaveScreenshot('control-prize-board-spinning-1366x1024.png', SNAPSHOT_OPTIONS)
  })
})
