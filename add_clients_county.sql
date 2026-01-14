-- =====================================================
-- 客戶表新增地區欄位
-- 用途：讓客戶管理可以依地區篩選
-- 執行方式：在 Supabase SQL Editor 中執行此腳本
-- =====================================================

-- 新增 county (縣市) 欄位
ALTER TABLE clients ADD COLUMN IF NOT EXISTS county TEXT;

-- 建立索引（加快依地區查詢速度）
CREATE INDEX IF NOT EXISTS idx_clients_county ON clients(county);

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
