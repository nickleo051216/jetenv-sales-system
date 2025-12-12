import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase 客戶端（使用環境變數）
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 環境變數未設定');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * factories API - 查詢工廠資料
 * GET /api/factories?taxId=12345678
 * 
 * 功能：根據統編查詢 Supabase factories 資料表
 * 回傳：該統編的所有工廠資料（包含委託項目、行業別等）
 */
export default async function handler(req, res) {
    // 只允許 GET 請求
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { taxId } = req.query;

    // 驗證統編
    if (!taxId) {
        return res.status(400).json({
            error: 'Missing taxId parameter',
            found: false
        });
    }

    if (taxId.length !== 8) {
        return res.status(400).json({
            error: 'Invalid taxId format (must be 8 digits)',
            found: false
        });
    }

    try {
        // 查詢 factories 資料表（根據 uniformno）
        const { data, error } = await supabase
            .from('factories')
            .select('*')
            .eq('uniformno', taxId);

        if (error) {
            console.error('❌ Supabase 查詢錯誤:', error);
            return res.status(500).json({
                error: 'Database query failed',
                details: error.message,
                found: false
            });
        }

        // 如果沒有找到任何工廠資料
        if (!data || data.length === 0) {
            return res.status(200).json({
                found: false,
                message: '查無此統編的工廠登記資料',
                data: null
            });
        }

        // 格式化回傳資料
        const factories = data.map(factory => ({
            // 基本資訊
            emsno: factory.emsno,
            facilityName: factory.facilityname,
            uniformNo: factory.uniformno,

            // 地理資訊
            county: factory.county,
            township: factory.township,
            address: factory.facilityaddress,
            industryAreaName: factory.industryareaname,

            // 產業資訊
            industryId: factory.industryid,
            industryName: factory.industryname,

            // 委託項目（布林值）
            licenses: {
                air: factory.isair === true || factory.isair === 1,
                water: factory.iswater === true || factory.iswater === 1,
                waste: factory.iswaste === true || factory.iswaste === 1,
                toxic: factory.istoxic === true || factory.istoxic === 1,
                soil: factory.issoil === true || factory.issoil === 1,
            },

            // 業務資訊
            consultantCompany: factory.consultant_company,
            phone: factory.phone,
            renewalYear: factory.renewal_year,
            notes: factory.notes,

            // 資料來源
            dataSource: factory.data_source,
            createdAt: factory.created_at
        }));

        // 成功回傳
        return res.status(200).json({
            found: true,
            count: factories.length,
            data: factories.length === 1 ? factories[0] : factories,
            multiple: factories.length > 1
        });

    } catch (err) {
        console.error('❌ API 錯誤:', err);
        return res.status(500).json({
            error: 'Internal server error',
            details: err.message,
            found: false
        });
    }
}
