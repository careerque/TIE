# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> Security, Edge Cases & Route Protection Suite >> should block unauthenticated access to /reports/123 and redirect to /login
- Location: e2e\security.spec.ts:35:7

# Error details

```
Error: page.goto: NS_ERROR_CONNECTION_REFUSED
Call log:
  - navigating to "http://localhost:3000/reports/123", waiting until "domcontentloaded"

```

# Page snapshot

```yaml
- article [ref=e3]:
  - generic [ref=e6]:
    - heading "Unable to connect" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - text: Nightly can’t connect to the server at
      - strong [ref=e9]: localhost:3000
    - generic [ref=e10]:
      - heading "What can you do about it?" [level=3] [ref=e11]
      - list [ref=e12]:
        - listitem [ref=e13]: The site could be temporarily unavailable or too busy. Try again in a few moments.
        - listitem [ref=e14]: If you are unable to load any pages, check your computer’s network connection.
        - listitem [ref=e15]: If your computer or network is protected by a firewall or proxy, make sure that Nightly is permitted to access the web.
    - button "Try Again" [ref=e18]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Security, Edge Cases & Route Protection Suite', () => {
  4  |   // ── 1. Unauthenticated Route Protection ──────────────────────────
  5  |   test('should block unauthenticated access to /assessment and redirect to /login', async ({ page }) => {
  6  |     await page.goto('/assessment', { waitUntil: 'domcontentloaded' });
  7  |     await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  8  |   });
  9  | 
  10 |   test('should block unauthenticated access to /dashboard and redirect to /login', async ({ page }) => {
  11 |     await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  12 |     await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  13 |   });
  14 | 
  15 |   test('should block unauthenticated access to /profile and redirect to /login', async ({ page }) => {
  16 |     await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  17 |     await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  18 |   });
  19 | 
  20 |   test('should block unauthenticated access to /hr-admin and redirect to /login', async ({ page }) => {
  21 |     await page.goto('/hr-admin', { waitUntil: 'domcontentloaded' });
  22 |     await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  23 |   });
  24 | 
  25 |   test('should block unauthenticated access to /manager and redirect to /login', async ({ page }) => {
  26 |     await page.goto('/manager', { waitUntil: 'domcontentloaded' });
  27 |     await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  28 |   });
  29 | 
  30 |   test('should block unauthenticated access to /action-plans/123 and redirect to /login', async ({ page }) => {
  31 |     await page.goto('/action-plans/123', { waitUntil: 'domcontentloaded' });
  32 |     await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  33 |   });
  34 | 
  35 |   test('should block unauthenticated access to /reports/123 and redirect to /login', async ({ page }) => {
> 36 |     await page.goto('/reports/123', { waitUntil: 'domcontentloaded' });
     |                ^ Error: page.goto: NS_ERROR_CONNECTION_REFUSED
  37 |     await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  38 |   });
  39 | 
  40 |   // ── 2. Malformed & Edge-Case URL Security ──────────────────────────
  41 |   test('should safely handle 404 for non-existent page routes', async ({ page }) => {
  42 |     const response = await page.goto('/non-existent-random-route-999');
  43 |     await expect(page.locator('body')).toBeVisible();
  44 |   });
  45 | 
  46 |   test('should safely handle malformed tenant slug routes without crashing', async ({ page }) => {
  47 |     await page.goto('/<script>alert(1)</script>/<invalid>/user', { waitUntil: 'domcontentloaded' });
  48 |     await expect(page.locator('body')).toBeVisible();
  49 |   });
  50 | 
  51 |   test('should safely handle SQL injection string in query params', async ({ page }) => {
  52 |     await page.goto('/login?redirect=1\' OR \'1\'=\'1', { waitUntil: 'domcontentloaded' });
  53 |     await expect(page).toHaveTitle(/Login|TIE|CareerQue/i);
  54 |   });
  55 | });
  56 | 
```