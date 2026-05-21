// ============================================================
//  Playwright Configuration
// ============================================================
//  📁 Save this file as:  playwright.config.ts  (project root)
//
//  This tells Playwright:
//    - Where your tests live
//    - Which browsers to test on
//    - How to generate reports
//    - Timeouts, retries, and other settings
// ============================================================

import { defineConfig, devices } from "@playwright/test";

import dotenv from 'dotenv';
import path from 'path';

// Initialize dotenv to read from the ".env" file
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  // ── Where are your test files? ──
  // Playwright scans this folder for files matching *.spec.ts
  testDir: "./tests",

  // ── Run tests inside each file in parallel? ──
  // false = tests in a single file run one after another (safer for beginners)
  // true  = tests in a file run simultaneously (faster but needs independent tests)
  fullyParallel: true,

  // ── Fail the build if you left test.only in the code ──
  // Prevents accidentally pushing focused tests to CI
  forbidOnly: !!process.env.CI,

  // ── Retries ──
  // On CI, retry failed tests 2 times to handle flakiness
  // Locally, no retries so you see failures immediately
  retries: process.env.CI ? 2 : 0,

  // ── Parallel workers ──
  // CI: use fewer workers to stay within resource limits
  // Local: undefined = Playwright picks the optimal count for your CPU
  workers: process.env.CI ? 2 : undefined,

  // ── Reporters ──
  // These generate your test output.
  reporter: [
    // Always show results in the terminal
    ["list"],

    // Generate a beautiful HTML report
    // Open it with:  npx playwright show-report
    [
      "html",
      {
        open: "never",            // don't auto-open in CI
        outputFolder: "playwright-report",
      },
    ],

    // JUnit XML — useful for CI dashboards and integrations
    [
      "junit",
      {
        outputFile: "test-results/junit-results.xml",
      },
    ],
  ],

  // ── Global settings for every test ──
  use: {
    // Base URL for your app — page.goto('/') will use this
    // baseURL: "http://localhost:3000",
    baseURL: process.env.BASE_URL,

    // Capture a screenshot when a test fails
    screenshot: "only-on-failure",

    // Record a video when a test fails (great for debugging)
    video: "retain-on-failure",

    // Record a trace on first retry — inspect step-by-step in Trace Viewer
    // Open traces with:  npx playwright show-trace trace.zip
    trace: "on-first-retry",

    // Default timeout for each action (click, fill, etc.)
    actionTimeout: 10_000,       // 10 seconds
  },

  // ── Browsers to test ──
  // Each "project" runs your entire test suite on a different browser.
  // Comment out any you don't need to speed up runs.
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },

    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
      },
    },

    // ── Mobile browsers (optional) ──
    // Uncomment to test on mobile viewports too:

    // {
    //   name: "mobile-chrome",
    //   use: {
    //     ...devices["Pixel 7"],
    //   },
    // },

    // {
    //   name: "mobile-safari",
    //   use: {
    //     ...devices["iPhone 14"],
    //   },
    // },
  ],

  // ── Local dev server (optional) ──
  // Playwright can start your server automatically before tests.
  // Uncomment this if you want Playwright to handle it instead
  // of starting the server manually.

  // webServer: {
  //   command: "npx serve . -l 3000",
  //   port: 3000,
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 10_000,
  // },
});
