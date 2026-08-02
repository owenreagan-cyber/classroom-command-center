/**
 * Phase 14B — Display Composer / Classroom Screen Builder E2E tests.
 * Phase 14C adds the Lesson Message Generator tests below.
 * Phase 14D adds Screen Packs / Quick-Start Templates / Readability tests below that.
 *
 * Run: npm run test:e2e -- tests/e2e/display-composer.spec.ts
 */

import { test, expect } from '@playwright/test'
import { enterEditMode, openDockTool, dockToolWorkspace } from './helpers/teacher-dock-e2e'
import { generateHomeroomBoard, seedPressYourLuckStateLive } from './helpers/prize-board-e2e'

test.describe('Display Composer — Teacher Dock integration', () => {
  test('Display Screens tool appears in the dock registry with saved screens', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')
    await expect(panel).toBeVisible()

    for (const title of [
      '7:20 Arrival',
      'Morning Work → Math',
      'Math → Snack and Shurley',
      'Shurley → Movement and Spelling/Reading',
      'Movement → Spelling/Reading',
      'Spelling/Reading → Lunch',
      'Specials',
    ]) {
      await expect(panel.getByRole('button', { name: title, exact: true })).toBeVisible()
    }
  })

  test('teacher can preview and send a screen to the display', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')

    await panel.getByRole('button', { name: '7:20 Arrival', exact: true }).click()
    await expect(panel.locator('[data-display-screen-id="arrival-720"]')).toBeVisible()

    await panel.getByRole('button', { name: 'Send to Display' }).click()
    await expect(panel.getByRole('status')).toContainText('sent to display')
  })
})

test.describe('Display Composer — student-safe /display rendering', () => {
  test('/display renders the sent screen full-screen and hides teacher controls', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')
    await panel.getByRole('button', { name: 'Morning Work → Math', exact: true }).click()
    await panel.getByRole('button', { name: 'Send to Display' }).click()

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id="morning-work-to-math"]')).toBeVisible()

    // Teacher-only chrome must never appear on /display.
    await expect(page.locator('[data-teacher-command-dock]')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Send to Display' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Duplicate' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Reset to Defaults' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Start$/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Reset$/ })).toHaveCount(0)

    // Content that must render for students.
    await expect(page.getByText('Morning Work → Math')).toBeVisible()
    await expect(page.getByText('Current Time')).toBeVisible() // clock
    await expect(page.getByText('Get Ready')).toBeVisible() // checklist heading
    await expect(page.getByText('Math Materials')).toBeVisible() // materials heading
    await expect(page.getByText('Homeroom → Math')).toBeVisible() // reused transition timer label
  })

  test('routine (lunch) timer screen shows current step, no teacher controls', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')
    await panel.getByRole('button', { name: 'Spelling/Reading → Lunch', exact: true }).click()
    await panel.getByRole('button', { name: 'Send to Display' }).click()

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id="spelling-reading-to-lunch"]')).toBeVisible()
    await expect(page.getByText('Lunch Routine')).toBeVisible()
    await expect(page.getByText('Current step')).toBeVisible()
    await expect(page.getByText('Lunch Checklist')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Start$/ })).toHaveCount(0)
  })

  test('clearing the display returns to the normal board', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')
    await panel.getByRole('button', { name: 'Specials', exact: true }).click()
    await panel.getByRole('button', { name: 'Send to Display' }).click()

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id="specials"]')).toBeVisible()

    await page.goto('/control')
    await openDockTool(page, 'Display Screens')
    await dockToolWorkspace(page, 'Display Screens').getByRole('button', { name: 'Clear Display' }).click()

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id]')).toHaveCount(0)
    await expect(page.locator('.board-screen-title')).toBeVisible()
  })

  test('sent screen survives a /display reload (persisted, not just in-memory)', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')
    await panel.getByRole('button', { name: 'Math → Snack and Shurley', exact: true }).click()
    await panel.getByRole('button', { name: 'Send to Display' }).click()

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id="math-to-snack-shurley"]')).toBeVisible()

    await page.reload()
    await expect(page.locator('[data-display-screen-id="math-to-snack-shurley"]')).toBeVisible()
  })
})

