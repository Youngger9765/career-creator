/**
 * Auto-detect and capture all gameplays
 */
import { test } from '@playwright/test';
import * as path from 'path';

const ROOM_URL = 'https://career-creator-frontend-production-849078733818.asia-east1.run.app/room/bd2bece6-398f-41b7-8a23-6dd8461b7df4';
const SCREENSHOTS_DIR = path.join(__dirname, '../../docs/images/gameplays');

test('Auto capture all gameplays', async ({ page }) => {
  await page.goto(ROOM_URL);
  await page.waitForTimeout(5000);

  let counter = 4; // Start from 4 since we already have 01-03

  // Find all gameplay selection buttons
  const gameplayButtons = await page.locator('button:has-text("選擇此玩法")').all();

  console.log(`Found ${gameplayButtons.length} gameplay buttons`);

  for (const button of gameplayButtons) {
    // Get button text to identify which gameplay
    const parentCard = button.locator('xpath=ancestor::*[self::div][1]');
    const titleElement = parentCard.locator('h3, h4').first();
    const title = await titleElement.textContent().catch(() => 'unknown');

    console.log(`\n📸 Clicking gameplay: ${title}`);

    try {
      await button.click();
      await page.waitForTimeout(4000);

      const filename = `${String(counter).padStart(2, '0')}-gameplay.png`;
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, filename),
        fullPage: false
      });

      console.log(`✅ Saved: ${filename} (${title})`);
      counter++;

      // Go back
      await page.goBack();
      await page.waitForTimeout(3000);
    } catch (err) {
      console.log(`⚠️  Failed for: ${title}`);
    }
  }
});
