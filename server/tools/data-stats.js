/**
 * 工具：資料統計摘要
 */

import supabase from '../lib/supabase.js';

export const definition = {
    type: 'function',
    function: {
        name: 'data_stats',
        description: '查看資料庫的統計摘要：各表的資料筆數、空污許可證各區分布、即將到期統計等。',
        parameters: {
            type: 'object',
            properties: {},
        },
    },
};

export async function execute() {
    const stats = {};

    // 各表筆數
    const tables = ['factories', 'air_permits', 'water_permits', 'toxic_permits', 'line_clients'];
    for (const table of tables) {
        try {
            const { count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            stats[table] = count || 0;
        } catch {
            stats[table] = '查詢失敗';
        }
    }

    // 空污各區分布
    try {
        const { data } = await supabase
            .from('air_permits')
            .select('county');

        if (data) {
            const countByCounty = {};
            data.forEach(row => {
                const key = row.county || '未知';
                countByCounty[key] = (countByCounty[key] || 0) + 1;
            });
            stats.airByCounty = countByCounty;
        }
    } catch { /* skip */ }

    return stats;
}
