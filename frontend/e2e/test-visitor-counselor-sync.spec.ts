/**
 * TDD Test: 完整測試 - Counselor 和 Visitor 雙瀏覽器同步
 *
 * Scenario: Counselor 在遊戲選擇畫面，Visitor 加入應該也看到選擇畫面
 */

import { test as base, expect } from '@playwright/test';
import type { Page, BrowserContext } from '@playwright/test';

// 擴展 test fixture 支援雙瀏覽器
const test = base.extend<{
  counselorPage: Page;
  visitorPage: Page;
  counselorContext: BrowserContext;
  visitorContext: BrowserContext;
}>({
  counselorContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  visitorContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  counselorPage: async ({ counselorContext }, use) => {
    const page = await counselorContext.newPage();
    await use(page);
    await page.close();
  },
  visitorPage: async ({ visitorContext }, use) => {
    const page = await visitorContext.newPage();
    await use(page);
    await page.close();
  },
});

test('Visitor syncs to counselor game selection state', async ({
  counselorPage,
  visitorPage,
}) => {
  const STAGING_URL = 'https://career-creator-frontend-staging-x43mdhfwsq-de.a.run.app';

  console.log('\n🧪 Test: Two-browser sync verification');
  console.log('1. Counselor opens room and stays on game selection');
  console.log('2. Visitor joins via share code');
  console.log('3. Visitor should see same game selection screen\n');

  // === Counselor Session ===
  console.log('👨‍⚕️ Counselor: Logging in...');
  await counselorPage.goto(`${STAGING_URL}/login`);

  // Login as counselor
  await counselorPage.fill('input[type="email"]', 'test@example.com');
  await counselorPage.fill('input[type="password"]', 'password123');
  await counselorPage.click('button[type="submit"]');
  await counselorPage.waitForURL('**/dashboard', { timeout: 10000 });

  console.log('👨‍⚕️ Counselor: Creating new room...');
  // Create new room
  await counselorPage.click('text=建立諮詢室');
  await counselorPage.waitForURL('**/room/**', { timeout: 10000 });

  const counselorUrl = counselorPage.url();
  const roomIdMatch = counselorUrl.match(/\/room\/([^?]+)/);
  if (!roomIdMatch) throw new Error('Failed to extract room ID');
  const roomId = roomIdMatch[1];

  console.log(`👨‍⚕️ Counselor: Room created - ${roomId}`);

  // Get share code
  await counselorPage.click('text=分享');
  const shareCodeElement = await counselorPage.locator('[data-testid="share-code"]').first();
  const shareCode = await shareCodeElement.textContent();
  if (!shareCode) throw new Error('Failed to get share code');

  console.log(`👨‍⚕️ Counselor: Share code - ${shareCode}`);
  console.log('👨‍⚕️ Counselor: Waiting on game selection screen...\n');

  // Verify counselor is on game selection
  const counselorHasGameSelection = await counselorPage.locator('text=選擇遊戲模式').count() > 0;
  expect(counselorHasGameSelection).toBe(true);

  // Wait a bit for counselor to fully load
  await counselorPage.waitForTimeout(2000);

  // === Visitor Session ===
  console.log('👤 Visitor: Joining room...');
  const visitorUrl = `${STAGING_URL}/join/${shareCode}`;
  await visitorPage.goto(visitorUrl);

  // Enter visitor name
  const nameInput = visitorPage.locator('input[type="text"]').first();
  await nameInput.fill('TestVisitor');
  const joinButton = visitorPage.locator('button:has-text("加入")').first();
  await joinButton.click();

  console.log('👤 Visitor: Joined room, waiting for sync...');
  await visitorPage.waitForTimeout(3000);

  // === Verification ===
  console.log('\n📊 Verifying sync state...');

  // Check visitor state
  const visitorHasGameSelection = await visitorPage.locator('text=選擇遊戲模式').count() > 0;
  const visitorHasLoadingScreen = await visitorPage.locator('text=正在連接諮商師').count() > 0;
  const visitorHasGameCards = await visitorPage.locator('text=Strategic action').count() > 0;

  // Screenshot both browsers
  await counselorPage.screenshot({ path: '/tmp/counselor-state.png', fullPage: true });
  await visitorPage.screenshot({ path: '/tmp/visitor-state.png', fullPage: true });

  console.log('📸 Screenshots saved:');
  console.log('   - Counselor: /tmp/counselor-state.png');
  console.log('   - Visitor: /tmp/visitor-state.png\n');

  console.log('📊 Test Results:');
  console.log(`   Counselor has game selection: ${counselorHasGameSelection}`);
  console.log(`   Visitor has game selection: ${visitorHasGameSelection}`);
  console.log(`   Visitor has loading screen: ${visitorHasLoadingScreen}`);
  console.log(`   Visitor has game cards: ${visitorHasGameCards}\n`);

  // Assertions
  expect(counselorHasGameSelection).toBe(true);
  expect(visitorHasGameSelection).toBe(true); // ✅ Should see same screen as counselor
  expect(visitorHasGameCards).toBe(false);     // ❌ Should NOT see game cards
  expect(visitorHasLoadingScreen).toBe(false); // Should not be loading anymore

  console.log('✅ Test passed! Visitor synced to counselor state correctly.\n');
});
