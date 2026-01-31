/**
 * 測試 WebSocket 訊息量 - 檢測 infinite loop 是否修復
 */

import { test, expect } from '@playwright/test';
import { skipInCI } from './test-helpers';

test.skip(skipInCI, 'Production integration tests only run locally');

test('monitor WebSocket messages for infinite loop', async ({ page }) => {
  const PRODUCTION_URL = 'https://career-creator-frontend-production-x43mdhfwsq-de.a.run.app';
  const shareCode = '3F4BK0';

  // 收集所有 WebSocket 訊息
  const wsMessages: any[] = [];
  const consoleMessages: string[] = [];

  // 監控 WebSocket frames
  page.on('websocket', ws => {
    console.log(`🔌 WebSocket connected: ${ws.url()}`);

    ws.on('framesent', frame => {
      try {
        const data = JSON.parse(frame.payload as string);
        wsMessages.push({ type: 'sent', timestamp: Date.now(), data });
      } catch (e) {
        // Binary or unparseable frame
      }
    });

    ws.on('framereceived', frame => {
      try {
        const data = JSON.parse(frame.payload as string);
        wsMessages.push({ type: 'received', timestamp: Date.now(), data });
      } catch (e) {
        // Binary or unparseable frame
      }
    });

    ws.on('close', () => {
      console.log(`🔌 WebSocket closed`);
    });
  });

  // 監控 console logs
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);

    // 偵測 infinite loop 特徵
    if (text.includes('[Room] Game state changed') ||
        text.includes('mode_changed') ||
        text.includes('broadcast')) {
      console.log(`📝 ${text}`);
    }
  });

  // 1. 訪客加入房間
  console.log('\n🧪 Step 1: Visitor joins room');
  await page.goto(`${PRODUCTION_URL}/join/${shareCode}`, { waitUntil: 'networkidle' });

  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.fill('WSTestVisitor');

  const joinButton = page.locator('button:has-text("加入"), button:has-text("進入")').first();
  await joinButton.click();

  await page.waitForURL(/\/room\/.+/, { timeout: 10000 });
  console.log(`✅ Joined room, URL: ${page.url()}`);

  // 2. 等待 15 秒，監控訊息量
  console.log('\n⏱️  Step 2: Monitoring WebSocket messages for 15 seconds...');
  const startTime = Date.now();
  const initialMsgCount = wsMessages.length;

  await page.waitForTimeout(15000);

  const endTime = Date.now();
  const finalMsgCount = wsMessages.length;
  const totalMessages = finalMsgCount - initialMsgCount;
  const duration = (endTime - startTime) / 1000;
  const messagesPerSecond = totalMessages / duration;

  console.log(`\n📊 WebSocket Message Statistics:`);
  console.log(`   Duration: ${duration.toFixed(1)}s`);
  console.log(`   Total messages: ${totalMessages}`);
  console.log(`   Messages/second: ${messagesPerSecond.toFixed(2)}`);

  // 3. 分析訊息類型
  const messageTypes = new Map<string, number>();
  wsMessages.forEach(msg => {
    const event = msg.data?.event || msg.data?.type || 'unknown';
    messageTypes.set(event, (messageTypes.get(event) || 0) + 1);
  });

  console.log(`\n📋 Message breakdown:`);
  messageTypes.forEach((count, type) => {
    console.log(`   ${type}: ${count}`);
  });

  // 4. 檢測 infinite loop 特徵
  const gameStateChangeLogs = consoleMessages.filter(msg =>
    msg.includes('[Room] Game state changed')
  );

  console.log(`\n🔍 Console log analysis:`);
  console.log(`   "[Room] Game state changed" count: ${gameStateChangeLogs.length}`);

  // 5. 判定結果
  console.log(`\n🎯 Test Results:`);

  if (messagesPerSecond > 10) {
    console.log(`   ❌ FAIL: Too many messages (${messagesPerSecond.toFixed(2)}/s > 10/s threshold)`);
    console.log(`   ⚠️  Possible infinite loop detected!`);
  } else {
    console.log(`   ✅ PASS: Message rate normal (${messagesPerSecond.toFixed(2)}/s)`);
  }

  if (gameStateChangeLogs.length > 20) {
    console.log(`   ❌ FAIL: Too many game state changes (${gameStateChangeLogs.length} > 20 threshold)`);
    console.log(`   ⚠️  Console log spam detected!`);
  } else {
    console.log(`   ✅ PASS: Game state changes normal (${gameStateChangeLogs.length})`);
  }

  // 截圖證明
  await page.screenshot({ path: '/tmp/websocket-test.png', fullPage: true });
  console.log(`\n📸 Screenshot saved to /tmp/websocket-test.png`);

  // Assertions
  expect(messagesPerSecond).toBeLessThan(10);
  expect(gameStateChangeLogs.length).toBeLessThan(20);
});
