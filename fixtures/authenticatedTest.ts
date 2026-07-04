import { test as base, chromium, BrowserContext, Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const PROFILE_DIR = path.resolve(__dirname, '..', 'playwright', '.chrome-profile');

export const test = base.extend<{ context: BrowserContext; page: Page }>({
  context: async ({}, use) => {
    if (!fs.existsSync(PROFILE_DIR)) {
      throw new Error(
        `找不到已登入的 Chrome 設定檔（${PROFILE_DIR}）。\n` +
        `請先執行： npm run login （人工完成一次登入以建立可重用的 session）。`,
      );
    }
    const context = await chromium.launchPersistentContext(PROFILE_DIR, {
      headless: true,
      viewport: { width: 1280, height: 800 },
      locale: 'zh-TW',
      args: ['--disable-blink-features=AutomationControlled'],
    });
    await use(context);
    await context.close();
  },

  page: async ({ context }, use) => {
    const page = context.pages()[0] ?? (await context.newPage());
    await use(page);
  },
});

export { expect } from '@playwright/test';
