/**
 * 重新截圖 - 確保頁面完全載入後才截圖
 */
import { test } from '@playwright/test';
import * as path from 'path';

const ROOM_URL = 'https://career-creator-frontend-production-849078733818.asia-east1.run.app/room/bd2bece6-398f-41b7-8a23-6dd8461b7df4';
const SCREENSHOTS_DIR = path.join(__dirname, '../../docs/images');

test.describe('Verified Screenshots Capture', () => {
  test.use({
    viewport: { width: 1920, height: 1080 }
  });

  test('Capture 6.2 牌卡互動介面 (5 張)', async ({ page }) => {
    const gameplays = [
      { deck: '職游旅人卡', name: '六大性格分析', file: '01-riasec-personality.png', waitExtra: 3000 },
      { deck: '職游旅人卡', name: '職業收藏家', file: '02-career-collector.png', waitExtra: 3000 },
      { deck: '職能盤點卡', name: '優劣勢分析', file: '03-competency-assessment.png', waitExtra: 3000 },
      { deck: '價值導航卡', name: '價值觀排序', file: '04-value-navigation.png', waitExtra: 3000 }
    ];

    // 先截遊戲模式選擇介面
    await page.goto(ROOM_URL);
    console.log('\n⏳ 等待遊戲模式選擇頁面載入...');
    await page.waitForTimeout(8000); // 等待 8 秒確保完全載入

    // 確認頁面已載入完成（檢查是否有牌組選項）
    const deckButtons = page.locator('button:has-text("職游旅人卡"), button:has-text("職能盤點卡"), button:has-text("價值導航卡")');
    await deckButtons.first().waitFor({ state: 'visible', timeout: 10000 });

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-game-mode-selection.png'),
      fullPage: false
    });
    console.log('✅ 05-game-mode-selection.png');

    // 截取各個玩法
    for (const gameplay of gameplays) {
      console.log(`\n📸 ${gameplay.deck} - ${gameplay.name}`);

      // 回到首頁
      await page.goto(ROOM_URL);
      await page.waitForTimeout(3000);

      // 點擊牌組
      console.log(`  → 點擊牌組: ${gameplay.deck}`);
      const deckButton = page.locator(`text=${gameplay.deck}`).first();
      await deckButton.click();
      await page.waitForTimeout(3000);

      // 點擊玩法
      console.log(`  → 點擊玩法: ${gameplay.name}`);
      const gameplayButton = page.locator(`text=${gameplay.name}`).first();
      await gameplayButton.click();

      // ⚠️ 關鍵：等待頁面完全載入（至少 8 秒）
      console.log(`  ⏳ 等待頁面載入完成（8 秒 + ${gameplay.waitExtra}ms）...`);
      await page.waitForTimeout(8000 + gameplay.waitExtra);

      // 截圖
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, gameplay.file),
        fullPage: false
      });
      console.log(`  ✅ ${gameplay.file}`);
    }
  });

  test('Capture 6.3 協作功能 (2 張)', async ({ page }) => {
    // TODO: 需要訪客協作和多人在線的具體操作流程
    console.log('\n⚠️ 6.3 協作功能截圖需要額外設定（訪客加入、多人在線）');
    console.log('這部分需要手動處理或額外腳本');
  });
});
