# n8n「我的許可證」查詢 Workflow

> 📅 2025-12-18  
> 🎯 用戶點選單後查詢自己的許可證狀態

---

## 流程圖

```
[LINE Webhook] → [HTTP: 查詢許可證] → [IF: 是否綁定] → [Code: 格式化] → [HTTP: LINE Reply]
                                            ↓
                                     [未綁定回覆]
```

---

## Step 1: LINE Webhook

1. 新增節點 **Webhook**
2. 設定：
   - **HTTP Method**: POST
   - **Path**: `line-my-permits`（或統一用一個 /line-webhook）

完整 URL 會是：`https://你的n8n.zeabur.app/webhook/line-my-permits`

---

## Step 2: 判斷是否為「我的許可證」

用 **IF** 或 **Switch** 節點判斷訊息內容：

```javascript
// 判斷條件
$json.events[0].message.text === '#查詢許可證'
```

---

## Step 3: HTTP Request (查詢 Supabase)

| 欄位 | 值 |
|------|-----|
| Method | POST |
| URL | `https://yeimehdcguwnwzkmopsu.supabase.co/rest/v1/rpc/get_my_permits` |
| Headers | apikey, Authorization (同之前) |
| Body | 見下方 |

**Body (JSON)**:
```json
{
  "user_line_id": "{{ $json.events[0].source.userId }}"
}
```

---

## Step 4: IF 判斷是否綁定

判斷查詢結果是否為空：

```javascript
// 條件：已綁定（有資料）
$json.length > 0
```

- **True** → 繼續格式化
- **False** → 回覆「請先綁定」

---

## Step 5A: Code 節點（格式化訊息）

```javascript
const data = $input.first().json;
const replyToken = $('LINE Webhook').first().json.events[0].replyToken;

// 狀態格式化
function formatStatus(days) {
  if (days === null) return '⚪ 無資料';
  if (days < 0) return '⛔ 已過期';
  if (days <= 30) return `🔴 ${days}天`;
  if (days <= 90) return `🟡 ${days}天`;
  if (days <= 180) return `🟢 ${days}天`;
  return `✅ ${days}天`;
}

// 組合訊息
let message = `📋 ${data.fac_name} 許可證狀態\n`;
message += `━━━━━━━━━━━━━━━\n`;

if (data.has_air && data.air_expiry) {
  message += `🌬️ 空污：${formatStatus(data.air_days_left)}\n`;
  message += `   到期：${data.air_expiry}\n`;
}

if (data.has_water && data.water_expiry) {
  message += `💧 水污：${formatStatus(data.water_days_left)}\n`;
  message += `   到期：${data.water_expiry}\n`;
}

if (data.has_waste && data.waste_expiry) {
  message += `🗑️ 廢棄物：${formatStatus(data.waste_days_left)}\n`;
  message += `   到期：${data.waste_expiry}\n`;
}

if (data.has_toxic && data.toxic_expiry) {
  message += `☠️ 毒化物：${formatStatus(data.toxic_days_left)}\n`;
  message += `   到期：${data.toxic_expiry}\n`;
}

message += `━━━━━━━━━━━━━━━\n`;
message += `📞 聯繫顧問：(02)6609-5888`;

return {
  replyToken,
  message
};
```

---

## Step 5B: 未綁定回覆

```javascript
const replyToken = $('LINE Webhook').first().json.events[0].replyToken;

return {
  replyToken,
  message: '❌ 尚未綁定帳號\n\n請先輸入「綁定」進行帳號設定。'
};
```

---

## Step 6: HTTP Request (LINE Reply)

| 欄位 | 值 |
|------|-----|
| Method | POST |
| URL | `https://api.line.me/v2/bot/message/reply` |
| Headers | Authorization: Bearer {{LINE_TOKEN}} |

**Body**:
```json
{
  "replyToken": "{{ $json.replyToken }}",
  "messages": [{
    "type": "text",
    "text": "{{ $json.message }}"
  }]
}
```

---

## 回覆訊息範例

```
📋 XX科技有限公司 許可證狀態
━━━━━━━━━━━━━━━
🌬️ 空污：🟡 45天
   到期：2025-02-01
💧 水污：🟢 180天
   到期：2025-06-15
☠️ 毒化物：🔴 15天
   到期：2025-01-02
━━━━━━━━━━━━━━━
📞 聯繫顧問：(02)6609-5888
```

---

## 完整 Workflow 節點順序

```
1. Webhook (LINE)
   ↓
2. IF (訊息 = #查詢許可證)
   ↓
3. HTTP Request (Supabase get_my_permits)
   ↓
4. IF (結果.length > 0)
   ├─ True → Code (格式化) → HTTP (LINE Reply)
   └─ False → Code (未綁定) → HTTP (LINE Reply)
```

---

*完成！*
