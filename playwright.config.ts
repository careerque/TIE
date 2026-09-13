import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration for TIE
 * Supports local execution & cloud integration (BrowserStack)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  timeout: 45 * 1000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Desktop Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Desktop Safari (WebKit)',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Desktop Edge',
      use: { ...devices['Desktop Edge'] },
    },
    {
      name: 'Mobile Chrome (Pixel 7)',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'Mobile Chrome (Galaxy S9+)',
      use: { ...devices['Galaxy S9+'] },
    },
    {
      name: 'Mobile Safari (iPhone 14)',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'Mobile Safari (iPhone 12)',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Tablet Safari (iPad Pro 11)',
      use: { ...devices['iPad Pro 11'] },
    },
    {
      name: 'Tablet Chrome (Nexus 10)',
      use: { ...devices['Nexus 10'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
