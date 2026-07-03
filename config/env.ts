import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

export const ENV = {
  BASE_URL: process.env.BASE_URL ?? 'https://swag.live/?lang=zh-TW',
  USERNAME: process.env.SWAG_USERNAME ?? '',
  PASSWORD: process.env.SWAG_PASSWORD ?? '',
  CAPTCHA_TIMEOUT_MS: Number(process.env.CAPTCHA_TIMEOUT_MS ?? 120_000),
};

export function assertEnv(): void {
  const missing: string[] = [];
  if (!ENV.USERNAME) missing.push('SWAG_USERNAME');
  if (!ENV.PASSWORD) missing.push('SWAG_PASSWORD');
  if (missing.length > 0) {
    throw new Error(
      `缺少必要環境變數：${missing.join(', ')}。請複製 .env.example 為 .env 並填入 HR 提供的測試帳密。`,
    );
  }
}
