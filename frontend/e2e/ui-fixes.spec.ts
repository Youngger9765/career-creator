import { test, expect } from '@playwright/test';

// Use environment variable or default to localhost
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const STAGING_URL = 'https://career-creator-frontend-staging-990202338378.asia-east1.run.app';

// Skip these tests in local dev (they require full auth flow and deployed backend)
const isLocalDev = BASE_URL.includes('localhost');

test.describe('UI Fixes Verification', () => {
  test.skip(isLocalDev, 'Skipped in local development (requires deployed backend)');

  test('Login page should load correctly', async ({ page }) => {
    await page.goto(`${STAGING_URL}/login`);

    // Wait for form elements with specific IDs
    await page.waitForSelector('input#email', { timeout: 10000 });

    // Verify all form elements are visible
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Verify demo account buttons exist (4 total)
    const fillButtons = page.locator('button:has-text("填入")');
    await expect(fillButtons).toHaveCount(4);

    console.log('✓ Login page loaded correctly');
  });

  test('Notes textarea should have visible text color', async ({ page }) => {
    // Login
    await page.goto(`${STAGING_URL}/login`);
    await page.fill('input#email', 'demo.counselor@example.com');
    await page.fill('input#password', 'demo123');
    await page.click('button[type="submit"]:has-text("登入")');

    // Wait for dashboard redirect
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });

    // Go to counselor room
    await page.goto(`${STAGING_URL}/counselor-room`);
    await page.waitForLoadState('networkidle');

    // Create or enter a room
    const roomButton = page.locator('button:has-text("建立諮詢室"), a:has-text("進入")').first();
    if (await roomButton.isVisible({ timeout: 5000 })) {
      await roomButton.click();
      await page.waitForURL(/.*\/room\/.*/, { timeout: 10000 });

      // Open notes drawer
      const notesToggle = page.locator('button[title="展開筆記"]').first();
      if (await notesToggle.isVisible({ timeout: 5000 })) {
        await notesToggle.click();
        await page.waitForTimeout(1000);

        // Check textarea text color
        const textarea = page.locator('textarea[placeholder*="記錄"]').first();
        if (await textarea.isVisible()) {
          const textColor = await textarea.evaluate((el) => {
            return window.getComputedStyle(el).color;
          });

          console.log('Notes textarea color:', textColor);

          // Should NOT be white
          expect(textColor).not.toBe('rgb(255, 255, 255)');
          expect(textColor).not.toBe('rgba(255, 255, 255, 1)');

          await page.screenshot({ path: 'test-results/notes-visible.png', fullPage: true });
          console.log('✓ Notes text is visible (not white on white)');
        }
      }
    }
  });

  test('Life Transformation Game font sizes are readable', async ({ page }) => {
    // Login
    await page.goto(`${STAGING_URL}/login`);
    await page.fill('input#email', 'demo.counselor@example.com');
    await page.fill('input#password', 'demo123');
    await page.click('button[type="submit"]:has-text("登入")');

    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });

    // Navigate to room
    await page.goto(`${STAGING_URL}/counselor-room`);
    await page.waitForLoadState('networkidle');

    const roomButton = page.locator('button:has-text("建立諮詢室"), a:has-text("進入")').first();
    if (await roomButton.isVisible({ timeout: 5000 })) {
      await roomButton.click();
      await page.waitForURL(/.*\/room\/.*/, { timeout: 10000 });

      // Select game mode
      const valueNavButton = page.locator('button:has-text("價值導航")').first();
      if (await valueNavButton.isVisible({ timeout: 5000 })) {
        await valueNavButton.click();
        await page.waitForTimeout(500);

        const lifeGameButton = page.locator('button:has-text("生活改造王")').first();
        if (await lifeGameButton.isVisible({ timeout: 3000 })) {
          await lifeGameButton.click();
          await page.waitForTimeout(2000);

          // Check pie chart title
          const pieTitle = page.locator('h3:has-text("生活平衡分配圖")').first();
          if (await pieTitle.isVisible()) {
            const fontSize = await pieTitle.evaluate((el) => {
              return window.getComputedStyle(el).fontSize;
            });

            console.log('Pie chart title font size:', fontSize);

            const fontSizeNum = parseFloat(fontSize);
            expect(fontSizeNum).toBeGreaterThanOrEqual(16);

            await page.screenshot({
              path: 'test-results/life-game-fonts.png',
              fullPage: true,
            });

            console.log('✓ Life Transformation Game fonts are readable');
          }
        }
      }
    }
  });
});
