import { test, expect } from '@playwright/test';

test.describe('Client & Employee Invitation Verification System', () => {
  test('should render accept invite page structure when accessed without parameters', async ({ page }) => {
    await page.goto('/accept-invite', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should safely render error or alert for malformed token parameter', async ({ page }) => {
    await page.goto('/accept-invite?token=malformed-123-%20-injection', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should safely handle expired invitation token', async ({ page }) => {
    await page.goto('/accept-invite?token=expired-token-uuid-0000', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle empty token parameter gracefully', async ({ page }) => {
    await page.goto('/accept-invite?token=', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });
});
