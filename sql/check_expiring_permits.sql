-- ================================================
-- 查詢即將到期許可證 + 只推給綁定客戶的完整 SQL
-- ================================================
/*
WITH expiring_permits AS (
  -- 💧 水污許可證
  SELECT 
    wp.ban as uniformno,
    wp.fac_name,
    wp.per_no,
    wp.per_edate as expiry_date,
    'water' as permit_type,
    '💧 水污許可' as permit_name
  FROM water_permits wp
  WHERE wp.per_edate BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '180 days')
  
  UNION ALL
  
  -- ☢️ 毒化物許可證
  SELECT 
    COALESCE(tp.unino, tp.ban) as uniformno,
    tp.fac_name,
    tp.per_no,
    tp.edate as expiry_date,
    'toxic' as permit_type,
    '☢️ 毒化物許可' as permit_name
  FROM toxic_permits tp
  WHERE tp.edate BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '180 days')
  
  UNION ALL
  
  -- 💨 空污許可證
  SELECT 
    f.uniformno,
    f.facilityname as fac_name,
    NULL as per_no,
    f.airreleasedate as expiry_date,
    'air' as permit_type,
    '💨 空污許可' as permit_name
  FROM factories f
  WHERE f.airreleasedate BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '180 days')
  
  UNION ALL
  
  -- 🗑️ 廢清書
  SELECT 
    f.uniformno,
    f.facilityname as fac_name,
    NULL as per_no,
    f.wastereleasedate as expiry_date,
    'waste' as permit_type,
    '🗑️ 廢清書' as permit_name
  FROM factories f
  WHERE f.wastereleasedate BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '180 days')
)
SELECT 
  lc.line_user_id,           -- 推播對象
  lc.line_display_name,
  ep.uniformno,
  ep.fac_name,
  ep.permit_type,
  ep.permit_name,
  ep.expiry_date,
  (ep.expiry_date - CURRENT_DATE) as days_until_expiry
FROM expiring_permits ep
INNER JOIN line_clients lc ON ep.uniformno = lc.uniformno
WHERE lc.is_active = TRUE
ORDER BY ep.expiry_date ASC;
*/
