/**
 * Phase 1 Closure Report - Production Screenshots
 * Uses real login credentials from seed data
 */
import { test, expect } from '@playwright/test';
import * as path from 'path';

const PRODUCTION_URL = 'https://career-creator-frontend-production-849078733818.asia-east1.run.app';
const SCREENSHOTS_DIR = path.join(__dirname, '../../docs/images');

// Demo account credentials from backend/app/core/auth.py
const DEMO_COUNSELOR = {
  email: 'demo.counselor@example.com',
  password: 'demo123',
  name: 'Dr. Sarah Chen'
};

test.describe('Phase 1 Production Screenshots', () => {
  test.use({
    baseURL: PRODUCTION_URL,
    viewport: { width: 1440, height: 900 }
  });

  test('01 - Login Page (登入頁面)', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-login-page.png'),
      fullPage: false
    });

    console.log('✅ Screenshot 01: Login Page');
  });

  test('02 - Dashboard After Login (諮詢師儀表板)', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', DEMO_COUNSELOR.email);
    await page.fill('input[type="password"]', DEMO_COUNSELOR.password);
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-teacher-dashboard.png'),
      fullPage: false
    });

    console.log('✅ Screenshot 02: Teacher Dashboard');
  });

  test('03 - Room List (諮詢室列表)', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', DEMO_COUNSELOR.email);
    await page.fill('input[type="password"]', DEMO_COUNSELOR.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Navigate to rooms if needed
    const roomsLink = page.locator('text=諮詢室').or(page.locator('text=房間')).or(page.locator('text=Rooms'));
    if (await roomsLink.count() > 0) {
      await roomsLink.first().click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-room-list.png'),
      fullPage: true
    });

    console.log('✅ Screenshot 03: Room List');
  });

  test('04 - Create Room Interface (建立諮詢室)', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', DEMO_COUNSELOR.email);
    await page.fill('input[type="password"]', DEMO_COUNSELOR.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Look for create room button
    const createButton = page.locator('text=建立諮詢室').or(page.locator('text=新增房間')).or(page.locator('text=Create Room'));
    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '04-create-room.png'),
        fullPage: false
      });

      console.log('✅ Screenshot 04: Create Room Interface');
    } else {
      console.log('⚠️  Screenshot 04: Create Room button not found, skipping');
    }
  });

  test('05 - Game Mode Selection (遊戲模式選擇)', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', DEMO_COUNSELOR.email);
    await page.fill('input[type="password"]', DEMO_COUNSELOR.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Try to find and enter a room
    const enterRoomButton = page.locator('button').filter({ hasText: /進入|Enter/ }).first();
    if (await enterRoomButton.count() > 0) {
      await enterRoomButton.click();
      await page.waitForTimeout(2000);

      // Check if game mode selection is visible
      const gameModeText = page.locator('text=選擇遊戲模式').or(page.locator('text=Game Mode'));
      if (await gameModeText.isVisible()) {
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '05-game-mode-selection.png'),
          fullPage: false
        });

        console.log('✅ Screenshot 05: Game Mode Selection');
      }
    }
  });

  test('06 - Card Deck Interface (牌卡介面)', async ({ page }) => {
    // Login and navigate to a room with cards
    await page.goto('/login');
    await page.fill('input[type="email"]', DEMO_COUNSELOR.email);
    await page.fill('input[type="password"]', DEMO_COUNSELOR.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Try to enter a room and select a card deck
    const enterRoomButton = page.locator('button').filter({ hasText: /進入|Enter/ }).first();
    if (await enterRoomButton.count() > 0) {
      await enterRoomButton.click();
      await page.waitForTimeout(2000);

      // Select first available card deck
      const cardDeck = page.locator('text=職游旅人卡').or(page.locator('text=價值導航卡')).or(page.locator('text=職能盤點卡'));
      if (await cardDeck.first().isVisible()) {
        await cardDeck.first().click();
        await page.waitForTimeout(2000);

        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '06-card-deck-interface.png'),
          fullPage: false
        });

        console.log('✅ Screenshot 06: Card Deck Interface');
      }
    }
  });

  test('07 - Client Management (客戶管理)', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', DEMO_COUNSELOR.email);
    await page.fill('input[type="password"]', DEMO_COUNSELOR.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Look for client/member management
    const clientLink = page.locator('text=客戶').or(page.locator('text=成員')).or(page.locator('text=Clients'));
    if (await clientLink.count() > 0) {
      await clientLink.first().click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '07-client-management.png'),
        fullPage: true
      });

      console.log('✅ Screenshot 07: Client Management');
    } else {
      console.log('⚠️  Screenshot 07: Client management not found, skipping');
    }
  });

  test('08 - Room Invitation Code (房間邀請碼)', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', DEMO_COUNSELOR.email);
    await page.fill('input[type="password"]', DEMO_COUNSELOR.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Try to get invitation code
    const enterRoomButton = page.locator('button').filter({ hasText: /進入|Enter/ }).first();
    if (await enterRoomButton.count() > 0) {
      await enterRoomButton.click();
      await page.waitForTimeout(2000);

      // Look for share/invite button or code display
      const inviteCode = page.locator('text=邀請碼').or(page.locator('text=分享')).or(page.locator('text=Invite Code'));
      if (await inviteCode.count() > 0) {
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '08-invitation-code.png'),
          fullPage: false
        });

        console.log('✅ Screenshot 08: Invitation Code');
      }
    }
  });
});
