/**
 * Phase 9C — Automated visual QA + classroom workflow smoke tests.
 *
 * Run: npm run test:visual-qa
 */

import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const ARTIFACT_DIR = path.join(process.cwd(), '.local/visual-qa/phase-9c')

const DISPLAY_VIEWPORTS = [
  { width: 1920, height: 1080, label: '1920x1080' },
  { width: 1366, height: 768, label: '1366x768' },
  { width: 1024, height: 768, label: '1024x768' },
] as const

async function enterEditMode(page: Page) {
  await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Enter edit mode"]') as HTMLButtonElement | null
    btn?.click()
  })
  await page.waitForTimeout(300)
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth > doc.clientWidth + 2
  })
  expect(overflow).toBe(false)
}

async function assertDisplayPrivacy(page: Page) {
  await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Teacher Dock' })).toHaveCount(0)
  await expect(page.getByLabel('Studio Canvas toolbar')).toHaveCount(0)
  await expect(page.getByText('Select a widget to see its position and size.')).toHaveCount(0)
  await expect(page.getByText('Teacher Notes')).toHaveCount(0)
  await expect(page.getByLabel('Today Prep and Material Launcher')).toHaveCount(0)
  await expect(page.getByText('Material Launcher')).toHaveCount(0)
  await expect(page.getByLabel('Open With')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Open With' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Copy Link' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Show on Display' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Clear Now Showing' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Morning Message Studio' })).toHaveCount(0)
  await expect(page.getByLabel('Morning Message Studio')).toHaveCount(0)
  await expect(page.getByText('Mystery Star & Picker')).toHaveCount(0)
  await expect(page.getByText('Backup / Restore')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Open Student Display' })).toHaveCount(0)
  await expect(page.getByLabel('Enter edit mode')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Copy Display Link' })).toHaveCount(0)
}

async function captureDisplayScreenshot(page: Page, viewportLabel: string, suffix = 'default') {
  const filename = `display-${viewportLabel}-${suffix}.png`
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, filename),
    fullPage: false,
  })
}

test.beforeAll(() => {
  mkdirSync(ARTIFACT_DIR, { recursive: true })
})

test.describe('Phase 9C /display visual QA', () => {
  for (const viewport of DISPLAY_VIEWPORTS) {
    test(`/display at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/display')

      await expect(page.locator('.board-screen-title')).toBeVisible()
      await expect(page.locator('.board-canvas')).toBeVisible()
      await expect(page.locator('.classroom-canvas-frame')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toBeVisible()

      await assertNoHorizontalOverflow(page)
      await assertDisplayPrivacy(page)
      await captureDisplayScreenshot(page, viewport.label)
    })
  }
})

test.describe('Phase 9C Morning Message on /display', () => {
  test('morning message display renders after Send to Display workflow', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/control')
    await enterEditMode(page)

    await page.getByLabel('Morning Message Studio').getByRole('button', { name: 'Send to Display' }).click()
    await page.goto('/display')

    await expect(page.getByTestId('morning-message-display')).toBeVisible()
    await assertDisplayPrivacy(page)
    await assertNoHorizontalOverflow(page)
    await captureDisplayScreenshot(page, '1920x1080', 'morning-message')
  })
})

test.describe('Phase 9C /control workflow smoke', () => {
  test('teacher workspace exposes display launch and prep controls', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)

    await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Teacher Dock' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open Student Display' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Copy Display Link' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Morning Message Studio' })).toBeVisible()
    await expect(page.getByLabel('Morning Message Studio')).toBeVisible()
    await expect(page.getByLabel('Today Prep and Material Launcher')).toBeVisible()
    await expect(page.getByText('Material Launcher')).toBeVisible()
  })

  test('Morning Message Studio preview toggle works on /control', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)

    const studio = page.getByLabel('Morning Message Studio')
    await studio.getByRole('button', { name: 'Preview', exact: true }).click()
    await expect(page.getByText('Student preview')).toBeVisible()
    await studio.getByRole('button', { name: 'Edit Mode' }).click()
    await expect(page.getByText('Student preview')).toHaveCount(0)
  })

  test('Today Prep checklist can be opened on /control only', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)

    const prepPanel = page.getByLabel('Today Prep and Material Launcher')
    await expect(prepPanel.getByText('Today Prep')).toBeVisible()
    await expect(prepPanel.getByPlaceholder('Add prep reminder...')).toBeVisible()

    await page.goto('/display')
    await expect(page.getByLabel('Today Prep and Material Launcher')).toHaveCount(0)
    await expect(page.getByPlaceholder('Add prep reminder...')).toHaveCount(0)
  })

  test('Material Launcher resource controls stay on /control', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)

    const prepPanel = page.getByLabel('Today Prep and Material Launcher')
    await expect(prepPanel.getByRole('button', { name: 'Add resource link' })).toBeVisible()
    await expect(prepPanel.getByLabel('Open With')).toBeVisible()
    await expect(prepPanel.getByLabel('Resource type preset')).toBeVisible()

    await page.goto('/display')
    await expect(page.getByRole('button', { name: 'Add resource link' })).toHaveCount(0)
    await expect(page.getByLabel('Open With')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Open With' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Copy Link' })).toHaveCount(0)
  })

  test('Open With preset selector stays on /control only', async ({ page }) => {
    await page.goto('/control')
    await enterEditMode(page)

    const prepPanel = page.getByLabel('Today Prep and Material Launcher')
    const presetSelect = prepPanel.getByLabel('Resource type preset').first()
    await expect(presetSelect).toBeVisible()
    await expect(presetSelect.locator('option')).toHaveCount(7)
    await expect(presetSelect.locator('option[value="google-slides"]')).toHaveCount(1)

    await page.goto('/display')
    await expect(page.getByLabel('Resource type preset')).toHaveCount(0)
    await expect(page.locator('option[value="google-slides"]')).toHaveCount(0)
  })

  test('Now Showing label appears on /display without exposing URLs', async ({ page }) => {
    const secretUrl = 'https://docs.google.com/presentation/d/phase10b-secret/edit'
    const secretNote = 'Teacher-only prep note for phase 10B'

    await page.goto('/control')
    await enterEditMode(page)

    const prepPanel = page.getByLabel('Today Prep and Material Launcher')
    await prepPanel.getByLabel('Resource type preset').first().selectOption('google-slides')
    await prepPanel.getByPlaceholder('Resource label').fill('Chapter 2 Slides')
    await prepPanel.getByPlaceholder('https://docs.google.com/presentation/d/...').fill(secretUrl)
    await prepPanel.getByPlaceholder('Optional note').fill(secretNote)
    await prepPanel.getByRole('button', { name: 'Add resource link' }).click()
    await prepPanel.getByRole('button', { name: 'Show on Display' }).click()

    await page.goto('/display')

    const nowShowing = page.getByTestId('now-showing-display')
    await expect(nowShowing).toBeVisible()
    await expect(nowShowing).toContainText('Now Showing')
    await expect(nowShowing).toContainText('Chapter 2 Slides')
    await expect(nowShowing).toContainText('Google Slides')

    const bodyText = await page.locator('body').innerText()
    expect(bodyText).not.toContain(secretUrl)
    expect(bodyText).not.toContain(secretNote)
    expect(bodyText).not.toContain('Open With')
    expect(bodyText).not.toContain('Copy Link')

    await assertDisplayPrivacy(page)
  })
})
