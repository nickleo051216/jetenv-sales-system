-- =====================================================
-- 建立 water_permits 資料表（水污許可證資料）
-- 用途：儲存從環境部 API (EMS_S_03) 同步的水污許可證資料
-- 同步方式：n8n 定期（每日/週）從環境部 API 下載同步
-- =====================================================

-- 1. 建立資料表
CREATE TABLE water_permits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 基本識別資訊
  ems_no TEXT,                          -- 管制事業編號 (F13B0997)
  ban TEXT NOT NULL,                    -- 統一編號 (50970570) - 主要查詢欄位!
  fac_name TEXT,                        -- 事業名稱
  
  -- 許可證資訊
  per_no TEXT,                          -- 許可證號
  per_sdate DATE,                       -- 許可證起始日
  per_edate DATE,                       -- 許可證截止日 ⭐ 重要！到期日
  per_type TEXT,                        -- 水污染防治許可種類
  
  -- 地址資訊
  address TEXT,                         -- 實際廠（場）地址
  
  -- 放流口資訊
  let TEXT,                             -- 放流口別
  let_tm2x TEXT,                        -- 放流口X座標
  let_tm2y TEXT,                        -- 放流口Y座標
  let_emi TEXT,                         -- 核准排放量
  let_watertype TEXT,                   -- 承受水體
  
  -- 處理設施資訊
  per_item TEXT,                        -- 廢（污）水處理設施單元名稱
  per_water TEXT,                       -- 處理水量
  per_recycle TEXT,                     -- 回收量
  
  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 唯一約束：同一統編+許可證號 只能有一筆
  UNIQUE(ban, per_no)
);

-- 2. 建立索引（加快查詢速度）
-- ⭐ 統編查詢索引 - 最重要！
CREATE INDEX idx_water_permits_ban ON water_permits(ban);

-- 許可證號查詢
CREATE INDEX idx_water_permits_per_no ON water_permits(per_no);

-- 到期日查詢（找即將到期的許可證）
CREATE INDEX idx_water_permits_per_edate ON water_permits(per_edate);

-- 管制編號查詢
CREATE INDEX idx_water_permits_ems_no ON water_permits(ems_no);

-- 3. 啟用 RLS（Row Level Security）
ALTER TABLE water_permits ENABLE ROW LEVEL SECURITY;

-- 4. 建立 RLS 政策（允許所有人查詢）
CREATE POLICY "Allow public select on water_permits" 
ON water_permits 
FOR SELECT 
USING (true);

-- 5. 建立 RLS 政策（允許插入/更新/刪除，供 n8n 使用）
CREATE POLICY "Allow all for service role on water_permits" 
ON water_permits 
FOR ALL 
USING (true)
WITH CHECK (true);

-- =====================================================
-- 測試查詢
-- =====================================================

-- 測試 1: 用統編查詢許可證
-- SELECT * FROM water_permits WHERE ban = '50970570';

-- 測試 2: 查詢即將到期的許可證（6個月內）
-- SELECT * FROM water_permits 
-- WHERE per_edate <= CURRENT_DATE + INTERVAL '6 months'
-- ORDER BY per_edate;

-- 測試 3: 計算每個統編有幾張許可證
-- SELECT ban, COUNT(*) as permit_count 
-- FROM water_permits 
-- GROUP BY ban;

-- =====================================================
-- 完成！
-- =====================================================
-- 請在 Supabase SQL Editor 執行此腳本
-- 然後設定 n8n 工作流同步資料
