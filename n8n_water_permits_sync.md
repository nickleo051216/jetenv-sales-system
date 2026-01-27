# n8n 水污許可同步工作流設定

## 工作流概述

```
觸發：每日凌晨 3 點（或手動執行）
資料來源：環境部 EMS_S_03 API（水污許可證資料）
資料目標：Supabase water_permits 表
預估資料量：約 166 萬筆（每次需分頁處理）
```

---

## 節點設定

### 1️⃣ Schedule Trigger（定時觸發）

```
觸發規則：每日凌晨 3 點
CRON 表達式：0 3 * * *
```

---

### 2️⃣ HTTP Request（取得 API 資料）

由於 API 資料量大，需要分頁處理。

**基本設定：**

```
Method: GET
URL: https://data.moenv.gov.tw/api/v2/EMS_S_03
    ?format=json
    &limit=1000
    &offset={{ $runIndex * 1000 }}
    &api_key=7854a04b-f171-47bb-9e42-4dd2ecc4745b
```

**注意**：需要用 Loop 來處理分頁（offset 0, 1000, 2000...）

---

### 3️⃣ Code Node（資料轉換）

```javascript
// 轉換欄位格式，準備寫入 Supabase
const records = $input.all().flatMap(item => item.json.records || []);

return records.map(r => ({
  json: {
    ems_no: r.ems_no || null,
    ban: r.ban || null,
    fac_name: r.fac_name || null,
    per_no: r.per_no || null,
    per_sdate: r.per_sdate || null,
    per_edate: r.per_edate || null,
    per_type: r.per_type || null,
    address: r.address || null,
    let: r.let || null,
    let_tm2x: r.let_tm2x || null,
    let_tm2y: r.let_tm2y || null,
    let_emi: r.let_emi || null,
    let_watertype: r.let_watertype || null,
    per_item: r.per_item || null,
    per_water: r.per_water || null,
    per_recycle: r.per_recycle || null
  }
}));
```

---

### 4️⃣ Supabase Node（寫入資料庫）

**設定：**

```
Operation: Upsert
Table: water_permits
Conflict Columns: ems_no, per_no, let（依唯一約束）
```

**欄位對應：**

| API 欄位 | Supabase 欄位 |
|---------|--------------|
| ems_no | ems_no |
| ban | ban |
| fac_name | fac_name |
| per_no | per_no |
| per_sdate | per_sdate |
| per_edate | per_edate |
| per_type | per_type |
| address | address |
| let | let |

---

## 簡化版（只同步新北市 + 台北市）

如果不想同步全部 166 萬筆，可以加一個篩選：

```javascript
// 在 Code Node 加入篩選
const records = $input.all().flatMap(item => item.json.records || []);

// 只保留新北市、台北市的資料
const filtered = records.filter(r => 
  r.address && (
    r.address.includes('新北市') || 
    r.address.includes('台北市') ||
    r.address.includes('桃園市')
  )
);

return filtered.map(r => ({ json: r }));
```

---

## 手動執行測試

建議先手動執行一次，確認同步正常後再設定定時。

---

## Supabase 連線設定

在 n8n 設定 Supabase Credentials：

```
Supabase URL: https://yeimehdcguwnwzkmopsu.supabase.co
API Key: [你的 Service Role Key]
```

> ⚠️ 注意：必須用 **Service Role Key** 才有寫入權限，不要用 anon key！
