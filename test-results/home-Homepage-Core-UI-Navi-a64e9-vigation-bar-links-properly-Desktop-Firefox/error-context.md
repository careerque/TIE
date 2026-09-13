# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> Homepage & Core UI Navigation >> should render navigation bar links properly
- Location: e2e\home.spec.ts:18:7

# Error details

```
Error: page.goto: NS_ERROR_CONNECTION_REFUSED
Call log:
  - navigating to "http://localhost:3000/", waiting until "domcontentloaded"

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
  3  | test.describe('Homepage & Core UI Navigation', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Using domcontentloaded prevents waiting on background HMR sockets/dev server polling
> 6  |     await page.goto('/', { waitUntil: 'domcontentloaded' });
     |                ^ Error: page.goto: NS_ERROR_CONNECTION_REFUSED
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