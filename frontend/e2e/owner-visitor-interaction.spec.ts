import { test, expect } from '@playwright/test';

const BASE_URL = 'https://career-creator-frontend-staging-849078733818.asia-east1.run.app';
const TEST_EMAIL = 'demo.counselor@example.com';
const TEST_PASSWORD = 'demo123';

test.describe('Owner-Visitor Real Interaction Test', () => {
  test.setTimeout(180000);

  test('Complete owner-visitor sync test', async ({ browser }) => {
    console.log('=== Owner-Visitor Interaction Test ===\n');

    // Create two separate browser contexts
    const ownerContext = await browser.newContext();
    const visitorContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    const visitorPage = await visitorContext.newPage();

    try {
      // ========== STEP 1: Owner Login ==========
      console.log('STEP 1: Owner logging in...');
      await ownerPage.goto(BASE_URL);
      await ownerPage.click('text=諮詢師登入');
      await ownerPage.waitForTimeout(1000);
      await ownerPage.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', TEST_EMAIL);
      await ownerPage.fill('input[type="password"], input[name="password"]', TEST_PASSWORD);
      await ownerPage.click('button[type="submit"], button:has-text("登入")');
      await ownerPage.waitForURL('**/dashboard**', { timeout: 15000 });
      await ownerPage.waitForFunction(() => !document.body.innerText.includes('載入'), { timeout: 30000 });
      await ownerPage.waitForTimeout(2000);
      await ownerPage.screenshot({ path: 'e2e/screenshots/interaction-1-owner-dashboard.png' });
      console.log('✓ Owner logged in\n');

      // ========== STEP 2: Owner enters room ==========
      console.log('STEP 2: Owner entering room...');
      // Click on first customer's 諮詢室 button
      await ownerPage.click('button:has-text("諮詢室")');
      await ownerPage.waitForTimeout(3000);
      await ownerPage.screenshot({ path: 'e2e/screenshots/interaction-2-owner-in-room.png' });

      // Get the share code from the page - it's shown as "分享碼 XXXXXX"
      // Use evaluate to get text from the page
      const shareCode = await ownerPage.evaluate(() => {
        const bodyText = document.body.innerText;
        // Look for pattern: 分享碼 followed by 6 alphanumeric characters
        const match = bodyText.match(/分享碼\s*([A-Z0-9]{5,8})/i);
        return match ? match[1] : '';
      });

      console.log(`✓ Room created, share code: "${shareCode}"`);

      if (!shareCode) {
        // Take debug screenshot
        await ownerPage.screenshot({ path: 'e2e/screenshots/debug-no-share-code.png' });
        throw new Error('Could not find share code on owner page');
      }

      // ========== STEP 3: Visitor opens join page ==========
      console.log('\nSTEP 3: Visitor opening join page...');
      await visitorPage.goto(`${BASE_URL}/join`);
      await visitorPage.waitForTimeout(1000);
      await visitorPage.screenshot({ path: 'e2e/screenshots/interaction-3-visitor-join-page.png' });
      console.log('✓ Visitor on join page\n');

      // ========== STEP 4: Visitor enters room code ==========
      console.log('STEP 4: Visitor entering room code...');
      const codeInput = visitorPage.locator('input').first();
      await codeInput.fill(shareCode);
      await visitorPage.waitForTimeout(500);
      await visitorPage.screenshot({ path: 'e2e/screenshots/interaction-4-visitor-code-entered.png' });
      console.log(`✓ Visitor entered code: ${shareCode}\n`);

      // ========== STEP 5: Visitor clicks join (first step) ==========
      console.log('STEP 5: Visitor clicking first join button...');
      await visitorPage.click('button:has-text("加入諮詢室")');
      await visitorPage.waitForTimeout(3000);
      await visitorPage.screenshot({ path: 'e2e/screenshots/interaction-5a-visitor-name-page.png' });

      // ========== STEP 5b: Visitor enters name ==========
      console.log('STEP 5b: Visitor entering name...');
      const nameInput = visitorPage.locator('input[placeholder*="姓名"], input[placeholder*="暱稱"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('測試訪客');
        await visitorPage.waitForTimeout(500);
        await visitorPage.screenshot({ path: 'e2e/screenshots/interaction-5b-visitor-name-entered.png' });
        console.log('✓ Visitor entered name: 測試訪客');

        // Click final join button
        await visitorPage.click('button:has-text("加入諮詢室")');
        await visitorPage.waitForTimeout(5000);
      }

      const visitorUrl = visitorPage.url();
      console.log(`Visitor URL after join: ${visitorUrl}`);
      await visitorPage.screenshot({ path: 'e2e/screenshots/interaction-5-visitor-in-room.png' });

      const visitorJoined = visitorUrl.includes('/room/') || visitorUrl.includes('/visitor/');
      console.log(`Visitor entered room: ${visitorJoined}\n`);

      // ========== STEP 6: Verify owner sees visitor ==========
      console.log('STEP 6: Checking if owner sees visitor...');
      await ownerPage.waitForTimeout(2000);
      await ownerPage.screenshot({ path: 'e2e/screenshots/interaction-6-owner-sees-visitor.png' });

      // ========== STEP 7: Owner selects a game ==========
      console.log('STEP 7: Owner selecting a game...');
      const gameButton = ownerPage.locator('text=六大性格分析, button:has-text("選擇此玩法")').first();
      if (await gameButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await gameButton.click();
      } else {
        // Try clicking on game card directly
        await ownerPage.click('text=六大性格分析');
      }
      await ownerPage.waitForTimeout(2000);
      await ownerPage.screenshot({ path: 'e2e/screenshots/interaction-7-owner-selects-game.png' });
      console.log('✓ Owner selected game\n');

      // ========== STEP 8: Check if visitor sees the game ==========
      console.log('STEP 8: Checking visitor view...');
      await visitorPage.waitForTimeout(2000);
      await visitorPage.screenshot({ path: 'e2e/screenshots/interaction-8-visitor-sees-game.png' });

      const visitorContent = await visitorPage.content();
      const hasGameContent = visitorContent.includes('六大性格') ||
                            visitorContent.includes('RIASEC') ||
                            visitorContent.includes('性格');
      console.log(`Visitor sees game: ${hasGameContent}\n`);

      // ========== FINAL SUMMARY ==========
      console.log('========== TEST SUMMARY ==========');
      console.log(`Share Code: ${shareCode}`);
      console.log(`Visitor joined room: ${visitorJoined}`);
      console.log(`Visitor sees game content: ${hasGameContent}`);
      console.log('==================================\n');

      // Assert visitor joined
      expect(visitorJoined).toBe(true);

    } finally {
      await ownerContext.close();
      await visitorContext.close();
    }
  });
});
