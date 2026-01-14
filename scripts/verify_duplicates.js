import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyDuplicates() {
    const filePath = path.join(__dirname, '..', 'data', 'water_permits.xlsx');

    if (!fs.existsSync(filePath)) {
        console.error('檔案不存在:', filePath);
        return;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const sheet = workbook.getWorksheet('三重區');
    if (!sheet) {
        console.error('找不到「三重區」工作表');
        return;
    }

    const headerRow = sheet.getRow(1);
    let controlNoColIndex = -1;
    headerRow.eachCell((cell, colNumber) => {
        if (cell.value === '管制編號') controlNoColIndex = colNumber;
    });

    if (controlNoColIndex === -1) {
        console.error('找不到管制編號欄位');
        return;
    }

    const idCounts = {};
    const companyNames = {};

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const id = row.getCell(controlNoColIndex).value;
        const name = row.getCell(4).value; // 事業名稱
        if (id) {
            idCounts[id] = (idCounts[id] || 0) + 1;
            companyNames[id] = name;
        }
    });

    const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
    const uniqueCount = Object.keys(idCounts).length;

    console.log(`\n--- 驗證報告: 「三重區」 ---`);
    console.log(`總列數 (扣除標題): ${sheet.rowCount - 1}`);
    console.log(`唯一管制編號數量: ${uniqueCount}`);
    console.log(`重複的編號數量: ${duplicates.length}`);

    if (duplicates.length > 0) {
        console.log('\n重複清單 (前 5 筆):');
        duplicates.slice(0, 5).forEach(([id, count]) => {
            console.log(`- [${id}] ${companyNames[id]}: 出現 ${count} 次`);
        });
    } else {
        console.log('\n✅ 恭喜！工作表中已完全沒有重複的管制編號。');
    }
}

verifyDuplicates().catch(console.error);
