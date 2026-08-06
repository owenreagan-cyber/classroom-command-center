/**
 * Phase 15F — Automated Visual QA Screenshot Capture
 *
 * Uses force-clicks to bypass Display Studio overlay interception.
 * Run: node scripts/capture-phase15f-screenshots.mjs
 * Requires: dev server running on port 5174
 */

import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const OUT = 'docs/status/phase-15f-screenshots'

async function screenshot(page, name) {
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  console.log(`  ✓ ${name}`)
}

async function forceClick(page, selector) {
  const el = page.locator(selector).first()
  const visible = await el.isVisible().catch(() => false)
  if (!visible) return false
  await el.evaluate((node) => (node).click())
  await page.waitForTimeout(400)
  return true
}

async function openDisplayStudio(page) {
  // Navigate to control
  await page.goto(`${BASE}/control`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)

  // Expand dock if collapsed
  await forceClick(page, 'button:has-text("»")')

  // Click Display Screens tool
  const foundDock = await forceClick(page, 'button:has-text("Display Screens")')
  if (!foundDock) {
    // Try tool buttons with data attributes
    const tools = page.locator('[data-dock-tool]')
    const count = await tools.count()
    console.log(`Found ${count} dock tools`)
    if (count > 0) {
      // Find the Display Screens tool
      for (let i = 0; i < count; i++) {
        const txt = await tools.nth(i).textContent()
        if (txt?.includes('Display Screens') || txt?.includes('Screens')) {
          await tools.nth(i).evaluate((n) => n.click())
          await page.waitForTimeout(500)
          break
        }
      }
    }
  }

  // Reopen Display Studio
  await page.waitForTimeout(500)
  const reopened = await forceClick(page, 'button:has-text("Reopen Display Studio"), button:has-text("Display Studio")')
  if (!reopened) {
    console.log('  ⚠ Display Studio not found, may already be open')
  }
  await page.waitForTimeout(1000)
}

async function selectScreen(page, screenId) {
  const thumb = page.locator(`[data-display-screen-thumb="${screenId}"]`)
  const visible = await thumb.isVisible().catch(() => false)
  if (visible) {
    await thumb.evaluate((n) => n.click())
    await page.waitForTimeout(500)
    return true
  }
  console.log(`  ⚠ Screen ${screenId} not found`)
  return false
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  // ── Step 1: Open Display Studio ──
  await openDisplayStudio(page)

  // 1. Template library overview (thumbnail rail + canvas)
  await screenshot(page, '01-template-library-overview')

  // 2. Wallpaper/theme preview (Style section in inspector)
  await forceClick(page, '[data-display-studio-section="style"], button:has-text("Style")')
  await screenshot(page, '02-wallpaper-theme-preview')

  // 3-9. Classroom templates
  const templateList = [
    ['arrival-720', '03-arrival-template'],
    ['math-launch-15c', '04-math-launch-template'],
    ['work-time', '05-work-time-template'],
    ['lunch-15c', '06-lunch-template'],
    ['mystery-student-15c', '07-mystery-student-template'],
    ['review-game-15c', '08-review-game-template'],
  ]
  for (const [id, name] of templateList) {
    await selectScreen(page, id)
    await screenshot(page, name)
  }

  // Game Day theme example (review game has sunny-specials)
  await selectScreen(page, 'game-review')
  await screenshot(page, '09-game-day-theme-example')

  // Calm Focus theme (lesson launch)
  await selectScreen(page, 'lesson-launch')
  await screenshot(page, '10-calm-focus-theme-example')

  // Winter/Seasonal (writing workshop uses soft-pastel, or use test-mode for minimal)
  await selectScreen(page, 'test-mode')
  await screenshot(page, '11-minimal-projector-theme')

  // ── 12: /display polished classroom screen ──
  await selectScreen(page, 'work-time')
  await forceClick(page, 'button:has-text("Send to Display"), [data-studio-action="send-to-display"]')
  await page.waitForTimeout(500)
  await page.goto(`${BASE}/display`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await screenshot(page, '12-display-polished-classroom-screen')

  // ── 13: /display high contrast ──
  await openDisplayStudio(page)
  await selectScreen(page, 'test-mode')
  await forceClick(page, 'button:has-text("Send to Display"), [data-studio-action="send-to-display"]')
  await page.waitForTimeout(500)
  await page.goto(`${BASE}/display`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await screenshot(page, '13-display-high-contrast')

  // ── 14: Narrow/laptop viewport ──
  await page.setViewportSize({ width: 1024, height: 768 })
  await openDisplayStudio(page)
  await selectScreen(page, 'arrival-720')
  await screenshot(page, '14-narrow-laptop-viewport')

  // ── 15: Widget readability state ──
  await page.setViewportSize({ width: 1440, height: 900 })
  await openDisplayStudio(page)
  await selectScreen(page, 'arrival-720')
  await screenshot(page, '15-readability-widget-state')

  await browser.close()
  console.log('\nAll 15 screenshots captured.')
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err.message)
  process.exit(1)
})
