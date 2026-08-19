/**
 * DB-2A — Spotify Level 2 vertical slice screenshots.
 *
 * Captures the /board-lab Spotify states with NO real Spotify config:
 *   - present mode (student-safe now-playing placeholder)
 *   - edit mode (board + toolbar)
 *   - edit mode with the Spotify placeholder selected (teacher panel shows
 *     "Spotify setup needed")
 *
 * Run: node scripts/capture-db2a-spotify-screenshots.mjs
 * Requires: dev server on http://localhost:5173
 */

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:5173'
const OUT = 'docs/status/db-2a-screenshots'

mkdirSync(OUT, { recursive: true })

async function shot(page, name) {
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log(`  OK ${name}`)
}

async function main() {
  const browser = await chromium.launch({ headless: true })

  // Present mode — student-safe now-playing placeholder inside the board.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await page.goto(`${BASE}/board-lab`, { waitUntil: 'networkidle' })
    await shot(page, 'spotify-present-safe-now-playing')
    await context.close()
  }

  // Edit mode — board + toolbar.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await page.goto(`${BASE}/board-lab?mode=edit`, { waitUntil: 'networkidle' })
    await shot(page, 'spotify-edit-board')
    await context.close()
  }

  // Edit mode — Spotify placeholder selected → teacher panel (setup-needed).
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await page.goto(`${BASE}/board-lab?mode=edit`, { waitUntil: 'networkidle' })
    await page.locator('[data-board-object-kind="spotifyNowPlayingPlaceholder"]').click()
    await page.waitForSelector('[data-spotify-setup-needed]', { timeout: 5000 })
    await shot(page, 'spotify-edit-setup-needed')
    await context.close()
  }

  await browser.close()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err.message)
  process.exit(1)
})
