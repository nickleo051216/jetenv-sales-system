import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function simpleCheck() {
    const filepath = path.join(__dirname, 'data', 'air_permits.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filepath);

    workbook.worksheets.forEach((sheet, idx) => {
        const dataCount = sheet.rowCount - 1;
        console.log(`${idx + 1}. "${sheet.name}": ${dataCount} 筆資料`);

        if (sheet.name === '總表' && dataCount > 0) {
            // 檢查總表的地區分布
            const districts = new Set();
            for (let i = 2; i <= sheet.rowCount; i++) {
                const district = sheet.getRow(i).getCell(11).value;
                if (district) districts.add(district);
            }
            console.log(`   地區: ${Array.from(districts).join(', ')}`);
        }
    });
}

simpleCheck().catch(console.error);
