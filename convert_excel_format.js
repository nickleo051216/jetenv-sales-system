/**
 * Excel 資料轉換腳本
 * 將現有的舊格式（每個製程一筆）轉換為新格式（每個工廠一筆，合併製程）
 */

import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 合併函式
function findEarliestDate(dates) {
    if (!dates || dates.length === 0) return '';
    return dates.sort()[0];
}

function findLatestDate(dates) {
    if (!dates || dates.length === 0) return '';
    return dates.sort().reverse()[0];
}

function consolidateFactoryData(data) {
    const factoryMap = new Map();

    data.forEach(item => {
        const key = item.ems_no;

        if (!factoryMap.has(key)) {
            factoryMap.set(key, {
                county: item.county,
                ems_no: item.ems_no,
                company_name: item.company_name,
                address: item.address,
                processes: [],
                categories: new Set(),
                permit_nos: new Set(),
                expiry_dates: []
            });
        }

        const factory = factoryMap.get(key);

        if (item.process_id && item.process_name) {
            factory.processes.push(`${item.process_id} - ${item.process_name}`);
        }

        if (item.category) {
            factory.categories.add(item.category);
        }

        if (item.permit_no) {
            factory.permit_nos.add(item.permit_no);
        }

        if (item.expiry_date) {
            factory.expiry_dates.push(item.expiry_date);
        }
    });

    return Array.from(factoryMap.values()).map(factory => ({
        county: factory.county,
        ems_no: factory.ems_no,
        company_name: factory.company_name,
        address: factory.address,
        process_count: factory.processes.length,
        processes: factory.processes.join('\n'),
        categories: Array.from(factory.categories).join(', '),
        permit_nos: Array.from(factory.permit_nos).join('\n'),
        earliest_expiry_date: findEarliestDate(factory.expiry_dates),
        latest_expiry_date: findLatestDate(factory.expiry_dates)
    }));
}

