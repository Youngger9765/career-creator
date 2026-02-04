import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://career-creator-frontend-staging-849078733818.asia-east1.run.app';
const TEST_EMAIL = 'demo.counselor@example.com';
const TEST_PASSWORD = 'demo123';

// Helper function to login and enter room
async function loginAndEnterRoom(page: Page) {
  await page.goto(BASE_URL);
  await page.click('text=諮詢師登入');
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', TEST_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"], button:has-text("登入")');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });

  // Wait for dashboard to load
  await page.waitForFunction(() => !document.body.innerText.includes('載入'), { timeout: 30000 });
  await page.waitForTimeout(2000);

  // Enter room
  await page.click('button:has-text("諮詢室")');
  await page.waitForTimeout(3000);
}

test.describe('Game Mode Tests - All 7 Games', () => {
  test.setTimeout(180000);

  test('Game A: 六大性格分析 (RIASEC)', async ({ page }) => {
    console.log('=== Game A: 六大性格分析 ===');
    await loginAndEnterRoom(page);

    // Select RIASEC game
    await page.click('text=六大性格分析');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/game-a-riasec.png' });

    // Verify game loaded
    const url = page.url();
    expect(url).toContain('/room/');
    console.log('Game A: RIASEC loaded ✓');
  });

  test('Game B: 職能收集家', async ({ page }) => {
    console.log('=== Game B: 職能收集家 ===');
    await loginAndEnterRoom(page);

    await page.click('text=職能收集家');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/game-b-collector.png' });
    console.log('Game B: 職能收集家 loaded ✓');
  });

  test('Game C: 優劣勢分析', async ({ page }) => {
    console.log('=== Game C: 優劣勢分析 ===');
    await loginAndEnterRoom(page);

    await page.click('text=優劣勢分析');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/game-c-swot.png' });
    console.log('Game C: 優劣勢分析 loaded ✓');
  });

  test('Game D: 成長規劃', async ({ page }) => {
    console.log('=== Game D: 成長規劃 ===');
    await loginAndEnterRoom(page);

    await page.click('text=成長規劃');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/game-d-growth.png' });
    console.log('Game D: 成長規劃 loaded ✓');
  });

  test('Game E: 職位拆解', async ({ page }) => {
    console.log('=== Game E: 職位拆解 ===');
    await loginAndEnterRoom(page);

    await page.click('text=職位拆解');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/game-e-position.png' });
    console.log('Game E: 職位拆解 loaded ✓');
  });

  test('Game F: 價值觀排序', async ({ page }) => {
    console.log('=== Game F: 價值觀排序 ===');
    await loginAndEnterRoom(page);

    await page.click('text=價值觀排序');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/game-f-values.png' });
    console.log('Game F: 價值觀排序 loaded ✓');
  });

  test('Game G: 生活重新設計', async ({ page }) => {
    console.log('=== Game G: 生活重新設計 ===');
    await loginAndEnterRoom(page);

    await page.click('text=生活重新設計');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'e2e/screenshots/game-g-life.png' });
    console.log('Game G: 生活重新設計 loaded ✓');
  });

  test('Auxiliary: 諮詢筆記功能', async ({ page }) => {
    console.log('=== Auxiliary: 諮詢筆記 ===');
    await loginAndEnterRoom(page);

    // Select any game first
    await page.click('text=六大性格分析');
    await page.waitForTimeout(2000);

    // Look for notes button/drawer
    const notesButton = page.locator('button:has-text("筆記"), button:has-text("記錄"), [aria-label*="note"]').first();
    if (await notesButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notesButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'e2e/screenshots/aux-notes.png' });
      console.log('Notes feature found ✓');
    } else {
      await page.screenshot({ path: 'e2e/screenshots/aux-notes-not-found.png' });
      console.log('Notes button not visible in current view');
    }
  });
});
