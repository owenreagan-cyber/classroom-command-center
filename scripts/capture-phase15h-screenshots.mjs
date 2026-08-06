// Phase 15H screenshot capture script
// Captures prize catalog, 100 Board, roster status, and student safety views.
// Uses fake/sample data only — no real student names.
import { chromium } from 'playwright';

const BASE = 'http://localhost:5174';
const SCREENSHOT_DIR = 'docs/status/phase-15h-roster-prize-board-screenshots';

async function forceClick(page, selector) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'attached', timeout: 8000 });
  await el.evaluate(node => node.click());
  await page.waitForTimeout(500);
}

async function capture(label, page) {
  const path = `${SCREENSHOT_DIR}/${label}.png`;
  await page.screenshot({ path, fullPage: false });
  console.log(`  ✓ ${label}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // ── 1. Navigate to /control and open Display Studio ──
    console.log('Navigating to /control...');
    await page.goto(`${BASE}/control`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    // Open teacher dock if collapsed
    const expandBtn = page.locator('button:has-text("»")');
    if (await expandBtn.isVisible().catch(() => false)) {
      await forceClick(page, 'button:has-text("»")');
    }

    // Open Display Screens
    const displayBtn = page.locator('button:has-text("Display Screens")');
    if (await displayBtn.isVisible().catch(() => false)) {
      await forceClick(page, 'button:has-text("Display Screens")');
    }
    await page.waitForTimeout(1000);

    // Reopen Display Studio
    const reopenBtn = page.locator('button:has-text("Reopen Display Studio")');
    if (await reopenBtn.isVisible().catch(() => false)) {
      await forceClick(page, 'button:has-text("Reopen Display Studio")');
    }
    await page.waitForTimeout(1500);

    // ── 2. 100 Board in Display Studio editor ──
    console.log('Capturing 100 Board screenshots...');
    // Click on a screen with a 100-board widget (e.g., game-review)
    const gameReviewThumb = page.locator('button:has-text("Review Game")');
    if (await gameReviewThumb.isVisible().catch(() => false)) {
      await forceClick(page, 'button:has-text("Review Game")');
    }
    await page.waitForTimeout(800);
    await capture('01-100-board-display-studio', page);

    // ── 3. Navigate to Prize Board tool ──
    // Open prize board screen
    const pbThumb = page.locator('button:has-text("Prize Board")');
    if (await pbThumb.isVisible().catch(() => false)) {
      await forceClick(page, 'button:has-text("Prize Board")');
    }
    await page.waitForTimeout(800);
    await capture('02-prize-board-screen-editor', page);

    // ── 4. Navigate to /display for student-safe view ──
    console.log('Navigating to /display...');
    await page.goto(`${BASE}/display`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1500);
    await capture('03-display-student-safe', page);

    // ── 5. Student Picker Roster Tab ──
    console.log('Navigating back to /control for roster view...');
    await page.goto(`${BASE}/control`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);

    // Open teacher dock
    const expandBtn2 = page.locator('button:has-text("»")');
    if (await expandBtn2.isVisible().catch(() => false)) {
      await forceClick(page, 'button:has-text("»")');
    }

    // Click Student Picker tool
    const pickerBtn = page.locator('button:has-text("Student Picker")');
    if (await pickerBtn.isVisible().catch(() => false)) {
      await forceClick(page, 'button:has-text("Student Picker")');
    }
    await page.waitForTimeout(1500);
    await capture('04-student-picker-roster', page);

    // ── 6. Class selector ──
    await page.waitForTimeout(500);
    await capture('05-class-selector', page);

    console.log('\nAll screenshots captured successfully.');
  } catch (err) {
    console.error('Screenshot capture error:', err.message);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
