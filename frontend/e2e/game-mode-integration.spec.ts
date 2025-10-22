/**
 * E2E Test for Game Mode Integration
 * 測試完整的遊戲模式選擇流程
 *
 * NOTE: These tests are for a test architecture that may no longer exist in the current codebase
 * TODO: Update or remove these tests based on current UI implementation
 */

import { test, expect } from '@playwright/test';

test.describe.skip('Game Mode Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to room page with test architecture enabled
    await page.goto('http://localhost:3002/room/test-room-123');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should show test architecture toggle button', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /測試新架構/ });
    await expect(toggleButton).toBeVisible();
    await expect(toggleButton).toHaveClass(/bg-purple-500/);
  });

  test('should switch to new architecture when button clicked', async ({ page }) => {
    // Click the toggle button
    const toggleButton = page.getByRole('button', { name: /測試新架構/ });
    await toggleButton.click();

    // Verify button text changes
    await expect(toggleButton).toHaveText('切換到舊架構');

    // Verify GameModeIntegration component is visible
    await expect(page.getByText('遊戲模式整合測試')).toBeVisible();

    // Verify tabs are present
    await expect(page.getByRole('tab', { name: '1. 選擇模式' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '2. 選擇玩法' })).toBeDisabled();
    await expect(page.getByRole('tab', { name: '3. 開始遊戲' })).toBeDisabled();
  });

  test('should select mode and enable gameplay selection', async ({ page }) => {
    // Switch to new architecture
    await page.getByRole('button', { name: /測試新架構/ }).click();

    // Enable test mode
    await page.getByRole('button', { name: '開啟測試模式' }).click();

    // Select Career Traveler mode
    const careerMode = page.getByTestId('mode-career_traveler');
    await careerMode.click();

    // Verify mode is selected
    await expect(careerMode).toHaveClass(/border-blue-500/);

    // Verify gameplay tab is enabled
    const gameplayTab = page.getByRole('tab', { name: '2. 選擇玩法' });
    await expect(gameplayTab).not.toBeDisabled();

    // Click gameplay tab
    await gameplayTab.click();

    // Verify gameplays are shown
    await expect(page.getByText('六大性格分析')).toBeVisible();
    await expect(page.getByText('收集家玩法')).toBeVisible();
  });

  test('should complete full flow from mode to gameplay to cards', async ({ page }) => {
    // Switch to new architecture
    await page.getByRole('button', { name: /測試新架構/ }).click();

    // Enable test mode for logging
    await page.getByRole('button', { name: '開啟測試模式' }).click();

    // Step 1: Select Career Traveler mode
    await page.getByTestId('mode-career_traveler').click();

    // Step 2: Go to gameplay selection
    await page.getByRole('tab', { name: '2. 選擇玩法' }).click();

    // Select personality analysis gameplay
    const personalityGameplay = page.getByTestId('gameplay-personality_analysis');
    await personalityGameplay.click();

    // Wait for cards to load
    await page.waitForTimeout(1000);

    // Step 3: Go to game start
    await page.getByRole('tab', { name: '3. 開始遊戲' }).click();

    // Verify game configuration is displayed
    await expect(page.getByText('遊戲配置資訊')).toBeVisible();
    await expect(page.getByText('職游旅人卡')).toBeVisible();
    await expect(page.getByText('六大性格分析')).toBeVisible();
    await expect(page.getByText('100張')).toBeVisible(); // Main deck
    await expect(page.getByText('三欄分類')).toBeVisible(); // Canvas type

    // Verify test logs show successful loading
    const testLogs = page.locator('.text-xs.font-mono');
    await expect(testLogs.first()).toContainText('✅');
  });

  test('should load correct cards for skill inventory mode', async ({ page }) => {
    // Switch to new architecture
    await page.getByRole('button', { name: /測試新架構/ }).click();

    // Select Skill Inventory mode
    await page.getByTestId('mode-skill_inventory').click();

    // Go to gameplay selection
    await page.getByRole('tab', { name: '2. 選擇玩法' }).click();

    // Select advantage analysis
    await page.getByTestId('gameplay-advantage_analysis').click();

    // Go to game start
    await page.getByRole('tab', { name: '3. 開始遊戲' }).click();

    // Verify correct cards loaded
    await expect(page.getByText('職能盤點卡')).toBeVisible();
    await expect(page.getByText('52張')).toBeVisible();
    await expect(page.getByText('雙區')).toBeVisible();
  });

  test('should show token system for life redesign gameplay', async ({ page }) => {
    // Switch to new architecture
    await page.getByRole('button', { name: /測試新架構/ }).click();

    // Select Value Navigation mode
    await page.getByTestId('mode-value_navigation').click();

    // Go to gameplay selection
    await page.getByRole('tab', { name: '2. 選擇玩法' }).click();

    // Select life redesign
    await page.getByTestId('gameplay-life_redesign').click();

    // Go to game start
    await page.getByRole('tab', { name: '3. 開始遊戲' }).click();

    // Verify token system is shown
    await expect(page.getByText('家庭')).toBeVisible();
    await expect(page.getByText('愛情')).toBeVisible();
    await expect(page.getByText('事業')).toBeVisible();
    await expect(page.getByText('財富')).toBeVisible();
    await expect(page.getByText('友誼')).toBeVisible();
    await expect(page.getByText('成長')).toBeVisible();
    await expect(page.getByText('休閒')).toBeVisible();
    await expect(page.getByText('健康')).toBeVisible();

    // Verify visualization components
    await expect(page.getByText('能量分配圓餅圖')).toBeVisible();
    await expect(page.getByText('能量分配進度')).toBeVisible();
  });

  test('should handle token allocation correctly', async ({ page }) => {
    // Switch to new architecture and navigate to life redesign
    await page.getByRole('button', { name: /測試新架構/ }).click();
    await page.getByTestId('mode-value_navigation').click();
    await page.getByRole('tab', { name: '2. 選擇玩法' }).click();
    await page.getByTestId('gameplay-life_redesign').click();
    await page.getByRole('tab', { name: '3. 開始遊戲' }).click();

    // Find family token input
    const familyInput = page.locator('input[data-area="family"]');

    // Set token value
    await familyInput.fill('30');
    await familyInput.press('Enter');

    // Verify remaining tokens updated
    await expect(page.getByText('剩餘: 70')).toBeVisible();

    // Set more tokens
    const careerInput = page.locator('input[data-area="career"]');
    await careerInput.fill('40');
    await careerInput.press('Enter');

    // Verify remaining
    await expect(page.getByText('剩餘: 30')).toBeVisible();

    // Try to exceed limit
    const healthInput = page.locator('input[data-area="health"]');
    await healthInput.fill('50');
    await healthInput.press('Enter');

    // Should show error or not accept
    await expect(page.getByText('超過可用籌碼')).toBeVisible();
  });

  test('should maintain state when switching between tabs', async ({ page }) => {
    // Switch to new architecture
    await page.getByRole('button', { name: /測試新架構/ }).click();

    // Select mode and gameplay
    await page.getByTestId('mode-career_traveler').click();
    await page.getByRole('tab', { name: '2. 選擇玩法' }).click();
    await page.getByTestId('gameplay-personality_analysis').click();

    // Go to game start tab
    await page.getByRole('tab', { name: '3. 開始遊戲' }).click();

    // Verify state is maintained
    await expect(page.getByText('職游旅人卡')).toBeVisible();
    await expect(page.getByText('六大性格分析')).toBeVisible();

    // Go back to mode selection
    await page.getByRole('tab', { name: '1. 選擇模式' }).click();

    // Verify mode is still selected
    const careerMode = page.getByTestId('mode-career_traveler');
    await expect(careerMode).toHaveClass(/border-blue-500/);
  });

  test('should show test logs in test mode', async ({ page }) => {
    // Switch to new architecture
    await page.getByRole('button', { name: /測試新架構/ }).click();

    // Enable test mode
    const testModeButton = page.getByRole('button', { name: '開啟測試模式' });
    await testModeButton.click();

    // Verify test mode enabled
    await expect(testModeButton).toHaveText('關閉測試模式');

    // Verify test log panel appears
    await expect(page.getByText('測試日誌')).toBeVisible();

    // Perform actions to generate logs
    await page.getByTestId('mode-career_traveler').click();

    // Verify logs are generated
    const logEntries = page.locator('.text-xs.font-mono');
    await expect(logEntries).toHaveCount(1, { timeout: 5000 });
    await expect(logEntries.first()).toContainText('選擇模式: career_traveler');
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/game-sessions/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Switch to new architecture
    await page.getByRole('button', { name: /測試新架構/ }).click();

    // Try to select mode and gameplay
    await page.getByTestId('mode-career_traveler').click();
    await page.getByRole('tab', { name: '2. 選擇玩法' }).click();
    await page.getByTestId('gameplay-personality_analysis').click();

    // Should show error message
    await expect(page.getByText(/錯誤/)).toBeVisible({ timeout: 5000 });
  });
});
