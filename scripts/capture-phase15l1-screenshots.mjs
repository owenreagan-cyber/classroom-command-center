/**
 * Phase 15L.1 — Display safety / layout screenshots.
 *
 * Captures:
 *   - /control Display Studio with a teacher-side overlap warning visible
 *   - /display for 6 required routine screens at two viewports
 *
 * Run: node scripts/capture-phase15l1-screenshots.mjs
 * Requires: dev server on http://localhost:5173
 */

import { chromium } from 'playwright'

const BASE = 'http://localhost:5173'
const OUT = 'docs/status/phase-15l-1-screenshots'
const KEY = 'classroom-command-center-display-composer'

const DISPLAY_TARGETS = [
  { id: 'arrival-720', label: 'morning-arrival' },
  { id: 'math-launch-15c', label: 'math-launch' },
  { id: 'work-time', label: 'work-time' },
  { id: 'lunch-15c', label: 'lunch-routine' },
  { id: 'mystery-student-15c', label: 'mystery-student' },
  { id: 'review-game-15c', label: 'review-game' },
]

async function shot(page, name) {
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  console.log(`  ✓ ${name}`)
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
  await page.waitForTimeout(1500)

  // /control defaults to Teach Mode; enter Edit/Dashboard Mode to reveal the dock.
  await forceClick(page, 'button:has-text("Dashboard")')
  await page.waitForTimeout(400)

  // Dock is collapsed by default; expand it so tool cards render.
  await forceClick(page, '[aria-label="Expand teacher dock"]')
  await page.waitForTimeout(300)

  // Open the Display Screens tool → its panel auto-opens Display Studio.
  await forceClick(page, '[data-dock-tool-card="display-composer"]')
  await page.waitForTimeout(1500)

  return page.locator('[data-display-studio]').isVisible().catch(() => false)
}

async function seedFromLiveApp(page) {
  // "Send to Display" triggers a persist write, seeding localStorage with the
  // full default screen set + activeScreenId.
  const send = page.locator('[data-studio-action="send-to-display"]')
  if (await send.isVisible().catch(() => false)) {
    await send.click()
    await page.waitForTimeout(600)
  }
  const state = await readState(page)
  if (!state) throw new Error('display composer state not found after seeding')
  return state
}

async function main() {
  const browser = await chromium.launch({ headless: true })

  // ── Seed: open studio once and persist the default screens ──
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    const opened = await openDisplayStudio(page)
    if (!opened) {
      console.error('Could not open Display Studio.')
      await context.close()
      await browser.close()
      process.exit(1)
    }
    await seedFromLiveApp(page)

    // Inject the overlap-demo screen at the front of the order
    const state = await readState(page)
    const overlap = {
      id: 'overlap-demo',
      title: 'Overlap Demo',
      mode: 'custom',
      background: { type: 'gradient', token: 'calm-focus' },
      showClock: true,
      timerWidget: { kind: 'none' },
      studentMessage: 'Two widgets overlap on purpose.',
      widgets: [
        { id: 'od-a', type: 'directions-text', label: 'Widget A', x: 18, y: 30, w: 30, h: 30, visible: true, locked: false, settings: { text: 'A' }, zIndex: 1 },
        { id: 'od-b', type: 'directions-text', label: 'Widget B', x: 40, y: 30, w: 30, h: 30, visible: true, locked: false, settings: { text: 'B' }, zIndex: 2 },
      ],
      studentSafe: true,
      updatedAt: 0,
      version: 1,
    }
    state.screens = { ...state.screens, 'overlap-demo': overlap }
    state.order = ['overlap-demo', ...state.order.filter((id) => id !== 'overlap-demo')]
    state.activeScreenId = null
    await writeState(page, state)

    // Reload /control and reopen studio so overlap-demo is the default screen
    await openDisplayStudio(page)
    await shot(page, 'control-overlap-warning-1440x900')
    await context.close()
  }

  // ── /display routine screens ──
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ]) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    await page.goto(`${BASE}/control`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    const suffix = `${viewport.width}x${viewport.height}`

    // Ensure state is seeded; open studio + send once if not
    let state = await readState(page)
    if (!state) {
      await openDisplayStudio(page)
      state = await seedFromLiveApp(page)
    }

    for (const target of DISPLAY_TARGETS) {
      state.activeScreenId = target.id
      state.displayBlanked = false
      await writeState(page, state)
      await page.goto(`${BASE}/display`, { waitUntil: 'networkidle' })
      await shot(page, `display-${target.label}-${suffix}`)
      await page.goto(`${BASE}/control`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(400)
    }
    await context.close()
  }

  await browser.close()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err.message)
  process.exit(1)
})
