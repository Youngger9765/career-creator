import { test, expect } from '@playwright/test';

test('debug production visitor 401 errors', async ({ page }) => {
  const roomId = '6afd6944-3c75-425c-93f8-cfc439604b21';
  const visitorName = 'DebugTest';

  // Capture ALL network requests
  const requests: string[] = [];
  const errors401: string[] = [];

  page.on('request', request => {
    const url = request.url();
    requests.push(`${request.method()} ${url}`);
  });

  page.on('response', response => {
    if (response.status() === 401) {
      errors401.push(`401: ${response.url()}`);
      console.log(`❌ 401 ERROR: ${response.url()}`);
    }
  });

  // Monitor console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Console Error: ${msg.text()}`);
    }
  });

  // Visit production visitor URL
  const url = `https://career-creator-frontend-production-x43mdhfwsq-de.a.run.app/room/${roomId}?visitor=true&name=${visitorName}`;
  console.log(`Visiting: ${url}`);

  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 20000
  });

  // Wait to see if redirect happens
  await page.waitForTimeout(5000);

  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);

  // Print all requests
  console.log(`\n=== ALL REQUESTS (${requests.length}) ===`);
  requests.forEach((req, i) => console.log(`${i + 1}. ${req}`));

  // Print 401 errors
  console.log(`\n=== 401 ERRORS (${errors401.length}) ===`);
  errors401.forEach(err => console.log(err));

  // Assertions
  if (currentUrl.includes('/login')) {
    console.log(`❌ REDIRECTED TO LOGIN - Bug still exists!`);
  } else {
    console.log(`✅ Stayed on room page`);
  }

  expect(errors401).toHaveLength(0);
  expect(currentUrl).not.toContain('/login');
});
