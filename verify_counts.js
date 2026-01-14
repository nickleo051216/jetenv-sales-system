import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verify() {
    const workbook = new ExcelJS.Workbook();
    const filepath = path.join(__dirname, 'data', 'water_permits.xlsx');
    await workbook.xlsx.readFile(filepath);

    console.log('--- Excel Record Counts ---');
    workbook.eachSheet(sheet => {
        console.log(`${sheet.name}: ${sheet.rowCount - 1} records`);
    });
}

verify().catch(console.error);
