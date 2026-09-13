# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication & Security Controls Suite >> should reject email missing domain extension
- Location: e2e\auth.spec.ts:50:7

# Error details

```
Error: page.goto: NS_ERROR_CONNECTION_REFUSED
Call log:
  - navigating to "http://localhost:3000/login", waiting until "domcontentloaded"

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
  3  | test.describe('Authentication & Security Controls Suite', () => {
  4  |   test.beforeEach(async ({ page }) => {
> 5  |     await page.goto('/login', { waitUntil: 'domcontentloaded' });
     |                ^ Error: page.goto: NS_ERROR_CONNECTION_REFUSED
  6  |   });
  7  | 
  8  |   // ── Positive / Normal Tests ──────────────────────────────────────
  9  |   test('should render login page with branding and input fields', async ({ page }) => {
  10 |     await expect(page).toHaveTitle(/Login|TIE|CareerQue/i);
  11 |     await expect(page.locator('input#email')).toBeVisible();
  12 |     await expect(page.locator('input#password')).toBeVisible();
  13 |   });
  14 | 
  15 |   test('should navigate to registration page from login link', async ({ page }) => {
  16 |     const registerLink = page.locator('a[href*="register"]').first();
  17 |     if (await registerLink.isVisible()) {
  18 |       await registerLink.click();
  19 |       await expect(page).toHaveURL(/.*register/, { timeout: 10000 });
  20 |     }
  21 |   });
  22 | 
  23 |   test('should navigate to forgot password page from login link', async ({ page }) => {
  24 |     const forgotLink = page.locator('a[href*="forgot-password"]').first();
  25 |     if (await forgotLink.isVisible()) {
  26 |       await forgotLink.click();
  27 |       await expect(page).toHaveURL(/.*forgot-password/, { timeout: 10000 });
  28 |     }
  29 |   });
  30 | 
  31 |   // ── Negative & Edge Case Validation Tests ─────────────────────────
  32 |   test('should show validation error when submitting empty login form', async ({ page }) => {
  33 |     const submitBtn = page.locator('button[type="submit"]');
  34 |     await submitBtn.click();
  35 | 
  36 |     const errorAlert = page.getByRole('alert');
  37 |     await expect(errorAlert).toBeVisible({ timeout: 10000 });
  38 |   });
  39 | 
  40 |   test('should reject invalid email format without @ symbol', async ({ page }) => {
  41 |     await page.locator('input#email').fill('invalidemailformat.com');
  42 |     await page.locator('input#password').fill('SomePassword123');
  43 |     await page.locator('button[type="submit"]').click();
  44 | 
  45 |     const errorAlert = page.getByRole('alert');
  46 |     await expect(errorAlert).toBeVisible({ timeout: 10000 });
  47 |     await expect(errorAlert).toContainText(/valid email/i);
  48 |   });
  49 | 
  50 |   test('should reject email missing domain extension', async ({ page }) => {
  51 |     await page.locator('input#email').fill('user@domain');
  52 |     await page.locator('input#password').fill('SomePassword123');
  53 |     await page.locator('button[type="submit"]').click();
  54 | 
  55 |     const errorAlert = page.getByRole('alert');
  56 |     await expect(errorAlert).toBeVisible({ timeout: 10000 });
  57 |   });
  58 | 
  59 |   test('should handle SQL injection strings in email field safely', async ({ page }) => {
  60 |     await page.locator('input#email').fill("' OR '1'='1");
  61 |     await page.locator('input#password').fill('SomePassword123');
  62 |     await page.locator('button[type="submit"]').click();
  63 | 
  64 |     const errorAlert = page.getByRole('alert');
  65 |     await expect(errorAlert).toBeVisible({ timeout: 10000 });
  66 |   });
  67 | 
  68 |   test('should handle extremely long email string edge case', async ({ page }) => {
  69 |     const longEmail = 'a'.repeat(250) + '@example.com';
  70 |     await page.locator('input#email').fill(longEmail);
  71 |     await page.locator('input#password').fill('SomePassword123');
  72 |     await page.locator('button[type="submit"]').click();
  73 | 
  74 |     await expect(page.locator('body')).toBeVisible();
  75 |   });
  76 | });
  77 | 
```