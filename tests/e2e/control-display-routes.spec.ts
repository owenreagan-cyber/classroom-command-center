/**
 * Phase 8B — Control / Display route split E2E tests.
 *
 * Run: npm run test:e2e -- tests/e2e/control-display-routes.spec.ts
 */

import { test, expect } from '@playwright/test'

async function enterEditMode(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Enter edit mode"]') as HTMLButtonElement | null
    btn?.click()
  })
  await page.waitForTimeout(300)
}

test.describe('Control / Display route split', () => {
  test('/control shows teacher workspace', async ({ page }) => {
    await page.goto('/control')
    await expect(page.locator('.board-screen-title')).toBeVisible()
    await enterEditMode(page)
    await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Teacher Dock' })).toBeVisible()
    await expect(page.getByText('Student Picker & Stars')).toBeVisible()
    await expect(page.getByText('Backup / Restore')).toBeVisible()
    await expect(page.getByText('Teacher Notes')).toBeVisible()
  })

  test('/display hides teacher-only controls', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toBeVisible()

    await page.goto('/display')
    await expect(page.locator('.board-screen-title')).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toHaveCount(0)
    await expect(page.getByText('Student Picker & Stars')).toHaveCount(0)
    await expect(page.getByText('Backup / Restore')).toHaveCount(0)
    await expect(page.getByText('Teacher Notes')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Undo$/ })).toHaveCount(0)
    await expect(page.getByLabel('Studio Canvas toolbar')).toHaveCount(0)
    await expect(page.getByLabel('Enter edit mode')).toHaveCount(0)
  })

  test('/display still renders active classroom content', async ({ page }) => {
    await page.goto('/display')
    await expect(page.locator('.board-screen-title')).toBeVisible()
    await expect(page.locator('.board-canvas')).toBeVisible()
  })

  test('root path redirects to /control', async ({ page }) => {
    await page.goto('/')
    await page.waitForFunction(() => window.location.pathname === '/control')
    await expect(page.locator('.board-screen-title')).toBeVisible()
  })

  test('unknown path redirects to /control', async ({ page }) => {
    await page.goto('/not-a-real-route')
    await page.waitForFunction(() => window.location.pathname === '/control')
    await expect(page.locator('.board-screen-title')).toBeVisible()
  })

  test('route change preserves persisted edit mode on control', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toBeVisible()

    await page.goto('/display')
    await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toHaveCount(0)

    await page.goto('/control')
    await enterEditMode(page)
    await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toBeVisible()
  })
})
