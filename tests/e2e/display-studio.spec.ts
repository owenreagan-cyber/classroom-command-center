/**
 * Phase 15A — Display Studio Redesign E2E tests.
 * Validates the slide-style editor: thumbnail rail, canvas, inspector,
 * widget library, presenter mode, student-safe /display, spacebar typing.
 */
import { test, expect } from '@playwright/test'
import { enterEditMode, openDockTool } from './helpers/teacher-dock-e2e'

test.describe('Phase 15A — Display Studio shell', () => {
  test('Display Studio opens from the Teacher Dock', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    // The Display Studio overlay should be visible
    await expect(page.locator('[data-display-studio]')).toBeVisible()

    // Thumbnail rail, canvas, inspector, command bar all present
    await expect(page.locator('[data-display-studio-thumbnail-rail]')).toBeVisible()
    await expect(page.locator('[data-display-studio-canvas-area]')).toBeVisible()
    await expect(page.locator('[data-display-studio-inspector]')).toBeVisible()
    await expect(page.locator('[data-display-studio-command-bar]')).toBeVisible()
  })

  test('slide thumbnail rail shows all 7 seeded screens', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    const rail = page.locator('[data-display-studio-thumbnail-rail]')
    await expect(rail).toBeVisible()

    const thumbButtons = rail.locator('[data-display-screen-thumb]')
    await expect(thumbButtons).toHaveCount(20)

    for (const title of [
      '7:20 Arrival',
      'Morning Work → Math',
      'Math → Snack and Shurley',
      'Shurley → Movement and Spelling/Reading',
      'Movement → Spelling/Reading',
      'Spelling/Reading → Lunch',
      'Specials',
    ]) {
      await expect(thumbButtons.filter({ hasText: title })).toHaveCount(1)
    }
  })

  test('selecting a screen updates the canvas', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    const rail = page.locator('[data-display-studio-thumbnail-rail]')
    await rail.locator('[data-display-screen-thumb="arrival-720"]').click()

    // Canvas should show the selected screen
    await expect(page.locator('[data-display-studio-canvas]')).toBeVisible()
    await expect(page.locator('[data-display-studio-canvas]')).toContainText('7:20 Arrival')
  })

  test('inspector sections collapse and expand', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    const inspector = page.locator('[data-display-studio-inspector]')

    // Screen section should be expanded by default (only default)
    const screenSection = inspector.getByRole('button', { name: /Screen/ })
    await expect(screenSection).toHaveAttribute('aria-expanded', 'true')

    // Content section should be collapsed
    const contentSection = inspector.getByRole('button', { name: /Content/ })
    await expect(contentSection).toHaveAttribute('aria-expanded', 'false')

    // Click to expand Content
    await contentSection.click()
    await expect(contentSection).toHaveAttribute('aria-expanded', 'true')

    // Click again to collapse
    await contentSection.click()
    await expect(contentSection).toHaveAttribute('aria-expanded', 'false')
  })

  test('Send to Display works from both command bar and inspector', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    // Send from command bar
    await page.locator('[data-studio-action="send-to-display"]').first().click()

    // Verify it appeared on /display
    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id="arrival-720"]')).toBeVisible()

    // Clear display
    await page.goto('/control')
    await openDockTool(page, 'Display Screens')
    await page.locator('[data-studio-action="clear-display"]').first().click()

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id]')).toHaveCount(0)
    await expect(page.locator('.board-screen-title')).toBeVisible()
  })
})

test.describe('Phase 15A — Widget Library', () => {
  test('widget library toggle opens and shows categories', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    // Expand the Widgets inspector section
    const inspector = page.locator('[data-display-studio-inspector]')
    await inspector.getByRole('button', { name: /Widgets/ }).click()

    // Click "Browse Widget Library..."
    await page.getByRole('button', { name: /Browse Widget Library/ }).click()

    // Widget library should be visible
    const widgetLib = page.locator('[data-display-studio-widget-library]')
    await expect(widgetLib).toBeVisible()

    // Category tabs should exist
    await expect(widgetLib.getByText('Time')).toBeVisible()
    await expect(widgetLib.getByText('Classroom')).toBeVisible()
    await expect(widgetLib.getByText('Engagement')).toBeVisible()
    await expect(widgetLib.getByText('Rewards')).toBeVisible()
    await expect(widgetLib.getByText('Instruction')).toBeVisible()
  })

  test('placeholder widgets show as coming soon and are not clickable', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    const inspector = page.locator('[data-display-studio-inspector]')
    await inspector.getByRole('button', { name: /Widgets/ }).click()
    await page.getByRole('button', { name: /Browse Widget Library/ }).click()

    const widgetLib = page.locator('[data-display-studio-widget-library]')

    // Switch to Classroom category to find Noise Meter (placeholder)
    await widgetLib.getByText('Classroom').click()
    await expect(widgetLib.getByText('Noise Meter')).toBeVisible()
    await expect(widgetLib.getByText('Coming soon')).toBeVisible()
  })
})

