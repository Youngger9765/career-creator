/**
 * TDD Test: 訪客應該同步到諮商師正在玩的遊戲
 *
 * Bug: 訪客初始狀態 = DEFAULT_STATE (六大性格分析)
 * Expected: 訪客應該等待諮商師回覆，顯示諮商師實際在玩的遊戲
 */

import { test, expect } from '@playwright/test';

test('visitor should sync to counselor current game, not default game', async ({ page }) => {
  const STAGING_URL = 'https://career-creator-frontend-staging-x43mdhfwsq-de.a.run.app';

  // 已知條件（從實際測試）：
  // - Share code: AOYYSN (letter O, not number 0)
  // - 諮商師狀態：在「選擇遊戲模式」畫面（還沒選遊戲）
  // - 預期：訪客應該看到「等待諮商師選擇遊戲」
  // - 實際：訪客進入了預設遊戲（優勢分析）← BUG!

  const shareCode = 'AOYYSN';
  const visitorUrl = `${STAGING_URL}/join/${shareCode}`;

  // Collect console logs to verify game mode
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);

    if (text.includes('[GameMode]') || text.includes('gameMode')) {
      console.log(`[Console] ${text}`);
    }
  });

  console.log('\n🧪 Test: Visitor should wait for counselor, not enter default game');
  console.log('Counselor: Still on game selection screen (no game chosen)');
  console.log('Expected: Visitor sees "請選擇遊戲模式" (waiting for counselor)');
  console.log('Actual Bug: Visitor enters default game immediately\n');

  // 訪客加入房間
  await page.goto(visitorUrl, { waitUntil: 'networkidle' });

  // 輸入訪客名稱
  const nameInput = page.locator('input[type="text"]').first();
  if (await nameInput.count() > 0) {
    await nameInput.fill('TestVisitor');
    const joinButton = page.locator('button:has-text("加入"), button:has-text("進入")').first();
    await joinButton.click();
    await page.waitForTimeout(3000);
  }

  // 檢查是否顯示「選擇遊戲模式」（諮商師的狀態）
  const hasGameSelection = await page.locator('text=選擇遊戲模式').count() > 0;

  // 檢查是否進入了任何遊戲（strategic action, 拖曳卡片區域等）
  const hasStrategicAction = await page.locator('text=Strategic action').count() > 0;
  const hasDragZone = await page.locator('text=拖曳卡片到此處').count() > 0;
  const hasGameCards = hasStrategicAction || hasDragZone;

  // 檢查是否有職能盤點相關內容（bug: 訪客不應該看到這些）
  const hasSkillsTab = await page.locator('text=職能盤點').count() > 0;
  const hasAdvantageTab = await page.locator('text=優勢').count() > 0;
  const hasSkillsCards = hasSkillsTab || hasAdvantageTab;

  // 截圖證明
  await page.screenshot({ path: '/tmp/visitor-sync-test.png', fullPage: true });
  console.log('📸 Screenshot saved to /tmp/visitor-sync-test.png');

  console.log('\n📊 Test Results:');
  console.log(`   Has game selection screen: ${hasGameSelection}`);
  console.log(`   Has game cards (Strategic action): ${hasGameCards}`);
  console.log(`   Has skills content (職能盤點): ${hasSkillsCards}`);

  // 分析 console logs 找出實際的 gameMode
  const gameModeLogs = consoleLogs.filter(log =>
    log.includes('gameMode') || log.includes('Game state') || log.includes('syncedState')
  );

  if (gameModeLogs.length > 0) {
    console.log('\n🔍 GameMode/State logs:');
    gameModeLogs.slice(0, 10).forEach(log => console.log(`   ${log}`));
  }

  // 🔴 RED Test - 這個測試目前應該 FAIL
  // Assertions: 訪客應該等待諮商師，不應該進入任何遊戲

  // ✅ 訪客應該看到「選擇遊戲模式」（和諮商師一樣的狀態）
  expect(hasGameSelection).toBe(true);

  // ❌ 訪客不應該看到遊戲卡片
  expect(hasGameCards).toBe(false);

  // ❌ 訪客不應該看到職能盤點內容
  expect(hasSkillsCards).toBe(false);
});
