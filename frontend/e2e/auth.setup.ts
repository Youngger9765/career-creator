import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Use localhost for auth (staging is down)
  await page.goto('http://localhost:3000/login');

  // Wait for login form to load
  await page.waitForSelector('input#email', { timeout: 10000 });

  // Fill in credentials
  await page.fill('input#email', 'demo.counselor@example.com');
  await page.fill('input#password', 'demo123');

  // Click login button
  await page.click('button[type="submit"]:has-text("登入")');

  // Wait for redirect to dashboard
  await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });

  // Verify we're logged in
  await expect(page.locator('text=諮詢師控制台')).toBeVisible({ timeout: 10000 });

  // Save auth state
  await page.context().storageState({ path: authFile });
});
