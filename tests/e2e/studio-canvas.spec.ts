/**
 * Studio Canvas E2E tests (Playwright).
 *
 * Run: npm run test:e2e
 *
 * BoardFrame has a CoachingCard that intercepts Playwright's hit-test.
 * Toolbar/clicks use dispatchEvent to bypass the overlay.
 * Mouse drag uses Playwright's native CDP-based pointer emulation.
 */

import { test, expect } from '@playwright/test'

const APP_URL = 'http://localhost:5173/'

async function openMorningArrival(page: import('@playwright/test').Page) {
  await page.goto(APP_URL)
  // Click Edit to enter studio mode
  await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Enter edit mode"]') as HTMLButtonElement | null
    btn?.click()
  })
  await page.waitForTimeout(300)
  // Navigate to Homeroom > Morning Arrival
  await page.getByRole('button', { name: /^Homeroom$/ }).click()
  await page.getByRole('button', { name: /Morning Arrival/i }).first().click()
  await page.waitForSelector('[data-widget-type="do-now"]', { timeout: 5000 })
}

test.describe('Studio Canvas', () => {
  test('select, drag, lock, unlock, undo, redo', async ({ page }) => {
    await openMorningArrival(page)

    const widget = page.locator('[data-widget-type="do-now"]').first()
    await expect(widget).toBeVisible()
    await expect(widget).toHaveAttribute('data-locked', 'false')

    // Select widget — focus triggers onFocus which calls onSelect
    await widget.focus()
    // Verify toolbar shows lock button (check DOM presence, not visibility/hit-test)
    const lockBtnExists = await page.evaluate(() => !!document.querySelector('[aria-label="Lock selected widget"]'))
    expect(lockBtnExists).toBe(true)

    // Drag via Playwright's native mouse (uses CDP, bypasses CSS overlay checks)
    const handle = widget.locator('[aria-label*="Drag handle"]')
    const handleBox = await handle.boundingBox()
    expect(handleBox).not.toBeNull()
    await page.mouse.move(handleBox!.x + 5, handleBox!.y + 5)
    await page.mouse.down()
    await page.mouse.move(handleBox!.x + 120, handleBox!.y + 60, { steps: 10 })
    await page.mouse.up()

    // Lock - dispatch click directly via DOM to bypass CoachingCard overlay
    await page.evaluate(() => {
      const lockBtn = document.querySelector('[aria-label="Lock selected widget"]') as HTMLButtonElement | null
      lockBtn?.click()
    })
    await page.waitForTimeout(200)
    await expect(widget).toHaveAttribute('data-locked', 'true')

    // Locked widget should not move via keyboard
    const lockedBox = await widget.boundingBox()
    await widget.focus()
    await page.keyboard.press('ArrowRight')
    const afterArrow = await widget.boundingBox()
    expect(afterArrow!.x).toBeCloseTo(lockedBox!.x, 0.5)

    // Unlock
    await page.evaluate(() => {
      const unlockBtn = document.querySelector('[aria-label="Unlock selected widget"]') as HTMLButtonElement | null
      unlockBtn?.click()
    })
    await page.waitForTimeout(200)
    await expect(widget).toHaveAttribute('data-locked', 'false')

    // Undo
    await page.evaluate(() => {
      const undoBtn = document.querySelector('[aria-label="Undo last layout change"]') as HTMLButtonElement | null
      undoBtn?.click()
    })
    await page.waitForTimeout(200)
    await expect(widget).toHaveAttribute('data-locked', 'true')

    // Redo
    await page.evaluate(() => {
      const redoBtn = document.querySelector('[aria-label="Redo last undone layout change"]') as HTMLButtonElement | null
      redoBtn?.click()
    })
    await page.waitForTimeout(200)
    await expect(widget).toHaveAttribute('data-locked', 'false')
  })

  test('widget lock state survives reload', async ({ page }) => {
    await openMorningArrival(page)

    const widget = page.locator('[data-widget-type="do-now"]').first()

    // Lock via DOM click
    await widget.focus()
    await page.evaluate(() => {
      const lockBtn = document.querySelector('[aria-label="Lock selected widget"]') as HTMLButtonElement | null
      lockBtn?.click()
    })
    await page.waitForTimeout(200)
    await expect(widget).toHaveAttribute('data-locked', 'true')

    // Reload
    await page.reload()
    await openMorningArrival(page)

    const reloaded = page.locator('[data-widget-type="do-now"]').first()
    await expect(reloaded).toHaveAttribute('data-locked', 'true')
  })

  test('snap toggle affects grid overlay', async ({ page }) => {
    await openMorningArrival(page)

    const snapButton = page.getByRole('button', { name: /Toggle snap/i })
    await expect(snapButton).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('.studio-canvas-surface')).toHaveAttribute('data-snap-enabled', 'true')

    // Dispatch click via DOM
    await page.evaluate(() => {
      const btn = document.querySelector('[aria-label="Toggle snap to grid"]') as HTMLButtonElement | null
      btn?.click()
    })
    await page.waitForTimeout(200)
    await expect(snapButton).toHaveAttribute('aria-pressed', 'false')
  })

  test('reset page layout is undoable', async ({ page }) => {
    await openMorningArrival(page)

    // Drag a widget first to have something to undo
    const widget = page.locator('[data-widget-type="do-now"]').first()
    await widget.focus()
    const handle = widget.locator('[aria-label*="Drag handle"]')
    const handleBox = await handle.boundingBox()
    expect(handleBox).not.toBeNull()
    await page.mouse.move(handleBox!.x + 5, handleBox!.y + 5)
    await page.mouse.down()
    await page.mouse.move(handleBox!.x + 200, handleBox!.y + 100, { steps: 10 })
    await page.mouse.up()

    // Reset — dialog
    page.once('dialog', (dialog) => dialog.accept())
    await page.evaluate(() => {
      const resetBtn = document.querySelector('[aria-label="Reset this page\'s layout to the default"]') as HTMLButtonElement | null
      resetBtn?.click()
    })
    await page.waitForTimeout(200)

    // Undo should be available (check via DOM, not Playwright hit-test)
    const undoEnabled = await page.evaluate(() => {
      const undo = document.querySelector('[aria-label="Undo last layout change"]') as HTMLButtonElement | null
      return undo && !undo.disabled
    })
    expect(undoEnabled).toBe(true)
  })

  test('undo history does not intermix across pages', async ({ page }) => {
    await openMorningArrival(page)

    // Drag the widget on Homeroom > Morning Arrival to create a history entry.
    const widget = page.locator('[data-widget-type="do-now"]').first()
    await widget.focus()
    const handle = widget.locator('[aria-label*="Drag handle"]')
    const handleBox = await handle.boundingBox()
    expect(handleBox).not.toBeNull()
    await page.mouse.move(handleBox!.x + 5, handleBox!.y + 5)
    await page.mouse.down()
    await page.mouse.move(handleBox!.x + 90, handleBox!.y + 40, { steps: 10 })
    await page.mouse.up()

    const undoEnabledOnHomeroom = await page.evaluate(() => {
      const undo = document.querySelector('[aria-label="Undo last layout change"]') as HTMLButtonElement | null
      return undo && !undo.disabled
    })
    expect(undoEnabledOnHomeroom).toBe(true)

    // Switch to Math — a different class with no edits made yet. The Undo
    // button must not report a change available here, and must not be able
    // to silently revert the Homeroom edit while the teacher is looking at
    // a different class.
    await page.getByRole('button', { name: /^Math$/ }).click()
    await page.waitForTimeout(300)

    const undoDisabledOnMath = await page.evaluate(() => {
      const undo = document.querySelector('[aria-label="Undo last layout change"]') as HTMLButtonElement | null
      return undo?.disabled
    })
    expect(undoDisabledOnMath).toBe(true)

    // Navigating back to Homeroom > Morning Arrival, the earlier edit must
    // still be there (untouched by anything done while viewing Math) and
    // Undo must still be available for it.
    await page.getByRole('button', { name: /^Homeroom$/ }).click()
    await page.getByRole('button', { name: /Morning Arrival/i }).first().click()
    await page.waitForSelector('[data-widget-type="do-now"]', { timeout: 5000 })

    const undoEnabledBackOnHomeroom = await page.evaluate(() => {
      const undo = document.querySelector('[aria-label="Undo last layout change"]') as HTMLButtonElement | null
      return undo && !undo.disabled
    })
    expect(undoEnabledBackOnHomeroom).toBe(true)
  })

  test('classroom mode hides studio toolbar', async ({ page }) => {
    await page.goto(APP_URL)
    // Enter studio mode via DOM click
    await page.evaluate(() => {
      const editBtn = document.querySelector('[aria-label="Enter edit mode"]') as HTMLButtonElement | null
      editBtn?.click()
    })
    await page.waitForTimeout(300)

    // Click Display to enter classroom mode
    await page.getByRole('button', { name: /^Display$/ }).click()
    await page.waitForTimeout(500)

    await expect(page.getByRole('button', { name: /^Undo$/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Redo$/ })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Reset Page Layout/i })).toHaveCount(0)

    // Classroom content should be visible
    await expect(page.locator('.board-screen-title')).toBeVisible()
  })
})
