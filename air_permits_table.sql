-- ============================================
-- air_permits 表 - 空污操作許可證資料
-- ============================================
-- 資料來源：aodmis.moenv.gov.tw 抓取
-- 查詢方式：用 ems_no（管編）查詢
-- 
-- 更新頻率建議：每季或有需要時手動更新
-- ============================================

-- 如果表已存在，先刪除（開發用，正式環境請移除）
-- DROP TABLE IF EXISTS air_permits;

CREATE TABLE IF NOT EXISTS air_permits (
    id BIGSERIAL PRIMARY KEY,
    
    -- 工廠識別（主要查詢欄位）
    ems_no VARCHAR(20) NOT NULL,          -- 管制編號（F0212415）
    county VARCHAR(20),                    -- 縣市
    company_name VARCHAR(200),             -- 公司名稱
    address TEXT,                          -- 地址
    
    -- 許可證資訊
    process_id VARCHAR(20),                -- 製程代碼（M01）
    process_name VARCHAR(200),             -- 製程名稱
    category VARCHAR(50),                  -- 類別（操作/設置）
    permit_no VARCHAR(100),                -- 許可證號
    effective_date VARCHAR(20),            -- 生效日期（民國年）
    expiry_date VARCHAR(20),               -- 有效期限（民國年）★最重要★
    
    -- 中繼資料
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 索引（加速查詢）
-- ============================================

-- 主要查詢索引：用管編查
CREATE INDEX IF NOT EXISTS idx_air_permits_ems_no 
ON air_permits(ems_no);

-- 複合索引：管編+類別
CREATE INDEX IF NOT EXISTS idx_air_permits_ems_category 
ON air_permits(ems_no, category);

-- 到期日索引：可用於找即將到期的許可
CREATE INDEX IF NOT EXISTS idx_air_permits_expiry 
ON air_permits(expiry_date);

-- ============================================
-- RLS 政策（Row Level Security）
-- ============================================

-- 啟用 RLS
ALTER TABLE air_permits ENABLE ROW LEVEL SECURITY;

-- 允許公開讀取
CREATE POLICY "Allow public read access on air_permits"
ON air_permits
FOR SELECT
TO public
USING (true);

-- 允許 service role 完全存取
CREATE POLICY "Allow service role full access on air_permits"
ON air_permits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 更新觸發器
-- ============================================

-- 自動更新 updated_at
CREATE OR REPLACE FUNCTION update_air_permits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_air_permits_updated_at ON air_permits;
CREATE TRIGGER trigger_air_permits_updated_at
    BEFORE UPDATE ON air_permits
    FOR EACH ROW
    EXECUTE FUNCTION update_air_permits_updated_at();

-- ============================================
-- 使用說明
-- ============================================
-- 
-- 1. 在 Supabase SQL Editor 執行此腳本
-- 
-- 2. 匯入 CSV 資料（從 air_permits_xxx.csv）：
--    - Supabase Dashboard → Table Editor → air_permits
--    - Import data from CSV
--    - 對應欄位：
--      縣市 → county
--      管編 → ems_no
--      公司名稱 → company_name
--      地址 → address
--      製程代碼 → process_id
--      製程名稱 → process_name
--      類別 → category
--      許可證號 → permit_no
--      生效日期 → effective_date
--      有效期限 → expiry_date
-- 
-- 3. 查詢範例：
--    SELECT * FROM air_permits WHERE ems_no = 'F0212415';
-- 
-- ============================================
