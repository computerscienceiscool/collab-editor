import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Changed to false to prevent resource conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Added retries for flaky tests
  workers: process.env.CI ? 1 : 2, // Reduced workers to prevent timeouts
  reporter: 'html',
  timeout: 20000, // Reduced from 30000
  expect: {
    timeout: 8000 // Reduced from default
  },
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000, // Added action timeout
    navigationTimeout: 15000 // Added navigation timeout
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      timeout: 25000 // Firefox needs slightly more time
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      timeout: 25000 // WebKit needs slightly more time
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      timeout: 25000 // Mobile needs more time
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 30000 // Reduced server startup timeout
  },
});
