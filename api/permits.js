// 許可證到期日整合查詢 API
// 整合水污許可 + 空污/環保許可基本資料

export default async function handler(req, res) {
    const { taxId } = req.query;

    if (!taxId || taxId.length !== 8) {
        return res.status(400).json({
            found: false,
            error: '請提供有效的 8 碼統編'
        });
    }

    const API_KEY = process.env.MOENV_API_KEY || '7854a04b-f171-47bb-9e42-4dd2ecc4745b';

    const results = {
        taxId,
        found: false,
        water: null,
        air: null,
        summary: {}
    };

    try {
        console.log('🔍 查詢許可證到期日:', taxId);

        // 同時查詢水污許可 + 環保許可基本資料
        const [waterRes, airRes] = await Promise.all([
            // 水污許可 (EMS_S_03)
            fetch(`https://data.moenv.gov.tw/api/v2/EMS_S_03?format=json&limit=1000&api_key=${API_KEY}`)
                .then(r => r.json())
                .catch(e => ({ error: e.message })),

            // 環保許可基本資料 (EMS_S_01)
            fetch(`https://data.moenv.gov.tw/api/v2/EMS_S_01?format=json&limit=1000&api_key=${API_KEY}`)
                .then(r => r.json())
                .catch(e => ({ error: e.message }))
        ]);

        // 處理水污許可資料
        if (waterRes.records && !waterRes.error) {
            const waterRecords = waterRes.records.filter(r =>
                (r['營利事業統一編號'] || '') === taxId
            );

            if (waterRecords.length > 0) {
                results.found = true;
                const permits = waterRecords.map(r => ({
                    permitNo: r['許可證號'] || '',
                    startDate: r['許可證起始日'] || '',
                    endDate: r['許可證截止日'] || '',
                    permitType: r['水污染防治許可種類'] || '',
                    facilityName: r['事業名稱'] || ''
                }));

                // 找最近到期的許可證
                const latestWater = permits.reduce((latest, current) => {
                    if (!latest.endDate) return current;
                    if (!current.endDate) return latest;
                    return new Date(current.endDate) > new Date(latest.endDate) ? current : latest;
                }, permits[0]);

                results.water = {
                    found: true,
                    count: permits.length,
                    latestEndDate: latestWater.endDate,
                    permits
                };

                results.summary.waterPermitEndDate = latestWater.endDate;
            }
        }

        // 處理環保許可基本資料
        if (airRes.records && !airRes.error) {
            const airRecords = airRes.records.filter(r =>
                (r['營利事業統一編號'] || '') === taxId
            );

            if (airRecords.length > 0) {
                results.found = true;
                const facilities = airRecords.map(r => ({
                    controlNo: r['管制編號'] || '',
                    facilityName: r['事業名稱'] || '',
                    address: r['實際廠（場）地址'] || '',
                    isAirControlled: r['是否空列管'] === 'Y' || r['是否空列管'] === '是',
                    isWaterControlled: r['是否水列管'] === 'Y' || r['是否水列管'] === '是',
                    isWasteControlled: r['是否廢列管'] === 'Y' || r['是否廢列管'] === '是',
                    isToxicControlled: r['是否毒列管'] === 'Y' || r['是否毒列管'] === '是'
                }));

                results.air = {
                    found: true,
                    count: facilities.length,
                    facilities,
                    note: '空污許可證有效期限請至 https://aodmis.moenv.gov.tw/opendata/#/lq 查詢'
                };

                // 將列管資訊加入摘要
                if (facilities.length > 0) {
                    const f = facilities[0];
                    results.summary.controlNo = f.controlNo;
                    results.summary.isAirControlled = f.isAirControlled;
                    results.summary.isWaterControlled = f.isWaterControlled;
                    results.summary.isWasteControlled = f.isWasteControlled;
                    results.summary.isToxicControlled = f.isToxicControlled;
                }
            }
        }

        console.log('✅ 許可證查詢完成:', results.found ? '有資料' : '無資料');

        return res.json(results);

    } catch (error) {
        console.error('❌ 許可證查詢失敗:', error);
        return res.status(500).json({
            found: false,
            error: error.message
        });
    }
}
