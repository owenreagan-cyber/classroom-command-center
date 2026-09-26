/**
 * Real-room bug report (2026-09-26): "Calibrate Quiet" never sets Baseline
 * on the M1 (Chrome/Safari, localhost:4180, mic allowed at OS + site
 * level) — it stays "—", so Start stays disabled forever.
 *
 * Root cause (confirmed by reading code, see the investigation report):
 * `NoiseDefenseHUD.tsx`'s render gate hid the mic-gesture button (and the
 * mic-denied banner) behind this screen's HUD opt-in
 * (`allowedOnThisScreen`), which defaults OFF for every screen
 * (`noiseGameStore.ts`'s `hudOptIn: {}`). A teacher who has never visited
 * `/control`'s Screens tab to opt a screen in gets a `/display` that
 * renders nothing at all once calibration starts — no button, no error —
 * so `finishCalibration()` times out after `CALIBRATION_DURATION_MS` with
 * zero samples collected and `baselineDb` stays `null` forever.
 *
 * This test drives the REAL flow end to end with no `addInitScript`
 * seeding — a fresh engine, real `getUserMedia` via Chromium's fake audio
 * device, real clicks on both `/control` and `/display`, and real
 * same-origin `storage`-event propagation between the two tabs (the same
 * mechanism this app already relies on in production). It must fail before
 * the fix (the mic-gesture button never appears on `/display`) and pass
 * after it.
 *
 * Run: npm run test:e2e -- tests/e2e/noise-defense-calibration.spec.ts
 */

import { test, expect, type Page } from '@playwright/test'

test.use({
  launchOptions: {
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
  },
})

const NOISE_GAME_STORAGE_KEY = 'classroom-command-center-noise-defense'

interface PersistedNoiseGameState {
  state?: {
    engine?: {
      status?: string
      baselineDb?: number | null
      missionStats?: { startedAtMs?: number | null }
    }
  }
}

async function readEngine(page: Page): Promise<{
  status: string | undefined
  baselineDb: number | null | undefined
  startedAtMs: number | null | undefined
}> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    if (!raw) return { status: undefined, baselineDb: undefined, startedAtMs: undefined }
    const parsed = JSON.parse(raw) as PersistedNoiseGameState
    return {
      status: parsed.state?.engine?.status,
      baselineDb: parsed.state?.engine?.baselineDb,
      startedAtMs: parsed.state?.engine?.missionStats?.startedAtMs,
    }
  }, NOISE_GAME_STORAGE_KEY)
}

test.describe('Noise Defense — real Calibrate Quiet flow (no seeding)', () => {
  test('Calibrate Quiet sets a Baseline and unlocks Start on a totally fresh session', async ({ page, context }) => {
    await context.grantPermissions(['microphone'])

    // `/display` first, exactly as it would sit on the classroom TV — never
    // reloaded again for the rest of this test. No seeding: hudOptIn is the
    // real default ({}), nothing pre-opted-in.
    const display = await context.newPage()
    await display.goto('/display')

    // Clean Board's own unrelated "tap to enable classroom sound" gesture
    // sits in the same bottom-right corner and otherwise intercepts the
    // click below — a real teacher taps this on first load too.
    await display.locator('[data-display-sound-unlock]').click()

    // `/control`: expand the panel and start calibration for real.
    await page.goto('/control')
    await page.locator('[data-noise-defense-control-toggle]').click()
    await expect(page.locator('[data-noise-defense-control-panel]')).toBeVisible()

    const calibrateButton = page.locator('[data-noise-defense-action="calibrate"]')
    await expect(calibrateButton).toBeEnabled()
    await calibrateButton.click()
    await expect(calibrateButton).toHaveText('Calibrating…')

    const beforeGesture = await readEngine(page)
    expect(beforeGesture.status).toBe('calibrating')
    expect(beforeGesture.baselineDb).toBeNull()

    // The real mic-consent gesture, on the display, on a screen that was
    // never opted into the HUD — this is the exact case that deadlocked.
    await expect(display.locator('[data-noise-defense-mic-gesture]')).toBeVisible({ timeout: 5000 })
    await display.locator('[data-noise-defense-mic-gesture]').click()

    // Calibration window is 7s (CALIBRATION_DURATION_MS) — baseline should
    // land well inside that once real samples are actually flowing.
    await expect
      .poll(async () => (await readEngine(page)).baselineDb, { timeout: 9000 })
      .not.toBeNull()

    await expect(page.locator('[data-noise-defense-readout="baseline"]')).not.toHaveText('—')

    const startButton = page.locator('[data-noise-defense-action="start"]')
    await expect(startButton).toBeEnabled()
    await startButton.click()

    // The mission genuinely starts (this is the deadlock this test targets:
    // Start was reachable and functional at all). This screen was never
    // opted into the HUD, so Decision #2 (towers must never take damage the
    // class can't see) immediately auto-jams it right back -- that's
    // correct, pre-existing, unrelated behavior, not part of this bug, so
    // this assertion doesn't depend on `status` settling on 'running'.
    await expect.poll(async () => (await readEngine(page)).startedAtMs).not.toBeNull()
    await expect.poll(async () => (await readEngine(page)).status).toMatch(/running|jammed/)
  })
})
