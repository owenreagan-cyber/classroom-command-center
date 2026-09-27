/**
 * Real-room fix (2026-09-26), companion to noise-defense-calibration.spec.ts:
 * a calibration where the mic is genuinely engaged but only ever hears
 * (near-)silence for the whole window must be rejected -- Baseline stays
 * unset and `/control` shows a clear message -- rather than silently
 * accepting an implausible baseline the way the original real-room bug did
 * (baseline landed at -91 dB against an actual ~-48 dB room, then struck 20
 * times in 2 minutes of ordinary room noise).
 *
 * `--use-fake-device-for-media-stream` alone (no `--use-file-for-fake-
 * audio-capture`) captures literal digital silence, which is exactly this
 * case -- unlike noise-defense-calibration.spec.ts's positive-path test,
 * this one deliberately does NOT feed a real "room" fixture file.
 *
 * This is distinct from noise-defense-mic-silent-warning.spec.ts, which
 * covers the mic gesture never being tapped at all (no session opened).
 * Here the gesture IS tapped and the mic IS running; it just never hears
 * anything above the digital floor.
 *
 * Run: npm run test:e2e -- tests/e2e/noise-defense-calibration-rejects-silence.spec.ts
 */

import { test, expect } from '@playwright/test'
import { readEngine } from './helpers/noise-defense-e2e'

test.use({
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
})

test.describe('Noise Defense — real calibration rejects real silence', () => {
  test('mic genuinely engaged but hearing only silence is rejected with a clear message', async ({ page, context }) => {
    await context.grantPermissions(['microphone'])

    const display = await context.newPage()
    await display.goto('/display')
    await display.locator('[data-display-sound-unlock]').click()

    await page.goto('/control')
    await page.locator('[data-noise-defense-control-toggle]').click()
    await page.locator('[data-noise-defense-action="calibrate"]').click()

    await expect(display.locator('[data-noise-defense-mic-gesture]')).toBeVisible({ timeout: 5000 })
    await display.locator('[data-noise-defense-mic-gesture]').click()

    // The mic genuinely engaged (unlike the mic-silent-warning spec, which
    // never taps the gesture at all) — so this must NOT show that warning.
    await expect(page.locator('[data-noise-defense-mic-silent-warning]')).toHaveCount(0)

    // Calibration window is 7s -- it must end with a rejection, not a
    // baseline, once it's had the full window to try.
    await expect
      .poll(async () => (await readEngine(page)).status, { timeout: 9000 })
      .toBe('idle')

    const { baselineDb } = await readEngine(page)
    expect(baselineDb).toBeNull()
    await expect(page.locator('[data-noise-defense-calibration-rejected]')).toBeVisible()
    await expect(page.locator('[data-noise-defense-readout="baseline"]')).toHaveText('—')
    await expect(page.locator('[data-noise-defense-action="start"]')).toBeDisabled()
  })
})
