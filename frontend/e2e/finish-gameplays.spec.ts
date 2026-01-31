import { test } from '@playwright/test';
import * as path from 'path';

const URL = 'https://career-creator-frontend-production-849078733818.asia-east1.run.app/room/bd2bece6-398f-41b7-8a23-6dd8461b7df4';
const DIR = path.join(__dirname, '../../docs/images/gameplays');

const gameplays = [
  { deck: '職能盤點卡', name: '成長計畫', file: '04-growth-plan.png' },
  { deck: '職能盤點卡', name: '職位拆解', file: '05-position-breakdown.png' },
  { deck: '價值導航卡', name: '價值觀排序', file: '06-value-ranking.png' },
  { deck: '價值導航卡', name: '生活重新設計', file: '07-life-redesign.png' }
];

test('Finish remaining gameplays', async ({ page }) => {
  await page.goto(URL);
  await page.waitForTimeout(5000);

  for (const gp of gameplays) {
    await page.locator(`text=${gp.deck}`).first().click();
    await page.waitForTimeout(2000);
    await page.locator(`text=${gp.name}`).first().click({ timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(DIR, gp.file), fullPage: false });
    console.log(`✅ ${gp.file}`);
    await page.goto(URL);
    await page.waitForTimeout(3000);
  }
});
