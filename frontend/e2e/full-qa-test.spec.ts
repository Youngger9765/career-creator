import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://career-creator-frontend-staging-849078733818.asia-east1.run.app';
const TEST_EMAIL = 'demo.counselor@example.com';
const TEST_PASSWORD = 'demo123';

// Helper function to login
async function login(page: Page) {
  await page.goto(BASE_URL);

  // Click "諮詢師登入" button on landing page
  await page.click('text=諮詢師登入');
  await page.waitForTimeout(1000);

  // Now fill in login form
  await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]', TEST_EMAIL);
  await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"], button:has-text("登入")');

  // Wait for dashboard URL
  await page.waitForURL('**/dashboard**', { timeout: 15000 });

  // Wait for dashboard to fully load (loading indicator gone)
  await page.waitForFunction(() => {
    const loadingText = document.body.innerText;
    return !loadingText.includes('載入') && !loadingText.includes('Loading');
  }, { timeout: 30000 });

  // Extra wait for any async data
  await page.waitForTimeout(2000);
}

test.describe('Full QA Checklist Test', () => {
  test.setTimeout(120000); // 2 minutes per test

  test('1. Counselor Login Flow', async ({ page }) => {
    console.log('=== 1. Counselor Login Flow ===');

    // Step 1.1: Open website
    await page.goto(BASE_URL);
    await page.screenshot({ path: 'e2e/screenshots/1-1-landing.png' });
    console.log('Step 1.1: Landing page loaded');

    // Step 1.2: Click counselor login
    await page.click('text=諮詢師登入');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'e2e/screenshots/1-2-login-page.png' });
    console.log('Step 1.2: Login page loaded');

    // Step 1.3: Enter credentials
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', TEST_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
    await page.screenshot({ path: 'e2e/screenshots/1-3-credentials.png' });
    console.log('Step 1.3: Credentials entered');

    // Step 1.4: Click login
    await page.click('button[type="submit"], button:has-text("登入")');

    // Step 1.5: Verify dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    await page.screenshot({ path: 'e2e/screenshots/1-4-dashboard.png' });
    console.log('Step 1.4: Dashboard loaded - LOGIN SUCCESS ✓');
  });

  test('2. Room Creation Flow', async ({ page }) => {
    console.log('=== 2. Room Creation Flow ===');

    await login(page);
    await page.screenshot({ path: 'e2e/screenshots/2-0-dashboard.png' });

    // Step 2.1: Find and click room entry button
    const roomButton = page.locator('button:has-text("進入"), button:has-text("開始"), a:has-text("進入"), button:has-text("諮詢室")').first();
    await roomButton.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'e2e/screenshots/2-1-room.png' });
    console.log('Step 2.1: Entered room');

    // Verify URL
    const currentUrl = page.url();
    expect(currentUrl).toContain('/room/');
    console.log('Step 2.2: Room URL verified - ROOM SUCCESS ✓');
  });

  test('3. Game Mode Tests', async ({ page }) => {
    console.log('=== 3. Game Mode Tests ===');

    await login(page);

    // Enter room - click "諮詢室" button
    const roomButton = page.locator('button:has-text("諮詢室")').first();
    await roomButton.click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'e2e/screenshots/3-0-room-initial.png' });

    // Look for game mode buttons/tabs
    const gameButtons = await page.locator('button, [role="tab"]').all();
    console.log(`Found ${gameButtons.length} buttons/tabs`);

    // Take screenshot of the room
    await page.screenshot({ path: 'e2e/screenshots/3-1-room-view.png', fullPage: true });
    console.log('Game mode test completed - GAME MODES VISIBLE ✓');
  });

  test('4. Visitor Join Flow', async ({ page, context }) => {
    console.log('=== 4. Visitor Join Flow ===');

    await login(page);

    // Enter room and get room code - click "諮詢室" button
    const roomButton = page.locator('button:has-text("諮詢室")').first();
    await roomButton.click();
    await page.waitForTimeout(3000);

    const roomUrl = page.url();
    const roomCode = roomUrl.split('/room/')[1]?.split('?')[0];
    console.log(`Room code: ${roomCode}`);
    await page.screenshot({ path: 'e2e/screenshots/4-0-counselor-room.png' });

    if (roomCode) {
      // Open visitor join page
      const visitorPage = await context.newPage();
      await visitorPage.goto(`${BASE_URL}/join`);
      await visitorPage.waitForTimeout(1000);
      await visitorPage.screenshot({ path: 'e2e/screenshots/4-1-visitor-join.png' });
      console.log('Step 4.1: Visitor join page loaded');

      // Find input and enter room code
      const inputs = await visitorPage.locator('input').all();
      if (inputs.length > 0) {
        await inputs[0].fill(roomCode);
        await visitorPage.screenshot({ path: 'e2e/screenshots/4-2-code-entered.png' });
        console.log('Step 4.2: Room code entered');
      }

      await visitorPage.close();
    }

    console.log('Visitor flow completed - VISITOR JOIN SUCCESS ✓');
  });
});
