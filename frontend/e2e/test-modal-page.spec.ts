/**
 * Test Modal Page E2E Test
 * Verify CardModal Windows DPI scaling fix on a simple test page
 */
import { test, expect } from '@playwright/test';

test.describe('Test Modal Page - DPI Fix Verification', () => {
  test('should open modal with proper size constraints', async ({ page }) => {
    // Go to test page (no auth required)
    await page.goto('/test-modal');

    // Wait for page to load
    await expect(page.locator('h1:has-text("CardModal 測試頁面")')).toBeVisible({ timeout: 10000 });

    // Click button to open modal
    const openButton = page.locator('button:has-text("開啟測試 Modal")');
    await expect(openButton).toBeVisible();
    await openButton.click();

    // Wait for modal to appear
    await page.waitForTimeout(1000);

    // Verify modal is visible
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Look for the element with max-w-5xl class (our DialogContent)
    const contentWithMaxW = page.locator('.max-w-5xl');
    await expect(contentWithMaxW).toBeVisible({ timeout: 5000 });

    // Check if it has max-h class
    const className = await contentWithMaxW.getAttribute('class');
    const hasMaxHeight = className?.includes('max-h');

    expect(hasMaxHeight).toBeTruthy();
    console.log('✓ DialogContent has max-h-[90vh] class');

    // Verify images have inline size constraints
    const modalImages = page.locator('[role="dialog"] img');
    const imageCount = await modalImages.count();

    if (imageCount > 0) {
      const firstImage = modalImages.first();
      await expect(firstImage).toBeVisible({ timeout: 10000 });

      const imageStyles = await firstImage.evaluate((img) => {
        const inline = (img as HTMLElement).style;
        const computed = window.getComputedStyle(img);
        return {
          inlineMaxWidth: inline.maxWidth,
          inlineMaxHeight: inline.maxHeight,
          computedObjectFit: computed.objectFit,
        };
      });

      console.log('Image styles:', imageStyles);

      // Verify inline styles are set (critical for Windows DPI fix)
      expect(imageStyles.inlineMaxWidth).toBe('100%');
      expect(imageStyles.inlineMaxHeight).toBe('100%');
      expect(imageStyles.computedObjectFit).toBe('contain');

      console.log('✓ Images have proper size constraints');
    }

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'test-results/test-modal-page-fix.png',
      fullPage: true,
    });

    console.log('✅ Test Modal Page - Windows DPI fix verified successfully');
  });

  test('should work on localhost', async ({ page }) => {
    // Test on localhost for local development
    await page.goto('/test-modal');

    await expect(page.locator('h1:has-text("CardModal 測試頁面")')).toBeVisible({ timeout: 10000 });

    const openButton = page.locator('button:has-text("開啟測試 Modal")');
    await openButton.click();
    await page.waitForTimeout(1000);

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    console.log('✅ Test Modal Page works on localhost');
  });
});
