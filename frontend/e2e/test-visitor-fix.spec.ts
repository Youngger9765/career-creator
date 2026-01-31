import { test, expect } from '@playwright/test';

test('visitor can join room without redirect loop', async ({ page }) => {
  const roomId = '00e6714f-2af8-40b5-87fc-d89e8c0baf1b';
  const visitorName = 'TestVisitor';

  // Monitor console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Monitor network 401 errors
  const apiErrors: string[] = [];
  page.on('response', response => {
    if (response.status() === 401) {
      apiErrors.push(response.url());
    }
  });

  // Visit room as visitor
  const url = `http://localhost:3003/room/${roomId}?visitor=true&name=${visitorName}`;
  console.log('Visiting:', url);

  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 15000
  });

  // Wait a bit to see if redirect happens
  await page.waitForTimeout(3000);

  // Check current URL - should NOT be /login
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  // Assertions
  expect(currentUrl).not.toContain('/login');
  expect(currentUrl).toContain(`/room/${roomId}`);
  expect(currentUrl).toContain('visitor=true');

  // Check for 401 errors
  if (apiErrors.length > 0) {
    console.log('❌ 401 Errors detected:', apiErrors);
    expect(apiErrors).toHaveLength(0);
  } else {
    console.log('✅ No 401 errors');
  }

  // Check for console errors related to auth
  const authErrors = errors.filter(e =>
    e.includes('401') ||
    e.includes('Unauthorized') ||
    e.includes('Failed to init consultation record')
  );

  if (authErrors.length > 0) {
    console.log('⚠️ Console errors:', authErrors);
  }

  console.log('✅ Test passed: Visitor joined without redirect loop');
});
