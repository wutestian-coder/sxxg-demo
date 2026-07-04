import { Locator, Page, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;

  readonly authModal: Locator;
  readonly guestLoginButton: Locator;
  readonly userAvatar: Locator;
  readonly userMenuButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.authModal = page.locator('[class*="AuthenticateComponent__Wrapper"]');
    this.guestLoginButton = page.getByRole('button', { name: '帳號註冊 / 登入' });
    this.userAvatar = page.locator('[class*="NavHeader"] [class*="MeAvatar__AvatarImage"]');
    this.userMenuButton = page.locator('[class*="NavHeader__UserButton"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async assertLoggedIn(): Promise<void> {
    await expect(this.userAvatar, '導覽列應出現登入後的使用者頭像').toBeVisible();
    await expect(this.userMenuButton, '導覽列應出現個人選單按鈕').toBeVisible();
    await expect(this.guestLoginButton, '未登入才有的「帳號註冊 / 登入」按鈕應已消失').toHaveCount(0);
  }

  async isLoggedIn(): Promise<boolean> {
    return (await this.userAvatar.count()) > 0 && (await this.userAvatar.first().isVisible().catch(() => false));
  }
}
