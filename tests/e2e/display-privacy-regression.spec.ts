/**
 * Phase 11D — Display route privacy regression tests.
 *
 * Run: npm run test:e2e -- tests/e2e/display-privacy-regression.spec.ts
 */

import { test, expect } from '@playwright/test'
import { enterEditMode, openDockTool } from './helpers/teacher-dock-e2e'

const DISPLAY_PRIVACY_PATTERNS = [
  /teacher notes/i,
  /teacher key/i,
  /answer key/i,
  /readiness/i,
  /omninote:\/\//i,
  /\.local\//i,
  /canvas\.instructure\.com/i,
  /access_token/i,
  /bearer\s+/i,
  /@[\w.-]+\.\w+/,
  /parent email/i,
  /teacher-only prep note/i,
] as const

const DISPLAY_PRIVACY_STRINGS = [
  'Teacher Notes',
  'Teacher Key',
  'Answer Key',
  'OmniNote handoff',
  'drivePath',
  'readiness',
  'access_token',
  'canvas.instructure.com',
  '.local/omninote-handoff',
  'Teach in OmniNote',
  'Copy OmniNote Link',
  'Teacher Control',
  'Backup / Restore',
  'Add prep reminder',
  'Material Launcher',
  'Open With',
  'Copy Link',
  'Show on Display',
  'Morning Message Studio',
  'Mystery Star',
] as const

async function assertDisplayBodyPrivacy(page: import('@playwright/test').Page) {
  const bodyText = await page.locator('body').innerText()
  const html = await page.content()

  for (const pattern of DISPLAY_PRIVACY_PATTERNS) {
    expect(bodyText, `body should not match ${pattern}`).not.toMatch(pattern)
  }

  for (const snippet of DISPLAY_PRIVACY_STRINGS) {
    expect(bodyText, `body should not contain "${snippet}"`).not.toContain(snippet)
  }

  expect(html, 'HTML should not expose .local paths').not.toMatch(/\.local\//)
  expect(html, 'HTML should not expose omninote handoff URLs').not.toMatch(/omninote:\/\/lesson/)
  expect(html, 'HTML should not expose tokens').not.toMatch(/access_token/i)
}

test.describe('Display privacy regression', () => {
  test('/display page text excludes teacher-only content', async ({ page }) => {
    await page.goto('/display')
    await expect(page.locator('.board-screen-title')).toBeVisible()
    await assertDisplayBodyPrivacy(page)
  })

  test('/display HTML excludes teacher dock and prep controls', async ({ page }) => {
    await page.goto('/display')
    await expect(page.locator('[data-teacher-command-dock]')).toHaveCount(0)
    await expect(page.getByLabel('Today Prep and Material Launcher')).toHaveCount(0)
    await expect(page.getByLabel('Morning Message Studio')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Open Student Display' })).toHaveCount(0)
    await assertDisplayBodyPrivacy(page)
  })

  test('/display after control prep workflow stays student-safe', async ({ page }) => {
    const secretUrl = 'https://canvas.instructure.com/courses/phase11d-secret'
    const secretNote = 'Teacher-only prep note for phase 11D privacy test'
    const secretToken = 'access_token=phase11d-secret-token'

    await page.goto('/control')
    await enterEditMode(page)
    await openDockTool(page, 'Today Prep')
    const prepPanel = page.getByLabel('Today Prep and Material Launcher')
    await expect(prepPanel).toBeVisible()
    await prepPanel.getByLabel('Resource type preset').first().selectOption('google-slides')
    await prepPanel.getByPlaceholder('Resource label').fill('Phase 11D Slides')
    await prepPanel.getByPlaceholder('https://docs.google.com/presentation/d/...').fill(secretUrl)
    await prepPanel.getByPlaceholder('Optional note').fill(`${secretNote} ${secretToken}`)
    await prepPanel.getByRole('button', { name: 'Add resource link' }).click()
    await prepPanel.getByRole('button', { name: 'Show on Display' }).click()

    await page.goto('/display')
    await expect(
      page.getByRole('status', { name: /now showing:\s*phase 11d slides/i }),
    ).toBeVisible()

    const bodyText = await page.locator('body').innerText()
    expect(bodyText).toContain('Phase 11D Slides')
    expect(bodyText).not.toContain(secretUrl)
    expect(bodyText).not.toContain(secretNote)
    expect(bodyText).not.toContain(secretToken)
    await assertDisplayBodyPrivacy(page)
  })
})
