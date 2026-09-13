# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication & Security Controls Suite >> should navigate to forgot password page from login link
- Location: e2e\auth.spec.ts:23:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*forgot-password/
Received string:  ""
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    - waiting for navigation to finish...

```

```
Tearing down "context" exceeded the test timeout of 45000ms.
```