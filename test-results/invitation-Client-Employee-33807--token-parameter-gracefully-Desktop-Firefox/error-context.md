# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: invitation.spec.ts >> Client & Employee Invitation Verification System >> should handle empty token parameter gracefully
- Location: e2e\invitation.spec.ts:19:7

# Error details

```
Error: page.goto: NS_ERROR_CONNECTION_REFUSED
Call log:
  - navigating to "http://localhost:3000/accept-invite?token=", waiting until "domcontentloaded"

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
  3  | test.describe('Client & Employee Invitation Verification System', () => {
  4  |   test('should render accept invite page structure when accessed without parameters', async ({ page }) => {
  5  |     await page.goto('/accept-invite', { waitUntil: 'domcontentloaded' });
  6  |     await expect(page.locator('body')).toBeVisible();
  7  |   });
  8  | 
  9  |   test('should safely render error or alert for malformed token parameter', async ({ page }) => {
  10 |     await page.goto('/accept-invite?token=malformed-123-%20-injection', { waitUntil: 'domcontentloaded' });
  11 |     await expect(page.locator('body')).toBeVisible();
  12 |   });
  13 | 
  14 |   test('should safely handle expired invitation token', async ({ page }) => {
  15 |     await page.goto('/accept-invite?token=expired-token-uuid-0000', { waitUntil: 'domcontentloaded' });
  16 |     await expect(page.locator('body')).toBeVisible();
  17 |   });
  18 | 
  19 |   test('should handle empty token parameter gracefully', async ({ page }) => {
> 20 |     await page.goto('/accept-invite?token=', { waitUntil: 'domcontentloaded' });
     |                ^ Error: page.goto: NS_ERROR_CONNECTION_REFUSED
  21 |     await expect(page.locator('body')).toBeVisible();
  22 |   });
  23 | });
  24 | 
```