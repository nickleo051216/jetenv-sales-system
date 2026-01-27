// 水污許可證查詢 API
// 使用環境部公開資料 EMS_S_03
// 可查詢：許可證號、起始日、截止日

export default async function handler(req, res) {
    const { taxId } = req.query;

    if (!taxId) {
        return res.status(400).json({
            found: false,
            error: '請提供統編'
        });
    }

    try {
        // 使用環境部環境資料開放平臺 API
        const API_KEY = process.env.MOENV_API_KEY || '7854a04b-f171-47bb-9e42-4dd2ecc4745b';
        const url = `https://data.moenv.gov.tw/api/v2/EMS_S_03?format=json&limit=1000&api_key=${API_KEY}`;

        console.log('🔍 查詢水污許可證:', taxId);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API 回應錯誤: ${response.status}`);
        }

        const data = await response.json();

        // 🔧 2025-01: 環境部 API 回傳格式已改為直接回傳陣列
        const allRecords = Array.isArray(data) ? data : (data.records || []);

        if (allRecords.length === 0) {
            return res.json({
                found: false,
                message: '無資料'
            });
        }

        // 過濾出符合統編的資料
        // 欄位名稱：營利事業統一編號
        const records = allRecords.filter(r => {
            const ban = r['營利事業統一編號'] || r['BAN'] || '';
            return ban === taxId;
        });

        if (records.length === 0) {
            return res.json({
                found: false,
                message: '查無此統編的水污許可資料'
            });
        }

        // 整理回傳資料
        // 欄位：許可證號、許可證起始日、許可證截止日、事業名稱、水污染防治許可種類
        const permits = records.map(r => ({
            permitNo: r['許可證號'] || r['PER_NO'] || '',
            startDate: r['許可證起始日'] || r['PER_SDATE'] || '',
            endDate: r['許可證截止日'] || r['PER_EDATE'] || '',     // ⭐ 到期日
            permitType: r['水污染防治許可種類'] || r['PER_TYPE'] || '',
            facilityName: r['事業名稱'] || r['FAC_NAME'] || '',
            address: r['實際廠（場）地址'] || r['FAC_ADDR'] || '',
            controlNo: r['管制事業編號'] || r['CTL_NO'] || ''
        }));

        // 找出最近到期的許可證
        const latestPermit = permits.reduce((latest, current) => {
            if (!latest.endDate) return current;
            if (!current.endDate) return latest;
            return new Date(current.endDate) > new Date(latest.endDate) ? current : latest;
        }, permits[0]);

        console.log('✅ 找到水污許可:', permits.length, '筆');

        return res.json({
            found: true,
            count: permits.length,
            latestEndDate: latestPermit.endDate,  // 最近的到期日
            data: permits
        });

    } catch (error) {
        console.error('❌ 水污許可查詢失敗:', error);
        return res.status(500).json({
            found: false,
            error: error.message
        });
    }
}
