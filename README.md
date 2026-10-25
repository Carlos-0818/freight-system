# 貨運管理系統

依《Freight_Phase_1_Scope_and_Implementation_Roadmap_v1.1》
逐步開發 Phase 1 貨運系統。

目前階段：Step 3 紙本單號收貨與逐件建檔。

已建立登入、JWT 驗證、角色授權、站所查詢，
以及 React 收貨表單與收貨建單 API。

收貨時可手動輸入紙本單號、件數、最終配送站所，
逐件標記需點交貨件，並記錄司機指定價格及現場實收。

目前尚未導入條碼掃描、標籤列印與貨件追蹤事件。

## 技術架構

- 前端：React + Vite
- 後端：Node.js + Express
- 資料庫：PostgreSQL + Prisma
- 專案管理：npm workspaces
- 手寫程式：JavaScript ES modules
- API 執行工具：tsx，用於載入 Prisma 產生的 TypeScript Client
- 輸入驗證：Zod
- 登入憑證：JWT（jsonwebtoken）
- 密碼雜湊：bcryptjs
- React Router 與 Tailwind CSS 尚未導入

React 呼叫 Express API，由 Express 經 Prisma 存取 PostgreSQL。
資料庫連線設定只放在後端。

## 專案位置

| 路徑                          | 用途                |
| ----------------------------- | ------------------- |
| apps/web                      | React 前端          |
| apps/api                      | Express 後端        |
| apps/api/prisma/schema.prisma | Prisma schema       |
| apps/api/prisma.config.js     | Prisma CLI 設定     |
| apps/api/src/lib/prisma.js    | 共用 Prisma 實例    |
| compose.yaml                  | PostgreSQL 開發環境 |
| package-lock.json             | 全專案套件 lockfile |

## 環境版本

| 工具            | 版本                    |
| --------------- | ----------------------- |
| Node.js         | 24.19.0                 |
| npm             | 11.17.0                 |
| Git             | 2.50.1.windows.1        |
| Docker          | 29.8.1                  |
| Docker Compose  | 5.5.1                   |
| PostgreSQL 映像 | postgres:17.11-bookworm |

## 套件版本

| 套件                 | 實際安裝版本 |
| -------------------- | ------------ |
| react                | 19.3.0       |
| react-dom            | 19.3.0       |
| vite                 | 8.3.2        |
| @vitejs/plugin-react | 6.1.1        |
| express              | 5.2.1        |
| prisma               | 7.10.0       |
| @prisma/client       | 7.10.0       |
| @prisma/adapter-pg   | 7.10.0       |
| pg                   | 8.23.1       |
| dotenv               | 18.0.5       |
| tsx                  | 4.23.15      |
| bcryptjs             | 3.0.3        |
| jsonwebtoken         | 9.0.3        |
| zod                  | 4.6.5        |

## 首次設定

所有指令均從專案根目錄執行。
以下使用 Windows PowerShell。

1. 安裝 lockfile 指定的套件：

```powershell
npm.cmd ci
```

2. 建立本機環境設定。已有檔案時保留原內容，不重複覆蓋：

```powershell
Copy-Item .env.example .env
Copy-Item apps/api/.env.example apps/api/.env
```

根目錄 .env 供 Compose 使用。
apps/api/.env 供 Express 與 Prisma 使用。

若修改資料庫帳號、密碼或連接埠，
API 的 DATABASE_URL 必須使用對應設定。

請在 apps/api/.env 補齊以下設定：

| 變數                   | 用途                           |
| ---------------------- | ------------------------------ |
| DATABASE_URL           | PostgreSQL 連線設定            |
| NODE_ENV               | 本機開發使用 development       |
| SEED_PASSWORD          | 新建開發測試帳號使用的初始密碼 |
| JWT_SECRET             | JWT 簽章密鑰                   |
| JWT_EXPIRES_IN_SECONDS | Token 有效秒數，預設 3600      |

產生 JWT 密鑰：

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

將輸出的完整字串填入 apps/api/.env 的 JWT_SECRET。
實際密碼及密鑰不提交 Git。
修改 API 環境設定後，手動重新啟動 API。

3. 啟動資料庫：

```powershell
docker compose up -d db
docker compose ps
```

等待 db 顯示 healthy。

4. 套用已有的 migration：

```powershell
npm.cmd exec --workspace @freight/api -- prisma migrate deploy
```

此指令套用 Git 中已有的 migration，不產生新的 migration。

5. 產生 Prisma Client：

```powershell
npm.cmd run prisma:generate --workspace @freight/api
```

6. 建立開發測試資料：

```powershell
npm.cmd run prisma:seed --workspace @freight/api
```

Seed 建立兩個測試站所及四種角色帳號。
重複執行時保留既有資料，不重設密碼、角色或啟用狀態。

## 日常開發

先啟動資料庫：

