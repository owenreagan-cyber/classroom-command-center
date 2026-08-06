/**
 * Phase 15G — Automated Visual QA Screenshot Capture
 *
 * Captures 15 required screenshots showing template picker, theme picker,
 * quick start flows, and display-active indicators.
 *
 * Run: node scripts/capture-phase15g-screenshots.mjs
 * Requires: dev server running on port 5174
 */

import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const OUT = 'docs/status/phase-15g-screenshots'

async function screenshot(page, name) {
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  console.log(`  ✓ ${name}`)
}

async function forceClick(page, selector) {
  const el = page.locator(selector).first()
  const visible = await el.isVisible().catch(() => false)
  if (!visible) return false
  await el.evaluate((node) => node.click())
  await page.waitForTimeout(400)
  return true
}

async function openDisplayStudio(page) {
  await page.goto(`${BASE}/control`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  await forceClick(page, 'button:has-text("»")')
  await page.waitForTimeout(300)

  // Open Display Screens tool
  const tools = page.locator('[data-dock-tool]')
  const count = await tools.count()
  for (let i = 0; i < count; i++) {
    const txt = await tools.nth(i).textContent()
    if (txt?.includes('Display Screens') || txt?.includes('Screens')) {
      await tools.nth(i).evaluate((n) => n.click())
      await page.waitForTimeout(500)
      break
    }
  }

  // Reopen Display Studio
  await forceClick(page, 'button:has-text("Reopen Display Studio"), button:has-text("Display Studio")')
  await page.waitForTimeout(1000)
}

async function selectScreen(page, screenId) {
  const thumb = page.locator(`[data-display-screen-thumb="${screenId}"]`)
  if (await thumb.isVisible().catch(() => false)) {
    await thumb.evaluate((n) => n.click())
    await page.waitForTimeout(500)
    return true
  }
  return false
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  // ── Open Display Studio ──
  await openDisplayStudio(page)

  // 1. Template picker overview
  await forceClick(page, 'button:has-text("Templates")') // 📁 Templates button in command bar
  await screenshot(page, '01-template-picker-overview')

  // 2. Daily templates category (click 'Daily' tab)
  await screenshot(page, '02-daily-templates-category')

  // 3. Instruction templates category
  await forceClick(page, 'button:has-text("Instruction")')
  await screenshot(page, '03-instruction-templates-category')

  // 4. Engagement templates category
  await forceClick(page, 'button:has-text("Engagement")')
  await screenshot(page, '04-engagement-templates-category')

  // Close template picker
  await forceClick(page, 'button:has-text("✕")')
  await page.waitForTimeout(500)

  // 5. Theme picker overview — expand Style section in inspector
  await selectScreen(page, 'arrival-720')
  await forceClick(page, 'button:has-text("Style")')
  await screenshot(page, '05-theme-picker-overview')

  // 6. High Contrast theme applied
  // Find High Contrast theme button and click it
  const hcBtn = page.locator('[data-display-studio-theme-picker] button:has-text("High Contrast")')
  if (await hcBtn.isVisible().catch(() => false)) {
    await hcBtn.evaluate((n) => n.click())
    await page.waitForTimeout(300)
  }
  await screenshot(page, '06-high-contrast-theme-applied')

  // 7. Anime Energy / Game Day theme applied
  const geBtn = page.locator('[data-display-studio-theme-picker] button:has-text("Game Day")')
  if (await geBtn.isVisible().catch(() => false)) {
    await geBtn.evaluate((n) => n.click())
    await page.waitForTimeout(300)
  }
  await screenshot(page, '07-game-day-theme-applied')

  // 8. Wallpaper/background preview (Style section shows current gradient)
  await forceClick(page, 'button:has-text("Style")') // ensure expanded
  await screenshot(page, '08-wallpaper-background-preview')

  // 9. Quick Start / one-click flows panel
  await forceClick(page, 'button:has-text("Quick Start")') // ⚡ Quick Start in command bar
  await screenshot(page, '09-quick-start-flows')

  // 10. Start the Day flow result
  await forceClick(page, 'button:has-text("Start the Day")')
  await screenshot(page, '10-start-day-flow-result')

  // 11. Work Time flow result
  await forceClick(page, 'button:has-text("Quick Start")')
  await forceClick(page, 'button:has-text("Work Time")')
  await screenshot(page, '11-work-time-flow-result')

  // 12. Review Game flow result
  await forceClick(page, 'button:has-text("Quick Start")')
  await forceClick(page, 'button:has-text("Review Game")')
  await screenshot(page, '12-review-game-flow-result')

  // Close Quick Start
  await forceClick(page, '[data-display-studio-quick-start] button:has-text("✕")')

  // 13. Active display indicator: selected-vs-live
  // Send current screen to display
  await forceClick(page, 'button:has-text("Send to Display")')
  await page.waitForTimeout(500)
  // Now select a different screen to show selected ≠ live
  await selectScreen(page, 'arrival-720')
  await screenshot(page, '13-active-display-indicator-selected-vs-live')

  // 14. /display after sending selected template
  await page.goto(`${BASE}/display`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await screenshot(page, '14-display-after-template-sent')

  // 15. Narrow/laptop viewport
  await page.setViewportSize({ width: 1024, height: 768 })
  await openDisplayStudio(page)
  await forceClick(page, 'button:has-text("Templates")')
  await screenshot(page, '15-narrow-laptop-viewport')

  await browser.close()
  console.log('\nAll 15 screenshots captured.')
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err.message)
  process.exit(1)
})
