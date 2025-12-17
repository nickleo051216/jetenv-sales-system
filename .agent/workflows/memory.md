---
description: 傑太業務系統核心記憶 - 換電腦後讀取此檔案恢復上下文
---

# 傑太業務系統 (JET Sales System) 核心記憶

## 系統概述

傑太環保顧問公司的業務管理系統，用於管理客戶、追蹤環境許可證到期日、產生報價單。

---

## 專案位置

```
主專案：C:\Users\jeten\.gemini\antigravity\scratch\jetenv-sales-system\
技術棧：React + Vite + TailwindCSS + Supabase
部署平台：Vercel
```

---

## 資料庫 (Supabase)

| 項目 | 值 |
|------|-----|
| URL | <https://yeimehdcguwnwzkmopsu.supabase.co> |
| 主要表格 | clients, water_permits, toxic_permits, air_permits, factories |

### 資料表用途

- `clients`：客戶基本資料、業務狀態
- `water_permits`：水污許可證（n8n 從 EMS_S_03 同步）
- `toxic_permits`：毒物許可證（n8n 從 EMS_S_05 同步）
- `air_permits`：空污許可證（爬蟲手動抓取）
- `factories`：Google Sheets 同步的工廠登記資料

---

## 環境許可證 API

| 許可證類型 | 資料來源 | 同步方式 |
|------------|----------|----------|
| 水污 (EMS_S_03) | 環境部開放資料 | n8n 每日凌晨 3 點同步 |
| 毒物 (EMS_S_05) | 環境部開放資料 | n8n 同步 |
| 空污 | aodmis.moenv.gov.tw | Puppeteer 爬蟲 (半自動) |
| 廢棄物 | 無公開 API | 手動維護 |

---

## 空污許可證爬蟲 v4（最新版）

### 檔案位置

```
C:\Users\jeten\.gemini\antigravity\scratch\jetenv-sales-system\scripts\air_permit_scraper_semi.js
```

### 依賴安裝

```bash
cd C:\Users\jeten\.gemini\antigravity\scratch\jetenv-sales-system
npm install puppeteer exceljs
```

### 使用方式

```bash
node scripts/air_permit_scraper_semi.js
```

### v4 版本特色

- **ES Modules**：使用 import 語法
- **Excel 輸出**：使用 exceljs，每個地區一個分頁 + 總表
- **自動勾選許可**：不用手動勾，腳本會自動處理
- **30 秒等待**：比舊版更短
- **多地區累積**：多次執行會累積到同一個 Excel 檔案

### 操作流程

1. 執行腳本，瀏覽器自動開啟 aodmis 網站
2. **手動**選擇縣市、鄉鎮區，點「查詢」
3. **不用手動勾選許可**（腳本自動處理）
4. 30 秒倒數後自動開始抓取
5. 結果存為 `data/air_permits.xlsx`（總表 + 各地區分頁）

### 輸出欄位

county, ems_no, company_name, address, process_id, process_name, category, permit_no, effective_date, expiry_date, district(總表專用)

---

## n8n 工作流

### 水污許可同步

- 觸發：每日凌晨 3 點
- 來源：<https://data.moenv.gov.tw/api/v2/EMS_S_03>
- 目標：Supabase water_permits 表
- 設定文件：`n8n_water_permits_sync.md`

---

## LINE 許可證到期通知系統

### 設計文件

- 完整設計：`n8n_line_notify_design.md`
- 資料表 SQL：`line_clients_table.sql`

### 綁定流程

1. 客戶簽約後加入 LINE 官方帳號
2. 點選「綁定業務系統」
3. 輸入統編 + 報價單單號
4. n8n 驗證後寫入 `line_clients` 表
5. 之後每日推播到期提醒

### line_clients 表主要欄位

- `line_user_id`：LINE User ID
- `uniformno`：統編（用來 JOIN 許可證）
- `quote_number`：報價單號（驗證用）
- `notify_180days/90days/30days/7days`：通知開關
- `is_active`：是否啟用

### 通知時間點

- 180 天前：📢 早期預警
- 90 天前：🟡 注意
- 30 天前：🔴 緊急
- 7 天前：❌ 最後通知

### n8n Workflows

1. **LINE 綁定驗證**（Webhook）
2. **每日到期檢查推播**（排程 09:00）
3. **手動查詢**（Webhook）

---

## 前端主要頁面

| 頁面 | 路徑 | 說明 |
|------|------|------|
| Admin Dashboard | /admin | 管理員後台 |
| FlowchartView | /admin/flowchart | 許可證流程圖 |
| MobileFlowchart | /client | 客戶入口 |

---

## 已完成功能

- [x] 報價單產生與 PDF 輸出（含公司印章）
- [x] 客戶 CRUD 管理
- [x] 水污/毒物許可證 n8n 同步
- [x] 空污許可證爬蟲（半自動版）
- [x] 廢清書 5 年換發提醒
- [x] Google Sheets 工廠資料同步

---

## 待辦功能

- [ ] LINE Notify 許可證到期提醒
- [ ] LINE Bot 查詢介面
- [ ] 自動化空污爬蟲（全區域）
- [ ] 多區域許可證資料整合儀表板

---

## 重要指令

```bash
# 啟動開發伺服器
cd C:\Users\jeten\.gemini\antigravity\scratch\jetenv-sales-system
npm run dev

# 執行空污爬蟲
node air_permit_scraper_semi.js

# Git 操作
git add .
git commit -m "更新內容"
git push
```

---

## 聯絡資訊

- Supabase 專案：yeimehdcguwnwzkmopsu
- Vercel 部署：jetenv-sales-system

---

*最後更新：2025-12-17*
