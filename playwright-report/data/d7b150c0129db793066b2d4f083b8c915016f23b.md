# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> Homepage & Core UI Navigation >> should render navigation bar links properly
- Location: e2e\home.spec.ts:18:7

# Error details

```
Error: page.goto: Could not connect to server
Call log:
  - navigating to "http://localhost:3000/", waiting until "domcontentloaded"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Homepage & Core UI Navigation', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Using domcontentloaded prevents waiting on background HMR sockets/dev server polling
> 6  |     await page.goto('/', { waitUntil: 'domcontentloaded' });
     |                ^ Error: page.goto: Could not connect to server
  7  |   });
  8  | 
  9  |   test('should load homepage cleanly with main branding', async ({ page }) => {
  10 |     // Check page title
  11 |     await expect(page).toHaveTitle(/TIE|CareerQue/i);
  12 | 
  13 |     // Verify main content is visible
  14 |     const mainHeading = page.locator('h1');
  15 |     await expect(mainHeading).toBeVisible({ timeout: 10000 });
  16 |   });
  17 | 
  18 |   test('should render navigation bar links properly', async ({ page }) => {
  19 |     // Check for interactive links / buttons on homepage
  20 |     const interactiveButtons = page.locator('a, button');
  21 |     const count = await interactiveButtons.count();
  22 |     expect(count).toBeGreaterThan(0);
  23 |   });
  24 | 
  25 |   test('should be responsive on mobile viewport', async ({ page }) => {
  26 |     await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
  27 |     await expect(page.locator('body')).toBeVisible();
  28 |   });
  29 | });
  30 | 
```