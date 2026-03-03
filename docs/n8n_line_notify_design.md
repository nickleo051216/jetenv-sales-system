# LINE 許可證到期通知系統 - n8n 設計文件

## 系統概述

簽約客戶透過 LINE 官方帳號綁定業務系統，定期收到許可證到期提醒推播。

---

## 綁定流程

```
客戶簽約 → 加入 LINE 官方帳號 → 點選「綁定業務系統」
                ↓
         輸入統編 + 報價單單號
                ↓
         n8n Webhook 驗證
                ↓
    驗證 quotations 表中是否有此報價單
                ↓
         驗證成功 → 寫入 line_clients 表
                ↓
         回覆「綁定成功！」
```

---

## 資料表

### line_clients（已建立）

| 欄位 | 類型 | 說明 |
|------|------|------|
| line_user_id | TEXT | LINE User ID |
| line_display_name | TEXT | LINE 顯示名稱 |
| uniformno | TEXT | 統一編號 |
| fac_name | TEXT | 工廠名稱 |
| quote_number | TEXT | 報價單單號 |
| notify_180days | BOOLEAN | 180天前通知 |
| notify_90days | BOOLEAN | 90天前通知 |
| notify_30days | BOOLEAN | 30天前通知 |
| notify_7days | BOOLEAN | 7天前通知 |
| is_active | BOOLEAN | 是否啟用 |

---

## 許可證資料來源

| 許可證類型 | 表格 | 到期日欄位 | 統編欄位 |
|------------|------|------------|----------|
| 水污 | water_permits | per_edate | ban |
| 毒化物 | toxic_permits | per_edate | ban |
| 空污 | air_permits | expiry_date | - (需用 ems_no JOIN) |
| 廢清書 | waste_permits (待建) | expiry_date | uniformno |

---

## n8n Workflows

### 1. LINE 綁定驗證

**觸發**：Webhook（LINE Bot 收到綁定訊息）

**流程**：

1. 解析 LINE 訊息，取得 user_id、統編、報價單號
2. 查詢 Supabase quotations 表驗證
3. 驗證成功 → 寫入 line_clients 表
4. 用 LINE Reply API 回覆結果

### 2. 每日到期檢查推播

**觸發**：Schedule Trigger（每日 09:00）

**流程**：

1. 查詢 line_clients（is_active = true）
2. 對每個 uniformno 查詢各許可證表
3. 篩選 180/90/30/7 天內到期的
4. 根據 notify_xxx 欄位決定是否發送
5. 組合訊息，用 LINE Push API 推播

### 3. 手動查詢

**觸發**：Webhook（LINE Bot 收到「查詢」訊息）

**流程**：

1. 用 line_user_id 查詢 line_clients 取得 uniformno
2. 查詢各許可證表
3. 用 LINE Reply API 回覆

---

## 通知時間點

| 時間點 | 說明 |
|--------|------|
| 180 天前 | 📢 早期預警（開始準備資料）|
| 90 天前 | 🟡 注意（聯繫顧問/送件）|
| 30 天前 | 🔴 緊急（加速處理）|
| 7 天前 | ❌ 最後通知（最後催促）|

---

## LINE API 設定

需要的資訊：

- Channel Access Token（推播用）
- Webhook URL（接收用戶訊息）

API Endpoints：

- Push API: `POST https://api.line.me/v2/bot/message/push`
- Reply API: `POST https://api.line.me/v2/bot/message/reply`

---

## 待辦事項

- [ ] 建立 waste_permits 表（廢清書）
- [ ] 設定 LINE Bot Webhook 指向 n8n
- [ ] 建立 n8n 綁定驗證 workflow
- [ ] 建立 n8n 每日推播 workflow
- [ ] 設計 LINE Rich Menu（綁定按鈕）

---

*最後更新：2025-12-17*
