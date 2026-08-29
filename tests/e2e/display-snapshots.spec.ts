/**
 * Phase 9C.1 (rewritten Phase 5) — Playwright screenshot baseline snapshots
 * for /display.
 *
 * `/display` is rendered by `BoardHostDisplay.tsx` (Clean Board's host
 * display) — see `src/App.tsx`'s routing, which intercepts the 'display'
 * route before it can ever reach `AppShell`/`StudentDisplayShell.tsx`. The
 * original version of this spec drove the legacy `/control` Command Center
 * (Morning Message Studio, Today Prep "Show on Display") and asserted on
 * `StudentDisplayShell`-only markup (`.board-screen-title`, the "Enter
 * fullscreen" button, `.classroom-canvas-frame`) — none of which /display
 * has rendered since Clean Board became the app's real display route, so
 * every test here was failing regardless of any actual regression. Rewritten
 * to drive and assert on the real, currently-reachable pipeline: /board-lab
 * casting a Stamp Manager milestone card or a QR code to /display via
 * localStorage + cross-tab sync (see stampStore.ts/qrCastStore.ts).
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

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth > doc.clientWidth + 2
  })
  expect(overflow).toBe(false)
}

/**
 * Negative assertions for every teacher-only surface that must never reach
 * /display — the legacy Command Center dock, Clean Board's own Teacher
 * Dock and its panels, and the QR/stamp teacher-input components
 * specifically (see the Phase 2/4 isolation guards these mirror at the
 * browser level).
 */
async function assertDisplayPrivacy(page: Page) {
  await expect(page.getByRole('complementary', { name: 'Teacher controls' })).toHaveCount(0)
  await expect(page.locator('[data-teacher-command-dock]')).toHaveCount(0)
  await expect(page.locator('[data-teacher-dock]')).toHaveCount(0)
  await expect(page.locator('[data-teacher-dock-fab]')).toHaveCount(0)
  await expect(page.locator('[data-stamp-manager-widget]')).toHaveCount(0)
  await expect(page.locator('[data-qr-cast-teacher-panel]')).toHaveCount(0)
  await expect(page.locator('[data-qr-url-input]')).toHaveCount(0)
  await expect(page.getByLabel('Studio Canvas toolbar')).toHaveCount(0)
  await expect(page.getByText('Teacher Notes')).toHaveCount(0)
  await expect(page.getByText('Backup / Restore')).toHaveCount(0)
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
  await expect(page.locator('[data-clean-board-host-display]')).toBeVisible()
  await expect(page.locator('[data-board-canvas]')).toBeVisible()
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

      // Fresh browser context, no board-lab activity yet — falls back to
      // the "Morning Arrival — New Classroom" default template (see
      // displayHost.ts), whose heading is "Good Morning".
      await expect(page.getByText('Good Morning', { exact: true })).toBeVisible()
      await assertDisplayReadyForSnapshot(page)

      await expect(page).toHaveScreenshot(`display-default-${viewport.label}.png`, SNAPSHOT_OPTIONS)
    })
  }
})

test.describe('Phase 4 Stamp Manager display snapshot', () => {
  test('/display stamp milestone card at 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/board-lab?mode=edit')

    await page.locator('[data-teacher-dock-fab]').click()
    await page.locator('[data-teacher-dock-tab="stamps"]').click()

    await page.locator('[data-stamp-name-input]').fill('Snapshot Student')
    await page.locator('[data-stamp-add-student]').click()
    await page.locator('[data-stamp-cast-to-display]').click()
    // A single +10 gives a stable, non-zero progress bar without redeeming
    // any milestone — redemption triggers a transient celebration animation
    // that would make this snapshot flaky.
    await page.locator('[data-stamp-add-amount="10"]').click()

    await page.goto('/display')

    await expect(page.locator('[data-projected-stamp-card]')).toBeVisible()
    await expect(page.getByText('Snapshot Student')).toBeVisible()
    await assertDisplayReadyForSnapshot(page)

    await expect(page).toHaveScreenshot('display-stamp-milestone-1920x1080.png', SNAPSHOT_OPTIONS)
  })
})

test.describe('Phase 4 QR code display snapshot', () => {
  test('/display QR code widget at 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/board-lab?mode=edit')

    await page.locator('[data-teacher-dock-fab]').click()
    await page.locator('[data-teacher-dock-tab="qrCode"]').click()

    await page.locator('[data-qr-url-input]').fill('https://example.com/join')
    await page.locator('[data-qr-cast-button]').click()

    await page.goto('/display')

    await expect(page.locator('[data-qr-code-widget]')).toBeVisible()
    await assertDisplayReadyForSnapshot(page)

    await expect(page).toHaveScreenshot('display-qr-code-1920x1080.png', SNAPSHOT_OPTIONS)
  })
})
