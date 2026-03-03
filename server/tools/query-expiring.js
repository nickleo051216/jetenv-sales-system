/**
 * 工具：查詢即將到期的許可證
 */

import supabase from '../lib/supabase.js';

export const definition = {
    type: 'function',
    function: {
        name: 'query_expiring',
        description: '查詢即將到期的許可證清單。可指定天數範圍（預設 90 天）和許可證類型（air/water/toxic/all）。',
        parameters: {
            type: 'object',
            properties: {
                days: {
                    type: 'number',
                    description: '查詢未來幾天內到期的許可證（預設 90）',
                },
                type: {
                    type: 'string',
                    enum: ['air', 'water', 'toxic', 'all'],
                    description: '許可證類型：air=空污, water=水污, toxic=毒化物, all=全部（預設 all）',
                },
            },
        },
    },
};

/**
 * 民國年 → ISO 日期
 */
function rocToIso(rocDate) {
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

export async function execute({ days = 90, type = 'all' }) {
    const now = new Date();
    const deadline = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const deadlineStr = deadline.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    const results = { days, deadline: deadlineStr, permits: [] };

    // 水污許可證
    if (type === 'all' || type === 'water') {
        try {
            const { data } = await supabase
                .from('water_permits')
                .select('ems_no, fac_name, per_no, per_edate, address')
                .gte('per_edate', todayStr)
                .lte('per_edate', deadlineStr)
                .order('per_edate');

            if (data) {
                results.permits.push(...data.map(p => ({
                    type: '水污',
                    emsNo: p.ems_no,
                    company: p.fac_name,
                    permitNo: p.per_no,
                    expiryDate: p.per_edate,
                })));
            }
        } catch (_) { /* skip */ }
    }

    // 毒化物許可證
    if (type === 'all' || type === 'toxic') {
        try {
            const { data } = await supabase
                .from('toxic_permits')
                .select('ems_no, fac_name, per_no, edate, emi_item')
                .gte('edate', todayStr)
                .lte('edate', deadlineStr)
                .order('edate');

            if (data) {
                results.permits.push(...data.map(p => ({
                    type: '毒化物',
                    emsNo: p.ems_no,
                    company: p.fac_name,
                    permitNo: p.per_no,
                    expiryDate: p.edate,
                    chemical: p.emi_item,
                })));
            }
        } catch (_) { /* skip */ }
    }

    // 空污許可證（expiry_date 是民國年格式，需特殊處理）
    if (type === 'all' || type === 'air') {
        try {
            const { data } = await supabase
                .from('air_permits')
                .select('ems_no, company_name, permit_no, expiry_date, category, county');

            if (data) {
                const filtered = data.filter(p => {
                    const iso = rocToIso(p.expiry_date);
                    if (!iso) return false;
                    return iso >= todayStr && iso <= deadlineStr;
                });

                results.permits.push(...filtered.map(p => ({
                    type: '空污',
                    emsNo: p.ems_no,
                    company: p.company_name,
                    permitNo: p.permit_no,
                    expiryDate: rocToIso(p.expiry_date),
                    expiryDateRoc: p.expiry_date,
                    category: p.category,
                    county: p.county,
                })));
            }
        } catch (_) { /* skip */ }
    }

    // 按到期日排序
    results.permits.sort((a, b) => (a.expiryDate || '').localeCompare(b.expiryDate || ''));
    results.totalCount = results.permits.length;

    return results;
}
