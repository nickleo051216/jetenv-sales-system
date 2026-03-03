-- ================================================
-- regulations 表 - 申報項目資料庫
-- 用途：LINE Bot 申報查詢功能
-- ================================================

-- 1. 建立資料表
CREATE TABLE IF NOT EXISTS regulations (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,           -- air, water, waste, toxic, soil, factory
  category_name TEXT NOT NULL,      -- 顯示名稱：💨 空污
  item TEXT NOT NULL,               -- 項目名稱
  months INTEGER[] NOT NULL,        -- 適用月份 [1,4,7,10]
  deadline TEXT,                    -- 期限說明
  period TEXT,                      -- 申報期間
  law TEXT,                         -- 法規依據
  url TEXT,                         -- 法規連結
  warning TEXT,                     -- 注意事項
  tip TEXT,                         -- 業務小提示
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 啟用 RLS
ALTER TABLE regulations ENABLE ROW LEVEL SECURITY;

-- 3. 允許公開讀取
CREATE POLICY "Allow public read on regulations" 
ON regulations FOR SELECT USING (true);

-- ================================================
-- 4. 插入所有申報資料
-- ================================================

-- 💨 空污
INSERT INTO regulations (id, category, category_name, item, months, deadline, period, law, url, warning, tip) VALUES
('air-fee', 'air', '💨 空污', '空污費季報', ARRAY[1,4,7,10], '每季底前', '前一季排放量', '空氣污染防制費收費辦法 §3', 'https://oaout.moenv.gov.tw/law/LawContent.aspx?id=FL015371', '⚠️ 常見錯誤：誤引「空污防制法§74」，該條是罰則，非申報依據！', '逾期會被加徵滯納金。'),
('vocs-inspection', 'air', '💨 空污', 'VOCs設備元件檢測申報', ARRAY[1,4,7,10], '每季底前', '前一季檢測紀錄', '揮發性有機物空氣污染管制及排放標準 §33', 'https://oaout.moenv.gov.tw/law/LawContent.aspx?id=FL015377', '🚨 114年起洩漏標準加嚴：≥1,000 ppm', '檢測頻率變更是很好的商機切入點！'),
('air-permit', 'air', '💨 空污', '設置/操作許可證', ARRAY[]::INTEGER[], '動工前/營運前', '新設/變更時', '固定污染源設置操作及燃料使用許可證管理辦法', 'https://oaout.moenv.gov.tw/Law/LawContent.aspx?id=FL015356', '🚨 保命符：沒拿到設置許可證，絕對不能動工！', '💰 每5年展延 = 穩定回頭客');

-- 💧 廢水
INSERT INTO regulations (id, category, category_name, item, months, deadline, period, law, url, warning, tip) VALUES
('water-quarter', 'water', '💧 廢水', '廢水檢測申報（特定大型事業）', ARRAY[1,4,7,10], '每季底前', '前一季資料', '水污染防治措施及檢測申報管理辦法 §93', 'https://oaout.moenv.gov.tw/law/LawContent.aspx?id=FL040734', '⚠️ 水污法全文僅75條，沒有§93！正確是子法的§93', '很多客戶搞不清楚是一般還是特定。'),
('water-half', 'water', '💧 廢水', '廢水檢測申報（一般事業）', ARRAY[1,7], '1月底、7月底', '前半年資料', '水污染防治措施及檢測申報管理辦法 §93', 'https://oaout.moenv.gov.tw/law/LawContent.aspx?id=FL040734', NULL, '一般事業數量最多，是主要客群。'),
('water-fee', 'water', '💧 廢水', '水污費申報', ARRAY[1,7], '1月底、7月底', '前半年', '事業及污水下水道系統水污染防治費收費辦法 §14', 'https://oaout.moenv.gov.tw/law/LawContent.aspx?id=FL040165', '📌 費用未滿100元免繳納，但「仍需申報」！', NULL),
('water-permit', 'water', '💧 廢水', '水措計畫書/排放許可證', ARRAY[]::INTEGER[], '動工前/營運前', '新設/變更時', '水污染防治措施計畫及許可申請審查管理辦法', 'https://oaout.moenv.gov.tw/law/LawContent.aspx?id=GL005950', '🚨 保命符：沒拿到水措核准函，絕對不能動工！', '💰 每5年展延 = 穩定回頭客');

-- ☢️ 毒化物
INSERT INTO regulations (id, category, category_name, item, months, deadline, period, law, url, warning, tip) VALUES
('toxic-permit', 'toxic', '☢️ 毒化物', '許可證/登記/核可文件', ARRAY[]::INTEGER[], '效期5年', '申請、變更、展延', '毒性及關注化學物質許可登記核可管理辦法', 'https://oaout.moenv.gov.tw/law/LawContent.aspx?id=FL044795', '⚠️ 只有「核可」和「許可」才有5年效期', '💰 每5年展延 = 穩定回頭客'),
('toxic-record', 'toxic', '☢️ 毒化物', '運作紀錄申報', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], '每月', '運作紀錄', '毒性及關注化學物質運作與釋放量紀錄管理辦法', 'https://oaout.moenv.gov.tw/law/LawContent.aspx?id=FL044796', NULL, '每月申報是最頻繁的服務項目。');

