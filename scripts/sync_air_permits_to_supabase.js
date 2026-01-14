/**
 * 同步 air_permits.xlsx 總表 → Supabase air_permits 表
 * 
 * 執行方式：
 * node scripts/sync_air_permits_to_supabase.js
 * 
 * 功能：
 * 1. 讀取本地 air_permits.xlsx 的「總表」
 * 2. 清空 Supabase air_permits 表（避免重複）
 * 3. 批次 upsert 所有資料
 */

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ES module 的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase 設定
const SUPABASE_URL = 'https://dtzwgicsrkbnevzxjgcr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0endnaWNzcmtibmV2enhqZ2NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzMTY3MTcsImV4cCI6MjA0ODg5MjcxN30.Y0g9iNYIygtD7MViYBpk77OEEWJfjXFoqkkf5M_aMDA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function syncAirPermits() {
    console.log('🚀 開始同步 air_permits.xlsx → Supabase\n');

    // 1. 讀取 Excel
    const excelPath = path.join(__dirname, '..', 'data', 'air_permits.xlsx');
    console.log('📖 讀取 Excel:', excelPath);

    const wb = XLSX.readFile(excelPath);
    const summary = wb.Sheets['總表'];

    if (!summary) {
        console.error('❌ 找不到「總表」工作表！');
        process.exit(1);
    }

    const data = XLSX.utils.sheet_to_json(summary);
    console.log(`✅ 讀取到 ${data.length} 筆資料\n`);

    // 2. 轉換資料格式
    const records = data.map(row => ({
        ems_no: row.ems_no || '',
        county: row.county || '',
        company_name: row.company_name || '',
        address: row.address || '',
        process_id: extractProcessId(row.processes),
        process_name: row.processes || '',
        category: row.categories || '',
        permit_no: row.permit_nos || '',
        effective_date: null,
        expiry_date: row.latest_expiry_date || row.earliest_expiry_date || ''
    }));

    console.log('📊 資料轉換完成，範例：');
    console.log(JSON.stringify(records[0], null, 2));
    console.log('');

    // 3. 清空現有資料
    console.log('🗑️ 清空 Supabase air_permits 表...');
    const { error: deleteError } = await supabase
        .from('air_permits')
        .delete()
        .neq('id', 0); // 刪除所有資料

    if (deleteError) {
        console.error('❌ 清空失敗:', deleteError.message);
        process.exit(1);
    }
    console.log('✅ 清空完成\n');

    // 4. 批次插入（每次 100 筆）
    const BATCH_SIZE = 100;
    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        const { data: result, error: insertError } = await supabase
            .from('air_permits')
            .insert(batch);

        if (insertError) {
            console.error(`❌ 批次 ${Math.floor(i / BATCH_SIZE) + 1} 插入失敗:`, insertError.message);
            failed += batch.length;
        } else {
            inserted += batch.length;
            console.log(`✅ 已插入 ${inserted}/${records.length} 筆`);
        }
    }

    // 5. 完成
    console.log('\n========================================');
    console.log('📊 同步結果');
    console.log('========================================');
    console.log(`✅ 成功: ${inserted} 筆`);
    console.log(`❌ 失敗: ${failed} 筆`);
    console.log('========================================\n');

    // 6. 驗證
    const { count } = await supabase
        .from('air_permits')
        .select('*', { count: 'exact', head: true });

    console.log(`🔍 驗證：Supabase air_permits 表現有 ${count || '?'} 筆資料`);
}

// 從 processes 字串中提取第一個製程代碼
function extractProcessId(processes) {
    if (!processes) return '';
    const match = processes.match(/^([A-Z]\d+)/);
    return match ? match[1] : '';
}

// 執行
syncAirPermits().catch(err => {
    console.error('❌ 同步失敗:', err);
    process.exit(1);
});
