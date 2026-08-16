import { test, expect } from '@playwright/test';

test.describe('Homepage & Core UI Navigation', () => {
  test('should load homepage cleanly with main branding', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/TIE|CareerQue/i);

    // Verify main content is visible
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
  });

  test('should render navigation bar links properly', async ({ page }) => {
    await page.goto('/');
    
    // Check for interactive links / buttons on homepage
    const interactiveButtons = page.locator('a, button');
    const count = await interactiveButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
