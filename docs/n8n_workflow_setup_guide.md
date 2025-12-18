# n8n 到期通知 Workflow 設定指南

> 📅 2025-12-17  
> 🎯 每日自動發送許可證到期提醒

---

## 前置條件

- [x] Supabase RPC 函數 `get_expiring_permits()` 已建立
- [ ] n8n 環境已設定
- [ ] LINE Channel Access Token 已取得

---

## Workflow 總覽

```
[Schedule Trigger] → [HTTP Request: Supabase] → [Code: 格式化] → [HTTP Request: LINE Push]
```

---

## Step 1: 新增 Workflow

1. 登入 n8n (Zeabur)
2. 點「+ Add Workflow」
3. 命名為：**LINE 許可證到期通知**

---

## Step 2: 新增 Schedule Trigger

1. 點「+」新增節點
2. 搜尋 **Schedule Trigger**
3. 設定：
   - **Trigger Times**: Add Cron
   - **Cron Expression**: `0 9 * * *`（每天早上 9:00）

```
Cron 表達式說明：
0 9 * * *
│ │ │ │ └── 星期幾 (*=每天)
│ │ │ └──── 月 (*=每月)
│ │ └────── 日 (*=每日)
│ └──────── 小時 (9=09:00)
└────────── 分鐘 (0)
```

---

## Step 3: 新增 HTTP Request (Supabase RPC)

1. 點「+」新增節點
2. 搜尋 **HTTP Request**
3. 設定：

| 欄位 | 值 |
|------|-----|
| Method | POST |
| URL | `https://YOUR_PROJECT_ID.supabase.co/rest/v1/rpc/get_expiring_permits` |
| Authentication | None (用 Header) |
| Send Headers | ON |

### Headers 設定：

| Name | Value |
|------|-------|
| apikey | `你的 SUPABASE_ANON_KEY` |
| Authorization | `Bearer 你的 SUPABASE_ANON_KEY` |
| Content-Type | `application/json` |

### Body 設定：
- **Body Content Type**: JSON
- **Body**: `{}`

---

## Step 4: 新增 Code 節點 (格式化訊息)

1. 點「+」新增節點
2. 搜尋 **Code**
3. 設定 Language: **JavaScript**
4. 貼上以下程式碼：

```javascript
const items = $input.all();
const results = [];

for (const item of items) {
  const data = item.json;
  const alerts = [];
  
  // 根據通知設定判斷是否發送
  const daysToCheck = {
    180: data.notify_180,
    90: data.notify_90,
    60: data.notify_60,
    30: data.notify_30,
    7: data.notify_7
  };
  
  // 檢查空污
  if (data.notify_air && daysToCheck[data.air_days_left]) {
    alerts.push({
      type: '🌬️ 空污許可',
      days: data.air_days_left,
      date: data.air_expiry_date
    });
  }
  
  // 檢查水污
  if (data.notify_water && daysToCheck[data.water_days_left]) {
    alerts.push({
      type: '💧 水污許可',
      days: data.water_days_left,
      date: data.water_expiry_date
    });
  }
  
  // 檢查廢棄物
  if (data.notify_waste && daysToCheck[data.waste_days_left]) {
    alerts.push({
      type: '🗑️ 廢棄物許可',
      days: data.waste_days_left,
      date: data.waste_expiry_date
    });
  }
  
  // 檢查毒化物
  if (data.notify_toxic && daysToCheck[data.toxic_days_left]) {
    alerts.push({
      type: '☠️ 毒化物許可',
      days: data.toxic_days_left,
      date: data.toxic_expiry_date
    });
  }
  
  // 有需要通知的項目才產生訊息
  if (alerts.length > 0) {
    let message = `⚠️ 許可證到期提醒\n\n📋 ${data.fac_name}\n`;
    
    for (const alert of alerts) {
      const urgency = alert.days <= 30 ? '🔴' : alert.days <= 90 ? '🟡' : '🟢';
      message += `\n${alert.type}\n${urgency} ${alert.days} 天後到期 (${alert.date})`;
    }
    
    message += `\n\n請儘早辦理展延！\n📞 (02)6609-5888`;
    
    results.push({
      json: {
        to: data.line_user_id,
        message: message
      }
    });
  }
}

return results;
```

---

## Step 5: 新增 HTTP Request (LINE Push)

1. 點「+」新增節點
2. 搜尋 **HTTP Request**
3. 設定：

| 欄位 | 值 |
|------|-----|
| Method | POST |
| URL | `https://api.line.me/v2/bot/message/push` |
| Authentication | None (用 Header) |
| Send Headers | ON |

### Headers 設定：

| Name | Value |
|------|-------|
| Authorization | `Bearer 你的 LINE_CHANNEL_ACCESS_TOKEN` |
| Content-Type | `application/json` |

### Body 設定：
- **Body Content Type**: JSON
- **Specify Body**: Using JSON

```json
{
  "to": "{{ $json.to }}",
  "messages": [
    {
      "type": "text",
      "text": "{{ $json.message }}"
    }
  ]
}
```

---

## Step 6: 連接節點

按照順序連接：

```
Schedule Trigger → HTTP Request (Supabase) → Code → HTTP Request (LINE)
```

---

## Step 7: 測試

1. 點右上角「Test Workflow」
2. 或點「Execute Workflow」手動執行一次
3. 檢查每個節點的輸出是否正確

---

## Step 8: 啟用

1. 右上角開關切換為 **Active**
2. 完成！每天早上 9:00 會自動執行

---

## 需要的憑證

| 憑證 | 來源 | 放在 |
|------|------|------|
| SUPABASE_URL | Supabase Dashboard → Settings → API | Step 3 URL |
| SUPABASE_ANON_KEY | 同上 | Step 3 Headers |
| LINE_CHANNEL_ACCESS_TOKEN | LINE Developers Console | Step 5 Headers |

---

## 測試用 SQL（手動插入測試資料）

```sql
-- 插入一筆 30 天後到期的測試資料
UPDATE factories 
SET airreleasedate = CURRENT_DATE + 30
WHERE uniformno = '你的測試統編';
```

---

*完成！🎉*
