-- line_clients 表 - LINE 客戶綁定資料
-- 用途：儲存簽約客戶的 LINE User ID，用於推播通知
-- ================================================

-- 1. 建立資料表
CREATE TABLE IF NOT EXISTS line_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- LINE 資訊
  line_user_id TEXT UNIQUE NOT NULL,    -- LINE User ID (U開頭，33字元)
  line_display_name TEXT,                -- LINE 顯示名稱
  
  -- 客戶資訊（關聯用）
  uniformno TEXT NOT NULL,               -- 統一編號（用來 JOIN 許可證資料）
  fac_name TEXT,                         -- 工廠名稱
  quote_number TEXT,                     -- 報價單單號（驗證用）
  
  -- 通知設定
  notify_180days BOOLEAN DEFAULT TRUE,   -- 180天前通知
  notify_90days BOOLEAN DEFAULT TRUE,    -- 90天前通知
  notify_30days BOOLEAN DEFAULT TRUE,    -- 30天前通知  
  notify_7days BOOLEAN DEFAULT TRUE,     -- 7天前通知
  is_active BOOLEAN DEFAULT TRUE,        -- 是否啟用通知
  
  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 建立索引（加快查詢速度）
CREATE INDEX IF NOT EXISTS idx_line_clients_uniformno ON line_clients(uniformno);
CREATE INDEX IF NOT EXISTS idx_line_clients_line_user_id ON line_clients(line_user_id);
CREATE INDEX IF NOT EXISTS idx_line_clients_is_active ON line_clients(is_active);

-- 3. 啟用 RLS (Row Level Security)
ALTER TABLE line_clients ENABLE ROW LEVEL SECURITY;

-- 4. 建立 RLS 政策 - 允許所有人讀取
CREATE POLICY "Allow public select on line_clients" 
ON line_clients 
FOR SELECT 
USING (true);

-- 5. 建立 RLS 政策 - 允許 Service Role 完全存取（n8n 同步用）
CREATE POLICY "Allow all for service role on line_clients" 
ON line_clients 
FOR ALL 
USING (true)
WITH CHECK (true);
