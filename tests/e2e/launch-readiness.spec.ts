/**
 * Phase 11D — Launch readiness smoke tests.
 *
 * Run: npm run test:e2e -- tests/e2e/launch-readiness.spec.ts
 */

import { test, expect } from '@playwright/test'
import { enterEditMode, openDockTool, dockToolWorkspace } from './helpers/teacher-dock-e2e'

test.describe('Launch readiness — route smoke', () => {
  test('/control loads without crashing', async ({ page }) => {
    await page.goto('/control')
    await expect(page.locator('.board-screen-title')).toBeVisible()
    await expect(page.locator('.board-canvas')).toBeVisible()
  })

  test('/display loads without crashing', async ({ page }) => {
    await page.goto('/display')
    await expect(page.locator('.board-screen-title')).toBeVisible()
    await expect(page.locator('.board-canvas')).toBeVisible()
  })

  test('index.html references favicon and manifest', async ({ page }) => {
    await page.goto('/control')
    const favicon = page.locator('link[rel="icon"][href="/favicon.svg"]')
    const manifest = page.locator('link[rel="manifest"][href="/manifest.webmanifest"]')
    const appleTouch = page.locator('link[rel="apple-touch-icon"][href="/apple-touch-icon.png"]')
    await expect(favicon).toHaveCount(1)
    await expect(manifest).toHaveCount(1)
    await expect(appleTouch).toHaveCount(1)
  })

  test('manifest and icon assets are served', async ({ request }) => {
    for (const path of [
      '/favicon.svg',
      '/manifest.webmanifest',
      '/icon-192.png',
      '/icon-512.png',
      '/apple-touch-icon.png',
    ]) {
      const response = await request.get(path)
      expect(response.ok(), `${path} should be reachable`).toBeTruthy()
    }

    const manifest = await (await request.get('/manifest.webmanifest')).json()
    expect(manifest.name).toBe('Classroom Command Center')
    expect(manifest.short_name).toBe('Command Center')
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/control')
  })
})

test.describe('Launch readiness — teacher dock', () => {
  test('teacher dock appears on /control', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await expect(page.locator('[data-teacher-command-dock]')).toBeVisible()
    await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toBeVisible()
  })

  test('/display does not show teacher dock', async ({ page }) => {
    await page.goto('/display')
    await expect(page.locator('[data-teacher-command-dock]')).toHaveCount(0)
    await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toHaveCount(0)
  })
})

test.describe('Launch readiness — core teacher tools', () => {
  test('Today Prep lesson context renders on /control', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Today Prep')

    const prepPanel = dockToolWorkspace(page, 'Today Prep').getByLabel(
      'Today Prep and Material Launcher',
    )
    await expect(prepPanel).toBeVisible()
    await expect(prepPanel.getByText('Active context')).toBeVisible()
    await expect(prepPanel.getByText('Today Prep')).toBeVisible()
  })

  test('Morning Message area renders on /control', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Morning Message')

    const studio = dockToolWorkspace(page, 'Morning Message').getByLabel('Morning Message Studio')
    await expect(studio).toBeVisible()
    await expect(studio.getByRole('button', { name: 'Send to Display' })).toBeVisible()
  })

  test('Timer UI renders on /control', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Timers')

    const timersPanel = dockToolWorkspace(page, 'Timers')
    await expect(timersPanel.getByText('Phase Timer')).toBeVisible()
    await expect(timersPanel.getByRole('button', { name: 'Start' }).first()).toBeVisible()
  })

  test('Random Number Selector renders on /control', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Random Number')

    const panel = dockToolWorkspace(page, 'Random Number')
    await expect(panel.getByLabel('Random Number Selector')).toBeVisible()
    await expect(panel.getByRole('button', { name: 'Draw Number' })).toBeVisible()
  })
})
