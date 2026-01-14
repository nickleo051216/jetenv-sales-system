/**
 * 清理水許可證的「代填表公司」欄位
 * 如果不是公司或事務所名稱，則替換為「空白」
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
    LOCAL_PATH: path.join(__dirname, '..', 'data', 'water_permits.xlsx')
};

// 判斷是否為有效的公司/事務所名稱
function isValidCompanyName(name) {
    if (!name || typeof name !== 'string') return false;

    const trimmed = name.trim();
    if (trimmed.length < 4) return false; // 太短不可能是公司名
    if (trimmed.length > 40) return false; // 太長通常是錯誤資料

    // 有效的公司/事務所名稱通常包含這些關鍵字
    const validKeywords = [
        '有限公司', '股份有限公司', '公司',
        '事務所', '技師事務所', '工程顧問',
        '環保', '環境', '工程', '科技', '企業',
        '顧問', '實業'
    ];

    // 無效內容的關鍵字 (明顯是抓錯的)
    const invalidKeywords = [
        '連絡電話', '負責人', '地址', '填表人', '座落位置',
        '註', '設置', '監測', '資料', '及地址'
    ];

    // 如果包含無效關鍵字，直接判定為無效
    for (const kw of invalidKeywords) {
        if (trimmed.includes(kw)) return false;
    }

    // 如果包含有效關鍵字，判定為有效
    for (const kw of validKeywords) {
        if (trimmed.includes(kw)) return true;
    }

    // 其他情況，如果只有中文字且長度合理，可能是有效的
    // 但為了安全起見，沒有明確關鍵字的就標為空白
    return false;
}

async function cleanRepresentativeData(filepath) {
    if (!fs.existsSync(filepath)) {
        console.log(`⚠️ 檔案不存在: ${filepath}`);
        return;
    }

    console.log(`\n📖 處理檔案: ${filepath}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filepath);

    let totalCleaned = 0;
    const cleanedExamples = [];

    workbook.eachSheet((sheet) => {
        const repColIndex = 8; // 代填表公司在第8欄

        for (let i = 2; i <= sheet.rowCount; i++) {
            const row = sheet.getRow(i);
            const repValue = row.getCell(repColIndex).value;

            if (repValue && !isValidCompanyName(repValue)) {
                if (cleanedExamples.length < 5) {
                    cleanedExamples.push({
                        sheet: sheet.name,
                        row: i,
                        old: repValue
                    });
                }
                row.getCell(repColIndex).value = '空白';
                totalCleaned++;
            }
        }
    });

    console.log(`   🧹 清理了 ${totalCleaned} 筆無效的代填表公司資料`);

    if (cleanedExamples.length > 0) {
        console.log(`   📋 清理範例：`);
        cleanedExamples.forEach(ex => {
            console.log(`      - [${ex.sheet}] 第${ex.row}列: "${ex.old.substring(0, 30)}..." → "空白"`);
        });
    }

    await workbook.xlsx.writeFile(filepath);
    console.log(`   💾 已儲存`);

    return totalCleaned;
}

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   🧹 清理水許可證「代填表公司」欄位');
    console.log('═══════════════════════════════════════════════════════\n');

    const filesToProcess = [CONFIG.ONE_DRIVE_PATH, CONFIG.LOCAL_PATH];

    for (const fp of filesToProcess) {
        await cleanRepresentativeData(fp);
    }

    console.log('\n✅ 完成！');
}

main().catch(console.error);
