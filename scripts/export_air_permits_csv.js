/**
 * 匯出 air_permits.xlsx 總表 → CSV 檔案
 * 然後可以在 Supabase Dashboard 手動匯入
 * 
 * 執行方式：
 * node scripts/export_air_permits_csv.js
 */

import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES module 的 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function exportAirPermitsCSV() {
    console.log('🚀 匯出 air_permits.xlsx → CSV\n');

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
        process_name: (row.processes || '').replace(/\n/g, '; '),  // 換行改成分號
        category: row.categories || '',
        permit_no: (row.permit_nos || '').replace(/\n/g, '; '),   // 換行改成分號
        effective_date: '',
        expiry_date: row.latest_expiry_date || row.earliest_expiry_date || ''
    }));

    // 3. 寫入 CSV
    const csvPath = path.join(__dirname, '..', 'data', 'air_permits_for_supabase.csv');

    // CSV 標頭
    const headers = ['ems_no', 'county', 'company_name', 'address', 'process_id', 'process_name', 'category', 'permit_no', 'effective_date', 'expiry_date'];

    // 產生 CSV 內容
    const csvContent = [
        headers.join(','),
        ...records.map(r => headers.map(h => {
            const val = r[h] || '';
            // 如果包含逗號或引號，需要用引號包起來
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        }).join(','))
    ].join('\n');

    fs.writeFileSync(csvPath, '\ufeff' + csvContent, 'utf8');  // 加 BOM 確保 Excel 正確開啟

    console.log('✅ CSV 已匯出:', csvPath);
    console.log(`📊 共 ${records.length} 筆資料\n`);

    console.log('========================================');
    console.log('📋 下一步：匯入 Supabase');
    console.log('========================================');
    console.log('1. 開啟 Supabase Dashboard');
    console.log('2. 進入 Table Editor → air_permits');
    console.log('3. 先清空現有資料（選全部 → Delete）');
    console.log('4. 點擊 Import → 選擇 CSV');
    console.log('5. 上傳 data/air_permits_for_supabase.csv');
    console.log('========================================\n');
}

// 從 processes 字串中提取第一個製程代碼
function extractProcessId(processes) {
    if (!processes) return '';
    const match = processes.match(/^([A-Z]\d+)/);
    return match ? match[1] : '';
}

// 執行
exportAirPermitsCSV();
