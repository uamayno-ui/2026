import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL:       BASE_URL,
    trace:         'on-first-retry',
    screenshot:    'only-on-failure',
    // Ukrainian locale for Intl-dependent assertions
    locale:        'uk-UA',
    timezoneId:    'Europe/Kyiv',
  },

  projects: [
    // Desktop — Chromium
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'] },
    },
    // Mobile — iPhone 14
    {
      name: 'mobile-safari',
      use:  { ...devices['iPhone 14'] },
    },
  ],

  // Start the dev server automatically when running locally
  webServer: {
    command:             'npm run dev',
    url:                 BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout:             120_000,
  },
})
