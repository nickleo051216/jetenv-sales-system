-- ================================================
-- Supabase RPC 函數：取得即將到期的許可證
-- 用途：n8n 每日呼叫，取得需要通知的用戶清單
-- ================================================

-- 建立函數
CREATE OR REPLACE FUNCTION get_expiring_permits()
RETURNS TABLE (
  line_user_id TEXT,
  fac_name TEXT,
  uniformno TEXT,
  
  -- 空污
  air_expiry_date DATE,
  air_days_left INTEGER,
  notify_air BOOLEAN,
  
  -- 水污
  water_expiry_date DATE,
  water_days_left INTEGER,
  notify_water BOOLEAN,
  
  -- 廢棄物
  waste_expiry_date DATE,
  waste_days_left INTEGER,
  notify_waste BOOLEAN,
  
  -- 毒化物
  toxic_expiry_date DATE,
  toxic_days_left INTEGER,
  notify_toxic BOOLEAN,
  
  -- 通知設定
  notify_180 BOOLEAN,
  notify_90 BOOLEAN,
  notify_60 BOOLEAN,
  notify_30 BOOLEAN,
  notify_7 BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lc.line_user_id,
    COALESCE(lc.fac_name, f.facilityname) AS fac_name,
    lc.uniformno,
    
    -- 空污
    f.airreleasedate AS air_expiry_date,
    (f.airreleasedate - CURRENT_DATE)::INTEGER AS air_days_left,
    (f.airreleasedate - CURRENT_DATE) IN (180, 90, 60, 30, 7) AS notify_air,
    
    -- 水污
    f.waterreleasedate AS water_expiry_date,
    (f.waterreleasedate - CURRENT_DATE)::INTEGER AS water_days_left,
    (f.waterreleasedate - CURRENT_DATE) IN (180, 90, 60, 30, 7) AS notify_water,
    
    -- 廢棄物
    f.wastereleasedate AS waste_expiry_date,
    (f.wastereleasedate - CURRENT_DATE)::INTEGER AS waste_days_left,
    (f.wastereleasedate - CURRENT_DATE) IN (180, 90, 60, 30, 7) AS notify_waste,
    
    -- 毒化物
    f.toxicreleasedate AS toxic_expiry_date,
    (f.toxicreleasedate - CURRENT_DATE)::INTEGER AS toxic_days_left,
    (f.toxicreleasedate - CURRENT_DATE) IN (180, 90, 60, 30, 7) AS notify_toxic,
    
    -- 通知設定
    lc.notify_180days AS notify_180,
    lc.notify_90days AS notify_90,
    COALESCE(lc.notify_60days, TRUE) AS notify_60,  -- 新欄位，預設 TRUE
    lc.notify_30days AS notify_30,
    lc.notify_7days AS notify_7
    
  FROM line_clients lc
  JOIN factories f ON lc.uniformno = f.uniformno
  WHERE lc.is_active = TRUE
    AND (
      -- 今天需要發送通知的
      (f.airreleasedate - CURRENT_DATE) IN (180, 90, 60, 30, 7) OR
      (f.waterreleasedate - CURRENT_DATE) IN (180, 90, 60, 30, 7) OR
      (f.wastereleasedate - CURRENT_DATE) IN (180, 90, 60, 30, 7) OR
      (f.toxicreleasedate - CURRENT_DATE) IN (180, 90, 60, 30, 7)
    );
END;
$$;

-- ================================================
-- 測試函數
-- ================================================
-- SELECT * FROM get_expiring_permits();

-- ================================================
-- n8n 呼叫方式 (HTTP Request)
-- ================================================
-- POST https://YOUR_PROJECT.supabase.co/rest/v1/rpc/get_expiring_permits
-- Headers:
--   apikey: YOUR_ANON_KEY
--   Authorization: Bearer YOUR_ANON_KEY
--   Content-Type: application/json
-- Body: {}

-- ================================================
-- 如果需要加 notify_60days 欄位到 line_clients 表
-- ================================================
-- ALTER TABLE line_clients 
-- ADD COLUMN IF NOT EXISTS notify_60days BOOLEAN DEFAULT TRUE;
