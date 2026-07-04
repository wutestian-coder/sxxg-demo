import { Locator, Page, test } from '@playwright/test';
import { ENV } from '../config/env';

export class LoginPage {
  readonly page: Page;

  readonly landingLoginButton: Locator;
  readonly passwordModeToggle: Locator;
  readonly passwordFormTitle: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly authModal: Locator;
  readonly captchaBox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.landingLoginButton = page.getByRole('button', { name: '帳號註冊 / 登入' });
    this.passwordModeToggle = page.getByRole('button', { name: '帳號密碼登入' });
    this.passwordFormTitle = page.getByRole('heading', { name: '帳號密碼登入' });
    this.usernameInput = page.locator('#username-form');
    this.passwordInput = page.locator('#password-form');
    this.submitButton = page.locator('button[type="submit"]', { hasText: '登入' });
    this.authModal = page.locator('[class*="AuthenticateComponent__Wrapper"]');
    this.captchaBox = page.locator('div[class*="geetest_box_wrap"]').first();
  }

  async openPasswordLoginForm(): Promise<void> {
    await this.page.goto(ENV.BASE_URL);
    await this.landingLoginButton.click();
    await this.passwordModeToggle.click();
    await this.passwordFormTitle.first().waitFor({ state: 'visible' });
  }

  async submitCredentials(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async handleCaptchaManually(): Promise<void> {
    const appeared = await test.step('偵測是否觸發機器人驗證', () =>
      this.waitForCaptchaVisible(10_000),
    );

    if (!appeared) {
      console.log('[INFO] 本次未觸發機器人驗證，繼續流程');
      return;
    }

    console.log('[ACTION REQUIRED] 偵測到 Geetest 滑塊驗證，請在瀏覽器中手動完成拼圖…');
    await this.captchaBox.waitFor({ state: 'hidden', timeout: ENV.CAPTCHA_TIMEOUT_MS });
    console.log('[INFO] 機器人驗證已完成，繼續流程');
  }

  private async waitForCaptchaVisible(timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await this.captchaBox.isVisible()) return true;
      await this.page.waitForTimeout(500);
    }
    return false;
  }

  async login(username: string, password: string): Promise<void> {
    await this.openPasswordLoginForm();
    await this.submitCredentials(username, password);
    await this.handleCaptchaManually();
  }
}
