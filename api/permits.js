// 許可證到期日整合查詢 API v2
// 查詢流程：統編 → EMS_S_01 取管編 → Supabase water_permits 用管編查許可到期日
// 
// 為什麼不直接用統編查 water_permits？
// 因為環境部 EMS_S_03 API 的 ban（統編）欄位大多是空的！
// 所以要先用 EMS_S_01 取得 ems_no（管編），再用管編查 water_permits

import { createClient } from '@supabase/supabase-js';

// 使用與 factories.js 相同的環境變數名稱
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const API_KEY = process.env.MOENV_API_KEY || '7854a04b-f171-47bb-9e42-4dd2ecc4745b';

// 初始化 Supabase
let supabase = null;
function getSupabase() {
    if (!supabase && supabaseUrl && supabaseKey) {
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

                // 整理工廠資料（包含解列日期）
                results.facilities = s01Data.records.map(r => ({
                    emsNo: r.emsno,
                    facilityName: r.facilityname,
                    address: r.facilityaddress,
                    county: r.county,
                    township: r.township,
                    industryName: r.industryname,
                    // 列管狀態
                    isAirControlled: r.isair === '1' || r.isair === 'Y',
                    isWaterControlled: r.iswater === '1' || r.iswater === 'Y',
                    isWasteControlled: r.iswaste === '1' || r.iswaste === 'Y',
                    isToxicControlled: r.istoxic === '1' || r.istoxic === 'Y',
                    isSoilControlled: r.issoil === '1' || r.issoil === 'Y',
                    // 解列日期（曾列管但已解列）- 欄位名稱來自 EMS_S_01 API
                    airDelistDate: r.airreleasedate || null,
                    waterDelistDate: r.waterreleasedate || null,
                    wasteDelistDate: r.wastereleasedate || null,
                    toxicDelistDate: r.toxicreleasedate || null,
                    soilDelistDate: r.soilreleasedate || null
                }));

                // 取得所有管編
                emsNoList = [...new Set(s01Data.records.map(r => r.emsno).filter(Boolean))];
                console.log('📋 管編列表:', emsNoList.join(', '));

                // 設定 summary（聚合所有工廠的列管狀態）
                // 🔥 修正：只要任一工廠有列管，就設為 true
                if (results.facilities.length > 0) {
                    // 找主要工廠（有行業別的那個）
                    const mainFactory = results.facilities.find(f => f.industryName) || results.facilities[0];

                    results.summary.controlNo = mainFactory.emsNo;
                    results.summary.facilityName = mainFactory.facilityName;

                    // 聚合所有工廠的列管狀態（任一為 true 就是 true）
                    results.summary.isAirControlled = results.facilities.some(f => f.isAirControlled);
                    results.summary.isWaterControlled = results.facilities.some(f => f.isWaterControlled);
                    results.summary.isWasteControlled = results.facilities.some(f => f.isWasteControlled);
                    results.summary.isToxicControlled = results.facilities.some(f => f.isToxicControlled);
                    results.summary.isSoilControlled = results.facilities.some(f => f.isSoilControlled);

                    // 聚合解列日期（找最新的解列日期）
                    const findLatestDelistDate = (field) => {
                        const dates = results.facilities
                            .map(f => f[field])
                            .filter(d => d && d !== 'null');
                        if (dates.length === 0) return null;
                        return dates.sort().reverse()[0]; // 最新日期
                    };

                    results.summary.airDelistDate = findLatestDelistDate('airDelistDate');
                    results.summary.waterDelistDate = findLatestDelistDate('waterDelistDate');
                    results.summary.wasteDelistDate = findLatestDelistDate('wasteDelistDate');
                    results.summary.toxicDelistDate = findLatestDelistDate('toxicDelistDate');
                    results.summary.soilDelistDate = findLatestDelistDate('soilDelistDate');

                    console.log('📊 聚合列管狀態:', {
                        air: results.summary.isAirControlled,
                        water: results.summary.isWaterControlled,
                        waste: results.summary.isWasteControlled,
                        toxic: results.summary.isToxicControlled,
                        toxicDelistDate: results.summary.toxicDelistDate
                    });
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

                // Debug log
                console.log('🔍 water_permits 查詢:', { banVariants, error: banError?.message, count: waterByBan?.length });

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
        // Step 2.5: 查 toxic_permits 表取得毒化物許可到期日
        // 先用統編查，沒結果再用管編查（有些工廠只有管編沒有統編）
        // ========================================
        if (getSupabase()) {
            try {
                // 準備兩種格式的統編：原始 + 去掉前導零
                const taxIdWithoutLeadingZeros = taxId.replace(/^0+/, '');
                const uniVariants = [taxId];
                if (taxIdWithoutLeadingZeros !== taxId) {
                    uniVariants.push(taxIdWithoutLeadingZeros);
                }

                // 先用 unino 查
                let { data: toxicPermits, error: toxicError } = await getSupabase()
                    .from('toxic_permits')
                    .select('*')
                    .in('unino', uniVariants);

                // 如果 unino 查不到，用 ban 查
                if ((!toxicPermits || toxicPermits.length === 0) && !toxicError) {
                    const { data: toxicByBan, error: banErr } = await getSupabase()
                        .from('toxic_permits')
                        .select('*')
                        .in('ban', uniVariants);
                    if (!banErr && toxicByBan) {
                        toxicPermits = toxicByBan;
                    }
                }


                // 如果統編查不到，用管編查（有些工廠只有管編沒有統編）
                if ((!toxicPermits || toxicPermits.length === 0) && emsNoList.length > 0) {
                    console.log('📋 用管編查毒化物許可:', emsNoList.join(', '));
                    const { data: toxicByEms, error: toxicByEmsError } = await getSupabase()
                        .from('toxic_permits')
                        .select('*')
                        .in('ems_no', emsNoList);

                    if (!toxicByEmsError && toxicByEms) {
                        toxicPermits = toxicByEms;
                    }
                }

                if (!toxicError && toxicPermits && toxicPermits.length > 0) {
                    console.log('✅ 找到毒化物許可:', toxicPermits.length, '筆');

                    results.toxic = {
                        found: true,
                        count: toxicPermits.length,
                        source: 'supabase',
                        permits: toxicPermits.map(p => ({
                            emsNo: p.ems_no,
                            permitNo: p.per_no,
                            startDate: p.sdate,
                            endDate: p.edate,
                            facilityName: p.fac_name,
                            chemicalName: p.emi_item,
                            status: p.per_status
                        }))
                    };

                    // 找最新到期的毒化物許可證
                    const validToxicPermits = toxicPermits.filter(p => p.edate);
                    if (validToxicPermits.length > 0) {
                        const latestToxic = validToxicPermits.reduce((latest, current) => {
                            return new Date(current.edate) > new Date(latest.edate) ? current : latest;
                        }, validToxicPermits[0]);

                        results.toxic.latestEndDate = latestToxic.edate;
                        results.summary.toxicPermitEndDate = latestToxic.edate;
                        results.summary.toxicPermitNo = latestToxic.per_no;
                    }
                }
            } catch (err) {
                console.error('毒化物許可查詢失敗:', err.message);
            }
        }

        // ========================================
        // Step 2.6: 查 air_permits 表取得空污操作許可到期日
        // 用管編查詢，expiry_date 是民國年格式（如：114/05/12）
        // ========================================
        if (getSupabase() && emsNoList.length > 0) {
            try {
                const { data: airPermits, error: airError } = await getSupabase()
                    .from('air_permits')
                    .select('*')
                    .in('ems_no', emsNoList);

                if (!airError && airPermits && airPermits.length > 0) {
                    console.log('✅ 找到空污許可:', airPermits.length, '筆');

                    // 民國年轉西元年的函數
                    const convertToWesternDate = (rocDate) => {
                        if (!rocDate) return null;
                        // 格式可能是 "114/05/12" 或 "114-05-12"
                        const parts = rocDate.replace(/-/g, '/').split('/');
                        if (parts.length === 3) {
                            const year = parseInt(parts[0]) + 1911;
                            const month = parts[1].padStart(2, '0');
                            const day = parts[2].padStart(2, '0');
                            return `${year}-${month}-${day}`;
                        }
                        return null;
                    };

                    // 更新 air 回傳結構
                    results.air = {
                        ...results.air,
                        permits: airPermits.map(p => ({
                            emsNo: p.ems_no,
                            permitNo: p.permit_no,
                            processName: p.process_name,
                            category: p.category,
                            effectiveDate: convertToWesternDate(p.effective_date),
                            expiryDate: convertToWesternDate(p.expiry_date),
                            expiryDateRoc: p.expiry_date,  // 保留原始民國年格式
                            facilityName: p.company_name,
                            address: p.address,
                            county: p.county
                        })),
                        source: 'supabase_air_permits'
                    };

                    // 找最新到期的空污許可證（只看「操作」類別）
                    const operationPermits = airPermits.filter(p =>
                        p.category === '操作' && p.expiry_date
                    );

                    if (operationPermits.length > 0) {
                        const latestAir = operationPermits.reduce((latest, current) => {
                            const latestDate = convertToWesternDate(latest.expiry_date);
                            const currentDate = convertToWesternDate(current.expiry_date);
                            if (!latestDate) return current;
                            if (!currentDate) return latest;
                            return new Date(currentDate) > new Date(latestDate) ? current : latest;
                        }, operationPermits[0]);

                        const westernDate = convertToWesternDate(latestAir.expiry_date);
                        results.air.latestEndDate = westernDate;
                        results.air.latestEndDateRoc = latestAir.expiry_date;
                        results.summary.airPermitEndDate = westernDate;
                        results.summary.airPermitEndDateRoc = latestAir.expiry_date;
                        results.summary.airPermitNo = latestAir.permit_no;
                    }
                }
            } catch (err) {
                console.error('空污許可查詢失敗:', err.message);
            }
        }

        // ========================================
        // Step 2.7: 備用方案 - 直接用統編查 air_permits
        // 當 EMS_S_01 API 查不到管編時使用
        // ========================================
        if ((!results.air?.permits || results.air.permits.length === 0) && getSupabase()) {
            try {
                // 準備兩種格式的統編：原始 + 去掉前導零
                const taxIdVariants = [taxId, taxId.replace(/^0+/, '')];

                const { data: airByUniformno, error: airUniError } = await getSupabase()
                    .from('air_permits')
                    .select('*')
                    .in('uniformno', taxIdVariants);

                if (!airUniError && airByUniformno && airByUniformno.length > 0) {
                    console.log('✅ 用統編直接找到空污許可:', airByUniformno.length, '筆');

                    // 民國年轉西元年
                    const convertMinguoToWestern = (rocDate) => {
                        if (!rocDate) return null;
                        const str = String(rocDate).trim();
                        // 已經是 ISO 格式
                        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
                        // 民國年格式
                        const parts = str.replace(/-/g, '/').split('/');
                        if (parts.length === 3) {
                            let year = parseInt(parts[0]);
                            if (year < 1911) year += 1911;
                            return `${year}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                        }
                        return null;
                    };

                    results.air = {
                        found: true,
                        permits: airByUniformno.map(p => ({
                            emsNo: p.ems_no,
                            expiryDate: convertMinguoToWestern(p.expiry_date),
                            expiryDateRoc: p.expiry_date,
                            facilityName: p.company_name,
                            address: p.address,
                            county: p.county
                        })),
                        source: 'supabase_uniformno'
                    };

                    // 找最新到期的許可證
                    const validPermits = airByUniformno.filter(p => p.expiry_date);
                    if (validPermits.length > 0) {
                        const latestAir = validPermits.reduce((latest, current) => {
                            const latestDate = convertMinguoToWestern(latest.expiry_date);
                            const currentDate = convertMinguoToWestern(current.expiry_date);
                            if (!latestDate) return current;
                            if (!currentDate) return latest;
                            return new Date(currentDate) > new Date(latestDate) ? current : latest;
                        }, validPermits[0]);

                        const westernDate = convertMinguoToWestern(latestAir.expiry_date);
                        results.air.latestEndDate = westernDate;
                        results.air.latestEndDateRoc = latestAir.expiry_date;
                        results.summary.airPermitEndDate = westernDate;
                        results.summary.airPermitEndDateRoc = latestAir.expiry_date;
                    }

                    results.found = true;
                }
            } catch (err) {
                console.error('用統編查 air_permits 失敗:', err.message);
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
