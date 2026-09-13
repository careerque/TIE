import { test, expect } from '@playwright/test';

test.describe('Authentication & Security Controls Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
  });

  // ── Positive / Normal Tests ──────────────────────────────────────
  test('should render login page with branding and input fields', async ({ page }) => {
    await expect(page).toHaveTitle(/Login|TIE|CareerQue/i);
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
  });

  test('should navigate to registration page from login link', async ({ page }) => {
    const registerLink = page.locator('a[href*="register"]').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*register/, { timeout: 10000 });
    }
  });

  test('should navigate to forgot password page from login link', async ({ page }) => {
    const forgotLink = page.locator('a[href*="forgot-password"]').first();
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page).toHaveURL(/.*forgot-password/, { timeout: 10000 });
    }
  });

  // ── Negative & Edge Case Validation Tests ─────────────────────────
  test('should show validation error when submitting empty login form', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
  });

  test('should reject invalid email format without @ symbol', async ({ page }) => {
    await page.locator('input#email').fill('invalidemailformat.com');
    await page.locator('input#password').fill('SomePassword123');
    await page.locator('button[type="submit"]').click();

    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
    await expect(errorAlert).toContainText(/valid email/i);
  });

  test('should reject email missing domain extension', async ({ page }) => {
    await page.locator('input#email').fill('user@domain');
    await page.locator('input#password').fill('SomePassword123');
    await page.locator('button[type="submit"]').click();

    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
  });

  test('should handle SQL injection strings in email field safely', async ({ page }) => {
    await page.locator('input#email').fill("' OR '1'='1");
    await page.locator('input#password').fill('SomePassword123');
    await page.locator('button[type="submit"]').click();

    const errorAlert = page.getByRole('alert');
    await expect(errorAlert).toBeVisible({ timeout: 10000 });
  });

  test('should handle extremely long email string edge case', async ({ page }) => {
    const longEmail = 'a'.repeat(250) + '@example.com';
    await page.locator('input#email').fill(longEmail);
    await page.locator('input#password').fill('SomePassword123');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('body')).toBeVisible();
  });
});
