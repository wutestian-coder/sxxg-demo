const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { chromium } = require('@playwright/test');

const USER = process.env.SWAG_USERNAME;
const PASS = process.env.SWAG_PASSWORD;
const BASE_URL = process.env.BASE_URL || 'https://swag.live/?lang=zh-TW';
const CAPTCHA_TIMEOUT = Number(process.env.CAPTCHA_TIMEOUT_MS || 180000);

const PROFILE_DIR = path.resolve(__dirname, '..', 'playwright', '.chrome-profile');

(async () => {
  if (!USER || !PASS) {
    console.error('缺少 SWAG_USERNAME / SWAG_PASSWORD，請先設定 .env');
    process.exit(1);
  }
  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: 'chrome',
    headless: false,
    viewport: null,
    locale: 'zh-TW',
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || (await context.newPage());
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.getByRole('button', { name: '帳號註冊 / 登入' }).click();
  await page.getByRole('button', { name: '帳號密碼登入' }).click();
  await page.locator('#username-form').fill(USER);
  await page.locator('#password-form').fill(PASS);
  await page.locator('button[type="submit"]').click();

  const captcha = page.getByText('請拖動滑塊完成拼圖');
  const appeared = await captcha.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);
  console.log('==============================================');
  console.log(appeared
    ? '>>> 滑塊已出現，請在 Chrome 視窗中手動拖曳完成拼圖'
    : '>>> 未偵測到滑塊（可能直接放行）');
  console.log(`>>> 完成後腳本會自動接手（最多等待 ${Math.round(CAPTCHA_TIMEOUT / 1000)} 秒）`);
  console.log('==============================================');

  const modal = page.locator('[class*="AuthenticateComponent__Wrapper"]');
  const ok = await modal.waitFor({ state: 'hidden', timeout: CAPTCHA_TIMEOUT }).then(() => true).catch(() => false);

  if (!ok) {
    console.error('FAIL - 逾時：登入 Modal 未關閉（滑塊未完成或登入失敗）');
    await context.close();
    process.exit(2);
  }

  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

  const avatar = page.locator('[class*="NavHeader"] [class*="MeAvatar__AvatarImage"]');
  const loggedIn = await avatar.first().isVisible().catch(() => false);
  if (!loggedIn) {
    console.error('FAIL - 登入後未偵測到使用者頭像，判定登入未成功');
    await context.close();
    process.exit(3);
  }

  console.log('PASS - Login successful');
  console.log(`登入狀態已保存於持久化設定檔：${PROFILE_DIR}`);
  console.log(`（測試將以此設定檔重用登入，最終 URL = ${page.url()}）`);
  await context.close();
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
