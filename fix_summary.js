import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixSummary() {
    const filepath = path.join(__dirname, 'data', 'air_permits.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filepath);

    console.log('🔧 開始修復總表...\n');

    // 取得總表
    const summarySheet = workbook.getWorksheet('總表');
    if (!summarySheet) {
        console.log('❌ 找不到總表！');
        return;
    }

    console.log(`總表目前有 ${summarySheet.rowCount - 1} 筆資料`);

    // 取得所有地區分頁（除了總表）
    const districtSheets = workbook.worksheets.filter(ws => ws.name !== '總表');

    console.log(`\n找到 ${districtSheets.length} 個地區分頁：`);
    districtSheets.forEach(sheet => {
        console.log(`- ${sheet.name}: ${sheet.rowCount - 1} 筆`);
    });

    // 清空總表資料（保留表頭）
    console.log(`\n🗑️  清空總表舊資料...`);
    while (summarySheet.rowCount > 1) {
        summarySheet.spliceRows(2, 1);
    }
    console.log(`   清空後行數: ${summarySheet.rowCount}`);

    // 從每個地區分頁讀取資料並加到總表
    console.log(`\n📥 從地區分頁讀取資料並加入總表...`);
    let totalAdded = 0;

    for (const districtSheet of districtSheets) {
        const districtName = districtSheet.name;
        let count = 0;

        // 從第2行開始讀取（跳過表頭）
        for (let i = 2; i <= districtSheet.rowCount; i++) {
            const row = districtSheet.getRow(i);

            // 讀取所有欄位
            const rowData = {
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
                district: districtName  // 加上地區欄位
            };

            // 加到總表
            summarySheet.addRow(rowData);
            count++;
        }

        console.log(`   ${districtName}: 加入 ${count} 筆`);
        totalAdded += count;
    }

    console.log(`\n✅ 總共加入 ${totalAdded} 筆資料到總表`);
    console.log(`   總表最終行數: ${summarySheet.rowCount} (含表頭)`);
    console.log(`   總表資料筆數: ${summarySheet.rowCount - 1}`);

    // 儲存檔案
    await workbook.xlsx.writeFile(filepath);
    console.log(`\n💾 已儲存檔案：${filepath}`);

    // 驗證
    const workbook2 = new ExcelJS.Workbook();
    await workbook2.xlsx.readFile(filepath);
    const summarySheet2 = workbook2.getWorksheet('總表');
    console.log(`\n🔍 驗證：重新讀取後總表有 ${summarySheet2.rowCount - 1} 筆資料`);

    if (summarySheet2.rowCount - 1 === totalAdded) {
        console.log('✅ 驗證成功！總表已正確修復。');
    } else {
        console.log(`❌ 驗證失敗！預期 ${totalAdded} 筆，實際 ${summarySheet2.rowCount - 1} 筆`);
    }
}

fixSummary().catch(console.error);
