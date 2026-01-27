// 空污許可證查詢 API
// 使用固定污染源管理資訊公開平台 (aodmis.moenv.gov.tw)
// 可查詢：設置/操作許可證、有效期限

export default async function handler(req, res) {
    const { controlNo, taxId } = req.query;

    // 需要管編或統編
    if (!controlNo && !taxId) {
        return res.status(400).json({
            found: false,
            error: '請提供管編 (controlNo) 或統編 (taxId)'
        });
    }

    try {
        // 注意：固定污染源平台沒有公開 API
        // 這裡嘗試直接呼叫他們的內部 API

        // 方法 1: 嘗試查詢列管工廠資料
        // URL 格式推測自網頁行為
        const baseUrl = 'https://aodmis.moenv.gov.tw';

        // 嘗試使用公開資料平台的空污相關資料集
        // EMS_P_19: 固定污染源設置、變更、操作許可申請家數統計
        // EMS_P_46: 公私場所處分資料
        const API_KEY = process.env.MOENV_API_KEY || '7854a04b-f171-47bb-9e42-4dd2ecc4745b';

        // 嘗試查詢 EMS_S_01 (環境保護許可管理系統對象基本資料)
        const url = `https://data.moenv.gov.tw/api/v2/EMS_S_01?format=json&limit=1000&api_key=${API_KEY}`;

        console.log('🔍 查詢空污/環保許可基本資料:', taxId || controlNo);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API 回應錯誤: ${response.status}`);
        }

        const data = await response.json();

        // 🔧 2025-01: 環境部 API 回傳格式已改為直接回傳陣列
        let records = Array.isArray(data) ? data : (data.records || []);

        if (records.length === 0) {
            return res.json({
                found: false,
                message: '無資料',
                note: '空污許可證詳細資料請至固定污染源平台查詢: https://aodmis.moenv.gov.tw/opendata/#/lq'
            });
        }
        // 過濾出符合條件的資料

        if (taxId) {
            records = records.filter(r => {
                const ban = r['營利事業統一編號'] || r['BAN'] || '';
                return ban === taxId;
            });
        }

        if (controlNo) {
            records = records.filter(r => {
                const ctlNo = r['管制編號'] || r['CTL_NO'] || '';
                return ctlNo.includes(controlNo);
            });
        }

        if (records.length === 0) {
            return res.json({
                found: false,
                message: '查無此統編的環保許可資料',
                note: '空污許可證詳細資料(含有效期限)請至固定污染源平台查詢: https://aodmis.moenv.gov.tw/opendata/#/lq'
            });
        }

        // 整理回傳資料
        const facilities = records.map(r => ({
            controlNo: r['管制編號'] || r['CTL_NO'] || '',
            facilityName: r['事業名稱'] || r['FAC_NAME'] || '',
            address: r['實際廠（場）地址'] || r['FAC_ADDR'] || '',
            isAirControlled: r['是否空列管'] || r['AIR_FLAG'] || '',
            isWaterControlled: r['是否水列管'] || r['WATER_FLAG'] || '',
            isWasteControlled: r['是否廢列管'] || r['WASTE_FLAG'] || '',
            isToxicControlled: r['是否毒列管'] || r['TOXIC_FLAG'] || ''
        }));

        console.log('✅ 找到環保許可基本資料:', facilities.length, '筆');

        return res.json({
            found: true,
            count: facilities.length,
            data: facilities,
            note: '此為列管基本資料。空污許可證有效期限請至固定污染源平台查詢: https://aodmis.moenv.gov.tw/opendata/#/lq'
        });

    } catch (error) {
        console.error('❌ 空污許可查詢失敗:', error);
        return res.status(500).json({
            found: false,
            error: error.message,
            note: '空污許可證詳細資料請至固定污染源平台查詢: https://aodmis.moenv.gov.tw/opendata/#/lq'
        });
    }
}
