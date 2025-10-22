import { test, expect } from '@playwright/test';

// TODO: These tests need complete rewrite for new game flow
// See refactoring-smoke-test.spec.ts for working tests
test.describe.skip('Drag and Drop Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test room
    await page.goto('http://localhost:3000/room/test-room?visitor=true&name=TestUser');

    // Wait for the page to load - wait for the main container
    await page.waitForSelector('.h-screen.bg-gradient-to-br', { timeout: 10000 });

    // Wait for game mode selection to appear
    await page.waitForSelector('text=選擇遊戲模式', { timeout: 5000 });

    // Select a game mode and gameplay to enter the game
    // First, click the 職游旅人卡 tab
    const careerTab = page.locator('text=職游旅人卡').first();
    await careerTab.click();
    await page.waitForTimeout(500);

    // Then click the 六大性格分析 gameplay card
    const personalityCard = page.locator('div:has-text("六大性格分析")').locator('..').locator('button:has-text("選擇此玩法")').first();
    await personalityCard.click();

    // Wait for the game interface to load
    await page.waitForTimeout(2000);
  });

  test('should display cards in the card list', async ({ page }) => {
    // Check if card list is visible
    const cardList = page.locator('h3:has-text("職游旅人卡")');
    await expect(cardList).toBeVisible();

    // Check if cards are displayed
    const cards = page.locator('[id^="list-"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should allow dragging cards from list to drop zones', async ({ page }) => {
    // Find a card in the list
    const sourceCard = page.locator('[id^="list-"]').first();

    // Find the advantage drop zone
    const dropZone = page.locator('[id="advantage"]');

    // Perform drag and drop
    await sourceCard.dragTo(dropZone);

    // Check if card appears in the drop zone
    const droppedCards = dropZone.locator('.w-32.h-44');
    const count = await droppedCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should allow dragging auxiliary cards when in personality mode', async ({ page }) => {
    // Switch to personality mode
    await page.selectOption('select:has-text("玩法選擇")', '六大性格分析');

    // Check if auxiliary cards are visible
    const auxCards = page.locator('h3:has-text("解釋卡 (Holland)")');
    await expect(auxCards).toBeVisible();

    // Find an auxiliary card
    const auxCard = page.locator('[id^="aux-"]').first();

    // Find the like drop zone
    const dropZone = page.locator('[id="like"]');

    // Perform drag and drop
    await auxCard.dragTo(dropZone);

    // Check if card appears in the drop zone
    const droppedCards = dropZone.locator('.w-32.h-44');
    const count = await droppedCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should clear canvas when clear button is clicked', async ({ page }) => {
    // First add a card to the canvas
    const sourceCard = page.locator('[id^="list-"]').first();
    const dropZone = page.locator('[id="advantage"]');
    await sourceCard.dragTo(dropZone);

    // Click clear button
    await page.click('button:has-text("清空畫面")');

    // Check if all zones are empty
    const advantageCards = page.locator('[id="advantage"] .w-32.h-44');
    const disadvantageCards = page.locator('[id="disadvantage"] .w-32.h-44');

    await expect(advantageCards).toHaveCount(0);
    await expect(disadvantageCards).toHaveCount(0);
  });

  test('should switch game modes correctly', async ({ page }) => {
    // Initial mode should be 優劣勢分析
    await expect(page.locator('h2:has-text("優劣勢分析")')).toBeVisible();

    // Switch to 價值觀排序
    await page.selectOption('select:nth-of-type(2)', '價值觀排序');
    await expect(page.locator('h2:has-text("價值觀排序")')).toBeVisible();

    // Switch to 六大性格分析
    await page.selectOption('select:nth-of-type(2)', '六大性格分析');
    await expect(page.locator('h2:has-text("六大性格分析")')).toBeVisible();
  });

  test('should filter cards when searching', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder="搜尋卡片..."]', '工程師');

    // Check if filtered results appear
    const cards = page.locator('[id^="list-"]');
    const count = await cards.count();

    // Should have fewer cards after filtering
    expect(count).toBeLessThan(15); // Assuming we have 15 total career cards
  });
});
