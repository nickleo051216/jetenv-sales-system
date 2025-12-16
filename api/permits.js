// 許可證到期日整合查詢 API v2
// 查詢流程：統編 → EMS_S_01 取管編 → Supabase water_permits 用管編查許可到期日
// 
// 為什麼不直接用統編查 water_permits？
// 因為環境部 EMS_S_03 API 的 ban（統編）欄位大多是空的！
// 所以要先用 EMS_S_01 取得 ems_no（管編），再用管編查 water_permits

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yeimehdcguwnwzkmopsu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_KEY = process.env.MOENV_API_KEY || '7854a04b-f171-47bb-9e42-4dd2ecc4745b';

// 延遲初始化 Supabase，避免 key 為空時報錯
let supabase = null;
function getSupabase() {
    if (!supabase && supabaseKey) {
        supabase = createClient(supabaseUrl, supabaseKey);
    }
    return supabase;
}

export default async function handler(req, res) {
    const { taxId } = req.query;

    if (!taxId || taxId.length !== 8) {
        return res.status(400).json({
            found: false,
            error: '請提供有效的 8 碼統編'
        });
    }

    const results = {
        taxId,
        found: false,
        water: null,
        air: null,
        facilities: [],  // 工廠列表（含管編）
        summary: {}
    };

    try {
        console.log('🔍 查詢許可證到期日:', taxId);

        // ========================================
        // Step 1: 用統編查 EMS_S_01 取得管編列表 + 列管狀態
        // ========================================
        let emsNoList = [];

        try {
            const s01Url = `https://data.moenv.gov.tw/api/v2/EMS_S_01?format=json&limit=50&filters=uniformno,EQ,${taxId}&api_key=${API_KEY}`;
            const s01Res = await fetch(s01Url);
            const s01Data = await s01Res.json();

            if (s01Data.records && s01Data.records.length > 0) {
                console.log('✅ EMS_S_01 找到', s01Data.records.length, '筆工廠資料');

                results.found = true;

                // 整理工廠資料
                results.facilities = s01Data.records.map(r => ({
                    emsNo: r.emsno,
                    facilityName: r.facilityname,
                    address: r.facilityaddress,
                    county: r.county,
                    township: r.township,
                    industryName: r.industryname,
                    isAirControlled: r.isair === '1' || r.isair === 'Y',
                    isWaterControlled: r.iswater === '1' || r.iswater === 'Y',
                    isWasteControlled: r.iswaste === '1' || r.iswaste === 'Y',
                    isToxicControlled: r.istoxic === '1' || r.istoxic === 'Y',
                    isSoilControlled: r.issoil === '1' || r.issoil === 'Y'
                }));

                // 取得所有管編
                emsNoList = [...new Set(s01Data.records.map(r => r.emsno).filter(Boolean))];
                console.log('📋 管編列表:', emsNoList.join(', '));

                // 設定 summary（用第一個工廠的資訊）
                if (results.facilities.length > 0) {
                    const f = results.facilities[0];
                    results.summary.controlNo = f.emsNo;
                    results.summary.facilityName = f.facilityName;
                    results.summary.isAirControlled = f.isAirControlled;
                    results.summary.isWaterControlled = f.isWaterControlled;
                    results.summary.isWasteControlled = f.isWasteControlled;
                    results.summary.isToxicControlled = f.isToxicControlled;
                    results.summary.isSoilControlled = f.isSoilControlled;
                }

                // 設定 air（相容舊格式）
                results.air = {
                    found: true,
                    count: results.facilities.length,
                    facilities: results.facilities,
                    note: '空污許可證有效期限請至 https://aodmis.moenv.gov.tw/opendata/#/lq 查詢'
                };
            } else {
                console.log('⚠️ EMS_S_01 查無此統編資料');
            }
        } catch (err) {
            console.error('❌ EMS_S_01 查詢失敗:', err.message);
        }

        // ========================================
        // Step 1.5: 優先用統編直接查 Supabase water_permits
        // （因為你同步的 Sheets 資料有統編！）
        // 注意：Sheets 可能把統編當數字存，前導零會被去掉
        // ========================================
        if (getSupabase()) {
            try {
                // 準備兩種格式的統編：原始 + 去掉前導零
                const taxIdWithoutLeadingZeros = taxId.replace(/^0+/, '');
                const banVariants = [taxId];
                if (taxIdWithoutLeadingZeros !== taxId) {
                    banVariants.push(taxIdWithoutLeadingZeros);
                }

                const { data: waterByBan, error: banError } = await getSupabase()
                    .from('water_permits')
                    .select('*')
                    .in('ban', banVariants);  // 同時查兩種格式

                if (!banError && waterByBan && waterByBan.length > 0) {
                    console.log('✅ 用統編直接找到水污許可:', waterByBan.length, '筆');

                    results.water = {
                        found: true,
                        count: waterByBan.length,
                        source: 'supabase_ban',
                        permits: waterByBan.map(p => ({
                            emsNo: p.ems_no,
                            permitNo: p.per_no,
                            startDate: p.per_sdate,
                            endDate: p.per_edate,
                            permitType: p.per_type,
                            facilityName: p.fac_name,
                            address: p.address
                        }))
                    };

                    // 找最新到期的許可證
                    const validPermits = waterByBan.filter(p => p.per_edate);
                    if (validPermits.length > 0) {
                        const latestPermit = validPermits.reduce((latest, current) => {
                            return new Date(current.per_edate) > new Date(latest.per_edate) ? current : latest;
                        }, validPermits[0]);

                        results.water.latestEndDate = latestPermit.per_edate;
                        results.summary.waterPermitEndDate = latestPermit.per_edate;
                        results.summary.waterPermitNo = latestPermit.per_no;
                    }
                }
            } catch (err) {
                console.error('用統編查 water_permits 失敗:', err.message);
            }
        }

        // ========================================
        // Step 2: 如果統編找不到，用管編查 Supabase water_permits
        // ========================================
        if (!results.water?.found && emsNoList.length > 0 && getSupabase()) {
            try {
                const { data: waterPermits, error: supabaseError } = await getSupabase()
                    .from('water_permits')
                    .select('*')
                    .in('ems_no', emsNoList);

                if (!supabaseError && waterPermits && waterPermits.length > 0) {
                    console.log('✅ Supabase water_permits 找到', waterPermits.length, '筆');

                    results.water = {
                        found: true,
                        count: waterPermits.length,
                        source: 'supabase',
                        permits: waterPermits.map(p => ({
                            emsNo: p.ems_no,
                            permitNo: p.per_no,
                            startDate: p.per_sdate,
                            endDate: p.per_edate,
                            permitType: p.per_type,
                            facilityName: p.fac_name,
                            address: p.address
                        }))
                    };

                    // 找最新到期的許可證（最晚到期 = 最重要）
                    const validPermits = waterPermits.filter(p => p.per_edate);
                    if (validPermits.length > 0) {
                        const latestPermit = validPermits.reduce((latest, current) => {
                            return new Date(current.per_edate) > new Date(latest.per_edate) ? current : latest;
                        }, validPermits[0]);

                        results.water.latestEndDate = latestPermit.per_edate;
                        results.summary.waterPermitEndDate = latestPermit.per_edate;
                        results.summary.waterPermitNo = latestPermit.per_no;
                    }
                } else {
                    console.log('⚠️ Supabase water_permits 查無資料（請先執行 n8n 同步）');
                    results.water = {
                        found: false,
                        message: '尚未同步水污許可資料，請執行 n8n 工作流'
                    };
                }
            } catch (err) {
                console.error('❌ Supabase 查詢失敗:', err.message);
            }
        }

        // ========================================
        // Step 3: 查 factories 表補充資料（你自己維護的）
        // ========================================
        if (getSupabase()) {
            try {
                const { data: factories, error: factoriesError } = await getSupabase()
                    .from('factories')
                    .select('*')
                    .eq('uniformno', taxId);

                if (!factoriesError && factories && factories.length > 0) {
                    console.log('✅ factories 表找到', factories.length, '筆');

                    const factory = factories[0];

                    // 如果 water_permits 沒有到期日，用 factories 的 waterreleasedate
                    if (!results.summary.waterPermitEndDate && factory.waterreleasedate) {
                        results.summary.waterPermitEndDate = factory.waterreleasedate;
                        results.summary.waterPermitSource = 'factories';
                    }

                    // 補充其他許可證到期日
                    if (factory.airreleasedate) {
                        results.summary.airPermitEndDate = factory.airreleasedate;
                    }
                    if (factory.wastereleasedate) {
                        results.summary.wastePermitEndDate = factory.wastereleasedate;
                    }
                    if (factory.toxicreleasedate) {
                        results.summary.toxicPermitEndDate = factory.toxicreleasedate;
                    }
                }
            } catch (err) {
                console.error('factories 表查詢失敗:', err.message);
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
