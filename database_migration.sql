-- =====================================================
-- 建立 factories 資料表（工廠資料庫）
-- 用途：儲存從 Google Sheets 同步的工廠登記資料
-- =====================================================

-- 1. 建立資料表
CREATE TABLE factories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 基本識別資訊
  emsno TEXT UNIQUE NOT NULL,           -- 工廠登記編號（主鍵）
  uniformno TEXT,                        -- 統一編號（查詢用）
  facilityname TEXT,                     -- 工廠名稱
  
  -- 地理資訊
  county TEXT,                           -- 縣市
  township TEXT,                         -- 鄉鎮區
  facilityaddress TEXT,                  -- 工廠地址
  industryareaname TEXT,                 -- 工業區名稱
  
  -- 產業資訊
  industryid TEXT,                       -- 產業代號
  industryname TEXT,                     -- 產業名稱（行業別）
  
  -- 委託項目標記（來自 Google Sheets）
  isair BOOLEAN DEFAULT FALSE,           -- 空氣污染防制
  iswater BOOLEAN DEFAULT FALSE,         -- 廢水處理
  iswaste BOOLEAN DEFAULT FALSE,         -- 廢棄物清理
  istoxic BOOLEAN DEFAULT FALSE,         -- 毒化物管理
  issoil BOOLEAN DEFAULT FALSE,          -- 土壤污染
  
  -- 業務資訊
  consultant_company TEXT,               -- 顧問公司
  phone TEXT,                            -- 電話
  renewal_year TEXT,                     -- 換證年
  notes TEXT,                            -- 備註（可拜訪等）
  
  -- 資料來源與時間戳
  data_source TEXT,                      -- 資料來源（新北市、台北市等）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 建立索引（加快查詢速度）
CREATE INDEX idx_factories_uniformno ON factories(uniformno);
CREATE INDEX idx_factories_county ON factories(county);
CREATE INDEX idx_factories_industryname ON factories(industryname);
CREATE INDEX idx_factories_consultant ON factories(consultant_company);
CREATE INDEX idx_factories_renewal ON factories(renewal_year);

-- 3. 啟用 RLS（Row Level Security）
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;

-- 4. 建立 RLS 政策（允許所有人查詢）
CREATE POLICY "Allow public select on factories" 
ON factories 
FOR SELECT 
USING (true);

-- 5. 建立 RLS 政策（允許插入/更新，供 n8n 使用）
CREATE POLICY "Allow insert for service role" 
ON factories 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update for service role" 
ON factories 
FOR UPDATE 
USING (true);

-- =====================================================
-- 驗證與測試
-- =====================================================

-- 測試 1: 查看資料表結構
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'factories'
ORDER BY ordinal_position;

-- 測試 2: 確認 RLS 已啟用
SELECT 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'factories';

-- 測試 3: 查看所有政策
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'factories'
ORDER BY policyname;

-- =====================================================
-- 測試插入範例資料（可選）
-- =====================================================

-- 插入一筆測試資料
INSERT INTO factories (
  emsno, 
  uniformno, 
  facilityname, 
  county, 
  township,
  facilityaddress,
  industryname,
  isair,
  iswater,
  iswaste,
  consultant_company,
  notes,
  data_source
) VALUES (
  'TEST001',
  '12345678',
  '測試工廠',
  '新北市',
  '土城區',
  '新北市土城區測試路123號',
  '金屬表面處理業',
  true,
  true,
  false,
  '測試顧問公司',
  '測試資料',
  '新北市'
);

-- 查詢測試資料
SELECT * FROM factories WHERE emsno = 'TEST001';

-- 查詢特定統編的所有工廠
SELECT * FROM factories WHERE uniformno = '12345678';

-- 刪除測試資料（執行後請刪除）
-- DELETE FROM factories WHERE emsno = 'TEST001';

-- =====================================================
-- 完成！
-- =====================================================
-- 資料表已建立完成，可以開始使用 n8n 同步資料了
