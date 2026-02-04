import { test, expect } from '@playwright/test';

test.describe('QA Checklist Page Verification', () => {
  const baseUrl = 'https://career-creator-frontend-staging-849078733818.asia-east1.run.app';

  test('verify QA checklist page structure and functionality', async ({ page }) => {
    // Navigate to QA checklist
    await page.goto(`${baseUrl}/docs/qa-checklist.html`);

    // Take initial screenshot
    await page.screenshot({ path: 'e2e/screenshots/qa-checklist-initial.png', fullPage: false });

    // Fill in tester info (testEnv and browser are auto-detected hidden fields)
    await page.fill('#testerName', '測試CLAUDE');
    // testDate is auto-filled by the page, but let's set it explicitly
    await page.evaluate(() => {
      const dateInput = document.getElementById('testDate') as HTMLInputElement;
      if (dateInput) dateInput.valueAsDate = new Date();
    });

    // Take screenshot after filling tester info
    await page.screenshot({ path: 'e2e/screenshots/qa-checklist-tester-filled.png', fullPage: false });

    // Verify first section is open by default
    const firstSection = page.locator('details.section').first();
    await expect(firstSection).toHaveAttribute('open', '');

    // Count total sections
    const sectionCount = await page.locator('details.section').count();
    console.log(`Total sections: ${sectionCount}`);
    expect(sectionCount).toBe(11); // 3 flow + 7 games + 1 tools

    // Verify all 7 games exist (A-G)
    const gameIds = ['gameA', 'gameB', 'gameC', 'gameD', 'gameE', 'gameF', 'gameG'];
    for (const gameId of gameIds) {
      const gameSection = page.locator(`details[data-section="${gameId}"]`);
      await expect(gameSection).toBeVisible();
      console.log(`Game ${gameId}: Found`);
    }

    // Verify no "諮商" word exists (should all be "諮詢")
    const pageContent = await page.content();
    const hasOldWord = pageContent.includes('諮商');
    expect(hasOldWord).toBe(false);
    console.log('Word check: No "諮商" found (correct)');

    // Verify test account info is removed
    const hasTestAccount = pageContent.includes('demo.counselor@example.com');
    expect(hasTestAccount).toBe(false);
    console.log('Test account check: Removed (correct)');

    // Test collapsible functionality - click to open second section
    const secondSection = page.locator('details.section').nth(1);
    await secondSection.locator('summary').click();
    await expect(secondSection).toHaveAttribute('open', '');

    // Take screenshot with second section open
    await page.screenshot({ path: 'e2e/screenshots/qa-checklist-section-toggle.png', fullPage: false });

    // Test checkbox functionality in first section
    const firstCheckbox = page.locator('details.section').first().locator('input[type="checkbox"]').first();
    await firstCheckbox.check();
    await expect(firstCheckbox).toBeChecked();

    // Take final screenshot
    await page.screenshot({ path: 'e2e/screenshots/qa-checklist-checkbox-tested.png', fullPage: false });

    console.log('All QA checklist verifications passed!');
  });
});
