-- ================================================
-- toxic_permits 表 - 毒化物許可證資料
-- 資料來源：環境部 EMS_S_05 API / 你的 Sheets
-- ================================================

-- 1. 如果表已存在，先刪除（開發階段用）
-- DROP TABLE IF EXISTS toxic_permits;

-- 2. 建立 toxic_permits 表
CREATE TABLE IF NOT EXISTS toxic_permits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 許可證基本資訊
  ems_no TEXT,                    -- 管制事業編號
  per_no TEXT,                    -- 許可證號
  per_status TEXT,                -- 許可證狀態（有效/...）
  
  -- 日期資訊
  sdate DATE,                     -- 許可證起始日
  edate DATE,                     -- 許可證到期日（重要！）
  
  -- 事業資訊
  unino TEXT,                     -- 統編（同步的 Sheets 可能叫 ban）
  ban TEXT,                       -- 統編（備用欄位，相容 Sheets 格式）
  fac_name TEXT,                  -- 事業/工廠名稱
  address TEXT,                   -- 地址
  
  -- 毒化物資訊
  emi_type TEXT,                  -- 資料類別（許可/核可）
  emi_item TEXT,                  -- 毒化物名稱
  emi_ename TEXT,                 -- 毒化物英文名稱
  listedno TEXT,                  -- 毒化物列管編號
  
  -- 系統欄位
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 建立索引
CREATE INDEX IF NOT EXISTS idx_toxic_permits_unino ON toxic_permits(unino);
CREATE INDEX IF NOT EXISTS idx_toxic_permits_ban ON toxic_permits(ban);
CREATE INDEX IF NOT EXISTS idx_toxic_permits_ems_no ON toxic_permits(ems_no);
CREATE INDEX IF NOT EXISTS idx_toxic_permits_edate ON toxic_permits(edate);

-- 4. 建立唯一約束（避免重複資料）
-- 同一許可證號 + 毒化物名稱 = 唯一
ALTER TABLE toxic_permits 
ADD CONSTRAINT unique_toxic_permit 
UNIQUE (ems_no, per_no, emi_item);

-- 5. 啟用 RLS (Row Level Security)
ALTER TABLE toxic_permits ENABLE ROW LEVEL SECURITY;

-- 6. 建立 RLS 政策 - 允許所有人讀取
CREATE POLICY "Allow public select on toxic_permits" 
ON toxic_permits 
FOR SELECT 
USING (true);

-- 7. 建立 RLS 政策 - 允許 Service Role 完全存取（n8n 同步用）
CREATE POLICY "Allow all for service role on toxic_permits" 
ON toxic_permits 
FOR ALL 
USING (auth.role() = 'service_role');

-- ================================================
-- 使用說明：
-- 1. 在 Supabase SQL Editor 執行此腳本
-- 2. 在 n8n 設定 Sheets -> Supabase 同步
-- 3. 欄位對應：
--    - EMS_S_05 的 unino -> toxic_permits.unino
--    - 或 Sheets 的 ban -> toxic_permits.ban
--    - edate -> edate（到期日）
-- ================================================
