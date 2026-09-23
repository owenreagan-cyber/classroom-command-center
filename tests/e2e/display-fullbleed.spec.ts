/**
 * /display full-bleed verification.
 *
 * /display renders a fixed 1920x1080 logical board, uniformly scaled to
 * "contain" inside whatever container it's given (boardGeometry.ts) -- scale
 * stays uniform always, so text and shapes never distort. A backdrop layer
 * fills the full container with the same active background
 * (BoardCanvas.tsx's `backdropStyle`), so any margin left by "contain"
 * fitting a non-16:9 container blends into the board's own background
 * instead of showing the outer wrapper's flat bg-slate-950 as a letterbox
 * bar.
 *
 * Priority order (per Owen):
 *  1. Exact 16:9 (1920x1080, 2560x1440, 3840x2160) is the real classroom
 *     case and must be pixel-perfect: the board fills the viewport edge to
 *     edge with zero margin.
 *  2. Non-16:9 (a misconfigured TV/Mac resolution) is a fallback: no crop,
 *     no distortion, no black -- margins blend into the board's background.
 */

import { mkdirSync } from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { test, expect, type Page } from '@playwright/test'

const ARTIFACT_DIR = path.join(process.cwd(), '.local/visual-qa/display-fullbleed')

const RESOLUTIONS = [
  { width: 1920, height: 1080, label: '1920x1080', aspect: '16:9', is16by9: true },
  { width: 3840, height: 2160, label: '3840x2160', aspect: '16:9', is16by9: true },
  { width: 2560, height: 1440, label: '2560x1440', aspect: '16:9', is16by9: true },
  { width: 1920, height: 1200, label: '1920x1200', aspect: '16:10 (misconfigured TV case)', is16by9: false },
] as const

/** Letterbox-bar color (Tailwind slate-950, the outer wrapper's flat bg). */
const LETTERBOX_RGB = { r: 2, g: 6, b: 23 }

function colorDistance(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

function luminance({ r, g, b }: { r: number; g: number; b: number }) {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * Minimal PNG pixel reader for a 1x1 (or small) screenshot clip. No decode
 * library dependency: for the first pixel of the first scanline, every PNG
 * filter type (None/Sub/Up/Average/Paeth) reduces to "raw byte" because the
 * left/above neighbors used by the predictor don't exist yet (treated as 0)
 * -- so we can read the raw post-filter-byte bytes directly.
 */
function readTopLeftPixelRGB(png: Buffer): { r: number; g: number; b: number } {
  let offset = 8 // PNG signature
  let width = 0
  let colorType = 0
  let bitDepth = 8
  const idatChunks: Buffer[] = []

  while (offset < png.length) {
    const length = png.readUInt32BE(offset)
    const type = png.toString('ascii', offset + 4, offset + 8)
    const data = png.subarray(offset + 8, offset + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      bitDepth = data.readUInt8(8)
      colorType = data.readUInt8(9)
    } else if (type === 'IDAT') {
      idatChunks.push(data)
    } else if (type === 'IEND') {
      break
    }
    offset += 8 + length + 4 // length + type + data + crc
  }

  if (width === 0) throw new Error('Could not parse PNG width (no IHDR)')
  if (bitDepth !== 8) throw new Error(`Unsupported PNG bit depth: ${bitDepth}`)

  const raw = zlib.inflateSync(Buffer.concat(idatChunks))
  // Byte 0 of the buffer is the filter-type byte for scanline 0; byte 1+ is
  // pixel data for that scanline's first pixel (see doc comment above).
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : null
  if (channels === null) throw new Error(`Unsupported PNG color type: ${colorType}`)

  const px = raw.subarray(1, 1 + channels)
  if (channels === 1) return { r: px[0], g: px[0], b: px[0] }
  return { r: px[0], g: px[1], b: px[2] }
}

async function samplePixel(page: Page, x: number, y: number): Promise<{ r: number; g: number; b: number }> {
  const buf = await page.screenshot({ clip: { x, y, width: 1, height: 1 } })
  return readTopLeftPixelRGB(buf)
}

async function assertNoScrollbars(page: Page) {
  const dims = await page.evaluate(() => {
    const doc = document.documentElement
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      scrollHeight: doc.scrollHeight,
      clientHeight: doc.clientHeight,
    }
  })
  expect(dims.scrollWidth, 'scrollWidth should equal clientWidth (no horizontal scrollbar)').toBe(dims.clientWidth)
  expect(dims.scrollHeight, 'scrollHeight should equal clientHeight (no vertical scrollbar)').toBe(dims.clientHeight)
}

async function getBoardRect(page: Page) {
  const rect = await page.evaluate(() => {
    const el = document.querySelector('[data-board-canvas]')
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }
  })
  expect(rect, '[data-board-canvas] must be present').not.toBeNull()
  return rect!
}