test.describe('Phase 14C — Lesson Message Generator', () => {
  test('panel shows the Lesson Message Generator section', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')

    const generatorSection = panel.locator('[data-lesson-message-generator]')
    await expect(generatorSection).toBeVisible()
    await expect(generatorSection.getByText('Lesson Message Generator', { exact: true })).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Generate Draft' })).toBeVisible()
    // No draft exists yet — Apply/Save actions must not be present.
    await expect(panel.getByRole('button', { name: 'Apply Draft to Current Screen' })).toHaveCount(0)
    await expect(panel.getByRole('button', { name: 'Save as New Screen' })).toHaveCount(0)
  })

  test('Generate Draft builds a preview but never touches /display', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')

    await panel.getByLabel('Subject').selectOption({ label: 'Math' })
    await panel.getByLabel('Activity Type').selectOption({ label: 'Lesson Launch' })
    await panel.getByLabel('Lesson Title').fill('Fractions')
    await panel.getByLabel('Objective (optional)').fill('practice solving problems carefully and show our thinking')
    await panel.getByLabel('Materials (one per line, optional)').fill('Math notebook\nPencil')
    await panel.getByRole('button', { name: 'Generate Draft' }).click()

    const draftPreview = panel.locator('[data-lesson-draft-preview]')
    await expect(draftPreview).toBeVisible()
    await expect(draftPreview).toContainText('Math: Fractions')
    await expect(draftPreview).toContainText('Teacher Only')

    // Generating never sends anything to /display.
    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id]')).toHaveCount(0)
  })

  test('Apply Draft updates the current screen editor only, not /display', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')

    await panel.getByRole('button', { name: 'Specials', exact: true }).click()

    await panel.getByLabel('Subject').selectOption({ label: 'Math' })
    await panel.getByLabel('Lesson Title').fill('Fractions')
    await panel.getByRole('button', { name: 'Generate Draft' }).click()
    await expect(panel.locator('[data-lesson-draft-preview]')).toBeVisible()

    await panel.getByRole('button', { name: 'Apply Draft to Current Screen' }).click()
    await expect(panel.locator('#dc-title')).toHaveValue('Math: Fractions')

    // Applying only changes the editor/preview — /display is untouched.
    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id]')).toHaveCount(0)
  })

  test('Send to Display remains a separate explicit step after applying a draft', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')

    await panel.getByRole('button', { name: '7:20 Arrival', exact: true }).click()
    await panel.getByLabel('Subject').selectOption({ label: 'Math' })
    await panel.getByLabel('Activity Type').selectOption({ label: 'Lesson Launch' })
    await panel.getByLabel('Lesson Title').fill('Fractions')
    await panel.getByLabel('Lesson Number (optional)').fill('5')
    await panel.getByLabel('Objective (optional)').fill('practice solving problems carefully and show our thinking')
    await panel.getByLabel('Materials (one per line, optional)').fill('Math notebook\nPencil')
    await panel.getByLabel('Teacher Notes (optional — teacher-only, never shown to students)').fill(
      'Table 3 was chatty yesterday, keep an eye on them',
    )
    await panel.getByRole('button', { name: 'Generate Draft' }).click()
    await panel.getByRole('button', { name: 'Apply Draft to Current Screen' }).click()

    // Still not on /display after Apply.
    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id]')).toHaveCount(0)

    // Only the explicit Send to Display action publishes it.
    await page.goto('/control')
    await openDockTool(page, 'Display Screens')
    await dockToolWorkspace(page, 'Display Screens').getByRole('button', { name: 'Send to Display' }).click()

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id="arrival-720"]')).toBeVisible()
    await expect(page.getByText('Math Lesson 5')).toBeVisible()
    await expect(page.getByText('Math notebook')).toBeVisible()

    // Teacher-only generator fields must never reach /display.
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('Table 3 was chatty yesterday')
    expect(bodyText).not.toContain('Teacher Only')
    expect(bodyText).not.toContain('Teacher Rationale')
    expect(bodyText).not.toContain('Drafted as a')
    expect(bodyText).not.toContain('Generate Draft')
    expect(bodyText).not.toContain('Apply Draft')
    await expect(page.getByRole('button', { name: 'Generate Draft' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Send to Display' })).toHaveCount(0)
  })
})

test.describe('Phase 14D — Screen Packs', () => {
  test('pack filter narrows the saved screen list and shows an empty state for an empty pack', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')

    // Unfiltered: all 7 seeded screens visible.
    for (const title of ['7:20 Arrival', 'Math → Snack and Shurley', 'Specials']) {
      await expect(panel.getByRole('button', { name: title, exact: true })).toBeVisible()
    }

    // Filter to Transitions: only the 4 transition-mode screens should remain.
    await panel.getByLabel('Filter saved screens by pack').selectOption({ label: 'Transitions (4)' })
    await expect(panel.getByRole('button', { name: 'Math → Snack and Shurley', exact: true })).toBeVisible()
    await expect(panel.getByRole('button', { name: '7:20 Arrival', exact: true })).toHaveCount(0)
    await expect(panel.getByRole('button', { name: 'Specials', exact: true })).toHaveCount(0)

    // Filter to an empty pack (no seeded screen uses Work Time) shows the empty state, not a blank void.
    await panel.getByLabel('Filter saved screens by pack').selectOption({ label: 'Work Time (0)' })
    await expect(panel.getByText('No screens in this pack yet.')).toBeVisible()
    await expect(panel.locator('[data-display-screen-card]')).toHaveCount(0)

    // Back to All restores the full list.
    await panel.getByLabel('Filter saved screens by pack').selectOption({ label: 'All (7)' })
    await expect(panel.getByRole('button', { name: '7:20 Arrival', exact: true })).toBeVisible()
  })
})

