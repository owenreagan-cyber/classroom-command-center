/**
 * Shared route-contract helpers for E2E tests.
 *
 * Encapsulates the CURRENT product route contracts so specs assert product
 * behavior (shell rendered, title/nav present, no teacher chrome) instead of
 * repeating raw selectors.
 *
 * Contracts:
 *  - /control (default) → TeachModeShell  (no board, no teacher dock)
 *  - /control (edit)    → PresentationHub + TeacherCommandDock (+ Board tab)
 *  - /display           → BoardHostDisplay (Clean Board host, no teacher chrome)
 */

import { expect, type Page } from '@playwright/test'
import { enterEditMode } from './teacher-dock-e2e'

/** /control default Teach Mode is ready: title + teacher-facing navigation. */
export async function expectTeachModeReady(page: Page) {
  // Default active screen is `homeroom` → title "Morning Arrival".
  await expect(page.getByRole('heading', { level: 1, name: 'Morning Arrival' })).toBeVisible()
  // Single exit to edit mode + slide navigation are the teacher-facing controls.
  await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Previous slide' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next slide' })).toBeVisible()
}

/** /display Clean Board host is ready: host + student canvas, no teacher chrome. */
export async function expectDisplayHostReady(page: Page) {
  await expect(page.locator('[data-clean-board-host-display]')).toBeVisible()
  await expect(page.locator('[data-board-canvas]')).toBeVisible()
  await expect(page.locator('[data-teacher-command-dock]')).toHaveCount(0)
  await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toHaveCount(0)
}

/**
 * Enter the board editor (Studio Canvas / BoardFrame) from /control.
 *
 * /control defaults to Teach Mode. `enterEditMode` exits to the Presentation
 * Hub, whose default view is "Present" (display preview). The board editor
 * (BoardWorkspace → BoardFrame) lives behind the "Board" tab.
 */
export async function enterBoardEditorMode(page: Page) {
  await enterEditMode(page)
  const boardTab = page.getByRole('tab', { name: 'Board' })
  if (await boardTab.isVisible().catch(() => false)) {
    await boardTab.click()
  }
}

/** Board editor (BoardFrame) is ready. */
export async function expectStudioCanvasReady(page: Page) {
  await expect(page.locator('[data-widget-type="do-now"]').first()).toBeVisible({
    timeout: 10_000,
  })
}
