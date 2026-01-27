import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanExcel() {
    const filePath = path.join(__dirname, '..', 'data', 'water_permits.xlsx');

    if (!fs.existsSync(filePath)) {
        console.error('檔案不存在:', filePath);
        return;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // 我們將建立一個全新的 workbook 來存放去重後的資料
    const newWorkbook = new ExcelJS.Workbook();

    for (const oldSheet of workbook.worksheets) {
        console.log(`處理工作表: ${oldSheet.name}`);

        const headerRow = oldSheet.getRow(1);
        let controlNoColIndex = -1;
        headerRow.eachCell((cell, colNumber) => {
            if (cell.value === '管制編號') controlNoColIndex = colNumber;
        });

        if (controlNoColIndex === -1) {
            console.log(`   ⚠️ 找不到管制編號欄位，直接複製全表`);
            const newSheet = newWorkbook.addWorksheet(oldSheet.name);
            oldSheet.eachRow((row, rowNumber) => {
                const values = row.values;
                newSheet.addRow(Array.isArray(values) ? values.slice(1) : values);
            });
            continue;
        }

        const newSheet = newWorkbook.addWorksheet(oldSheet.name);
        // 複製標題
        const headerValues = [];
        headerRow.eachCell({ includeEmpty: true }, cell => headerValues.push(cell.value));
        newSheet.addRow(headerValues);
        newSheet.getRow(1).font = { bold: true };
        newSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

        const seen = new Set();
        let uniqueCount = 0;
        let totalCount = 0;

        oldSheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            totalCount++;

            let id = row.getCell(controlNoColIndex).value;
            if (id) {
                id = String(id).trim();
                if (!seen.has(id)) {
                    seen.add(id);
                    uniqueCount++;
                    const rowData = [];
                    // 獲取該列的所有值
                    for (let i = 1; i <= oldSheet.columnCount; i++) {
                        rowData.push(row.getCell(i).value);
                    }
                    newSheet.addRow(rowData);
                }
            }
        });

        console.log(`   ✅ 去重完成: ${totalCount} 筆 -> ${uniqueCount} 筆`);
    }

    await newWorkbook.xlsx.writeFile(filePath);
    console.log('💾 已儲存乾淨的檔案 (Wiped and Rebuilt)');
}

cleanExcel().catch(console.error);
