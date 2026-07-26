/**
 * Phase 12C.1.1 — iPad landscape QA for Press Your Luck teacher control workflow.
 *
 * Run: npm run test:e2e -- tests/e2e/prize-board-ipad-landscape.spec.ts
 */

import { test, expect } from '@playwright/test'
import {
  IPAD_LANDSCAPE_VIEWPORT,
  assertControlPrizeBoardUsability,
  assertNoHorizontalOverflow,
  assertProjectorDisplayPrivacy,
  assertSecretStopZoneReachable,
  generateHomeroomBoard,
  getPressYourLuckPhase,
  openProjectorDisplay,
} from './helpers/prize-board-e2e'

test.describe('iPad landscape teacher control', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(IPAD_LANDSCAPE_VIEWPORT)
  })

  test('no horizontal overflow on /control', async ({ page }) => {
    await generateHomeroomBoard(page)
    await assertNoHorizontalOverflow(page)
  })

  test('Prize Board controls are usable at iPad landscape', async ({ page }) => {
    await generateHomeroomBoard(page)
    await assertControlPrizeBoardUsability(page)
    await assertNoHorizontalOverflow(page)
  })

  test('SecretStopZone is reachable during spin', async ({ page }) => {
    await generateHomeroomBoard(page)
    await page.locator('[data-control-id="start-spin"]').click()
    await expect.poll(() => getPressYourLuckPhase(page)).toBe('spinning')
    await assertSecretStopZoneReachable(page)
  })
})

test.describe('iPad landscape /display projector privacy', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(IPAD_LANDSCAPE_VIEWPORT)
  })

  test('projector output stays student-safe at iPad landscape', async ({ page }) => {
    await openProjectorDisplay(page, {
      phase: 'spinning',
      highlightedTileId: 22,
      finalTileId: 55,
      spinStartTime: Date.now(),
      spinDurationMs: 300_000,
      currentSpinCount: 1,
      remainingSpins: 2,
    })

    await assertNoHorizontalOverflow(page)
    await assertProjectorDisplayPrivacy(page)
    await expect(page.locator('[data-projector-mode="prize-board"]')).toBeVisible()
  })
})
