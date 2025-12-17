import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkExcel() {
    const filepath = path.join(__dirname, 'data', 'air_permits.xlsx');
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filepath);
    
    console.log('📊 Excel 檔案分析\n');
    console.log('═══════════════════════════════════════');
    
    workbook.worksheets.forEach((sheet, idx) => {
        console.log(`\n${idx + 1}. 分頁名稱: ${sheet.name}`);
        console.log(`   總行數: ${sheet.rowCount}`);
        console.log(`   資料行數: ${sheet.rowCount - 1} (扣除表頭)`);
        
        // 顯示前 3 筆資料
        if (sheet.rowCount > 1) {
            console.log(`   前 3 筆資料:`);
            for (let i = 2; i <= Math.min(4, sheet.rowCount); i++) {
                const row = sheet.getRow(i);
                const company = row.getCell(3).value || '(空白)';
                console.log(`     - Row ${i}: ${company}`);
            }
        } else {
            console.log(`   ⚠️  沒有資料（只有表頭）`);
        }
    });
    
    console.log('\n═══════════════════════════════════════\n');
}

checkExcel().catch(console.error);
