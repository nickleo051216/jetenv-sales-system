import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function recreateSummary() {
    const filepath = path.join(__dirname, 'data', 'air_permits.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filepath);

    console.log('🔧 重新創建總表...\n');

    // 1. 刪除舊的總表
    const oldSummary = workbook.getWorksheet('總表');
    if (oldSummary) {
        workbook.removeWorksheet(oldSummary.id);
        console.log('🗑️  已刪除舊總表');
    }

    // 2. 創建新的總表（在最前面）
    const summarySheet = workbook.addWorksheet('總表', { state: 'visible' });

    // 設定表頭
    const headerColumns = [
        { header: 'county', key: 'county', width: 10 },
        { header: 'ems_no', key: 'ems_no', width: 15 },
        { header: 'company_name', key: 'company_name', width: 30 },
        { header: 'address', key: 'address', width: 40 },
        { header: 'process_id', key: 'process_id', width: 15 },
        { header: 'process_name', key: 'process_name', width: 20 },
        { header: 'category', key: 'category', width: 15 },
        { header: 'permit_no', key: 'permit_no', width: 20 },
        { header: 'effective_date', key: 'effective_date', width: 15 },
        { header: 'expiry_date', key: 'expiry_date', width: 15 },
        { header: 'district', key: 'district', width: 10 }
    ];

    summarySheet.columns = headerColumns;

    // 設定表頭樣式
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };

    console.log('📋 已創建新總表');

    // 3. 從每個地區分頁讀取資料
    const districtSheets = workbook.worksheets.filter(ws => ws.name !== '總表');
    console.log(`\n找到 ${districtSheets.length} 個地區分頁：`);

    let totalAdded = 0;

    for (const districtSheet of districtSheets) {
        const districtName = districtSheet.name;
        let count = 0;

        // 從第2行開始（跳過表頭）
        for (let i = 2; i <= districtSheet.rowCount; i++) {
            const row = districtSheet.getRow(i);

            summarySheet.addRow({
                county: row.getCell(1).value,
                ems_no: row.getCell(2).value,
                company_name: row.getCell(3).value,
                address: row.getCell(4).value,
                process_id: row.getCell(5).value,
                process_name: row.getCell(6).value,
                category: row.getCell(7).value,
                permit_no: row.getCell(8).value,
                effective_date: row.getCell(9).value,
                expiry_date: row.getCell(10).value,
                district: districtName
            });
            count++;
        }

        console.log(`   ${districtName}: ${count} 筆`);
        totalAdded += count;
    }

    console.log(`\n✅ 總共加入 ${totalAdded} 筆資料`);
    console.log(`   總表行數: ${summarySheet.rowCount}`);

    // 儲存
    console.log(`\n💾 儲存中...`);
    await workbook.xlsx.writeFile(filepath);
    console.log(`✅ 已儲存`);

    // 驗證
    const workbook2 = new ExcelJS.Workbook();
    await workbook2.xlsx.readFile(filepath);
    const verifySheet = workbook2.getWorksheet('總表');
    console.log(`\n🔍 驗證：總表有 ${verifySheet.rowCount - 1} 筆資料`);

    if (verifySheet.rowCount - 1 === totalAdded) {
        console.log('✅ 修復成功！');
    } else {
        console.log(`⚠️  預期 ${totalAdded}，實際 ${verifySheet.rowCount - 1}`);
    }
}

recreateSummary().catch(console.error);
