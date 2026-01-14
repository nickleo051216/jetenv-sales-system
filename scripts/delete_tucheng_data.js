/**
 * 刪除土城區現有資料，以便重新爬取
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
    EXCEL_FILENAME: 'water_permits.xlsx',
    ONE_DRIVE_PATH: 'C:\\Users\\jeten\\OneDrive\\Nick Sales\\00. 業務所需資料\\陌生開發資料區\\1. 許可證\\water_permits.xlsx',
    TARGET_DISTRICT: '土城區'
};

async function main() {
    const dataDir = path.join(__dirname, '..', 'data');
    const localFilepath = path.join(dataDir, CONFIG.EXCEL_FILENAME);
    const oneDrivePath = CONFIG.ONE_DRIVE_PATH;

    // 處理兩個檔案
    const filesToProcess = [oneDrivePath, localFilepath];

    for (const filepath of filesToProcess) {
        if (!fs.existsSync(filepath)) {
            console.log(`⚠️ 檔案不存在: ${filepath}`);
            continue;
        }

        console.log(`\n📖 處理檔案: ${filepath}`);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filepath);

        // 1. 刪除土城區分頁
        const tuchengSheet = workbook.getWorksheet(CONFIG.TARGET_DISTRICT);
        if (tuchengSheet) {
            console.log(`   🗑️ 刪除分頁「${CONFIG.TARGET_DISTRICT}」...`);
            workbook.removeWorksheet(tuchengSheet.id);
        } else {
            console.log(`   ⚠️ 找不到分頁「${CONFIG.TARGET_DISTRICT}」`);
        }

        // 2. 從總表刪除土城區資料
        const summarySheet = workbook.getWorksheet('總表');
        if (summarySheet) {
            console.log(`   🗑️ 從總表刪除「${CONFIG.TARGET_DISTRICT}」資料...`);
            const rowsToDelete = [];

            // 找出所有土城區的列 (從最後往前找，避免刪除時索引錯亂)
            for (let i = summarySheet.rowCount; i >= 2; i--) {
                const row = summarySheet.getRow(i);
                const district = row.getCell(2).value; // 地區在第2欄
                if (district === CONFIG.TARGET_DISTRICT) {
                    rowsToDelete.push(i);
                }
            }

            console.log(`   📊 找到 ${rowsToDelete.length} 筆土城區資料`);

            // 從後往前刪除
            for (const rowNum of rowsToDelete) {
                summarySheet.spliceRows(rowNum, 1);
            }

            console.log(`   ✅ 已從總表刪除 ${rowsToDelete.length} 筆`);
        }

        // 儲存
        await workbook.xlsx.writeFile(filepath);
        console.log(`   💾 已儲存: ${filepath}`);
    }

    console.log('\n✅ 完成！現在可以重新執行爬蟲。');
}

main().catch(console.error);
