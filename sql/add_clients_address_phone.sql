-- =====================================================
-- 客戶表新增地址和電話欄位
-- 用途：支援可展開的詳細資訊功能
-- 執行方式：在 Supabase SQL Editor 中執行此腳本
-- =====================================================

-- 新增 address (地址) 欄位
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT;

-- 新增 phone (電話) 欄位
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone TEXT;

-- =====================================================
-- 驗證更新結果
-- =====================================================

-- 查看更新後的資料表結構
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- =====================================================
-- 完成！欄位已新增
-- =====================================================
