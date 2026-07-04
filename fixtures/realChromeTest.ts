import { test as base, chromium, BrowserContext, Page } from '@playwright/test';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export const test = base.extend<{ context: BrowserContext; page: Page }>({
  context: async ({}, use) => {
    const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'swag-e2e-'));
    const context = await chromium.launchPersistentContext(profileDir, {
      channel: 'chrome',
      headless: false,
      viewport: { width: 1280, height: 800 },
      locale: 'zh-TW',
      args: ['--disable-blink-features=AutomationControlled'],
    });
    await use(context);
    await context.close();
    fs.rmSync(profileDir, { recursive: true, force: true });
  },

  page: async ({ context }, use) => {
    const page = context.pages()[0] ?? (await context.newPage());
    await use(page);
  },
});

export { expect } from '@playwright/test';
