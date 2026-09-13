# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: security.spec.ts >> Security, Edge Cases & Route Protection Suite >> should block unauthenticated access to /manager and redirect to /login
- Location: e2e\security.spec.ts:25:7

# Error details

```
Error: page.goto: NS_ERROR_CONNECTION_REFUSED
Call log:
  - navigating to "http://localhost:3000/manager", waiting until "domcontentloaded"

```

```
Tearing down "context" exceeded the test timeout of 45000ms.
```