import { test, expect } from '@playwright/test';

test('test /join/3F4BK0 visitor flow and online status', async ({ page }) => {
  const shareCode = '3F4BK0';

  // Monitor console for presence/online status
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Presence') || text.includes('在線') || text.includes('online')) {
      console.log(`[Console] ${text}`);
    }
  });

  // Visit join page
  const joinUrl = `https://career-creator-frontend-production-x43mdhfwsq-de.a.run.app/join/${shareCode}`;
  console.log(`\n1. Visiting join page: ${joinUrl}`);

  await page.goto(joinUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Check current page
  const currentUrl = page.url();
  console.log(`\n2. Current URL: ${currentUrl}`);

  // Look for visitor name input
  const nameInput = page.locator('input[type="text"]').first();
  const isOnJoinPage = await nameInput.isVisible().catch(() => false);

  if (isOnJoinPage) {
    console.log('\n3. On join page, entering visitor name...');
    await nameInput.fill('TestVisitor');

    // Find and click join button
    const joinButton = page.locator('button:has-text("加入"), button:has-text("進入")').first();
    await joinButton.click();

    console.log('4. Clicked join button, waiting for room page...');
    await page.waitForTimeout(3000);
  }

  const roomUrl = page.url();
  console.log(`\n5. Final URL: ${roomUrl}`);

  // Check for "等待諮詢師上線" message
  await page.waitForTimeout(2000);
  const pageContent = await page.content();

  const hasWaitingMessage = pageContent.includes('等待諮詢師上線') ||
                           pageContent.includes('諮詢師離線');
  const hasCounselorOnline = pageContent.includes('2 線上') ||
                             pageContent.includes('在線');

  console.log(`\n6. Page analysis:`);
  console.log(`   - Has "等待諮詢師上線": ${hasWaitingMessage}`);
  console.log(`   - Has online indicator: ${hasCounselorOnline}`);

  // Take screenshot
  await page.screenshot({ path: '/tmp/join-code-test.png', fullPage: true });
  console.log(`\n7. Screenshot saved to /tmp/join-code-test.png`);

  // Check presence state in console
  await page.waitForTimeout(2000);

  if (hasWaitingMessage) {
    console.log(`\n❌ BUG: Shows "等待諮詢師上線" even though counselor is online!`);
  } else {
    console.log(`\n✅ Correct: Counselor shown as online`);
  }
});
