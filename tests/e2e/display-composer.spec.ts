/**
 * Phase 14B — Display Composer / Classroom Screen Builder E2E tests.
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
