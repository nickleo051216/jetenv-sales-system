# 🚀 Vercel 部署快速指南

## 📋 環境變數（複製使用）

### VITE_SUPABASE_URL
```
https://yeimehdcguwnwzkmopsu.supabase.co
```

### VITE_SUPABASE_ANON_KEY
請從 Supabase 複製您的 anon key（以 eyJ 開頭）

---

## 🎯 部署步驟

### 1. Import Project
- 選擇 GitHub repository: `jetenv-sales-system`

### 2. 設定環境變數
在 "Environment Variables" 區域新增：

**變數 1:**
- Name: `VITE_SUPABASE_URL`
- Value: `https://yeimehdcguwnwzkmopsu.supabase.co`

**變數 2:**
- Name: `VITE_SUPABASE_ANON_KEY`  
- Value: (您的 Supabase anon key)

### 3. Build Settings
保持預設值：
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

### 4. Deploy
點擊 "Deploy" 按鈕

---

## ✅ 部署完成後

您會得到一個網址，例如：
```
https://jetenv-sales-system-xxx.vercel.app
```

測試以下功能：
- Landing Page
- Admin Login (密碼: jet888)
- 新增客戶
- 戰情首頁統計

---

## 🔑 如何取得 Supabase Anon Key

1. 到 Supabase: https://supabase.com/dashboard
2. 選擇您的專案
3. Settings → API
4. 複製 "anon public" key
