import { test } from '../fixtures/authenticatedTest';
import { HomePage } from '../pages/HomePage';
import { ENV } from '../config/env';
import { TestStatus, logResult } from '../utils/testStatus';

test('TC-LOGIN-003 重用登入設定檔應維持登入狀態', async ({ page }) => {
  const homePage = new HomePage(page);

  await page.goto(ENV.BASE_URL, { waitUntil: 'domcontentloaded' });

  try {
    await homePage.assertLoggedIn();
  } catch (err) {
    logResult(TestStatus.FAIL, `Login failed - 重用設定檔未維持登入：${(err as Error).message}`);
    throw err;
  }

  logResult(TestStatus.PASS, 'Login successful (via reused profile)');
});
