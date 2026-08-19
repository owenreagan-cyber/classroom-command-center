/**
 * DB-1 — Clean Board Lab screenshots.
 *
 * Captures /board-lab in present and edit modes at 1440x900 and 1024x768.
 *
 * Run: node scripts/capture-db1-board-lab-screenshots.mjs
 * Requires: dev server on http://localhost:5173
 */

import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = 'http://localhost:5173'
const OUT = 'docs/status/db-1-screenshots'

mkdirSync(OUT, { recursive: true })

async function shot(page, name) {
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
  console.log(`  OK ${name}`)
}

async function main() {
  const browser = await chromium.launch({ headless: true })

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
  ]) {
    for (const mode of ['present', 'edit']) {
      const context = await browser.newContext({ viewport })
      const page = await context.newPage()
      const suffix = `${viewport.width}x${viewport.height}`
      await page.goto(`${BASE}/board-lab?mode=${mode}`, { waitUntil: 'networkidle' })
      await shot(page, `board-lab-${mode}-${suffix}`)
      await context.close()
    }
  }

  await browser.close()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err.message)
  process.exit(1)
})
