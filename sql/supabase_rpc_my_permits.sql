-- ================================================
-- Supabase RPC 函數：根據 LINE User ID 查詢許可證
-- 用途：用戶點「我的許可證」時呼叫
-- ================================================

CREATE OR REPLACE FUNCTION get_my_permits(user_line_id TEXT)
RETURNS TABLE (
  -- 是否綁定
  is_bound BOOLEAN,
  
  -- 公司資訊
  fac_name TEXT,
  uniformno TEXT,
  
  -- 空污
  air_expiry DATE,
  air_days_left INTEGER,
  has_air BOOLEAN,
  
  -- 水污
  water_expiry DATE,
  water_days_left INTEGER,
  has_water BOOLEAN,
  
  -- 廢棄物
  waste_expiry DATE,
  waste_days_left INTEGER,
  has_waste BOOLEAN,
  
  -- 毒化物
  toxic_expiry DATE,
  toxic_days_left INTEGER,
  has_toxic BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TRUE AS is_bound,
    COALESCE(lc.fac_name, f.facilityname) AS fac_name,
    lc.uniformno,
    
    -- 空污
    f.airreleasedate AS air_expiry,
    (f.airreleasedate - CURRENT_DATE)::INTEGER AS air_days_left,
    COALESCE(f.isair, FALSE) AS has_air,
    
    -- 水污
    f.waterreleasedate AS water_expiry,
    (f.waterreleasedate - CURRENT_DATE)::INTEGER AS water_days_left,
    COALESCE(f.iswater, FALSE) AS has_water,
    
    -- 廢棄物
    f.wastereleasedate AS waste_expiry,
    (f.wastereleasedate - CURRENT_DATE)::INTEGER AS waste_days_left,
    COALESCE(f.iswaste, FALSE) AS has_waste,
    
    -- 毒化物
    f.toxicreleasedate AS toxic_expiry,
    (f.toxicreleasedate - CURRENT_DATE)::INTEGER AS toxic_days_left,
    COALESCE(f.istoxic, FALSE) AS has_toxic
    
  FROM line_clients lc
  LEFT JOIN factories f ON lc.uniformno = f.uniformno
  WHERE lc.line_user_id = user_line_id
  LIMIT 1;
  
  -- 如果沒找到（未綁定），回傳空結果
  -- n8n 會檢查結果是否為空來判斷是否綁定
END;
$$;

-- ================================================
-- 測試
-- ================================================
-- SELECT * FROM get_my_permits('Uxxxxxxxxxxxx');

-- ================================================
-- n8n 呼叫方式
-- ================================================
-- POST https://YOUR_PROJECT.supabase.co/rest/v1/rpc/get_my_permits
-- Headers: apikey, Authorization
-- Body: { "user_line_id": "Uxxxxxxxxxxxx" }
