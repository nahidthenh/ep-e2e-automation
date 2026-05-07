import { defineConfig, devices, ReporterDescription } from '@playwright/test';
import 'dotenv/config';

// Enable the Slack reporter only when both vars are set, so local runs without
// Slack creds (or partially-configured CI runs) don't crash on missing config.
const slackEnabled = !!process.env.SLACK_BOT_TOKEN && !!process.env.SLACK_CHANNEL_ID;

const reporter: ReporterDescription[] = [
  ['line'],
  ['html', { outputFolder: 'playwright-report', open: 'never' }],
];

if (slackEnabled) {
  reporter.push([
    './node_modules/playwright-slack-report/dist/src/SlackReporter.js',
    {
      slackOAuthToken: process.env.SLACK_BOT_TOKEN,
      channels:        [process.env.SLACK_CHANNEL_ID!],
      sendResults:     process.env.SLACK_SEND_RESULTS ?? 'always', // 'always' | 'on-failure' | 'off'
      maxNumberOfFailuresToShow: 10,
      meta: [
        { key: 'Run',    value: process.env.CI ? 'GitHub Actions' : 'Local' },
        { key: 'Branch', value: process.env.GITHUB_REF_NAME ?? 'local' },
      ],
    },
  ]);
}

export default defineConfig({
  globalSetup: './global-setup.ts',
  testDir: './tests',
  fullyParallel: false,          // WP state is shared — run serially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  timeout: 90_000,               // generous for slow Elementor UI

  reporter,

  use: {
    baseURL:       process.env.WP_URL ?? 'http://localhost:8080',
    storageState:  '.auth/state.json',   // reuse session from globalSetup
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
    trace:         'retain-on-failure',
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
