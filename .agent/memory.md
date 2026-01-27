# JetEnv 業務系統 - 專案記憶

> 這份文件記錄專案的重要決策和配置，讓 AI 助手在任何時候都能快速理解專案背景。
> **更新日期**：2025-12-17

---

## 🚧 當前開發狀態 (2025-12-17)

**正在進行**: LINE Bot 許可證到期通知 (Phase 1)

| 步驟 | 狀態 | 說明 |
|------|------|------|
| 1. Supabase 建表 | ✅ 完成 | `line_clients` 表已建立 |
| 2. LINE Token | ✅ 完成 | 用戶已取得 Access Token |
| 3. n8n 工作流 | 🔄 進行中 | 已提供 JSON 檔，**下一步需在 Zeabur n8n 匯入** |
| 4. 測試 | ⏳ 等待中 | 等待工作流匯入後進行測試 |

**下一步驟 (換電腦後請執行)**：
1. 下載專案中的 `n8n_line_notification.json`
2. 匯入到 Zeabur n8n
3. 設定 Supabase & LINE Credentials
4. 執行測試

---

## 🏢 專案概覽

| 項目 | 說明 |
|------|------|
| 專案名稱 | 傑太環境業務系統 (JetEnv Sales System) |
| 專案路徑 | `C:\Users\Nick\.gemini\antigravity\scratch\jetenv-sales-system` |
| 技術棧 | React 19 + Vite + TailwindCSS + Supabase |
| 部署 | Vercel (前端) + Zeabur (n8n) |

---

## 📱 LINE Bot 功能規劃

### 已確認設定

| 項目 | 決定 |
|------|------|
| LINE 帳號 | 使用**現有公開帳號**（不新建） |
| n8n 環境 | **Zeabur** (nickleo9.zeabur.app) |
| 通知時間 | **180 / 90 / 30 / 7 天**前到期通知 |
| 客戶綁定 | **統編 + 報價單單號**（雙重驗證） |
| 資料關聯 | **統編 (uniformno)** 來 JOIN 各表 |

### 四大許可證（都要查詢）

| 類型 | 資料表 | 到期日欄位 | 統編欄位 |
|------|--------|-----------|----------|
| 💧 水污 | water_permits | per_edate | ban |
| ☢️ 毒化物 | toxic_permits | edate | unino/ban |
| 💨 空污 | factories | airreleasedate | uniformno |
| 🗑️ 廢清書 | factories | wastereleasedate | uniformno |

### 推播邏輯

```
許可證到期 INNER JOIN line_clients (用統編)
              ↓
   只推給有綁定 LINE 的客戶 ✅
```

### 功能優先順序

1. ⭐ **Phase 1**：到期通知推播（被動通知）
2. **Phase 2**：客戶綁定流程
3. **Phase 3**：進度查詢 + Rich Menu

---

## 📊 資料庫結構 (Supabase)

| 資料表 | 說明 | 到期日欄位 |
|--------|------|-----------|
| `factories` | 工廠基本資料 | `*releasedate` |
| `water_permits` | 水污許可證 | `per_edate` |
| `toxic_permits` | 毒化物許可證 | `edate` |
| `line_clients` | LINE 客戶綁定 (待建) | - |

---

## 🔌 API 整合

| 來源 | 用途 | 狀態 |
|------|------|------|
| 經濟部 GCIS | 公司基本資料查詢 | ✅ 已完成 |
| 環保署 EMS_S_01 | 列管狀態查詢 | ✅ 已完成 |
| 環保署 EMS_S_03 | 水污許可 → Supabase | ✅ n8n 同步 |
| 環保署 EMS_S_05 | 毒化物許可 → Supabase | ✅ n8n 同步 |
| LINE Messaging API | Push Message 到期通知 | 🔄 開發中 |

---

## 📋 待辦事項

- [ ] LINE Bot Phase 1：到期通知功能
- [ ] LINE Bot Phase 2：客戶綁定
- [ ] LINE Bot Phase 3：進度查詢

---

## 💡 業務邏輯筆記

### 列管 vs 許可證

> ⚠️ **重要：有列管不一定有許可證！**

| 狀態 | 說明 |
|------|------|
| ✅ 有列管 + 有許可證 | 正常營運中 |
| ⚠️ 有列管 + 無許可證 | 可能需申請或已失效 |
| ❌ 無列管 | 不需該類許可證 |

### 許可證類型

- 💨 空污：無公開 API，需手動維護
- 💧 水污：EMS_S_03 API 可查
- ☢️ 毒化物：EMS_S_05 API 可查
- 🗑️ 廢棄物：無公開 API，需手動維護
