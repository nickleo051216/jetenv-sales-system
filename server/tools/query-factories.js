/**
 * 工具：查詢工廠資料
 */

import supabase from '../lib/supabase.js';

export const definition = {
    type: 'function',
    function: {
        name: 'query_factories',
        description: '查詢工廠資料。可用統編、管編、縣市、區域篩選，或查詢特定區域的工廠數量。',
        parameters: {
            type: 'object',
            properties: {
                taxId: {
                    type: 'string',
                    description: '統一編號（8碼）',
                },
                emsNo: {
                    type: 'string',
                    description: '管制編號',
                },
                county: {
                    type: 'string',
                    description: '縣市名稱（如：新北市、桃園市）',
                },
                district: {
                    type: 'string',
                    description: '區域名稱（如：土城區、板橋區）',
                },
                limit: {
                    type: 'number',
                    description: '最多回傳幾筆（預設 20）',
                },
            },
        },
    },
};

export async function execute({ taxId, emsNo, county, district, limit = 20 }) {
    let query = supabase
        .from('factories')
        .select('emsno, uniformno, facilityname, county, township, industryname, isair, iswater, iswaste, istoxic');

    if (taxId) query = query.eq('uniformno', taxId);
    if (emsNo) query = query.eq('emsno', emsNo);
    if (county) query = query.eq('county', county);
    if (district) query = query.eq('township', district);

    query = query.limit(Math.min(limit, 100));

    const { data, error, count } = await query;

    if (error) return { error: error.message };

    // 如果是區域查詢，同時回傳計數
    if (county || district) {
        let countQuery = supabase
            .from('factories')
            .select('*', { count: 'exact', head: true });

        if (county) countQuery = countQuery.eq('county', county);
        if (district) countQuery = countQuery.eq('township', district);

        const { count: total } = await countQuery;

        return {
            total,
            showing: data?.length || 0,
            factories: data || [],
        };
    }

    return {
        count: data?.length || 0,
        factories: data || [],
    };
}
