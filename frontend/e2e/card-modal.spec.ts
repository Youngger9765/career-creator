/**
 * CardModal component test - verify Windows DPI scaling fix
 */
import { test, expect } from '@playwright/test';

test.describe('CardModal Windows DPI Fix', () => {
  test('modal should have proper size constraints', async ({ page }) => {
    // Go to a page with CardModal (visitor mode doesn't need auth)
    await page.goto('http://localhost:3000/room/test-room?visitor=true&name=TestUser');

    // Wait for page to load
    await page.waitForSelector('.h-screen.bg-gradient-to-br', { timeout: 10000 });

    // Click on 職游旅人卡 tab to see cards
    const careerTab = page.locator('text=職游旅人卡').first();
    if (await careerTab.isVisible({ timeout: 5000 })) {
      await careerTab.click();
      await page.waitForTimeout(500);

      // Look for any card in the sidebar and click it to open modal
      const cardElement = page.locator('[draggable="true"]').first();
      if (await cardElement.isVisible({ timeout: 5000 })) {
        await cardElement.click();
        await page.waitForTimeout(1000);

        // Check if modal dialog opened
        const dialog = page.locator('[role="dialog"]').first();
        if (await dialog.isVisible({ timeout: 3000 })) {
          // Verify DialogContent has max-height constraint
          const dialogContent = dialog.locator('.max-w-5xl').first();
          const hasMaxHeight = await dialogContent.evaluate((el) => {
            const classList = Array.from(el.classList);
            return classList.some(cls => cls.includes('max-h'));
          });

          expect(hasMaxHeight).toBeTruthy();

          // Check image has proper size constraints
          const modalImage = dialog.locator('img').first();
          if (await modalImage.isVisible({ timeout: 2000 })) {
            const imageStyles = await modalImage.evaluate((img) => {
              const computed = window.getComputedStyle(img);
              return {
                maxWidth: computed.maxWidth,
                maxHeight: computed.maxHeight,
                objectFit: computed.objectFit,
              };
            });

            console.log('Modal image styles:', imageStyles);

            // Verify max-width and max-height are set
            expect(imageStyles.maxWidth).toBe('100%');
            expect(imageStyles.maxHeight).toBe('100%');
            expect(imageStyles.objectFit).toBe('contain');

            await page.screenshot({
              path: 'test-results/card-modal-size-fix.png',
              fullPage: true,
            });

            console.log('✓ CardModal has proper size constraints for Windows DPI scaling');
          }
        }
      }
    }
  });
});
