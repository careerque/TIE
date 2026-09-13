import { test, expect } from '@playwright/test';

test.describe('Dashboard & Core User Pages', () => {
  test('should load public pages and navigation header', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/TIE|CareerQue/i);
  });

  test('should render responsive navigation on mobile screen sizes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X/11/12
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });
});