async function main() {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   🔄 Excel 資料格式轉換工具');
    console.log('   📊 將舊格式轉換為合併後的新格式');
    console.log('═══════════════════════════════════════════════════════\n');

    const inputPath = path.join(__dirname, 'data', 'air_permits.xlsx');
    const outputPath = path.join(__dirname, 'data', 'air_permits_consolidated.xlsx');

    // 備份原檔案
    const backupPath = path.join(__dirname, 'data', 'air_permits_backup.xlsx');

    if (!fs.existsSync(inputPath)) {
        console.error('❌ 找不到 Excel 檔案:', inputPath);
        return;
    }

    // 讀取現有檔案
    console.log('📂 讀取現有 Excel 檔案...');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(inputPath);

    // 建立新的工作簿
    const newWorkbook = new ExcelJS.Workbook();

    // 新表頭定義
    const headerColumns = [
        { header: 'county', key: 'county', width: 10 },
        { header: 'ems_no', key: 'ems_no', width: 15 },
        { header: 'company_name', key: 'company_name', width: 30 },
        { header: 'address', key: 'address', width: 40 },
        { header: 'process_count', key: 'process_count', width: 12 },
        { header: 'processes', key: 'processes', width: 35 },
        { header: 'categories', key: 'categories', width: 20 },
        { header: 'permit_nos', key: 'permit_nos', width: 25 },
        { header: 'earliest_expiry_date', key: 'earliest_expiry_date', width: 18 },
        { header: 'latest_expiry_date', key: 'latest_expiry_date', width: 18 },
        { header: 'district', key: 'district', width: 10 }
    ];

    let totalOriginal = 0;
    let totalConsolidated = 0;

    // 處理每個分頁（跳過總表）
    const sheets = workbook.worksheets.filter(ws => ws.name !== '總表');

    console.log(`\n📋 找到 ${sheets.length} 個地區分頁\n`);

    for (const oldSheet of sheets) {
        const sheetName = oldSheet.name;

        // 檢查是否為新格式（已有 process_count 欄位）
        const firstHeader = oldSheet.getRow(1).getCell(5).value;
        if (firstHeader === 'process_count') {
            console.log(`   ⏭️  ${sheetName} - 已是新格式，跳過`);
            // 直接複製到新工作簿
            const newSheet = newWorkbook.addWorksheet(sheetName);
            newSheet.columns = headerColumns.filter(h => h.key !== 'district');
            newSheet.getRow(1).font = { bold: true };
            newSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

            for (let i = 2; i <= oldSheet.rowCount; i++) {
                const row = oldSheet.getRow(i);
                if (row.getCell(2).value) {
                    const newRow = newSheet.addRow({
                        county: row.getCell(1).value,
                        ems_no: row.getCell(2).value,
                        company_name: row.getCell(3).value,
                        address: row.getCell(4).value,
                        process_count: row.getCell(5).value,
                        processes: row.getCell(6).value,
                        categories: row.getCell(7).value,
                        permit_nos: row.getCell(8).value,
                        earliest_expiry_date: row.getCell(9).value,
                        latest_expiry_date: row.getCell(10).value
                    });
                    newRow.getCell('processes').alignment = { wrapText: true, vertical: 'top' };
                    newRow.getCell('permit_nos').alignment = { wrapText: true, vertical: 'top' };
                    totalConsolidated++;
                }
            }
            continue;
        }

        // 讀取舊格式資料
        const oldData = [];
        for (let i = 2; i <= oldSheet.rowCount; i++) {
            const row = oldSheet.getRow(i);
            const emsNo = row.getCell(2).value;
            if (emsNo) {
                oldData.push({
                    county: row.getCell(1).value,
                    ems_no: row.getCell(2).value,
                    company_name: row.getCell(3).value,
                    address: row.getCell(4).value,
                    process_id: row.getCell(5).value,
                    process_name: row.getCell(6).value,
                    category: row.getCell(7).value,
                    permit_no: row.getCell(8).value,
                    effective_date: row.getCell(9).value,
                    expiry_date: row.getCell(10).value
                });
            }
        }

        if (oldData.length === 0) {
            console.log(`   ⏭️  ${sheetName} - 無資料，跳過`);
            continue;
        }

        // 合併資料
        const consolidated = consolidateFactoryData(oldData);

        console.log(`   🔄 ${sheetName}: ${oldData.length} 筆製程 → ${consolidated.length} 家工廠`);

        totalOriginal += oldData.length;
        totalConsolidated += consolidated.length;

        // 建立新分頁
        const newSheet = newWorkbook.addWorksheet(sheetName);
        newSheet.columns = headerColumns.filter(h => h.key !== 'district');

        newSheet.getRow(1).font = { bold: true };
        newSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

        consolidated.forEach(row => {
            const excelRow = newSheet.addRow(row);
            excelRow.getCell('processes').alignment = { wrapText: true, vertical: 'top' };
            excelRow.getCell('permit_nos').alignment = { wrapText: true, vertical: 'top' };
        });
    }

    // 建立新的總表
    console.log('\n🔄 建立新的總表...');
    const summarySheet = newWorkbook.addWorksheet('總表');
    summarySheet.columns = headerColumns;
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    let summaryTotal = 0;
    newWorkbook.eachSheet((ws, id) => {
        if (ws.name === '總表') return;

        for (let i = 2; i <= ws.rowCount; i++) {
            const row = ws.getRow(i);
            if (row.getCell(2).value) {
                const summaryRow = summarySheet.addRow({
                    county: row.getCell(1).value,
                    ems_no: row.getCell(2).value,
                    company_name: row.getCell(3).value,
                    address: row.getCell(4).value,
                    process_count: row.getCell(5).value,
                    processes: row.getCell(6).value,
                    categories: row.getCell(7).value,
                    permit_nos: row.getCell(8).value,
                    earliest_expiry_date: row.getCell(9).value,
                    latest_expiry_date: row.getCell(10).value,
                    district: ws.name
                });
                summaryRow.getCell('processes').alignment = { wrapText: true, vertical: 'top' };
                summaryRow.getCell('permit_nos').alignment = { wrapText: true, vertical: 'top' };
                summaryTotal++;
            }
        }
    });

    console.log(`   ✅ 總表共 ${summaryTotal} 家工廠`);

    // 備份原檔案
    console.log('\n💾 備份原檔案...');
    fs.copyFileSync(inputPath, backupPath);
    console.log(`   ✅ 備份至: ${backupPath}`);

    // 儲存新檔案（覆蓋原檔案）
    console.log('\n💾 儲存轉換後的檔案...');
    await newWorkbook.xlsx.writeFile(inputPath);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   ✅ 轉換完成！');
    console.log(`   📊 總計: ${totalOriginal} 筆製程 → ${summaryTotal} 家工廠`);
    console.log(`   📁 輸出: ${inputPath}`);
    console.log(`   📁 備份: ${backupPath}`);
    console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
