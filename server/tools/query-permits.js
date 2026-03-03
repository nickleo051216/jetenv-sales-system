/**
 * 工具：用統編查詢所有許可證到期日
 * 邏輯複製自 api/permits.js
 */

import axios from 'axios';
import config from '../config.js';
import supabase from '../lib/supabase.js';

/**
 * 民國年 → 西元年
 */
function rocToWestern(rocDate) {
    if (!rocDate) return null;
    const str = String(rocDate).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    const parts = str.replace(/-/g, '/').split('/');
    if (parts.length === 3) {
        let year = parseInt(parts[0]);
        if (year < 1911) year += 1911;
        return `${year}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return null;
}

export const definition = {
    type: 'function',
    function: {
        name: 'query_permits',
        description: '用統一編號（8碼）查詢該公司所有許可證到期日，包含空污、水污、毒化物許可證。回傳各類許可證的最新到期日和列管狀態。',
        parameters: {
            type: 'object',
            properties: {
                taxId: {
                    type: 'string',
                    description: '公司統一編號（8碼數字）',
                },
            },
            required: ['taxId'],
        },
    },
};

export async function execute({ taxId }) {
    if (!taxId || taxId.length !== 8) {
        return { error: '請提供有效的 8 碼統編' };
    }

    const result = {
        taxId,
        found: false,
        facilities: [],
        summary: {},
    };

    // Step 1: EMS_S_01 取管編 + 列管狀態
    let emsNoList = [];
    try {
        const url = `https://data.moenv.gov.tw/api/v2/EMS_S_01?format=json&limit=50&filters=uniformno,EQ,${taxId}&api_key=${config.moenvApiKey}`;
        const res = await axios.get(url, { timeout: 15000 });
        const records = Array.isArray(res.data) ? res.data : (res.data.records || []);

        if (records.length > 0) {
            result.found = true;
            result.facilities = records.map(r => ({
                emsNo: r.emsno,
                name: r.facilityname,
                county: r.county,
                township: r.township,
                isAir: r.isair === '1' || r.isair === 'Y',
                isWater: r.iswater === '1' || r.iswater === 'Y',
                isWaste: r.iswaste === '1' || r.iswaste === 'Y',
                isToxic: r.istoxic === '1' || r.istoxic === 'Y',
            }));
            emsNoList = [...new Set(records.map(r => r.emsno).filter(Boolean))];

            const main = result.facilities.find(f => f.name) || result.facilities[0];
            result.summary.facilityName = main.name;
            result.summary.controlNo = main.emsNo;
        }
    } catch (err) {
        result.emsApiError = err.message;
    }

    const taxIdVariants = [taxId, taxId.replace(/^0+/, '')];

    // Step 2: 水污許可證
    try {
        let waterData = null;
        // 先用統編查
        const { data: byBan } = await supabase
            .from('water_permits')
            .select('ems_no, per_no, per_sdate, per_edate, per_type, fac_name')
            .in('ban', taxIdVariants);

        if (byBan?.length > 0) {
            waterData = byBan;
        } else if (emsNoList.length > 0) {
            // 再用管編查
            const { data: byEms } = await supabase
                .from('water_permits')
                .select('ems_no, per_no, per_sdate, per_edate, per_type, fac_name')
                .in('ems_no', emsNoList);
            if (byEms?.length > 0) waterData = byEms;
        }

        if (waterData) {
            const valid = waterData.filter(p => p.per_edate);
            if (valid.length > 0) {
                const latest = valid.reduce((a, b) =>
                    new Date(b.per_edate) > new Date(a.per_edate) ? b : a
                );
                result.summary.waterPermitEndDate = latest.per_edate;
                result.summary.waterPermitNo = latest.per_no;
            }
            result.summary.waterPermitCount = waterData.length;
        }
    } catch (_) { /* skip */ }

    // Step 3: 毒化物許可證
    try {
        let toxicData = null;
        const { data: byUni } = await supabase
            .from('toxic_permits')
            .select('ems_no, per_no, edate, emi_item, per_status')
            .in('unino', taxIdVariants);

        if (byUni?.length > 0) {
            toxicData = byUni;
        } else {
            const { data: byBan } = await supabase
                .from('toxic_permits')
                .select('ems_no, per_no, edate, emi_item, per_status')
                .in('ban', taxIdVariants);
            if (byBan?.length > 0) toxicData = byBan;
        }

        if (!toxicData && emsNoList.length > 0) {
            const { data: byEms } = await supabase
                .from('toxic_permits')
                .select('ems_no, per_no, edate, emi_item, per_status')
                .in('ems_no', emsNoList);
            if (byEms?.length > 0) toxicData = byEms;
        }

        if (toxicData) {
            const valid = toxicData.filter(p => p.edate);
            if (valid.length > 0) {
                const latest = valid.reduce((a, b) =>
                    new Date(b.edate) > new Date(a.edate) ? b : a
                );
                result.summary.toxicPermitEndDate = latest.edate;
                result.summary.toxicPermitNo = latest.per_no;
            }
            result.summary.toxicPermitCount = toxicData.length;
        }
    } catch (_) { /* skip */ }

    // Step 4: 空污許可證
    try {
        let airData = null;
        if (emsNoList.length > 0) {
            const { data } = await supabase
                .from('air_permits')
                .select('ems_no, permit_no, process_name, category, expiry_date, company_name')
                .in('ems_no', emsNoList);
            if (data?.length > 0) airData = data;
        }

        if (!airData) {
            const { data } = await supabase
                .from('air_permits')
                .select('ems_no, permit_no, process_name, category, expiry_date, company_name')
                .in('uniformno', taxIdVariants);
            if (data?.length > 0) airData = data;
        }

        if (airData) {
            const operations = airData.filter(p => p.category === '操作' && p.expiry_date);
            if (operations.length > 0) {
                const latest = operations.reduce((a, b) => {
                    const da = rocToWestern(a.expiry_date);
                    const db = rocToWestern(b.expiry_date);
                    if (!da) return b;
                    if (!db) return a;
                    return new Date(db) > new Date(da) ? b : a;
                });
                result.summary.airPermitEndDate = rocToWestern(latest.expiry_date);
                result.summary.airPermitEndDateRoc = latest.expiry_date;
                result.summary.airPermitNo = latest.permit_no;
            }
            result.summary.airPermitCount = airData.length;
            result.found = true;
        }
    } catch (_) { /* skip */ }

    // Step 5: factories 補充
    try {
        const { data: factories } = await supabase
            .from('factories')
            .select('waterreleasedate, wastereleasedate, airreleasedate, toxicreleasedate')
            .eq('uniformno', taxId);

        if (factories?.length > 0) {
            const f = factories[0];
            if (!result.summary.waterPermitEndDate && f.waterreleasedate) {
                result.summary.waterPermitEndDate = f.waterreleasedate;
            }
            if (f.wastereleasedate) {
                result.summary.wastePermitEndDate = f.wastereleasedate;
            }
        }
    } catch (_) { /* skip */ }

    return result;
}
