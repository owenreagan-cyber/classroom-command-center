/**
 * In-room-test fix (2026-09-26), companion to noise-defense-calibration.spec.ts:
 * if calibration is running and no mic sample has arrived after a few
 * seconds (MIC_SILENT_WARNING_MS), `/control` must say so explicitly
 * instead of leaving Baseline silently at "—" until the full calibration
 * window times out.
 *
 * This test never taps the `/display` mic gesture at all -- it's testing
 * the case where the teacher hasn't (or can't) get to the display yet.
 *
 * Run: npm run test:e2e -- tests/e2e/noise-defense-mic-silent-warning.spec.ts
 */

import { test, expect } from '@playwright/test'

test.describe('Noise Defense — mic-silent warning on /control', () => {
  test('shows "microphone isn\'t running" once calibration gets no samples', async ({ page, context }) => {
    // /display open, but its mic gesture is never tapped in this test.
    const display = await context.newPage()
    await display.goto('/display')
    await display.locator('[data-display-sound-unlock]').click()

    await page.goto('/control')
    await page.locator('[data-noise-defense-control-toggle]').click()
    await expect(page.locator('[data-noise-defense-control-panel]')).toBeVisible()

    await expect(page.locator('[data-noise-defense-mic-silent-warning]')).toHaveCount(0)

    await page.locator('[data-noise-defense-action="calibrate"]').click()
    await expect(page.locator('[data-noise-defense-action="calibrate"]')).toHaveText('Calibrating…')

    // Still under the warning threshold: the ordinary "keep the room quiet"
    // copy shows, not the warning.
    await expect(page.getByText('Keep the room quiet')).toBeVisible()
    await expect(page.locator('[data-noise-defense-mic-silent-warning]')).toHaveCount(0)

    await expect(page.locator('[data-noise-defense-mic-silent-warning]')).toBeVisible({ timeout: 6000 })
    await expect(page.locator('[data-noise-defense-readout="baseline"]')).toHaveText('—')
  })
})
