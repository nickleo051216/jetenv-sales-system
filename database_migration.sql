-- ============================================
-- 資料庫結構優化：增加流程階段追蹤
-- ============================================

-- 1. 新增 workflow_stage 欄位到 licenses 表
ALTER TABLE licenses 
ADD COLUMN workflow_stage TEXT DEFAULT '規劃階段',
ADD COLUMN next_action TEXT,
ADD COLUMN expected_date DATE;

-- 2. 更新現有資料（台積電範例廠）
UPDATE licenses 
SET 
  workflow_stage = CASE 
    WHEN type = 'air' THEN '環保局審查中'
    WHEN type = 'water' THEN '試車執行中'
    ELSE '正常營運'
  END,
  next_action = CASE
    WHEN type = 'air' THEN '追蹤空污許可審查進度'
    WHEN type = 'water' THEN '完成試車數據收集'
    ELSE '定期申報作業'
  END,
  expected_date = CASE
    WHEN type = 'air' THEN '2025-03-15'::date
    WHEN type = 'water' THEN '2025-02-28'::date
    ELSE NULL
  END
WHERE client_id IN (SELECT id FROM clients WHERE tax_id = '12345678');

-- 3. 修改 status 欄位的含義
-- status 現在只表示「證照有效性」
-- pending: 申請中/還沒取得
-- valid: 有效
-- expiring: 即將到期
-- expired: 已過期

UPDATE licenses
SET status = CASE
  WHEN type IN ('air', 'water') THEN 'pending'  -- 還在申請階段
  ELSE 'valid'  -- 已取得
END;

-- 4. 新增一些範例許可證（展示多許可證情況）
INSERT INTO licenses (client_id, type, name, workflow_stage, status, next_action, expected_date)
SELECT 
  id,
  'waste',
  '廢棄物清理計畫書',
  '正常營運',
  'valid',
  '每季定期申報',
  NULL
FROM clients WHERE tax_id = '12345678';

-- 5. 查詢測試：確認資料正確
SELECT 
  c.name AS 客戶名稱,
  l.type AS 許可證類型,
  l.name AS 許可證名稱,
  l.workflow_stage AS 流程階段,
  l.status AS 證照狀態,
  l.next_action AS 下一步動作,
  l.expected_date AS 預計日期,
  l.valid_until AS 有效期限
FROM licenses l
JOIN clients c ON l.client_id = c.id
WHERE c.tax_id = '12345678'
ORDER BY l.type;

-- 完成！現在資料庫結構更清晰了
