import { test, expect } from '../fixtures/realChromeTest';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { ENV, assertEnv } from '../config/env';
import { TestStatus, logResult } from '../utils/testStatus';

const WRONG_PASSWORD = `${ENV.PASSWORD}_wrong_x`;

test.beforeAll(() => assertEnv());

test('TC-LOGIN-002 錯誤密碼應無法登入', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const homePage = new HomePage(page);

  await loginPage.openPasswordLoginForm();
  await loginPage.submitCredentials(ENV.USERNAME, WRONG_PASSWORD);
  await loginPage.handleCaptchaManually();

  if (await homePage.isLoggedIn()) {
    logResult(TestStatus.FAIL, 'Negative login - 錯誤密碼竟然登入成功，屬安全缺陷');
    throw new Error('錯誤密碼不應能登入');
  }

  await expect(loginPage.authModal, '錯誤密碼登入後，登入 Modal 應仍顯示').toBeVisible();
  logResult(TestStatus.PASS, 'Negative login correctly rejected - 錯誤密碼已被拒絕');
});
