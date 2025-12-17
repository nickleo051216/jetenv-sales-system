import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugExcel() {
    const filepath = path.join(__dirname, 'data', 'air_permits.xlsx');

    console.log('🔍 測試 Excel 讀取和追加功能\n');

    // 讀取現有檔案
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filepath);

    console.log('📂 已載入 Excel 檔案\n');

    // 檢查總表
    let summarySheet = workbook.getWorksheet('總表');

    if (summarySheet) {
        console.log('✅ 找到「總表」分頁');
        console.log(`   目前行數: ${summarySheet.rowCount}`);
        console.log(`   資料筆數: ${summarySheet.rowCount - 1} (扣除表頭)\n`);

        // 顯示前 5 筆
        console.log('📊 總表前 5 筆資料:');
        for (let i = 2; i <= Math.min(6, summarySheet.rowCount); i++) {
            const row = summarySheet.getRow(i);
            const company = row.getCell(3).value;
            const district = row.getCell(11).value; // district 欄位
            console.log(`   ${i - 1}. ${company} (地區: ${district || '無'})`);
        }

        console.log('\n🧪 測試追加新資料...');

        // 測試追加一筆資料
        const testRow = {
            county: '測試縣市',
            ems_no: 'TEST001',
            company_name: '測試公司',
            address: '測試地址',
            process_id: 'T01',
            process_name: '測試製程',
            category: '測試',
            permit_no: 'P001',
            effective_date: '113/01/01',
            expiry_date: '118/12/31',
            district: '測試地區'
        };

        summarySheet.addRow(testRow);
        console.log(`   追加後行數: ${summarySheet.rowCount}`);

        // 儲存到新檔案測試
        const testFilepath = path.join(__dirname, 'data', 'air_permits_test.xlsx');
        await workbook.xlsx.writeFile(testFilepath);
        console.log(`   ✅ 已儲存測試檔案: air_permits_test.xlsx`);

        // 重新讀取驗證
        const workbook2 = new ExcelJS.Workbook();
        await workbook2.xlsx.readFile(testFilepath);
        const summarySheet2 = workbook2.getWorksheet('總表');
        console.log(`   重新讀取後行數: ${summarySheet2.rowCount}`);
        console.log(`   ${summarySheet2.rowCount === summarySheet.rowCount ? '✅' : '❌'} 資料保存正確`);

    } else {
        console.log('❌ 找不到「總表」分頁！');
    }

    console.log('\n📑 所有分頁:');
    workbook.worksheets.forEach((sheet, idx) => {
        console.log(`   ${idx + 1}. ${sheet.name} (${sheet.rowCount - 1} 筆資料)`);
    });
}

debugExcel().catch(console.error);
