/**
 * Phase 12C.1 — Prize Board projector workflow and reliability E2E tests.
 *
 * Run: npm run test:e2e -- tests/e2e/prize-board-projector.spec.ts
 */

import { test, expect } from '@playwright/test'
import {
  assertProjectorDisplayPrivacy,
  enterEditMode,
  generateHomeroomBoard,
  getBoardTileKinds,
  getPressYourLuckPhase,
  seedPressYourLuckState,
  seedPressYourLuckStateLive,
} from './helpers/prize-board-e2e'

test.describe('SecretStopZone workflow', () => {
  test('secret stop ends spin, resolves outcome, and display stays student-safe', async ({ page }) => {
    await generateHomeroomBoard(page)

    await page.getByRole('button', { name: 'Start Spin' }).click()

    await expect.poll(() => getPressYourLuckPhase(page)).toBe('spinning')

    await page.getByLabel('Stop spin').click({ force: true })

    await expect.poll(async () => {
      const phase = await getPressYourLuckPhase(page)
      return phase !== 'spinning' && phase !== 'stopping'
    }, { timeout: 15000 }).toBe(true)

    const finalPhase = await getPressYourLuckPhase(page)
    expect(['revealing', 'celebrating', 'miss']).toContain(finalPhase)

    const finalTileId = await page.evaluate(() => {
      const getter = (window as unknown as { __getPylState?: () => { finalTileId?: number | null } }).__getPylState
      if (getter) return getter().finalTileId ?? null
      return null
    })
    expect(finalTileId).not.toBeNull()

    await page.goto('/display')
    await assertProjectorDisplayPrivacy(page)
    await expect(page.locator('[data-projector-mode="prize-board"]')).toBeVisible()
  })
})

test.describe('Interrupted spin recovery', () => {
  test('reload during spin resets without auto-winner and board stays intact', async ({ page }) => {
    await generateHomeroomBoard(page)
    const kindsBefore = await getBoardTileKinds(page)

    await seedPressYourLuckState(page, {
      phase: 'spinning',
      finalTileId: 42,
      highlightedTileId: 30,
      spinStartTime: Date.now() - 3000,
      spinDurationMs: 12000,
      currentSpinCount: 1,
      remainingSpins: 2,
    })

    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(500)

    const phaseAfter = await getPressYourLuckPhase(page)
    expect(phaseAfter).toBe('ready')

    const recovered = await page.evaluate(() => {
      const getter = (window as unknown as { __getPylState?: () => {
        finalTileId?: number | null
        outcome?: unknown
        remainingSpins?: number
      } }).__getPylState
      if (getter) return getter()
      return null
    })

    expect(recovered?.finalTileId ?? null).toBeNull()
    expect(recovered?.outcome ?? null).toBeNull()
    expect(recovered?.remainingSpins).toBe(3)

    const kindsAfter = await getBoardTileKinds(page)
    expect(kindsAfter).toEqual(kindsBefore)

    await enterEditMode(page)
    await page.getByRole('button', { name: 'Start Spin' }).click()
    await expect.poll(() => getPressYourLuckPhase(page)).toBe('spinning')
  })

  test('teacher reset spin clears active projector state', async ({ page }) => {
    await generateHomeroomBoard(page)

    await seedPressYourLuckStateLive(page, {
      phase: 'celebrating',
      revealExperience: 'rare',
      outcome: { kind: 'prize', tileIndex: 0, prizeLabel: 'Test', prizeRarity: 'rare' },
    })

    await enterEditMode(page)
    await page.getByRole('button', { name: 'Reset Spin' }).click()

    const phase = await getPressYourLuckPhase(page)
    expect(phase).toBe('idle')

    await page.goto('/display')
    await expect(page.locator('[data-projector-mode="prize-board"]')).toHaveCount(0)
    await expect(page.locator('.board-canvas')).toBeVisible()
  })
})

test.describe('Projector display privacy', () => {
  test('/display projector hides all teacher-only controls', async ({ page }) => {
    await generateHomeroomBoard(page)
    await page.goto('/display')
    await seedPressYourLuckStateLive(page, {
      phase: 'spinning',
      highlightedTileId: 5,
      finalTileId: 10,
      spinStartTime: Date.now(),
      spinDurationMs: 300_000,
      currentSpinCount: 1,
    })

    await expect(page.locator('[data-projector-mode="prize-board"]')).toBeVisible()
    await assertProjectorDisplayPrivacy(page)
  })
})
