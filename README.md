# SWAG 登入自動化測試

swag.live 登入功能的 E2E 測試，用 Playwright + TypeScript，POM 分層。

登入會跳 Geetest v4 滑塊，這本來就是設計來擋機器人的。我沒有去破解它，改成半自動：帳密輸入、送出、登入結果判定都自動化，滑塊留給人工拖，而且只拖一次——解完就把登入狀態存下來重用。詳細理由寫在下面的設計取捨。

## 技術選型

- 語言：TypeScript
- 框架：[Playwright Test](https://playwright.dev/)
- 架構：Page Object Model
- 帳密：dotenv（`.env`，不進版控）

## 目錄結構

```
config/
  env.ts                 環境變數 + 必填檢查
fixtures/
  realChromeTest.ts      登入測試：系統 Chrome + 全新設定檔（半自動）
  authenticatedTest.ts   重用測試：持久化設定檔（已登入，全自動）
pages/
  LoginPage.ts           登入 Modal 操作
  HomePage.ts            登入後狀態判定
tests/
  login.spec.ts          TC-LOGIN-001 正向
  login.negative.spec.ts TC-LOGIN-002 反向（錯誤密碼）
  session-reuse.spec.ts  TC-LOGIN-003 重用設定檔
scripts/
  capture-session.js     人工登入一次，建立可重用設定檔
utils/
  testStatus.ts          PASS/FAIL/BLOCK 狀態與輸出
```

## 安裝

需要 Node.js 18+ 和 Google Chrome（用系統 Chrome 跑，比較不會被風控擋）。

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

然後編輯 `.env`，把 HR 給的測試帳密填進去：

```
BASE_URL=https://swag.live/?lang=zh-TW
SWAG_USERNAME=帳號
SWAG_PASSWORD=密碼
CAPTCHA_TIMEOUT_MS=120000
```

`CAPTCHA_TIMEOUT_MS` 是等人工拖滑塊的上限（毫秒）。

## 跑測試

### 端對端登入（半自動，要人工過一次滑塊）

用有頭的 Chrome 跑，跳滑塊時自己拖完。

```bash
npm run test:login      # 正向：正確帳密
npm run test:negative   # 反向：錯誤密碼
```

結果會印在終端機：`PASS - Login successful` 或 `FAIL - ...`。

### 建立可重用登入 + 全自動回歸

```bash
npm run login   # 人工登入一次，跳滑塊就手動拖
npm test        # 之後用已登入設定檔全自動跑，不用再登入
```

`npm run login` 把登入狀態存進持久化 Chrome 設定檔（`playwright/.chrome-profile`），`npm test` 直接載入它驗證。報告用 `npm run report` 看。

## 登入怎麼判定

`HomePage.assertLoggedIn()` 看的是「登入後才會有的東西」，比等某個元素消失可靠，三條任一不過就 FAIL：

1. 導覽列有使用者頭像（`MeAvatar__AvatarImage`）
2. 導覽列有個人選單按鈕（`NavHeader__UserButton`）
3. 未登入才有的「帳號註冊 / 登入」按鈕消失

反向測試（TC-LOGIN-002）反過來：送錯誤密碼、過完驗證後，斷言沒有頭像、Modal 還在。錯誤密碼要是登得進去，那是安全問題，直接 FAIL。

## 設計取捨

**滑塊用半自動，不寫程式破解。** Geetest 後端會分析拖曳軌跡、時間、裝置指紋來判斷是不是機器人。偽造軌跡去解，成功率不穩會 flaky，本質上也是在繞網站風控。所以人工過一次、之後重用登入狀態，把人工成本壓到只發生一次。

**用系統 Chrome 而不是內建 Chromium。** 試過內建 Chromium 會露出 `navigator.webdriver` 之類的自動化特徵，Geetest 直接封（Error 60500），連人工都拖不動。換成系統 Chrome（`channel: 'chrome'`）加上關掉 `AutomationControlled`，才會被當成一般使用者。這只是降低被誤判的機率，滑塊還是真人拖的。

**重用登入靠持久化設定檔，不用 storageState。** SWAG 的登入 token 放在 IndexedDB，不是 cookie / localStorage，而 Playwright 的 `storageState` 不含 IndexedDB，拿它重用沒用。持久化設定檔會把 IndexedDB 一起存到磁碟，才能跨次重用。

**定位器封在 `pages/`，帳密走 `.env`。** 測試檔只呼叫頁面方法，不寫死選擇器和帳密。

**等待全用動態等待。** 靠 `toBeVisible` / `toBeHidden` 這類，沒有寫死 sleep。過驗證是等 Modal 消失，不是等固定秒數。

**狀態判定集中在 `utils/testStatus.ts`。** PASS/FAIL/BLOCK 和輸出格式放一起，之後要接報告工具可以共用。

失敗會自動留截圖、錄影、trace（`screenshot`/`video`/`trace` 都設 on-failure）。

## CI 怎麼跑登入測試

重點：CI 沒辦法穩定地自動破解滑塊，也不該去破解。正確做法是讓 CI 根本碰不到滑塊。

### 路線 A：Session 重用（本專案已實作）

滑塊只在「登入」出現，登入成功後靠的是瀏覽器裡的 auth token（IndexedDB），之後開頁面不會再驗。所以 CI 只要延續一個已登入的 session 就好。

1. 本機 `npm run login` 解一次滑塊，產生 `playwright/.chrome-profile`
2. 打包成 base64 存成 repo secret `SWAG_CHROME_PROFILE_B64`
3. CI 還原設定檔後跑 `npm test`，全自動、無頭、零滑塊

限制：token 會過期（過期 / 被登出 / 改密碼後 `npm test` 會正確地紅燈），這時要有人在本機重跑一次 `npm run login` 刷新設定檔和 secret。它驗的是「登入後的狀態」，不是整條登入交易。

### 路線 B：測試環境放行驗證

E2E 碰到第三方 CAPTCHA 的標準解法，是網站團隊在測試環境把驗證關掉或放行：測試用 `captcha_id`、CI IP 白名單、或一支免驗證發 token 的測試 API。有其中一項，連完整登入 E2E（TC-LOGIN-001）都能在 CI 無人跑。

GitHub Actions 範例見 [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml)，走路線 A。準備 secret：

```bash
tar -czf chrome-profile.tar.gz -C playwright .chrome-profile
base64 -w0 chrome-profile.tar.gz > profile.b64
# profile.b64 內容存成 secret SWAG_CHROME_PROFILE_B64
# 另外存 SWAG_USERNAME / SWAG_PASSWORD
```

## 已知限制

- 端對端登入（TC-LOGIN-001/002）要在有頭環境跑，滑塊得人工拖（低風險 session 偶爾會被無感放行，但不保證）。
- 要完全無人值守走路線 A；連完整登入都自動要靠路線 B。
