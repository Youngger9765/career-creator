/**
 * Complete gameplay screenshots for Phase 1 Closure Report
 * Captures all 3 card decks × 8 gameplays
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';

const PRODUCTION_URL = 'https://career-creator-frontend-production-849078733818.asia-east1.run.app';
const SCREENSHOTS_DIR = path.join(__dirname, '../../docs/images/gameplays');

// Demo account from backend seed data
const DEMO_COUNSELOR = {
  email: 'demo.counselor@example.com',
  password: 'demo123',
  name: 'Dr. Sarah Chen'
};

test.describe('Complete Gameplay Screenshots', () => {
  test.use({
    baseURL: PRODUCTION_URL,
    viewport: { width: 1920, height: 1080 }
  });

  // Helper: Login and navigate to room
  async function loginAndEnterRoom(page: any) {
    await page.goto('/login');
    await page.fill('input[type="email"]', DEMO_COUNSELOR.email);
    await page.fill('input[type="password"]', DEMO_COUNSELOR.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Enter first available room
    const enterButton = page.locator('button').filter({ hasText: /進入|Enter/ }).first();
    if (await enterButton.count() > 0) {
      await enterButton.click();
      await page.waitForTimeout(2000);
      return true;
    }
    return false;
  }

  // 職游旅人卡
  test('職游旅人卡 - 01 六大性格分析', async ({ page }) => {
    const entered = await loginAndEnterRoom(page);
    if (!entered) {
      console.log('⚠️  No room found');
      return;
    }

    // Select deck
    await page.locator('text=職游旅人卡').first().click();
    await page.waitForTimeout(1000);

    // Select gameplay: 六大性格分析
    const gameplayOption = page.locator('text=六大性格分析').first();
    if (await gameplayOption.isVisible()) {
      await gameplayOption.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '01-traveler-personality-analysis.png'),
        fullPage: true
      });

      console.log('✅ Screenshot: 職游旅人卡 - 六大性格分析');
    }
  });

  test('職游旅人卡 - 02 優劣勢分析', async ({ page }) => {
    const entered = await loginAndEnterRoom(page);
    if (!entered) return;

    await page.locator('text=職游旅人卡').first().click();
    await page.waitForTimeout(1000);

    const gameplayOption = page.locator('text=優劣勢分析').first();
    if (await gameplayOption.isVisible()) {
      await gameplayOption.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '02-traveler-advantage-analysis.png'),
        fullPage: true
      });

      console.log('✅ Screenshot: 職游旅人卡 - 優劣勢分析');
    }
  });

  // 職能盤點卡
  test('職能盤點卡 - 03 職能收集家', async ({ page }) => {
    const entered = await loginAndEnterRoom(page);
    if (!entered) return;

    await page.locator('text=職能盤點卡').first().click();
    await page.waitForTimeout(1000);

    const gameplayOption = page.locator('text=職能收集家').first();
    if (await gameplayOption.isVisible()) {
      await gameplayOption.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '03-skills-career-collector.png'),
        fullPage: true
      });

      console.log('✅ Screenshot: 職能盤點卡 - 職能收集家');
    }
  });

  test('職能盤點卡 - 04 成長規劃', async ({ page }) => {
    const entered = await loginAndEnterRoom(page);
    if (!entered) return;

    await page.locator('text=職能盤點卡').first().click();
    await page.waitForTimeout(1000);

    const gameplayOption = page.locator('text=成長規劃').first();
    if (await gameplayOption.isVisible()) {
      await gameplayOption.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '04-skills-growth-planning.png'),
        fullPage: true
      });

      console.log('✅ Screenshot: 職能盤點卡 - 成長規劃');
    }
  });

  test('職能盤點卡 - 05 職位拆解', async ({ page }) => {
    const entered = await loginAndEnterRoom(page);
    if (!entered) return;

    await page.locator('text=職能盤點卡').first().click();
    await page.waitForTimeout(1000);

    const gameplayOption = page.locator('text=職位拆解').first();
    if (await gameplayOption.isVisible()) {
      await gameplayOption.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '05-skills-position-breakdown.png'),
        fullPage: true
      });

      console.log('✅ Screenshot: 職能盤點卡 - 職位拆解');
    }
  });

  test('職能盤點卡 - 06 優劣勢分析', async ({ page }) => {
    const entered = await loginAndEnterRoom(page);
    if (!entered) return;

    await page.locator('text=職能盤點卡').first().click();
    await page.waitForTimeout(1000);

    const gameplayOption = page.locator('text=優劣勢分析').first();
    if (await gameplayOption.isVisible()) {
      await gameplayOption.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '06-skills-advantage-analysis.png'),
        fullPage: true
      });

      console.log('✅ Screenshot: 職能盤點卡 - 優劣勢分析');
    }
  });

  // 價值導航卡
  test('價值導航卡 - 07 價值觀排序', async ({ page }) => {
    const entered = await loginAndEnterRoom(page);
    if (!entered) return;

    await page.locator('text=價值導航卡').first().click();
    await page.waitForTimeout(1000);

    const gameplayOption = page.locator('text=價值觀排序').first();
    if (await gameplayOption.isVisible()) {
      await gameplayOption.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '07-values-ranking.png'),
        fullPage: true
      });

      console.log('✅ Screenshot: 價值導航卡 - 價值觀排序');
    }
  });

  test('價值導航卡 - 08 生活重新設計', async ({ page }) => {
    const entered = await loginAndEnterRoom(page);
    if (!entered) return;

    await page.locator('text=價值導航卡').first().click();
    await page.waitForTimeout(1000);

    const gameplayOption = page.locator('text=生活重新設計').first();
    if (await gameplayOption.isVisible()) {
      await gameplayOption.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '08-values-life-redesign.png'),
        fullPage: true
      });

      console.log('✅ Screenshot: 價值導航卡 - 生活重新設計');
    }
  });

  test('價值導航卡 - 09 優劣勢分析', async ({ page }) => {
    const entered = await loginAndEnterRoom(page);
    if (!entered) return;

    await page.locator('text=價值導航卡').first().click();
    await page.waitForTimeout(1000);

    const gameplayOption = page.locator('text=優劣勢分析').first();
    if (await gameplayOption.isVisible()) {
      await gameplayOption.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '09-values-advantage-analysis.png'),
        fullPage: true
      });

      console.log('✅ Screenshot: 價值導航卡 - 優劣勢分析');
    }
  });
});