-- 🗑️ 廢棄物
INSERT INTO regulations (id, category, category_name, item, months, deadline, period, law, url, warning, tip) VALUES
('waste-plan', 'waste', '🗑️ 廢棄物', '廢清書', ARRAY[]::INTEGER[], '設立時', '審查/展延', '事業廢棄物清理計畫書審查管理辦法', 'https://oaout.moenv.gov.tw/law/LawContent.aspx?id=FL015606', NULL, '💰 廢清書展延 = 穩定回頭客'),
('waste-storage', 'waste', '🗑️ 廢棄物', '貯存量月申報', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], '每月5日前', '前月底貯存量', '應以網路傳輸方式申報廢棄物之事業公告', 'https://oaout.moenv.gov.tw/law/LawContent.aspx?id=GL006044', '🚨 每月必須申報！', '最頻繁的申報服務項目。'),
('waste-manifest', 'waste', '🗑️ 廢棄物', '清運聯單申報', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12], '出廠前/處理後', '即時申報', '應以網路傳輸方式申報廢棄物之事業公告', 'https://oaout.moenv.gov.tw/law/LawContent.aspx?id=GL006044', '📌 廢棄前後都要申報，流向要透明！', NULL);

-- 🌍 土壤
INSERT INTO regulations (id, category, category_name, item, months, deadline, period, law, url, warning, tip) VALUES
('soil', 'soil', '🌍 土壤', '地下儲槽土壤氣體監測申報', ARRAY[1,5,9], '1/5/9月底前', '前4個月監測資料', '防止貯存系統污染地下水體設施及監測設備設置管理辦法 §16', 'https://oaout.moenv.gov.tw/law/LawContent.aspx?id=FL022348', '⚠️ 完整名稱要用對', '加油站是主要客群。');

-- 🏭 工廠
INSERT INTO regulations (id, category, category_name, item, months, deadline, period, law, url, warning, tip) VALUES
('factory', 'factory', '🏭 工廠', '工廠危險物品申報', ARRAY[1,7], '1月、7月', '製造、加工、使用紀錄', '工廠危險物品申報辦法 §11', 'https://law.moea.gov.tw/LawContent.aspx?id=FL056111', NULL, '這是經濟部的規定，不是環保署。');

-- ================================================
-- 5. 建立 RPC 函數：取得指定月份申報項目
-- ================================================

CREATE OR REPLACE FUNCTION get_monthly_regulations(target_month INTEGER DEFAULT NULL)
RETURNS TABLE (
  id TEXT,
  category TEXT,
  category_name TEXT,
  item TEXT,
  deadline TEXT,
  period TEXT,
  law TEXT,
  warning TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  check_month INTEGER;
BEGIN
  check_month := COALESCE(target_month, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER);
  
  RETURN QUERY
  SELECT 
    r.id,
    r.category,
    r.category_name,
    r.item,
    r.deadline,
    r.period,
    r.law,
    r.warning
  FROM regulations r
  WHERE check_month = ANY(r.months)
  ORDER BY r.category, r.item;
END;
$$;

-- ================================================
-- 6. 測試
-- ================================================

-- 查看所有資料
-- SELECT * FROM regulations;

-- 查詢 1 月申報項目
-- SELECT * FROM get_monthly_regulations(1);

-- 查詢當月申報項目
-- SELECT * FROM get_monthly_regulations();

-- ================================================
-- n8n 呼叫方式
-- ================================================
-- POST https://YOUR_PROJECT.supabase.co/rest/v1/rpc/get_monthly_regulations
-- Headers: apikey, Authorization
-- Body: { "target_month": 1 }  或 {}（當月）
