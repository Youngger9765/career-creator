/**
 * Quick gameplay screenshots using existing room
 */
import { test } from '@playwright/test';
import * as path from 'path';

const ROOM_URL = 'https://career-creator-frontend-production-849078733818.asia-east1.run.app/room/bd2bece6-398f-41b7-8a23-6dd8461b7df4';
const SCREENSHOTS_DIR = path.join(__dirname, '../../docs/images/gameplays');

test.describe('Quick Gameplay Screenshots', () => {
  test.use({
    viewport: { width: 1920, height: 1080 }
  });

  const gameplays = [
    { deck: '職游旅人卡', name: '六大性格分析', file: '01-riasec-personality.png' },
    { deck: '職游旅人卡', name: '職業收藏家', file: '02-career-collector.png' },
    { deck: '職能盤點卡', name: '優劣勢分析', file: '03-competency-assessment.png' },
    { deck: '職能盤點卡', name: '成長規劃', file: '04-growth-plan.png' },
    { deck: '職能盤點卡', name: '職位拆解', file: '05-position-breakdown.png' },
    { deck: '價值導航卡', name: '價值觀排序', file: '06-value-ranking.png' },
    { deck: '價值導航卡', name: '生活重新設計', file: '07-life-redesign.png' }
  ];

  test('Capture all gameplays', async ({ page }) => {
    await page.goto(ROOM_URL);
    await page.waitForTimeout(3000);

    for (const gameplay of gameplays) {
      console.log(`\n📸 ${gameplay.deck} - ${gameplay.name}`);

      // Click deck
      const deckButton = page.locator(`text=${gameplay.deck}`).first();
      await deckButton.click();
      await page.waitForTimeout(2000);

      // Click gameplay
      const gameplayButton = page.locator(`text=${gameplay.name}`).first();
      await gameplayButton.click();
      await page.waitForTimeout(3000);

      // Screenshot
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, gameplay.file),
        fullPage: false
      });
      console.log(`✅ ${gameplay.file}`);

      // Back
      await page.goBack();
      await page.waitForTimeout(2000);
    }
  });
});
