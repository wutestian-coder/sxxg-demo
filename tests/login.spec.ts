import { test } from '../fixtures/realChromeTest';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { ENV, assertEnv } from '../config/env';
import { TestStatus, logResult } from '../utils/testStatus';

test.beforeAll(() => assertEnv());

test('TC-LOGIN-001 正確帳密應可成功登入', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const homePage = new HomePage(page);

  await loginPage.login(ENV.USERNAME, ENV.PASSWORD);

  try {
    await homePage.assertLoggedIn();
  } catch (err) {
    logResult(TestStatus.FAIL, `Login failed - 未偵測到登入成功狀態：${(err as Error).message}`);
    throw err;
  }

  logResult(TestStatus.PASS, 'Login successful');
});
