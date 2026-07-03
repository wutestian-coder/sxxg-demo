import { defineConfig } from '@playwright/test';
import { ENV } from './config/env';

export default defineConfig({
  testDir: './tests',
  timeout: ENV.CAPTCHA_TIMEOUT_MS + 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: ENV.BASE_URL,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'e2e-login',
      testMatch: ['**/login.spec.ts', '**/login.negative.spec.ts'],
    },
    {
      name: 'authenticated',
      testMatch: ['**/session-reuse.spec.ts'],
    },
  ],
});
