/**
 * Setup room and capture all gameplay screenshots
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';
import { skipInCI } from './test-helpers';

const PRODUCTION_URL = 'https://career-creator-frontend-production-849078733818.asia-east1.run.app';
const SCREENSHOTS_DIR = path.join(__dirname, '../../docs/images/gameplays');

const DEMO_COUNSELOR = {
  email: 'demo.counselor@example.com',
  password: 'demo123'
};

test.describe('Setup Room and Capture Gameplays', () => {
  test.skip(skipInCI, 'Production screenshot tests only run locally');

  test.use({
    baseURL: PRODUCTION_URL,
    viewport: { width: 1920, height: 1080 }
  });

  test('Create room and capture all gameplays', async ({ page }) => {
    // 1. Login Page
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '../01-login-page.png'),
      fullPage: true
    });
    console.log('✅ Screenshot: 01-login-page.png');

    await page.fill('input[type="email"]', DEMO_COUNSELOR.email);
    await page.fill('input[type="password"]', DEMO_COUNSELOR.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // 2. Dashboard (Teacher Dashboard)
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '../02-teacher-dashboard.png'),
      fullPage: true
    });
    console.log('✅ Screenshot: 02-teacher-dashboard.png');

    // 3. Room List (before creating)
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '../03-room-list.png'),
      fullPage: true
    });
    console.log('✅ Screenshot: 03-room-list.png');

    // Create new room
    const createButton = page.locator('button').filter({ hasText: /創建|Create/ }).first();
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForTimeout(2000);
    }

    // Enter the room
    const enterButton = page.locator('button').filter({ hasText: /進入|Enter/ }).first();
    if (await enterButton.count() > 0) {
      await enterButton.click();
      await page.waitForTimeout(3000);

      // 4. Game Mode Selection (inside room)
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '../05-game-mode-selection.png'),
        fullPage: true
      });
      console.log('✅ Screenshot: 05-game-mode-selection.png');
    } else {
      throw new Error('No room available to enter');
    }

    // Define gameplays to capture
    const gameplays = [
      { deck: '職游旅人卡', gameplay: '六大性格分析', filename: '01-riasec-personality.png' },
      { deck: '職游旅人卡', gameplay: '職業收藏家', filename: '02-career-collector.png' },
      { deck: '職能盤點卡', gameplay: '優劣勢分析', filename: '03-competency-assessment.png' },
      { deck: '職能盤點卡', gameplay: '成長計畫', filename: '04-growth-plan.png' },
      { deck: '職能盤點卡', gameplay: '職位拆解', filename: '05-position-breakdown.png' },
      { deck: '價值導航卡', gameplay: '價值觀排序', filename: '06-value-ranking.png' },
      { deck: '價值導航卡', gameplay: '生活改造王', filename: '07-life-redesign.png' }
    ];

    for (const { deck, gameplay, filename } of gameplays) {
      console.log(`\n📸 Capturing: ${deck} - ${gameplay}`);

      // Go back to gameplay selection if needed
      const backButton = page.locator('button').filter({ hasText: /返回|Back/ }).first();
      if (await backButton.isVisible()) {
        await backButton.click();
        await page.waitForTimeout(1000);
      }

      // Select deck
      const deckButton = page.locator(`text=${deck}`).first();
      if (await deckButton.isVisible()) {
        await deckButton.click();
        await page.waitForTimeout(1500);

        // Select gameplay
        const gameplayButton = page.locator(`text=${gameplay}`).first();
        if (await gameplayButton.isVisible()) {
          await gameplayButton.click();
          await page.waitForTimeout(3000);

          // Take screenshot
          await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, filename),
            fullPage: true
          });

          console.log(`✅ Screenshot saved: ${filename}`);
        } else {
          console.log(`⚠️  Gameplay not found: ${gameplay}`);
        }
      } else {
        console.log(`⚠️  Deck not found: ${deck}`);
      }
    }

    console.log('\n✅ All screenshots captured!');
  });
});
