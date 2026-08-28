/**
 * Shared helpers for Teacher Command Dock E2E tests.
 */

import { expect, type Page } from '@playwright/test'

export const TOOL_TITLE_TO_ID: Record<string, string> = {
  Dashboard: 'dashboard',
  Timers: 'timers',
  'Classroom Atmosphere': 'classroom-atmosphere',
  'Morning Message': 'morning-message',
  'Today Prep': 'today-prep',
  'Mystery Star': 'mystery-star',
  'Quick Picker': 'quick-picker',
  'Prize Board': 'prize-board',
  'Random Number': 'random-number',
  Materials: 'materials',
  Display: 'display',
  'Display Screens': 'display-composer',
  OmniNote: 'omninote',
  Jobs: 'jobs',
  'Board Control': 'board-control',
  'Noise Control': 'noise',
}

export function dockToolWorkspace(page: Page, toolTitle: string) {
  const toolId = TOOL_TITLE_TO_ID[toolTitle]
  if (!toolId) {
    throw new Error(`Unknown dock tool title: ${toolTitle}`)
  }
  return page.locator(`[data-teacher-tool="${toolId}"]`)
}

export async function enterEditMode(page: Page) {
  const dock = page.locator('[data-teacher-command-dock]')

  // Already in the editor workspace.
  if (await dock.isVisible().catch(() => false)) return

  // /control now opens in Teach Mode by default. Its "Dashboard" button is the
  // single exit to the editor workspace (edit mode). In legacy display mode
  // there is no Dashboard button — the "Enter edit mode" button is used instead.
  const dashboard = page.getByRole('button', { name: 'Dashboard', exact: true })
  const inTeachMode = await dashboard
    .waitFor({ state: 'visible', timeout: 2000 })
    .then(() => true)
    .catch(() => false)

  if (inTeachMode) {
    await dashboard.click()
    await expect(dock).toBeVisible()
    return
  }

  await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Enter edit mode"]') as HTMLButtonElement | null
    btn?.click()
  })
  await expect(dock).toBeVisible()
}

export async function expandDockLauncher(page: Page) {
  const expand = page.getByRole('button', { name: 'Expand teacher dock' })
  if (await expand.isVisible()) {
    await expand.click()
    await expect(page.getByRole('heading', { name: 'Tools' })).toBeVisible()
  }
}

export async function openDockTool(page: Page, toolTitle: string) {
  const toolId = TOOL_TITLE_TO_ID[toolTitle]
  if (!toolId) {
    throw new Error(`Unknown dock tool title: ${toolTitle}`)
  }

  const workspace = dockToolWorkspace(page, toolTitle)
  if (await workspace.isVisible()) {
    return
  }

  const edgeButton = page.locator(`[data-dock-edge-tool="${toolId}"]`)
  if (await edgeButton.count()) {
    await edgeButton.click()
    await expect(workspace).toBeVisible()
    return
  }

  await expandDockLauncher(page)
  const cardButton = page.locator(`[data-dock-tool-card="${toolId}"]`)
  await expect(cardButton).toBeVisible()
  await cardButton.click()
  await expect(workspace).toBeVisible()
}
