/**
 * Phase 8B / 13.2 — Control / Display route split E2E tests.
 *
 * Run: npm run test:e2e -- tests/e2e/control-display-routes.spec.ts
 */

import { test, expect } from '@playwright/test'
import { enterEditMode, openDockTool, expandDockLauncher, dockToolWorkspace } from './helpers/teacher-dock-e2e'

test.describe('Control / Display route split', () => {
  test('/control shows teacher workspace', async ({ page }) => {
    await page.goto('/control')
    await expect(page.locator('.board-screen-title')).toBeVisible()
    await enterEditMode(page)
    await expect(page.locator('[data-teacher-command-dock]')).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toBeVisible()
    await expandDockLauncher(page)
    await openDockTool(page, 'Mystery Star')
    await expect(page.getByLabel('Mystery Star workspace')).toBeVisible()
    await openDockTool(page, 'Board Control')
    await expect(page.getByText('Backup / Restore')).toBeVisible()
    await expect(page.getByText('Teacher Notes')).toBeVisible()
  })

  test('/display hides teacher-only controls', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await expect(page.locator('[data-teacher-command-dock]')).toBeVisible()

    await page.goto('/display')
    await expect(page.locator('[data-clean-board-host-display]')).toBeVisible()
    await expect(page.locator('[data-teacher-command-dock]')).toHaveCount(0)
    await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toHaveCount(0)
    await expect(page.getByText('Mystery Star')).toHaveCount(0)
    await expect(page.getByText('Backup / Restore')).toHaveCount(0)
    await expect(page.getByText('Teacher Notes')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /^Undo$/ })).toHaveCount(0)
    await expect(page.getByLabel('Studio Canvas toolbar')).toHaveCount(0)
    await expect(page.getByLabel('Enter edit mode')).toHaveCount(0)
  })

  test('/display still renders active classroom content', async ({ page }) => {
    await page.goto('/display')
    await expect(page.locator('[data-clean-board-host-display]')).toBeVisible()
    await expect(page.locator('[data-board-canvas]')).toBeVisible()
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
    await expect(page.locator('[data-teacher-command-dock]')).toBeVisible()

    await page.goto('/display')
    await expect(page.locator('[data-teacher-command-dock]')).toHaveCount(0)

    await page.goto('/control')
    await enterEditMode(page)
    await expect(page.locator('[data-teacher-command-dock]')).toBeVisible()
  })

  test('Noise Control tool appears in dock launcher', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await expandDockLauncher(page)
    await expect(page.getByRole('button', { name: 'Open Noise Control' })).toHaveCount(1)
  })
})

test.describe('Display launch controls', () => {
  test('/control shows display launch controls', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display')
    const displayPanel = dockToolWorkspace(page, 'Display')
    await expect(displayPanel.getByLabel('Student display launch').getByText('Teacher Control')).toBeVisible()
    await expect(displayPanel.getByRole('button', { name: 'Open Student Display' })).toBeVisible()
    await expect(displayPanel.getByRole('button', { name: 'Copy Display Link' })).toBeVisible()
  })

  test('/display hides display launch controls', async ({ page }) => {
    await page.goto('/display')
    await expect(page.getByText('Teacher Control')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Open Student Display' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Copy Display Link' })).toHaveCount(0)
  })

  test('copy display link shows success message', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display')
    await dockToolWorkspace(page, 'Display').getByRole('button', { name: 'Copy Display Link' }).click()
    await expect(page.getByRole('status')).toHaveText('Display link copied')
  })

  test('open student display opens /display in a new tab', async ({ page, context }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Display')

    const popupPromise = context.waitForEvent('page')
    await dockToolWorkspace(page, 'Display').getByRole('button', { name: 'Open Student Display' }).click()
    const popup = await popupPromise

    await popup.waitForLoadState('domcontentloaded')
    expect(popup.url()).toContain('/display')
    await expect(popup.locator('[data-clean-board-host-display]')).toBeVisible()
    await popup.close()
    expect(page.url()).toContain('/control')
  })
})
