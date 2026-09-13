# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard & Core User Pages >> should load public pages and navigation header
- Location: e2e\dashboard.spec.ts:4:7

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
  3  | test.describe('Dashboard & Core User Pages', () => {
  4  |   test('should load public pages and navigation header', async ({ page }) => {
> 5  |     await page.goto('/', { waitUntil: 'domcontentloaded' });
     |                ^ Error: page.goto: NS_ERROR_CONNECTION_REFUSED
  6  |     await expect(page).toHaveTitle(/TIE|CareerQue/i);
  7  |   });
  8  | 
  9  |   test('should render responsive navigation on mobile screen sizes', async ({ page }) => {
  10 |     await page.setViewportSize({ width: 375, height: 812 }); // iPhone X/11/12
  11 |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  12 |     await expect(page.locator('body')).toBeVisible();
  13 |   });
  14 | });
  15 | 
```