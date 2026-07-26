/**
 * Phase 12C.1 — Playwright screenshot baselines for Prize Board projector /display.
 *
 * Run: npm run test:prize-board-projector-snapshots
 * Update baselines: npx playwright test tests/e2e/prize-board-projector-snapshots.spec.ts --update-snapshots
 */

import { test, expect } from '@playwright/test'
import {
  SNAPSHOT_OPTIONS,
  assertProjectorReadyForSnapshot,
  openProjectorDisplay,
} from './helpers/prize-board-e2e'

const VIEWPORT = { width: 1920, height: 1080 }

test.describe('Phase 12C.1 Prize Board projector snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT)
  })

  test('/display default Prize Board projector', async ({ page }) => {
    await openProjectorDisplay(page, {
      phase: 'spinning',
      highlightedTileId: 12,
      finalTileId: 42,
      spinStartTime: Date.now(),
      spinDurationMs: 300_000,
      currentSpinCount: 1,
      remainingSpins: 2,
    })

    await expect(page.getByText('Press Your Luck')).toBeVisible()
    await expect(page.locator('[role="grid"][aria-label="Prize board"]')).toBeVisible()
    await assertProjectorReadyForSnapshot(page)

    await expect(page).toHaveScreenshot('display-prize-board-default-1920x1080.png', SNAPSHOT_OPTIONS)
  })

  test('/display during spinning mode', async ({ page }) => {
    await openProjectorDisplay(page, {
      phase: 'spinning',
      highlightedTileId: 67,
      finalTileId: 88,
      spinStartTime: Date.now() - 500,
      spinDurationMs: 300_000,
      currentSpinCount: 2,
      remainingSpins: 1,
    })

    await expect(page.getByText('Spinning…')).toBeVisible()
    await assertProjectorReadyForSnapshot(page)

    await expect(page).toHaveScreenshot('display-prize-board-spinning-1920x1080.png', SNAPSHOT_OPTIONS)
  })

  test('/display rare prize reveal', async ({ page }) => {
    await openProjectorDisplay(page, {
      phase: 'celebrating',
      finalTileId: 15,
      highlightedTileId: 15,
      currentSpinCount: 1,
      revealExperience: 'rare',
      outcome: {
        kind: 'prize',
        tileIndex: 15,
        prizeLabel: 'Lunch with Friend',
        prizeRarity: 'rare',
      },
    })

    await expect(page.getByText('Lunch with Friend')).toBeVisible()
    await assertProjectorReadyForSnapshot(page)

    await expect(page).toHaveScreenshot('display-prize-board-rare-reveal-1920x1080.png', SNAPSHOT_OPTIONS)
  })

  test('/display legendary prize reveal', async ({ page }) => {
    await openProjectorDisplay(page, {
      phase: 'celebrating',
      finalTileId: 3,
      highlightedTileId: 3,
      currentSpinCount: 1,
      revealExperience: 'legendary',
      outcome: {
        kind: 'prize',
        tileIndex: 3,
        prizeLabel: 'Medium 3D Print',
        prizeRarity: 'legendary',
      },
    })

    await expect(page.getByText('Medium 3D Print')).toBeVisible()
    await assertProjectorReadyForSnapshot(page)

    await expect(page).toHaveScreenshot('display-prize-board-legendary-reveal-1920x1080.png', SNAPSHOT_OPTIONS)
  })

  test('/display Whammy reveal', async ({ page }) => {
    await openProjectorDisplay(page, {
      phase: 'revealing',
      finalTileId: 20,
      highlightedTileId: 20,
      currentSpinCount: 1,
      whammyPhase: 'message',
      outcome: {
        kind: 'whammy',
        tileIndex: 20,
        prizeLabel: 'Homework Pass',
      },
    })

    await expect(page.getByText('Whammy!')).toBeVisible()
    await expect(page.getByText('Your prize has been stolen!')).toBeVisible()
    await assertProjectorReadyForSnapshot(page)

    await expect(page).toHaveScreenshot('display-prize-board-whammy-reveal-1920x1080.png', SNAPSHOT_OPTIONS)
  })
})
