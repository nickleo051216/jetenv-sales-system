/**
 * 工具：查詢申報項目期限
 */

import supabase from '../lib/supabase.js';

export const definition = {
    type: 'function',
    function: {
        name: 'query_regulations',
        description: '查詢指定月份的環保申報項目和期限。包含空污、水污、廢棄物、毒化物等各類申報規定。',
        parameters: {
            type: 'object',
            properties: {
                month: {
                    type: 'number',
                    description: '查詢哪個月份（1-12），不指定則查當月',
                },
                category: {
                    type: 'string',
                    enum: ['air', 'water', 'waste', 'toxic', 'soil', 'factory', 'all'],
                    description: '申報類別（預設 all）',
                },
            },
        },
    },
};

export async function execute({ month, category = 'all' }) {
    const targetMonth = month || (new Date().getMonth() + 1);

    // 嘗試用 RPC 函式
    try {
        const { data, error } = await supabase.rpc('get_monthly_regulations', {
            target_month: targetMonth,
        });

        if (!error && data) {
            let filtered = data;
            if (category !== 'all') {
                filtered = data.filter(r => r.category === category);
            }
            return {
                month: targetMonth,
                count: filtered.length,
                regulations: filtered,
            };
        }
    } catch (_) { /* fallback below */ }

    // Fallback: 直接查表
    let query = supabase
        .from('regulations')
        .select('*')
        .contains('months', [targetMonth]);

    if (category !== 'all') {
        query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) return { error: error.message };

    return {
        month: targetMonth,
        count: data?.length || 0,
        regulations: data || [],
    };
}
