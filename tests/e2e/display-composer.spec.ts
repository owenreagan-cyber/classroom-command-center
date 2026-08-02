/**
 * Phase 14B — Display Composer / Classroom Screen Builder E2E tests.
 * Phase 14C adds the Lesson Message Generator tests below.
 *
 * Run: npm run test:e2e -- tests/e2e/display-composer.spec.ts
 */

import { test, expect } from '@playwright/test'
import { enterEditMode, openDockTool, dockToolWorkspace } from './helpers/teacher-dock-e2e'

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

    await expect(panel.locator('[data-lesson-message-generator]')).toBeVisible()
    await expect(panel.getByText('Lesson Message Generator')).toBeVisible()
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
