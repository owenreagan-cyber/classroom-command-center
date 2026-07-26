import { test, expect } from '@playwright/test'
import { enterEditMode, openDockTool, dockToolWorkspace } from './helpers/teacher-dock-e2e'

test.describe('Morning Message Studio (Phase 9B)', () => {
  test('control route shows Morning Message Studio panel', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Morning Message')
    await expect(dockToolWorkspace(page, 'Morning Message').getByLabel('Morning Message Studio')).toBeVisible()
  })

  test('display route hides Morning Message Studio editor', async ({ page }) => {
    await page.goto('/display')
    await expect(page.getByRole('heading', { name: 'Morning Message Studio' })).toHaveCount(0)
    await expect(page.getByLabel('Morning Message Studio')).toHaveCount(0)
  })

  test('display route hides Teacher Dock', async ({ page }) => {
    await page.goto('/display')
    await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toHaveCount(0)
    await expect(page.locator('[data-teacher-command-dock]')).toHaveCount(0)
  })

  test('morning message display renders on homeroom morning message page', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Morning Message')
    const studio = dockToolWorkspace(page, 'Morning Message').getByLabel('Morning Message Studio')
    await studio.getByRole('button', { name: 'Send to Display' }).click()
    await page.goto('/display')
    await expect(page.getByTestId('morning-message-display')).toBeVisible()
  })

  test('preview mode toggles in studio panel', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Morning Message')
    const studio = dockToolWorkspace(page, 'Morning Message').getByLabel('Morning Message Studio')
    await studio.getByRole('button', { name: 'Preview', exact: true }).click()
    await expect(page.getByText('Student preview')).toBeVisible()
    await studio.getByRole('button', { name: 'Edit Mode' }).click()
    await expect(page.getByText('Student preview')).toHaveCount(0)
  })
})
