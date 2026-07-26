/**
 * Phase 9A — Display polish E2E checks.
 * Run: npm run test:e2e -- tests/e2e/display-polish.spec.ts
 */

import { test, expect } from '@playwright/test'
import { enterEditMode, openDockTool, dockToolWorkspace } from './helpers/teacher-dock-e2e'

test.describe('Phase 9A display polish', () => {
  test('/display excludes page navigation and teacher controls', async ({ page }) => {
    await page.goto('/display')
    await expect(page.locator('.board-screen-title')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Page navigation' })).toHaveCount(0)
    await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toHaveCount(0)
  })

  test('/control retains page navigation on homeroom', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await expect(page.getByRole('navigation', { name: 'Page navigation' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Page navigation' }).getByText('1 of 5')).toBeVisible()
  })

  test('/display shows student-safe fullscreen control', async ({ page }) => {
    await page.goto('/display')
    await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toBeVisible()
  })

  test('/control shows open display for fullscreen workflow', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display')
    await expect(
      dockToolWorkspace(page, 'Display').getByRole('button', { name: 'Open Display for Fullscreen' }),
    ).toBeVisible()
  })

  test('no horizontal overflow at 1920x1080 on display', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/display')
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement
      return doc.scrollWidth > doc.clientWidth + 2
    })
    expect(overflow).toBe(false)
  })

  test('no horizontal overflow at 1024x768 on display', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/display')
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement
      return doc.scrollWidth > doc.clientWidth + 2
    })
    expect(overflow).toBe(false)
  })

  test('ClassroomCanvas frame renders on display', async ({ page }) => {
    await page.goto('/display')
    await expect(page.locator('.classroom-canvas-frame')).toBeVisible()
  })
})