```powershell
docker compose up -d db
```

終端機一，啟動 API：

```powershell
npm.cmd run dev --workspace @freight/api
```

終端機二，啟動前端：

```powershell
npm.cmd run dev --workspace @freight/web
```

| 服務                | 位址                  |
| ------------------- | --------------------- |
| React 前端          | http://localhost:5173 |
| Express API         | http://localhost:3000 |
| PostgreSQL 本機連線 | 127.0.0.1:5433        |

Vite 將 /api 請求轉送至 Express，保留原路徑。
這是開發代理設定，正式部署方式另行設定。

## 健康檢查

| 端點               | 成功條件                                      |
| ------------------ | --------------------------------------------- |
| GET /api/health    | HTTP 200，status 為 ok                        |
| GET /api/health/db | SQL 查詢成功，HTTP 200，database 為 connected |

資料庫查詢失敗時，/api/health/db 回傳 HTTP 503，
database 為 unavailable。

前端的「檢查 API 連線」按鈕呼叫 /api/health，
只檢查 API，不包含資料庫狀態。

## 登入與站所 API

| 方法 | 路徑            | 登入要求 | 用途                        |
| ---- | --------------- | -------- | --------------------------- |
| POST | /api/auth/login | 不需要   | 驗證帳密並簽發 Access Token |
| GET  | /api/auth/me    | 需要     | 取得目前使用者資料          |
| GET  | /api/stations   | 需要     | 取得啟用中的站所            |

受保護端點使用：

```http
Authorization: Bearer <Access Token>
```

登入及後續請求都檢查人員與所屬站所的啟用狀態。
受保護請求從資料庫取得目前角色，不採用客戶端指定的角色。

角色授權由 requireRoles Middleware 處理；
各業務端點仍須明確設定允許角色與作業規則。

| HTTP | 意義                   |
| ---- | ---------------------- |
| 400  | 輸入格式不符           |
| 401  | 登入失敗或登入狀態無效 |
| 403  | 已登入，但角色不允許   |
| 500  | 系統處理失敗           |

## 開發測試帳號

| 帳號         | 角色           | 所屬站所 |
| ------------ | -------------- | -------- |
| driver01     | 收貨／配送司機 | 001      |
| linehaul01   | 幹線司機       | 001      |
| clerk01      | 站所內勤       | 001      |
| supervisor01 | 站所主管       | 002      |

新建帳號的密碼取自當次 seed 的 SEED_PASSWORD。
之後修改 SEED_PASSWORD 不會改變既有帳號密碼。

## 前端登入行為

- Token 保存在 React 記憶體中，重新整理後需重新登入。
- 登入後顯示人員、角色、所屬站所及可用站所清單。
- 站所查詢失敗時可重新載入。
- 站所查詢或收貨建單收到 401 時清除登入狀態，提示重新登入。
- 收貨表單僅對收配司機、內勤及主管顯示；API 另外執行角色授權。
- 登出清除前端登入狀態；尚未實作伺服器端 Token 撤銷。

## 收貨建單 API

| 方法 | 路徑           | 允許角色                  |
| ---- | -------------- | ------------------------- |
| POST | /api/shipments | DRIVER、CLERK、SUPERVISOR |

請求範例：

```json
{
  "paperNumber": "TEST-RECEIVE-001",
  "packageCount": 3,
  "destinationStationId": 2,
  "handoverSequences": [2],
  "driverQuotedAmount": "350.00",
  "collectedAmount": "300.00",
  "collectedAt": "2026-10-25T10:00:00+08:00"
}
```

destinationStationId 使用資料庫站所 ID，不是站所編號；
實際值應從 GET /api/stations 取得。

### 建單規則

- 紙本單號去除前後空白後不得為空，且全系統唯一。
- 一張託運單目前接受 1 至 200 件貨，此為試作保護上限。
- 起站與建立者取自登入資料，不接受前端指定。
- 最終配送站所必須存在且啟用，允許起站與配送站相同。
- 每件貨有唯一識別碼與單內序號。
- 點交清單可省略；序號不得重複或超過總件數。
- 託運單、貨件與本次收款紀錄在同一筆資料庫交易中建立。

### 價格與實收

- 金額以字串傳入，資料庫使用 Decimal(12, 2)，最多兩位小數。
- driverQuotedAmount 可省略；未指定保存為 null，明確指定零元保存為 0。
- collectedAmount 可省略；有填寫時必須大於零，並同時提供 collectedAt。
- collectedAt 必須包含時區，代表實際收款時間。
- PaymentRecord.createdAt 另外記錄系統登錄時間。
- 本入口的實際收款人與登錄人均為登入者，不支援代他人補登。
- 未收款不建立 PaymentRecord。
- 指定價格與實收金額分開保留，不一致時不互相覆寫。
- 目前記錄收款事實，尚不判定最終運費或是否付清。

### 回應

