import { test, expect } from '@playwright/test';

test('debug production visitor - wait 30 seconds for polling', async ({ page }) => {
  const roomId = '6afd6944-3c75-425c-93f8-cfc439604b21';
  const visitorName = 'LongWaitTest';

  const errors401: Array<{time: number, url: string}> = [];
  const startTime = Date.now();

  page.on('response', response => {
    if (response.status() === 401) {
      const elapsed = Date.now() - startTime;
      const err = {time: elapsed, url: response.url()};
      errors401.push(err);
      console.log(`❌ 401 at ${(elapsed/1000).toFixed(1)}s: ${response.url()}`);
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('401')) {
      console.log(`Console 401: ${msg.text()}`);
    }
  });

  const url = `https://career-creator-frontend-production-x43mdhfwsq-de.a.run.app/room/${roomId}?visitor=true&name=${visitorName}`;
  console.log(`Visiting: ${url}`);
  console.log(`Will wait 30 seconds to check for polling 401 errors...`);

  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait 30 seconds to see if polling triggers 401
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    if (errors401.length > 0) {
      console.log(`❌ Found ${errors401.length} 401 errors after ${i+1} seconds`);
      break;
    }
  }

  const currentUrl = page.url();
  console.log(`\nFinal URL: ${currentUrl}`);
  console.log(`Total 401 errors: ${errors401.length}`);

  if (errors401.length > 0) {
    console.log(`\n=== 401 ERRORS ===`);
    errors401.forEach(err => {
      console.log(`  ${(err.time/1000).toFixed(1)}s: ${err.url}`);
    });
  }

  if (currentUrl.includes('/login')) {
    console.log(`❌ BUG: Redirected to login!`);
  } else {
    console.log(`✅ Still on room page`);
  }

  expect(errors401).toHaveLength(0);
  expect(currentUrl).not.toContain('/login');
});
