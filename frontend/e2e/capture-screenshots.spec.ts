/**
 * Screenshot capture for Phase 1 Closure Report
 * Captures key features and flows from Production environment
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';

const PRODUCTION_URL = 'https://career-creator-frontend-production-849078733818.asia-east1.run.app';
const SCREENSHOTS_DIR = path.join(__dirname, '../../docs/images');

test.describe('Phase 1 Closure Report Screenshots', () => {
  test.use({
    baseURL: PRODUCTION_URL,
    viewport: { width: 1920, height: 1080 }
  });

  test('01 - RIASEC 六大性格說明卡', async ({ page }) => {
    // Visit as visitor to see game mode selection
    await page.goto('/room/demo-room?visitor=true&name=ScreenshotUser');
    await page.waitForSelector('text=選擇遊戲模式', { timeout: 10000 });

    // Click on 職游旅人卡 to enter RIASEC mode
    await page.locator('text=職游旅人卡').first().click();
    await page.waitForTimeout(1000);

    // Screenshot of RIASEC personality analysis
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-riasec-personality.png'),
      fullPage: false
    });
  });

  test('02 - 職業收藏家（職游旅人卡）', async ({ page }) => {
    await page.goto('/room/demo-room?visitor=true&name=ScreenshotUser');
    await page.waitForSelector('text=選擇遊戲模式', { timeout: 10000 });

    // Click on 職游旅人卡
    await page.locator('text=職游旅人卡').first().click();
    await page.waitForTimeout(1000);

    // Screenshot of career cards
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-career-collector.png'),
      fullPage: false
    });
  });

  test('03 - 職能盤點卡', async ({ page }) => {
    await page.goto('/room/demo-room?visitor=true&name=ScreenshotUser');
    await page.waitForSelector('text=選擇遊戲模式', { timeout: 10000 });

    // Click on 職能盤點卡
    await page.locator('text=職能盤點卡').first().click();
    await page.waitForTimeout(1000);

    // Screenshot of competency assessment cards
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-competency-assessment.png'),
      fullPage: false
    });
  });

  test('04 - 價值導航卡', async ({ page }) => {
    await page.goto('/room/demo-room?visitor=true&name=ScreenshotUser');
    await page.waitForSelector('text=選擇遊戲模式', { timeout: 10000 });

    // Click on 價值導航卡
    await page.locator('text=價值導航卡').first().click();
    await page.waitForTimeout(1000);

    // Screenshot of value navigation cards
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-value-navigation.png'),
      fullPage: false
    });
  });

  test('05 - 遊戲模式選擇畫面', async ({ page }) => {
    await page.goto('/room/demo-room?visitor=true&name=ScreenshotUser');
    await page.waitForSelector('text=選擇遊戲模式', { timeout: 10000 });

    // Screenshot of game mode selection
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-game-mode-selection.png'),
      fullPage: false
    });
  });

  test('06 - 訪客協作介面', async ({ page }) => {
    await page.goto('/room/demo-room?visitor=true&name=測試用戶');
    await page.waitForSelector('text=選擇遊戲模式', { timeout: 10000 });

    // Select a game mode to show collaboration interface
    await page.locator('text=價值導航卡').first().click();
    await page.waitForTimeout(2000);

    // Screenshot showing visitor view
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '06-visitor-collaboration.png'),
      fullPage: false
    });
  });

  test('07 - 價值觀排序結果', async ({ page }) => {
    await page.goto('/room/demo-room?visitor=true&name=ScreenshotUser');
    await page.waitForSelector('text=選擇遊戲模式', { timeout: 10000 });

    // Go to value navigation cards
    await page.locator('text=價值導航卡').first().click();
    await page.waitForTimeout(1000);

    // Look for value sorting result (top 3 + others layout)
    const valueSort = page.locator('text=價值觀排序').first();
    if (await valueSort.isVisible()) {
      await valueSort.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '07-value-sorting-result.png'),
        fullPage: false
      });
    }
  });

  test('08 - 多人在線狀態', async ({ page }) => {
    await page.goto('/room/demo-room?visitor=true&name=ScreenshotUser');
    await page.waitForSelector('text=選擇遊戲模式', { timeout: 10000 });

    // Look for participant list or online status indicator
    // Screenshot showing multi-user status
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '08-multi-user-status.png'),
      fullPage: false
    });
  });
});
