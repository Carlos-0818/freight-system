# 貨運管理系統

依《Freight_Phase_1_Scope_and_Implementation_Roadmap_v1.1》
逐步開發 Phase 1 貨運系統。

目前階段：Step 1 專案骨架與開發環境。
尚未建立登入、權限或貨運業務功能。

## 技術架構

- 前端：React + Vite
- 後端：Node.js + Express
- 資料庫：PostgreSQL + Prisma
- 專案管理：npm workspaces
- 手寫程式：JavaScript ES modules
- API 執行工具：tsx，用於載入 Prisma 產生的 TypeScript Client
- React Router、Tailwind CSS、Zod 與 JWT 在後續單元加入

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

3. 啟動資料庫：

```powershell
docker compose up -d db
docker compose ps
```

等待 db 顯示 healthy。

4. 產生 Prisma Client：

```powershell
npm.cmd run prisma:generate --workspace @freight/api
```

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
- 業務資料表與 migration 從後續 Step 逐步建立。
