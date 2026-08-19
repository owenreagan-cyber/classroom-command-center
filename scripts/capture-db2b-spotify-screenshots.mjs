/**
 * DB-2B — Spotify live validation screenshots.
 *
 * Captures the /board-lab Spotify states that are SAFE without a real Spotify
 * config. Connected/device screenshots are captured manually after live OAuth
 * (see docs/status/db-2b-live-spotify-validation.md) — never with tokens,
 * codes, email, or raw device IDs.
 *
 * Run: node scripts/capture-db2b-spotify-screenshots.mjs
 * Requires: dev server on http://localhost:5173
 */

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:5173'
const OUT = 'docs/status/db-2b-screenshots'

mkdirSync(OUT, { recursive: true })

async function shot(page, name) {
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log(`  OK ${name}`)
}

async function main() {
  const browser = await chromium.launch({ headless: true })

  // Present mode — student-safe now-playing placeholder.
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await page.goto(`${BASE}/board-lab`, { waitUntil: 'networkidle' })
    await shot(page, 'spotify-present-safe-now-playing')
    await context.close()
  }

  // Edit mode — Spotify placeholder selected → teacher panel (setup-needed).
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    await page.goto(`${BASE}/board-lab?mode=edit`, { waitUntil: 'networkidle' })
    await page.waitForSelector('[data-board-object-kind="spotifyNowPlayingPlaceholder"]', {
      timeout: 5000,
    })
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
