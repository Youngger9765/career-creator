/**
 * Smoke test to verify refactoring didn't break basic functionality
 */
import { test, expect } from '@playwright/test';

test.describe('Refactoring Smoke Test', () => {
  test('room page should load and display game mode selection', async ({ page }) => {
    // Navigate to room as visitor
    await page.goto('http://localhost:3000/room/test-room?visitor=true&name=TestUser');

    // Wait for page to load
    await page.waitForSelector('.h-screen.bg-gradient-to-br', { timeout: 10000 });

    // Verify game mode selection UI is visible
    await expect(page.locator('text=選擇遊戲模式')).toBeVisible();

    // Verify all three card types are displayed
    await expect(page.locator('text=職游旅人卡').first()).toBeVisible();
    await expect(page.locator('text=職能盤點卡').first()).toBeVisible();
    await expect(page.locator('text=價值導航卡').first()).toBeVisible();

    // Verify visitor name is displayed in header
    await expect(page.locator('text=訪客: TestUser')).toBeVisible();
  });

  test('can switch between card deck tabs', async ({ page }) => {
    await page.goto('http://localhost:3000/room/test-room?visitor=true&name=TestUser');
    await page.waitForSelector('.h-screen.bg-gradient-to-br', { timeout: 10000 });

    // Click on 職能盤點卡 tab
    await page.locator('text=職能盤點卡').first().click();
    await page.waitForTimeout(500);

    // Verify 優劣勢分析 is visible under this tab
    await expect(page.locator('text=優劣勢分析').first()).toBeVisible();

    // Click on 價值導航卡 tab
    await page.locator('text=價值導航卡').first().click();
    await page.waitForTimeout(500);

    // Verify 價值觀排序 is visible
    await expect(page.locator('text=價值觀排序').first()).toBeVisible();
  });

  test('mockCards data is loaded correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/room/test-room?visitor=true&name=TestUser');
    await page.waitForSelector('.h-screen.bg-gradient-to-br', { timeout: 10000 });

    // Verify career cards are mentioned (from mockCards data)
    await expect(page.locator('text=六大性格分析').first()).toBeVisible();
    await expect(page.locator('text=RIASEC').first()).toBeVisible();
  });
});
