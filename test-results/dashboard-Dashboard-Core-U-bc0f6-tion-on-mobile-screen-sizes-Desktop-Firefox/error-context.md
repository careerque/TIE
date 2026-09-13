# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard & Core User Pages >> should render responsive navigation on mobile screen sizes
- Location: e2e\dashboard.spec.ts:9:7

# Error details

```
Error: page.goto: NS_ERROR_CONNECTION_REFUSED
Call log:
  - navigating to "http://localhost:3000/", waiting until "domcontentloaded"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Dashboard & Core User Pages', () => {
  4  |   test('should load public pages and navigation header', async ({ page }) => {
  5  |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  6  |     await expect(page).toHaveTitle(/TIE|CareerQue/i);
  7  |   });
  8  | 
  9  |   test('should render responsive navigation on mobile screen sizes', async ({ page }) => {
  10 |     await page.setViewportSize({ width: 375, height: 812 }); // iPhone X/11/12
> 11 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
     |                ^ Error: page.goto: NS_ERROR_CONNECTION_REFUSED
  12 |     await expect(page.locator('body')).toBeVisible();
  13 |   });
  14 | });
  15 | 
```