成功回傳 HTTP 201，shipment 包含託運資料、
貨件清單、指定價格與本次收款紀錄。
Decimal 金額在 JSON 中以字串回傳，未指定價格為 null，
沒有收款時 paymentRecords 為空陣列。

| HTTP | 意義                                     |
| ---- | ---------------------------------------- |
| 400  | 輸入驗證失敗，或最終配送站所不存在／停用 |
| 401  | 未登入或登入失效                         |
| 403  | 角色無建單權限                           |
| 409  | 紙本單號或其他唯一編號衝突               |
| 500  | 系統處理失敗                             |

紙本單號重複回傳 DUPLICATE_PAPER_NUMBER；
其他唯一編號衝突回傳 SHIPMENT_IDENTIFIER_CONFLICT。

## 前端收貨行為

- 手動輸入紙本單號與件數，配送站所須自行選擇。
- 逐件勾選需要點交的貨件。
- 減少件數時移除超出範圍的點交選擇，再增加件數不自動恢復。
- 指定價格與現場實收為選填；有實收時須填實際收款時間。
- 收款時間依裝置當地時區輸入，送出前轉為 ISO 時間。
- 清空實收金額時，一併清空並停用收款時間。
- 送出期間停用表單，並以同步鎖阻擋連續送出。
- 成功後保留結果並停用表單，按「建立下一張」才清空。
- 成功結果顯示貨件編號、點交標記、指定價格及實收紀錄。
- 錯誤時保留輸入並顯示訊息；收到 401 時返回登入畫面。
- 網路錯誤不自動重送；回應未收到不代表後端未建立資料。
- 目前尚無既有託運單查詢畫面。

## Step 3 驗證紀錄

以下項目已在本機開發環境驗證，不代表已完成現場驗收。

| 情境                                           | 結果 |
| ---------------------------------------------- | ---- |
| 建立一單三件，各件編號唯一、序號正確           | 通過 |
| 僅指定第 2 件需要點交                          | 通過 |
| 重複紙本單號回傳 409，沒有重複建單             | 通過 |
| 無效件數、配送站所與偽造建立者被拒絕           | 通過 |
| 未登入回傳 401，幹線司機建單回傳 403           | 通過 |
| 指定價格為正金額、零元或未指定                 | 通過 |
| 指定價格與實收金額不同時分開保存               | 通過 |
| 有實收但未指定價格，可正常建立                 | 通過 |
| 收款人、登錄人與兩種時間正確保存及回傳         | 通過 |
| 零元／負數實收、無效時間、金額與時間缺一被拒絕 | 通過 |
| 上述無效輸入未留下託運單或收款紀錄             | 通過 |
| 表單成功／錯誤顯示、下一張重設與登入失效處理   | 通過 |
| React 正式建置                                 | 通過 |

尚未以故障注入方式驗證交易中途失敗的回滾。
條碼掃描、追蹤事件與按單按件查詢留待 Step 4；
實物貼標、列印設備及跨站現場驗證留待後續階段。

## 權限驗證

執行 HTTP 角色授權驗證：

```powershell
npm.cmd exec --workspace @freight/api -- tsx scripts/verify-rbac.js
```

需要資料庫已啟動、測試人員及站所啟用，
且 SEED_PASSWORD 與測試帳號初始密碼相同。

腳本在獨立程序啟動測試伺服器，測試結束後自動關閉。
驗證未登入回傳 401、司機角色被拒絕時回傳 403、
內勤及主管通過授權，以及客戶端角色參數無法提升權限。

人工驗證項目：

- 人員停用後，既有受保護請求及重新登入均被拒絕。
- 站所停用後，其所屬人員的受保護請求及登入均被拒絕。
- 其他啟用站所的人員仍可查詢，清單排除停用站所。
- 恢復啟用後，不需重啟 API 即可重新登入或查詢。
- Token 到期後再次查詢站所，前端返回登入表單。

## 常用驗證

```powershell
npm.cmd run prisma:validate --workspace @freight/api
npm.cmd run build --workspace @freight/web
docker compose ps
```

## 停止開發環境

前端與 API 終端機各按 Ctrl+C。

停止資料庫並保留資料：

```powershell
docker compose stop db
```

PostgreSQL 資料保存在 postgres_data volume。
初始化完成後，修改 POSTGRES_PASSWORD 環境設定
不會自動變更既有資料庫帳號密碼。

## Git 提交規則

- 提交 package-lock.json。
- 提交 .env.example，作為設定範例。
- 不提交實際 .env。
- 不提交 node_modules、dist 或 Prisma 自動產生的 Client。
- schema 修改後，重新執行 prisma:generate。
- 提交 prisma/migrations 中的 migration 與 migration_lock.toml。
- 後續資料結構變更使用 migrate dev 建立新 migration。
- 取得既有專案後，使用 migrate deploy 套用已有 migration。
