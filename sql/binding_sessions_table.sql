-- ================================================
-- binding_sessions 表 - 綁定對話狀態暫存
-- 用途：追蹤用戶在綁定流程中的對話狀態
-- ================================================

-- 1. 建立資料表
CREATE TABLE IF NOT EXISTS binding_sessions (
  line_user_id TEXT PRIMARY KEY,           -- LINE User ID
  state TEXT NOT NULL,                      -- 對話狀態: 'waiting_taxid', 'waiting_quote'
  temp_uniformno TEXT,                      -- 暫存已輸入的統編
  temp_fac_name TEXT,                       -- 暫存公司名稱
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 建立索引
CREATE INDEX IF NOT EXISTS idx_binding_sessions_state ON binding_sessions(state);
CREATE INDEX IF NOT EXISTS idx_binding_sessions_updated ON binding_sessions(updated_at);

-- 3. 啟用 RLS
ALTER TABLE binding_sessions ENABLE ROW LEVEL SECURITY;

-- 4. RLS 政策 - 允許 service_role 完全存取（n8n 使用）
CREATE POLICY "Allow all for service role on binding_sessions" 
ON binding_sessions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- ================================================
-- 自動清理過期 session（可選）
-- 使用 Supabase Edge Function 或 n8n 定時任務
-- ================================================

-- 手動清理 24 小時前的 session
-- DELETE FROM binding_sessions 
-- WHERE updated_at < NOW() - INTERVAL '24 hours';

-- ================================================
-- 使用範例
-- ================================================

-- 開始綁定流程（用戶說「綁定」）
-- INSERT INTO binding_sessions (line_user_id, state)
-- VALUES ('Uxxxxxxxxx', 'waiting_taxid')
-- ON CONFLICT (line_user_id) 
-- DO UPDATE SET state = 'waiting_taxid', updated_at = NOW();

-- 用戶輸入統編後，更新狀態
-- UPDATE binding_sessions 
-- SET state = 'waiting_quote', 
--     temp_uniformno = '12345678',
--     temp_fac_name = 'XX科技有限公司',
--     updated_at = NOW()
-- WHERE line_user_id = 'Uxxxxxxxxx';

-- 綁定完成後，清除 session
-- DELETE FROM binding_sessions WHERE line_user_id = 'Uxxxxxxxxx';
