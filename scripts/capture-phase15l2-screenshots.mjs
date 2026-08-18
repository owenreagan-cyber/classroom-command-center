/**
 * Phase 15L.2 — Presentation Hub screenshots.
 *
 * Captures:
 *   - /control Presentation Hub at 1440x900 and 1024x768
 *   - /control hub with the display blanked (if practical)
 *   - /control hub with Display Studio opened (if practical)
 *   - /display active screen at 1440x900 and 1024x768
 *
 * Run: node scripts/capture-phase15l2-screenshots.mjs
 * Requires: dev server on http://localhost:5173
 */

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:5173'
const OUT = 'docs/status/phase-15l-2-screenshots'
const KEY = 'classroom-command-center-display-composer'

mkdirSync(OUT, { recursive: true })

async function shot(page, name) {
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  console.log(`  OK ${name}`)
}

async function readState(page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed.state ?? parsed
  }, KEY)
}

async function writeState(page, state) {
  await page.evaluate(
    ({ key, state }) => {
      localStorage.setItem(key, JSON.stringify({ state, version: 1 }))
    },
    { key: KEY, state },
  )
}

async function clickText(page, text) {
  const el = page.locator(`button:has-text("${text}")`).first()
  if (await el.isVisible().catch(() => false)) {
    await el.evaluate((n) => n.click())
    await page.waitForTimeout(500)
    return true
  }
  return false
}

async function enterHub(page) {
  await page.goto(`${BASE}/control`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  // /control defaults to Teach Mode; enter edit mode to reveal the hub.
  await clickText(page, 'Dashboard')
  await page.waitForTimeout(600)
  return page.locator('[data-presentation-hub]').isVisible().catch(() => false)
}

async function seedIfNeeded(page) {
  // "Send to Display" persists the default screen set so we can inspect /display.
  let state = await readState(page)
  if (state) return state
  const send = page.locator('[data-hub-action="send-to-display"]')
  if (await send.isVisible().catch(() => false)) {
    await send.evaluate((n) => n.click())
    await page.waitForTimeout(600)
  }
  state = await readState(page)
  if (!state) throw new Error('display composer state not found after seeding')
  return state
}

async function main() {
  const browser = await chromium.launch({ headless: true })

  // ── Presentation Hub (both viewports) ──
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ]) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    const suffix = `${viewport.width}x${viewport.height}`

    const entered = await enterHub(page)
    if (!entered) {
      console.error('Could not enter Presentation Hub.')
      await context.close()
      await browser.close()
      process.exit(1)
    }

    await shot(page, `hub-${suffix}`)

    // Blank the display via the hub's primary Blank control.
    if (await clickText(page, 'Blank Screen')) {
      await shot(page, `hub-blanked-${suffix}`)
      await clickText(page, 'Restore Display')
    } else {
      console.log('  WARN: Blank Screen control not reachable; skipping blanked shot')
    }

    // Open Display Studio from the hub entry point.
    const studioBtn = page.locator('[data-hub-action="open-studio"]')
    if (await studioBtn.isVisible().catch(() => false)) {
      await studioBtn.evaluate((n) => n.click())
      await page.waitForTimeout(1200)
      if (await page.locator('[data-display-studio]').isVisible().catch(() => false)) {
        await shot(page, `hub-studio-${suffix}`)
      }
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    }

    await context.close()
  }

  // ── /display active screen (both viewports) ──
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ]) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    const suffix = `${viewport.width}x${viewport.height}`

    await enterHub(page)
    const state = await seedIfNeeded(page)
    const firstId = state.order?.[0]
    if (!firstId) {
      console.error('No screen ids available for /display capture.')
      await context.close()
      continue
    }
    state.activeScreenId = firstId
    state.displayBlanked = false
    await writeState(page, state)

    await page.goto(`${BASE}/display`, { waitUntil: 'networkidle' })
    await shot(page, `display-active-${suffix}`)
    await context.close()
  }

  await browser.close()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err.message)
  process.exit(1)
})