/** Exact 16:9: the board must fill the viewport edge to edge, zero margin. */
async function assertBoardCoversViewportExactly(page: Page, width: number, height: number) {
  const rect = await getBoardRect(page)
  const epsilon = 1 // subpixel rounding tolerance
  expect(rect.left, 'board left edge').toBeLessThanOrEqual(epsilon)
  expect(rect.top, 'board top edge').toBeLessThanOrEqual(epsilon)
  expect(rect.right, 'board right edge').toBeGreaterThanOrEqual(width - epsilon)
  expect(rect.bottom, 'board bottom edge').toBeGreaterThanOrEqual(height - epsilon)
}

/**
 * Non-16:9 fallback: the board must not be cropped (its scaled box fits
 * entirely within the viewport, both axes) and must not be distorted (its
 * rendered aspect ratio is still exactly 16:9 -- proving the scale stayed
 * uniform rather than stretching X and Y independently).
 */
async function assertBoardNotClippedOrDistorted(page: Page, width: number, height: number) {
  const rect = await getBoardRect(page)
  const epsilon = 1
  expect(rect.left, 'board left edge should not be pushed off-screen (clipped)').toBeGreaterThanOrEqual(-epsilon)
  expect(rect.top, 'board top edge should not be pushed off-screen (clipped)').toBeGreaterThanOrEqual(-epsilon)
  expect(rect.right, 'board right edge should not exceed the viewport (clipped)').toBeLessThanOrEqual(width + epsilon)
  expect(rect.bottom, 'board bottom edge should not exceed the viewport (clipped)').toBeLessThanOrEqual(
    height + epsilon,
  )
  const renderedAspect = rect.width / rect.height
  expect(renderedAspect, 'board must keep its native 16:9 aspect ratio (no non-uniform stretch)').toBeCloseTo(
    16 / 9,
    2,
  )
}

test.describe('/display full-bleed', () => {
  for (const res of RESOLUTIONS) {
    const label = res.is16by9
      ? `fills the viewport edge to edge at ${res.label} (${res.aspect})`
      : `no crop/distortion/black at ${res.label} (${res.aspect})`

    test(label, async ({ page }) => {
      await page.setViewportSize({ width: res.width, height: res.height })
      await page.goto('/display')
      await expect(page.locator('[data-board-canvas]')).toBeVisible()

      await assertNoScrollbars(page)
      if (res.is16by9) {
        await assertBoardCoversViewportExactly(page, res.width, res.height)
      } else {
        await assertBoardNotClippedOrDistorted(page, res.width, res.height)
      }

      const inset = 2 // sample just inside the edge, not exactly on it
      const corners = [
        { name: 'top-left', x: inset, y: inset },
        { name: 'top-right', x: res.width - 1 - inset, y: inset },
        { name: 'bottom-left', x: inset, y: res.height - 1 - inset },
        { name: 'bottom-right', x: res.width - 1 - inset, y: res.height - 1 - inset },
      ]

      for (const corner of corners) {
        const rgb = await samplePixel(page, corner.x, corner.y)
        const distanceFromLetterbox = colorDistance(rgb, LETTERBOX_RGB)
        expect(
          distanceFromLetterbox,
          `${corner.name} corner (${JSON.stringify(rgb)}) should not be the letterbox bar color`,
        ).toBeGreaterThan(40)
        expect(
          luminance(rgb),
          `${corner.name} corner (${JSON.stringify(rgb)}) should be display background brightness, not a near-black bar`,
        ).toBeGreaterThan(100)
      }

      mkdirSync(ARTIFACT_DIR, { recursive: true })
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `display-${res.label}.png`) })
    })
  }
})
