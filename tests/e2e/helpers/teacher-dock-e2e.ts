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
  await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Enter edit mode"]') as HTMLButtonElement | null
    btn?.click()
  })
  await expect(page.locator('[data-teacher-command-dock]')).toBeVisible()
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
