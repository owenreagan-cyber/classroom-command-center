/**
 * Phase 9C.1 — Playwright screenshot baseline snapshots for /display.
 *
 * Run: npm run test:display-snapshots
 * Update baselines: npx playwright test tests/e2e/display-snapshots.spec.ts --update-snapshots
 */

import { test, expect, type Page } from '@playwright/test'

const DISPLAY_VIEWPORTS = [
  { width: 1920, height: 1080, label: '1920x1080' },
  { width: 1366, height: 768, label: '1366x768' },
  { width: 1024, height: 768, label: '1024x768' },
] as const

const SNAPSHOT_OPTIONS = {
  animations: 'disabled' as const,
  maxDiffPixelRatio: 0.01,
}

async function enterEditMode(page: Page) {
  await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Enter edit mode"]') as HTMLButtonElement | null
    btn?.click()
  })
  await expect(page.getByLabel('Studio Canvas toolbar')).toBeVisible()
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
  await expect(page.getByRole('heading', { name: 'Morning Message Studio' })).toHaveCount(0)
  await expect(page.getByLabel('Morning Message Studio')).toHaveCount(0)
  await expect(page.getByText('Student Picker & Stars')).toHaveCount(0)
  await expect(page.getByText('Backup / Restore')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Open Student Display' })).toHaveCount(0)
  await expect(page.getByLabel('Enter edit mode')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Copy Display Link' })).toHaveCount(0)
}

async function prepareStableDisplay(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  })
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await expect(page.locator('.board-canvas')).toBeVisible()
  await expect(page.locator('.classroom-canvas-frame')).toBeVisible()
}

async function assertDisplayReadyForSnapshot(page: Page) {
  await assertDisplayPrivacy(page)
  await assertNoHorizontalOverflow(page)
  await prepareStableDisplay(page)
}

test.describe('Phase 9C.1 /display baseline snapshots', () => {
  for (const viewport of DISPLAY_VIEWPORTS) {
    test(`/display default at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/display')

      await expect(page.locator('.board-screen-title')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Enter fullscreen' })).toBeVisible()
      await assertDisplayReadyForSnapshot(page)

      await expect(page).toHaveScreenshot(`display-default-${viewport.label}.png`, SNAPSHOT_OPTIONS)
    })
  }
})

test.describe('Phase 9C.1 Morning Message display snapshot', () => {
  test('/display Morning Message at 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/control')
    await enterEditMode(page)

    await page.getByLabel('Morning Message Studio').getByRole('button', { name: 'Send to Display' }).click()
    await page.goto('/display')

    await expect(page.getByTestId('morning-message-display')).toBeVisible()
    await assertDisplayReadyForSnapshot(page)

    await expect(page).toHaveScreenshot('display-morning-message-1920x1080.png', SNAPSHOT_OPTIONS)
  })
})
