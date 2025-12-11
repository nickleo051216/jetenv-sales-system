# Vercel 部署說明

## 🚀 部署步驟

### 1. 連接 GitHub
1. 登入 [Vercel](https://vercel.com)
2. 點擊 **Import Project**
3. 選擇您的 GitHub Repository（jetenv-sales-system）

### 2. 設定環境變數
在 Vercel 專案設定中，加入以下環境變數：

**Settings → Environment Variables → Add**

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://yeimehdcguwnwzkmopsu.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | 您的 Supabase anon key |

### 3. 部署設定
Vercel 會自動檢測到 Vite 專案，無需額外設定。

**Build Command**: `npm run build`
**Output Directory**: `dist`
**Install Command**: `npm install`

### 4. 部署
點擊 **Deploy** 即可！

部署完成後，您會得到一個網址，例如：
```
https://jetenv-sales-system.vercel.app
```

---

## ✅ 確認清單

部署前請確認：
- [ ] `.env.local` 已包含正確的 Supabase 憑證
- [ ] Supabase SQL Schema 已執行完成
- [ ] 本地測試無誤（`npm run dev`）
- [ ] Git 已推送最新程式碼到 GitHub

---

## 🔄 自動部署

之後每次推送到 GitHub `main` 分支，Vercel 會自動重新部署！

---

## 🧪 測試網址功能

部署後請測試：
1. **Landing Page**: `https://your-domain.vercel.app/`
2. **Client Portal**: `https://your-domain.vercel.app/portal`
3. **Admin Dashboard**: `https://your-domain.vercel.app/admin`

---

## 💡 常見問題

### Q: 部署後顯示 404？
**A:** 檢查 `vercel.json` 是否正確設定 SPA 路由重寫。

### Q: 環境變數無效？
**A:** 確認變數名稱以 `VITE_` 開頭，並且已在 Vercel 設定中加入。

### Q: Supabase 連線失敗？
**A:** 確認 Supabase URL 和 Key 正確，並檢查 Supabase 專案是否正常運作。