test.describe('Phase 14D — Quick-Start Templates', () => {
  test('creating a screen from a quick-start template does not touch /display', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')

    await panel.getByRole('button', { name: '+ Checklist Only' }).click()
    await expect(panel.getByRole('status')).toContainText('Created a new screen')
    await expect(panel.locator('#dc-title')).toHaveValue('New Checklist')

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id]')).toHaveCount(0)
  })
})

test.describe('Phase 14D — Readability warnings (teacher-only)', () => {
  test('a too-long title shows a readability warning on /control and never on /display', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')

    await panel.getByRole('button', { name: '7:20 Arrival', exact: true }).click()
    await expect(panel.locator('[data-readability-warnings]')).toHaveCount(0)

    await panel.locator('#dc-title').fill('This Is An Extremely Long Screen Title That Will Not Fit On A Projector Nicely')
    await expect(panel.locator('[data-readability-warnings]')).toBeVisible()
    await expect(panel.locator('[data-readability-warnings]')).toContainText('Title is long')
    await expect(panel.locator('[data-readability-warnings]')).toContainText('Readability Check (teacher-only, not shown on /display)')

    await panel.getByRole('button', { name: 'Send to Display' }).click()
    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id="arrival-720"]')).toBeVisible()
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('Readability Check')
    expect(bodyText).not.toContain('Title is long')
  })

  test('non-student-safe screen never renders on /display even after Send to Display', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')

    await panel.getByRole('button', { name: 'Specials', exact: true }).click()
    await panel.getByLabel('Student-safe (visible on /display)').uncheck()
    await expect(panel.getByText('marked not student-safe')).toBeVisible()
    await panel.getByRole('button', { name: 'Send to Display' }).click()

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id]')).toHaveCount(0)
    await expect(page.locator('.board-screen-title')).toBeVisible()
  })
})

test.describe('Phase 14D — Regression: existing 14B/14C behavior unchanged', () => {
  test('overlay precedence remains Prize Board > Random Number > Display Composer > board', async ({ page }) => {
    // Send a Display Composer screen to the display first.
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    await dockToolWorkspace(page, 'Display Screens').getByRole('button', { name: 'Specials', exact: true }).click()
    await dockToolWorkspace(page, 'Display Screens').getByRole('button', { name: 'Send to Display' }).click()

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id="specials"]')).toBeVisible()

    // Prize Board projector mode must take over when active, hiding the composer overlay.
    await generateHomeroomBoard(page)
    await page.goto('/display')
    await seedPressYourLuckStateLive(page, { phase: 'spinning' })
    await expect(page.locator('[data-projector-mode="prize-board"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('[data-display-screen-id]')).toHaveCount(0)

    // Once Prize Board goes idle again, the composer screen resumes.
    await seedPressYourLuckStateLive(page, { phase: 'idle' })
    await expect(page.locator('[data-display-screen-id="specials"]')).toBeVisible()
  })

  test('seeded screens still load and Send to Display still works', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')
    for (const title of [
      '7:20 Arrival',
      'Morning Work → Math',
      'Math → Snack and Shurley',
      'Shurley → Movement and Spelling/Reading',
      'Movement → Spelling/Reading',
      'Spelling/Reading → Lunch',
      'Specials',
    ]) {
      await expect(panel.getByRole('button', { name: title, exact: true })).toBeVisible()
    }
    await panel.getByRole('button', { name: 'Morning Work → Math', exact: true }).click()
    await panel.getByRole('button', { name: 'Send to Display' }).click()
    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id="morning-work-to-math"]')).toBeVisible()
  })

  test('Lesson Message Generator still creates a draft and Apply does not auto-send', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')
    await panel.getByRole('button', { name: 'Specials', exact: true }).click()
    await panel.getByLabel('Lesson Title').fill('Fractions')
    await panel.getByRole('button', { name: 'Generate Draft' }).click()
    await expect(panel.locator('[data-lesson-draft-preview]')).toBeVisible()

    await panel.getByRole('button', { name: 'Apply Draft to Current Screen' }).click()
    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id]')).toHaveCount(0)

    // A fresh /control navigation remounts the panel, resetting its local
    // "selected screen" state — re-select by the stable screen id (the applied
    // draft renamed the button's visible title, so select by id, not name).
    await page.goto('/control')
    await openDockTool(page, 'Display Screens')
    const reopenedPanel = dockToolWorkspace(page, 'Display Screens')
    await reopenedPanel.locator('[data-display-screen-card="specials"]').click()
    await reopenedPanel.getByRole('button', { name: 'Send to Display' }).click()
    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id="specials"]')).toBeVisible()
  })
})