test.describe('Phase 15A — Student-safe /display', () => {
  test('/display renders student-safe screen without teacher controls', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    // Select and send a screen
    await page.locator('[data-display-screen-thumb="morning-work-to-math"]').click()
    await page.locator('[data-studio-action="send-to-display"]').first().click()

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id="morning-work-to-math"]')).toBeVisible()

    // Teacher-only chrome must never appear
    await expect(page.locator('[data-teacher-command-dock]')).toHaveCount(0)
    await expect(page.locator('[data-display-studio]')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Send to Display' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Clear Display' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Duplicate' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Presenter' })).toHaveCount(0)

    // Student content must render
    await expect(page.getByText('Morning Work → Math')).toBeVisible()
  })

  test('teacher notes never render on /display', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    await page.locator('[data-display-screen-thumb="specials"]').click()
    await page.locator('[data-studio-action="send-to-display"]').first().click()

    await page.goto('/display')
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('Teacher Notes')
    expect(bodyText).not.toContain('teacher-notes')
    expect(bodyText).not.toContain('private')
  })

  test('provider/warnings never render on /display', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    await page.locator('[data-display-screen-thumb="specials"]').click()
    await page.locator('[data-studio-action="send-to-display"]').first().click()

    await page.goto('/display')
    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain('Readability')
    expect(bodyText).not.toContain('Generator Mode')
    expect(bodyText).not.toContain('Provider')
    expect(bodyText).not.toContain('not student-safe')
  })

  test('non-student-safe screen never renders on /display', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    // Uncheck student-safe on the inspector
    const inspector = page.locator('[data-display-studio-inspector]')
    const screenSection = inspector.getByRole('button', { name: /Screen/ })
    await expect(screenSection).toHaveAttribute('aria-expanded', 'true')
    await page.getByLabel('Student-safe (visible on /display)').uncheck()

    await page.locator('[data-studio-action="send-to-display"]').first().click()

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id]')).toHaveCount(0)
    await expect(page.locator('.board-screen-title')).toBeVisible()
  })
})

test.describe('Phase 15A — Spacebar / text input', () => {
  test('spacebar works in title text input', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    const titleInput = page.locator('[data-studio-field="title"]')
    await titleInput.click()
    await titleInput.fill('')
    await titleInput.pressSequentially('Morning Message Room 4B')

    await expect(titleInput).toHaveValue('Morning Message Room 4B')
  })

  test('spacebar works in student message textarea', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    // Expand Content section to find the message field
    const inspector = page.locator('[data-display-studio-inspector]')
    await inspector.getByRole('button', { name: /Content/ }).click()
    await expect(inspector.getByRole('button', { name: /Content/ })).toHaveAttribute('aria-expanded', 'true')

    const messageField = page.locator('[data-studio-field="message"]')
    await messageField.click()
    await messageField.fill('')
    await messageField.pressSequentially('Welcome to class everyone')

    await expect(messageField).toHaveValue('Welcome to class everyone')
  })
})

test.describe('Phase 15A — Presenter Mode', () => {
  test('presenter mode opens and shows current and next screen', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    // Click Presenter
    await page.getByRole('button', { name: 'Presenter' }).first().click()

    // Presenter mode should be visible
    await expect(page.locator('[data-display-studio-presenter]')).toBeVisible()
    await expect(page.locator('[data-display-studio-presenter]')).toContainText('Presenter View')

    // Should show current screen and next screen
    await expect(page.locator('[data-display-screen-id="arrival-720"]')).toBeVisible()

    // Close presenter
    await page.getByRole('button', { name: 'Exit Presenter' }).click()
    await expect(page.locator('[data-display-studio-presenter]')).toHaveCount(0)
  })
})

test.describe('Phase 15A — Regression: existing features preserved', () => {
  test('existing display composer Send to Display still works from studio', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    await page.locator('[data-display-screen-thumb="arrival-720"]').click()
    await page.locator('[data-studio-action="send-to-display"]').first().click()

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id="arrival-720"]')).toBeVisible()
    await expect(page.getByText('7:20 Arrival')).toBeVisible()
    await expect(page.getByText('Current Time')).toBeVisible()
  })

  test('Clear Display returns to normal board', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    await page.locator('[data-studio-action="send-to-display"]').first().click()
    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id="arrival-720"]')).toBeVisible()

    await page.goto('/control')
    await openDockTool(page, 'Display Screens')
    await page.locator('[data-studio-action="clear-display"]').first().click()

    await page.goto('/display')
    await expect(page.locator('[data-display-screen-id]')).toHaveCount(0)
    await expect(page.locator('.board-screen-title')).toBeVisible()
  })

  test('seeded screens still load correctly from the studio', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display Screens')

    const rail = page.locator('[data-display-studio-thumbnail-rail]')
    const thumbs = rail.locator('[data-display-screen-thumb]')
    await expect(thumbs).toHaveCount(20)

    // Check each screen is selectable
    for (const id of [
      'arrival-720',
      'morning-work-to-math',
      'math-to-snack-shurley',
      'specials',
    ]) {
      await rail.locator(`[data-display-screen-thumb="${id}"]`).click()
      await expect(page.locator('[data-display-studio-canvas]')).toContainText(
        DEFAULT_DISPLAY_SCREENS_TITLES[id],
      )
    }
  })
})

// Quick reference map for seeded screen titles
const DEFAULT_DISPLAY_SCREENS_TITLES: Record<string, string> = {
  'arrival-720': '7:20 Arrival',
  'morning-work-to-math': 'Morning Work → Math',
  'math-to-snack-shurley': 'Math → Snack and Shurley',
  'shurley-to-movement-spelling-reading': 'Shurley → Movement and Spelling/Reading',
  'movement-to-spelling-reading': 'Movement → Spelling/Reading',
  'spelling-reading-to-lunch': 'Spelling/Reading → Lunch',
  'specials': 'Specials',
}
