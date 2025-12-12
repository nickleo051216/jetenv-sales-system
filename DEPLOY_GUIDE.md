# 🚀 Vercel 部署步驟指南

## ⚠️ 開始前準備

### 需要的資料
1. **Supabase URL**: `https://yeimehdcguwnwzkmopsu.supabase.co`
2. **Supabase Anon Key**: 請從 Supabase 複製

---

## 📋 詳細步驟

### 步驟 1：前往 Vercel New Project
您已經打開了這個頁面：https://vercel.com/new

### 步驟 2：匯入 GitHub Repository

#### 2.1 找到您的 Repository
在頁面上尋找 **"jetenv-sales-system"** 或 **"Nick/jetenv-sales-system"**

如果沒看到，可能需要：
- 點擊 "Adjust GitHub App Permissions" 
- 或點擊 "Import Git Repository"

#### 2.2 點擊 Import
找到 `jetenv-sales-system` 後，點擊旁邊的 **"Import"** 按鈕

---

### 步驟 3：配置專案（最重要！）

#### 3.1 專案設定
保持預設值即可：
- **Framework Preset**: Vite（自動檢測）
- **Root Directory**: `./`（預設）
- **Build Command**: `npm run build`（預設）
- **Output Directory**: `dist`（預設）

#### 3.2 環境變數設定 ⚠️ 必須設定！

**展開 "Environment Variables" 區域**

**新增第 1 個變數**：
```
Name:  VITE_SUPABASE_URL
Value: https://yeimehdcguwnwzkmopsu.supabase.co
```

**新增第 2 個變數**：
```
Name:  VITE_SUPABASE_ANON_KEY
Value: [您的 Supabase anon public key]
```

#### 📸 如何取得 Supabase Anon Key：

1. 打開新分頁：https://supabase.com/dashboard
2. 選擇您的專案（yeimehdcguwnwzkmopsu）
3. 左側選單 → **Settings** → **API**
4. 在 "Project API keys" 區域
5. 複製 **"anon public"** key（以 `eyJ` 開頭的長字串）
6. 貼到 Vercel 的 `VITE_SUPABASE_ANON_KEY` 值

---

### 步驟 4：部署

1. 確認環境變數已正確設定（2 個變數）
2. 點擊大大的藍色按鈕 **"Deploy"**
3. 等待 1-2 分鐘

---

### 步驟 5：部署完成

成功後會看到：
- 🎉 恭喜畫面
- 一個網址，例如：`https://jetenv-sales-system-xxx.vercel.app`

---

## ✅ 部署後測試清單

訪問您的網址並測試：

### 1. Landing Page
```
https://your-domain.vercel.app/
```
✅ 確認 Logo 和按鈕正常

### 2. Admin Dashboard
```
https://your-domain.vercel.app/admin
```
- 輸入密碼：`jet888`
- ✅ 確認登入成功

### 3. 客戶管理
- 進入「客戶管理」分頁
- ✅ 確認顯示「台積電範例廠」
- ✅ 確認顯示「共 1 筆」

### 4. 戰情首頁
- 進入「戰情首頁」分頁
- ✅ 確認「進行中案件 = 1」

### 5. 新增客戶
- 點擊「+ 新增案件」
- ✅ 確認 Modal 彈出
- ✅ 填寫並測試新增功能

---

## 🔧 常見問題

### Q: 找不到 Repository？
**A**: 點擊 "Adjust GitHub App Permissions" → 給 Vercel 權限訪問該倉庫

### Q: 部署失敗？
**A**: 檢查：
1. 環境變數是否正確設定（2 個都要有）
2. Supabase Key 是否正確（以 `eyJ` 開頭）
3. Build Command 是否為 `npm run build`

### Q: 網站打開是空白？
**A**: 
1. 檢查瀏覽器 Console 是否有錯誤
2. 確認 vercel.json 已包含在程式碼中
3. 確認環境變數名稱前面有 `VITE_`

### Q: 顯示 Supabase 連線失敗？
**A**:
1. 檢查環境變數是否設定
2. 確認 Supabase URL 和 Key 正確
3. 到 Vercel Dashboard → Settings → Environment Variables 重新檢查

---

## 📞 需要協助？

如果遇到問題，請告訴我：
1. 目前在哪一步？
2. 看到什麼錯誤訊息？
3. 截圖或錯誤描述

我會立刻協助您！🚀
