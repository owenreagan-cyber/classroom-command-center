/**
 * In-room-test brief (2026-09-25), point 4 — `BoardHostDisplay` must
 * re-resolve the active scene/`displayModeId` on a `storage` event instead
 * of only once at mount, so an already-open `/display` tab picks up a
 * `/board-lab` Display Mode switch live, with no reload -- specifically:
 * switching to Assessment Mode must hide the Noise Defense HUD and
 * auto-jam the engine on `/display` with no reload.
 *
 * `/board-lab` (not `/control`) is where the Display Mode selector actually
 * lives today (`DisplayModeSelector.tsx`, mounted in `BoardLabPage.tsx`) --
 * see `NoiseDefenseControlPanel`'s doc comment for the `/control`/
 * `/board-lab` split. The noise-defense session itself is seeded directly
 * into `noiseGameStore`'s localStorage key before either tab loads, so this
 * test exercises the live-resolve fix without needing real microphone
 * permissions or the calibration flow.
 *
 * Run: npm run test:e2e -- tests/e2e/noise-defense-display-sync.spec.ts
 */

import { test, expect, type BrowserContext, type Page } from '@playwright/test'

const NOISE_GAME_STORAGE_KEY = 'classroom-command-center-noise-defense'

/** Seeds a `running` session, calibrated, opted in for `morningArrival`
 * (the default template's display mode, so `/display` shows the HUD with no
 * scene/layout/autosave saved yet), with no need for real mic access.
 * Applied via `context.addInitScript` (not `page.addInitScript`) so it also
 * covers `/display`'s own page, created later in this same context -- a
 * page-scoped init script only ever applies to the page it was added to. */
async function seedRunningNoiseDefenseSession(context: BrowserContext) {
  await context.addInitScript(
    ({ key }) => {
      const engine = {
        status: 'running',
        config: {
          maxTowerHp: 100,
          strikeDamage: 25,
          pressureDwellSeconds: 2,
          pressureAttackTauSeconds: 2,
          pressureDecayTauSeconds: 1.5,
          warningThresholdPct: 75,
          warningRearmPct: 50,
          recoveryMarginDb: 6,
          recoveryGraceSeconds: 5,
          healPerSecond: 3,
          protocolThresholdOffsetDb: { stealth: 4, patrol: 9, combat: 16 },
        },
        towers: ['N', 'O', 'I', 'S', 'E'].map((id) => ({ id, hp: 100, maxHp: 100 })),
        baselineDb: -40,
        protocol: 'patrol',
        pressure: 0,
        aboveThresholdSeconds: 0,
        quietSeconds: 0,
        recovering: false,
        warningArmed: false,
        lastRms: 0,
        lastDb: -120,
        lastSampleAtMs: null,
        // Calm Mode: mute theatrics/SFX/animation so this test never depends
        // on audio or motion timing, only on HUD presence + engine status.
        calmMode: true,
        calibrationSamplesDb: [],
        preJamStatus: null,
        jamReason: null,
        jammedAtMs: null,
        missionStats: {
          strikeCount: 0,
          towerFallCount: 0,
          recoveryCompleteCount: 0,
          protocolSeconds: { stealth: 0, patrol: 0, combat: 0 },
          jammedSeconds: 0,
          autoJammedSeconds: 0,
          startedAtMs: Date.now(),
        },
      }
      localStorage.setItem(
        key,
        JSON.stringify({
          state: {
            engine,
            micFailureReason: null,
            // The default template ("Morning Arrival — New Classroom") ships
            // `displayModeId: 'morningArrival'`, which is what `/display`
            // resolves to with no saved scene/layout/autosave -- opt it in.
            hudOptIn: { morningArrival: true },
            lastMissionReport: null,
          },
          version: 2,
        }),
      )
    },
    { key: NOISE_GAME_STORAGE_KEY },
  )
}

/** Reads the engine's live `status`/`jamReason` directly out of
 * `noiseGameStore`'s persisted localStorage -- `/display` is the one
 * dispatching auto-jam here, and `jamReason` is never rendered as text on
 * `/display` (teacher-only, per the noise-defense design doc), so this is
 * the only way to observe it from this route. */
async function readEngineJamState(page: Page): Promise<{ status: string; jamReason: string | null }> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    if (!raw) throw new Error('noise-defense store not found in localStorage')
    const parsed = JSON.parse(raw) as { state: { engine: { status: string; jamReason: string | null } } }
    return { status: parsed.state.engine.status, jamReason: parsed.state.engine.jamReason }
  }, NOISE_GAME_STORAGE_KEY)
}

test.describe('Noise Defense — /display picks up a /board-lab Display Mode switch live', () => {
  test('switching to Assessment Mode hides the HUD and auto-jams /display with no reload', async ({
    page,
    context,
  }) => {
    await seedRunningNoiseDefenseSession(context)

    // /display open first, as it would be on the classroom TV, and never
    // reloaded again for the rest of this test.
    const display = await context.newPage()
    await display.goto('/display')
    await expect(display.locator('[data-noise-defense-hud]')).toBeVisible()

    // /board-lab (edit mode, where the Display Mode selector lives):
    // explicitly (re-)select the already-opted-in "Morning Arrival" mode
    // first, so the next switch is the one under test, not board-lab's own
    // initial-mount autosave write (which otherwise defaults to "Custom").
    await page.goto('/board-lab?mode=edit')
    const modeSelect = page.locator('[data-display-mode-select]')
    await expect(modeSelect).toBeVisible()
    await modeSelect.selectOption('morningArrival')
    // BoardLabPage debounce-persists the autosave 400ms after a change.
    await page.waitForTimeout(600)
    await expect(display.locator('[data-noise-defense-hud]')).toBeVisible()
    const beforeSwitch = await readEngineJamState(display)
    expect(beforeSwitch).toEqual({ status: 'running', jamReason: null })

    // The switch under test: Assessment Mode is structurally excluded from
    // the HUD (`displayModes.ts`) and not opted in either way.
    await modeSelect.selectOption('assessment')
    await page.waitForTimeout(600)

    // No reload of `display` -- the `storage`-event fix must re-resolve
    // `displayModeId` on its own and hudGate must auto-jam in response.
    await expect(display.locator('[data-noise-defense-hud]')).toBeHidden()
    await expect
      .poll(() => readEngineJamState(display).then((s) => s.status))
      .toBe('jammed')
    const afterSwitch = await readEngineJamState(display)
    expect(afterSwitch.jamReason).toBe('auto')
  })
})