test.describe('Phase 14E — Provider status controls', () => {
  test('provider controls default to Deterministic Local and appear only on /control', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')

    const controls = panel.locator('[data-provider-status-controls]')
    await expect(controls).toBeVisible()
    await expect(panel.getByLabel('Generator mode')).toHaveValue('deterministicOnly')
    await expect(controls.locator('[data-provider-status]')).toContainText('Disabled')

    await page.goto('/display')
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('Generator Mode')
    expect(bodyText).not.toContain('Drafts used today')
    await expect(page.locator('[data-provider-status-controls]')).toHaveCount(0)
  })

  test('Generate Draft in deterministic mode keeps status Disabled and never touches /display', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')

    await panel.getByLabel('Lesson Title').fill('Fractions')
    await panel.getByRole('button', { name: 'Generate Draft' }).click()
    await expect(panel.locator('[data-lesson-draft-preview]')).toBeVisible()
    await expect(panel.locator('[data-provider-status]')).toContainText('Disabled')

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id]')).toHaveCount(0)
  })

  test('an unreachable configured provider falls back to deterministic with a teacher-only warning, never shown on /display', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')

    await panel.getByLabel('Generator mode').selectOption({ value: 'providerIfAvailable' })
    await panel.getByLabel('Provider').selectOption({ value: 'customEndpoint' })
    // Port 1 refuses connections immediately — a fast, deterministic "unreachable" without a real server.
    await panel.getByLabel('Endpoint URL (your own local server)').fill('http://127.0.0.1:1/generate')
    await panel.getByLabel('Enable provider for draft generation').check()

    await panel.getByRole('button', { name: '7:20 Arrival', exact: true }).click()
    await panel.getByLabel('Lesson Title').fill('Fractions')
    await panel.getByLabel('Objective (optional)').fill('practice solving problems carefully')
    await panel.getByRole('button', { name: 'Generate Draft' }).click()

    await expect(panel.locator('[data-lesson-draft-preview]')).toBeVisible({ timeout: 15000 })
    // Deterministic content still renders — the provider outage never blocked the draft.
    await expect(panel.locator('[data-lesson-draft-preview]')).toContainText('Math: Fractions')
    // Teacher-only fallback explanation is visible in the draft's own warnings box.
    await expect(panel.locator('[data-lesson-draft-preview]')).toContainText(/provider unavailable/i)
    await expect(panel.locator('[data-provider-status]')).not.toContainText('Ready')

    await panel.getByRole('button', { name: 'Apply Draft to Current Screen' }).click()
    await panel.getByRole('button', { name: 'Send to Display' }).click()

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id="arrival-720"]')).toBeVisible()
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('provider unavailable')
    expect(bodyText).not.toContain('Generator Mode')
    expect(bodyText).not.toContain('127.0.0.1')
    expect(bodyText).not.toContain('Status:')
  })
})

test.describe('Phase 14E — Runtime hardening regression', () => {
  test('unknown pack filter value falls back to showing all screens, not an empty list', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')
    const panel = dockToolWorkspace(page, 'Display Screens')

    // Simulate a stale/unknown filter value the UI itself could never produce,
    // proving the panel degrades to "All Screens" rather than an empty state.
    // Uses the native value setter (not select.value=) so React's controlled
    // <select> actually observes the change and fires onChange.
    await page.evaluate(() => {
      const select = document.querySelector('[aria-label="Filter saved screens by pack"]') as HTMLSelectElement | null
      if (select) {
        const opt = document.createElement('option')
        opt.value = 'not-a-real-pack'
        select.appendChild(opt)
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set
        setter?.call(select, 'not-a-real-pack')
        select.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })

    await expect(panel.getByText('No screens in this pack yet.')).toHaveCount(0)
    await expect(panel.getByRole('button', { name: '7:20 Arrival', exact: true })).toBeVisible()
  })
})
