import { test, expect } from '@playwright/test';

test.describe('Security, Edge Cases & Route Protection Suite', () => {
  // ── 1. Unauthenticated Route Protection ──────────────────────────
  test('should block unauthenticated access to /assessment and redirect to /login', async ({ page }) => {
    await page.goto('/assessment', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should block unauthenticated access to /dashboard and redirect to /login', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should block unauthenticated access to /profile and redirect to /login', async ({ page }) => {
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should block unauthenticated access to /hr-admin and redirect to /login', async ({ page }) => {
    await page.goto('/hr-admin', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should block unauthenticated access to /manager and redirect to /login', async ({ page }) => {
    await page.goto('/manager', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should block unauthenticated access to /action-plans/123 and redirect to /login', async ({ page }) => {
    await page.goto('/action-plans/123', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should block unauthenticated access to /reports/123 and redirect to /login', async ({ page }) => {
    await page.goto('/reports/123', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  // ── 2. Malformed & Edge-Case URL Security ──────────────────────────
  test('should safely handle 404 for non-existent page routes', async ({ page }) => {
    const response = await page.goto('/non-existent-random-route-999');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should safely handle malformed tenant slug routes without crashing', async ({ page }) => {
    await page.goto('/<script>alert(1)</script>/<invalid>/user', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should safely handle SQL injection string in query params', async ({ page }) => {
    await page.goto('/login?redirect=1\' OR \'1\'=\'1', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Login|TIE|CareerQue/i);
  });
});
