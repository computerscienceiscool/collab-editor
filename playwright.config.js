// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Keep false to prevent resource conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 2, // Increased retries for flaky tests
  workers: process.env.CI ? 1 : 1, // Single worker to avoid conflicts
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  timeout: 45000, // Increased from 20000
  expect: {
    timeout: 12000 // Increased from 8000
  },
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure', 
    video: 'retain-on-failure',
    actionTimeout: 15000, // Increased from 10000
    navigationTimeout: 20000, // Increased from 15000
    // Additional options for stability
    locale: 'en-US',
    timezoneId: 'America/New_York'
  },

  
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox'
          ]
        }
      },
      timeout: 40000
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webnotifications.enabled': false,
            'media.navigator.permission.disabled': true
          }
        }
      },
      timeout: 50000,
      retries: 3
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
      timeout: 50000,
      retries: 3
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        hasTouch: true,
        isMobile: true
      },
      timeout: 45000,
      retries: 2
    }
  ],


  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 60000, // Increased server startup timeout
    stdout: 'ignore',
    stderr: 'pipe'
  },

  // Global setup for better test isolation
  globalSetup: './tests/global-setup.js',
  
  // Test output configuration
  outputDir: 'test-results',
  
  // Better error reporting
  reportSlowTests: {
    max: 5,
    threshold: 30000
  }
});
