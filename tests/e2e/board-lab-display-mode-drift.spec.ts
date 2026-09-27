/**
 * Real-room fix (2026-09-26, display-mode drift): on a truly fresh session
 * (no saved board state anywhere), `/display` resolves to the default
 * template's `displayModeId` ('morningArrival'). `/board-lab` used to seed
 * its own Display Mode selector from a hardcoded `'custom'` fallback and
 * write an autosave 400ms after every mount regardless of whether the
 * teacher changed anything -- so simply opening `/board-lab` once silently
 * flipped `/display`'s effective screen to "Custom," which was never opted
 * into the Noise Defense HUD the way "Morning Arrival" was.
 *
 * The fix: `BoardLabPage` seeds its Display Mode selector from
 * `loadHostDisplayState()` (the same resolver `/display` itself uses), and
 * its autosave-write effect only fires once `activePage`/`displayModeId`
 * actually differ from what was loaded at mount -- not "skip the very
 * first effect run" (a coarser, less precise guard).
 *
 * Run: npm run test:e2e -- tests/e2e/board-lab-display-mode-drift.spec.ts
 */

import { test, expect } from '@playwright/test'

const AUTOSAVE_KEY = 'clean-board.board.autosave'

test.describe('BoardLabPage — display-mode drift fix', () => {
  test('visiting /board-lab with no edits never writes an autosave, and the Screens tab shows the true default', async ({
    page,
    context,
  }) => {
    const display = await context.newPage()
    await display.goto('/display')

    const boardLab = await context.newPage()
    await boardLab.goto('/board-lab?mode=edit')
    // Past the 400ms debounce, with margin.
    await boardLab.waitForTimeout(800)

    const autosave = await boardLab.evaluate((key) => localStorage.getItem(key), AUTOSAVE_KEY)
    expect(autosave).toBeNull()

    await page.goto('/control')
    await page.locator('[data-noise-defense-control-toggle]').click()
    await page.locator('[data-noise-defense-tab="screens"]').click()
    await expect(page.locator('[data-noise-defense-current-display-mode]')).toHaveText(
      'TV is showing: Morning Arrival',
    )
  })

  test('an actual Display Mode change in /board-lab still writes an autosave, and the Screens tab reflects it', async ({
    page,
    context,
  }) => {
    const boardLab = await context.newPage()
    await boardLab.goto('/board-lab?mode=edit')

    const modeSelect = boardLab.locator('[data-display-mode-select]')
    await expect(modeSelect).toBeVisible()
    await modeSelect.selectOption('focus')
    // Past the 400ms debounce, with margin.
    await boardLab.waitForTimeout(800)

    const autosave = await boardLab.evaluate((key) => localStorage.getItem(key), AUTOSAVE_KEY)
    expect(autosave).not.toBeNull()
    const parsed = JSON.parse(autosave!) as { displayModeId?: string }
    expect(parsed.displayModeId).toBe('focus')

    await page.goto('/control')
    await page.locator('[data-noise-defense-control-toggle]').click()
    await page.locator('[data-noise-defense-tab="screens"]').click()
    await expect(page.locator('[data-noise-defense-current-display-mode]')).toHaveText('TV is showing: Focus')
  })
})
