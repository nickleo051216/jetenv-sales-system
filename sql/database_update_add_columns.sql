-- =====================================================
-- 更新 factories 資料表 - 新增欄位
-- 用途：對應 Google Sheets 新增的欄位
-- 執行方式：在 Supabase SQL Editor 中執行此腳本
-- =====================================================

-- 新增基本識別欄位
ALTER TABLE factories ADD COLUMN IF NOT EXISTS admino TEXT;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS facno TEXT;

-- 新增地理座標欄位
ALTER TABLE factories ADD COLUMN IF NOT EXISTS twd97tm2x NUMERIC;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS twd97tm2y NUMERIC;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS wgs84lon NUMERIC;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS wgs84lat NUMERIC;

-- 新增產業群組欄位
ALTER TABLE factories ADD COLUMN IF NOT EXISTS industrygroup TEXT;

-- 新增許可證到期日欄位
ALTER TABLE factories ADD COLUMN IF NOT EXISTS airreleasedate DATE;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS waterreleasedate DATE;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS wastereleasedate DATE;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS toxicreleasedate DATE;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS soilreleasedate DATE;

-- 新增業務追蹤欄位
ALTER TABLE factories ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE factories ADD COLUMN IF NOT EXISTS result TEXT;

-- 新增索引(用於加快查詢速度)
CREATE INDEX IF NOT EXISTS idx_factories_airreleasedate ON factories(airreleasedate);
CREATE INDEX IF NOT EXISTS idx_factories_waterreleasedate ON factories(waterreleasedate);
CREATE INDEX IF NOT EXISTS idx_factories_wastereleasedate ON factories(wastereleasedate);
CREATE INDEX IF NOT EXISTS idx_factories_toxicreleasedate ON factories(toxicreleasedate);
CREATE INDEX IF NOT EXISTS idx_factories_soilreleasedate ON factories(soilreleasedate);
CREATE INDEX IF NOT EXISTS idx_factories_scheduled_date ON factories(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_factories_result ON factories(result);
CREATE INDEX IF NOT EXISTS idx_factories_wgs84 ON factories(wgs84lon, wgs84lat);

-- =====================================================
-- 驗證更新結果
-- =====================================================

-- 查看更新後的資料表結構
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'factories'
ORDER BY ordinal_position;

-- 查看所有索引
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'factories'
ORDER BY indexname;

-- =====================================================
-- 完成！
-- =====================================================
-- 資料表已更新完成，可以繼續使用 n8n 同步新欄位資料
