# n8n「申報查詢」功能設計

> 📅 2025-12-18  
> 🎯 用戶點選單後查詢當月/指定月份的申報期限

---

## 功能特點

| 對象 | 功能 |
|------|------|
| **未綁定用戶** | 顯示當月所有申報項目（通用版） |
| **已綁定用戶** | 根據委託項目過濾（個人化版） |

---

## 資料來源

申報資料已定義在前端 `src/data/clients.js` 的 `regulationsData`，我們可以：
1. 在 n8n 直接硬編碼（簡單但難維護）
2. 新建 Supabase 表儲存（推薦，方便更新）

---

## 方案：新建 regulations 表

```sql
-- 建立申報項目表
CREATE TABLE IF NOT EXISTS regulations (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,           -- air, water, waste, toxic, soil, factory
  category_name TEXT NOT NULL,      -- 顯示名稱：💨 空污
  item TEXT NOT NULL,               -- 項目名稱
  months INTEGER[] NOT NULL,        -- 適用月份 [1,4,7,10]
  deadline TEXT,                    -- 期限說明
  period TEXT,                      -- 申報期間
  law TEXT,                         -- 法規依據
  url TEXT,                         -- 法規連結
  warning TEXT,                     -- 注意事項
  tip TEXT,                         -- 業務小提示
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 允許公開讀取
ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON regulations FOR SELECT USING (true);
```

---

## RPC 函數：取得當月申報項目

```sql
CREATE OR REPLACE FUNCTION get_monthly_regulations(target_month INTEGER DEFAULT NULL)
RETURNS TABLE (
  id TEXT,
  category TEXT,
  category_name TEXT,
  item TEXT,
  deadline TEXT,
  period TEXT,
  law TEXT,
  warning TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  check_month INTEGER;
BEGIN
  -- 如果沒指定月份，使用當月
  check_month := COALESCE(target_month, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER);
  
  RETURN QUERY
  SELECT 
    r.id,
    r.category,
    r.category_name,
    r.item,
    r.deadline,
    r.period,
    r.law,
    r.warning
  FROM regulations r
  WHERE check_month = ANY(r.months)
  ORDER BY r.category, r.item;
END;
$$;
```

---

## n8n Workflow 設計

### 流程

```
[LINE Webhook] → [HTTP: 查詢當月申報] → [Code: 格式化] → [HTTP: LINE Reply]
```

### 格式化 Code（當月 + 次月）

```javascript
const data = $input.all()[0].json;
const replyToken = $('LINE Webhook').first().json.events[0].replyToken;

const currentMonth = new Date().getMonth() + 1;
const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;

// 申報資料（硬編碼版，也可從 Supabase 查詢）
const regulations = {
  1: [
    { cat: '💨', item: '空污費季報', deadline: '1月底' },
    { cat: '💧', item: '廢水檢測申報', deadline: '1月底' },
    { cat: '💧', item: '水污費申報', deadline: '1月底' },
    { cat: '☢️', item: '毒化物運作紀錄', deadline: '每月' },
    { cat: '🗑️', item: '貯存量月申報', deadline: '5日前' },
    { cat: '🌍', item: '土壤氣體監測', deadline: '1月底' },
    { cat: '🏭', item: '危險物品申報', deadline: '1月' }
  ],
  2: [
    { cat: '☢️', item: '毒化物運作紀錄', deadline: '每月' },
    { cat: '🗑️', item: '貯存量月申報', deadline: '5日前' }
  ],
  // ... 其他月份
};

function formatMonth(month, items) {
  if (!items || items.length === 0) return '  ✅ 本月無申報項目\n';
  return items.map(r => `  ${r.cat} ${r.item} ⏰${r.deadline}`).join('\n') + '\n';
}

let message = `📋 申報行事曆\n`;
message += `━━━━━━━━━━━━━━━\n\n`;
message += `📍 本月 (${currentMonth}月)\n`;
message += formatMonth(currentMonth, regulations[currentMonth]);
message += `\n📍 下月預告 (${nextMonth}月)\n`;
message += formatMonth(nextMonth, regulations[nextMonth]);
message += `\n━━━━━━━━━━━━━━━\n`;
message += `� 需要代辦？聯繫我們！\n`;
message += `📞 (02)6609-5888`;

return { replyToken, message };
```

---

## 回覆訊息範例

```
📋 申報行事曆
━━━━━━━━━━━━━━━

� 本月 (1月)
  💨 空污費季報 ⏰1月底
  💧 廢水檢測申報 ⏰1月底
  💧 水污費申報 ⏰1月底
  ☢️ 毒化物運作紀錄 ⏰每月
  🗑️ 貯存量月申報 ⏰5日前
  🌍 土壤氣體監測 ⏰1月底
  🏭 危險物品申報 ⏰1月

📍 下月預告 (2月)
  ☢️ 毒化物運作紀錄 ⏰每月
  🗑️ 貯存量月申報 ⏰5日前

━━━━━━━━━━━━━━━
� 需要代辦？聯繫我們！
📞 (02)6609-5888
```

---

## 快速開始（簡化版）

如果不想建表，可以直接在 n8n Code 節點硬編碼資料：

```javascript
// 1月申報項目
const januaryItems = [
  { cat: '💨 空污', items: ['空污費季報 ⏰每季底前', 'VOCs檢測申報 ⏰每季底前'] },
  { cat: '💧 廢水', items: ['廢水檢測申報 ⏰1月底', '水污費申報 ⏰1月底'] },
  { cat: '☢️ 毒化物', items: ['運作紀錄申報 ⏰每月'] },
  { cat: '🗑️ 廢棄物', items: ['貯存量月申報 ⏰每月5日前'] },
  { cat: '🌍 土壤', items: ['土壤氣體監測申報 ⏰1月底'] },
  { cat: '🏭 工廠', items: ['危險物品申報 ⏰1月'] }
];

// 依月份對應...
```

---

## 下一步

1. **選擇方案**：
   - A) 建 regulations 表（推薦，易維護）
   - B) 硬編碼在 n8n（快速但難更新）

2. 在 n8n 建立 Workflow

---

*完成！*
