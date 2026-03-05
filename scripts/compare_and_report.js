/**
 * 許可證比對與合併報告 (compare_and_report.js)
 *
 * 功能：
 * 1. 讀取 air_permits.xlsx + water_permits.xlsx
 * 2. 合併資料（用 emsno 當 Key，同 GAS mergeAirWater 邏輯）
 * 3. 讀取 Google Sheets {地區}-空水合併 分頁（A=emsno, J=水到期, K=空到期）
 * 4. 比對：找出到期日有異動的工廠
 * 5. 寫入 combined_permits.xlsx：
 *    - {地區} 分頁：完整合併資料（格式同 GAS 輸出）
 *    - {地區}_變動_YYYYMMDD 分頁：只有異動的工廠
 * 6. LINE 通知
 *
 * 使用方式：
 *   node scripts/compare_and_report.js --district 三重區
 *   node scripts/compare_and_report.js --district 三重區 --county 新北市
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import axios from 'axios';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// ============================================
// 載入環境變數
// ============================================
function loadEnv() {
    const envPath = path.join(PROJECT_ROOT, '.env.local');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.substring(0, eqIdx).trim();
        const value = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
    }
}
loadEnv();

// ============================================
// 設定
// ============================================
const CONFIG = {
    // Google Sheets
    SPREADSHEET_ID: '1MeVmMZYOjrXAlTBlDIc7VoM30HuG1MufUgSPJpEEOvI',
    CREDENTIALS_PATH: path.join(PROJECT_ROOT, 'google_credentials.json'),

    // Excel 路徑
    AIR_EXCEL: path.join(PROJECT_ROOT, 'data', 'air_permits.xlsx'),
    WATER_EXCEL: 'C:\\Users\\jeten\\OneDrive\\Nick Sales\\00. 業務所需資料\\陌生開發資料區\\1. 許可證\\water_permits.xlsx',
    COMBINED_EXCEL: 'C:\\Users\\jeten\\OneDrive\\Nick Sales\\00. 業務所需資料\\陌生開發資料區\\1. 許可證\\combined_permits.xlsx',
    COMBINED_EXCEL_LOCAL: path.join(PROJECT_ROOT, 'data', 'combined_permits.xlsx'),

    // combined_permits.xlsx 欄位（同 GAS 輸出格式）
    OUTPUT_HEADERS: [
        'emsno', 'facilityname', 'uniformno', '目前運作狀態(水)', '預計排程',
        '結果', '初步行動', '顧問公司(代填表公司)', '電話',
        '許可證效期(水)', '許可證效期(空氣)', 'facilityaddress', ''
    ],
};

// ============================================
// 解析命令列參數
// ============================================
function parseArgs() {
    const args = process.argv.slice(2);
    const result = { district: '', county: '新北市' };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--district' && args[i + 1]) { result.district = args[i + 1]; i++; }
        if (args[i] === '--county' && args[i + 1]) { result.county = args[i + 1]; i++; }
    }
    return result;
}

// ============================================
// 日期轉換（民國斜線 → ISO）
// ============================================
function minguoSlashToISO(s) {
    if (!s) return '';
    const t = String(s).trim();
    const m = t.match(/(\d{3,4})\/(\d{1,2})\/(\d{1,2})/);
    if (!m) return '';
    const y = Number(m[1]) + 1911;
    return `${y}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
}

// ============================================
// 日期轉換（民國中文年月日 → ISO）
// ============================================
function minguoChineseToISO(s) {
    if (!s) return '';
    const t = String(s).trim();
    const m = t.match(/(\d{3,4})年(\d{1,2})月(\d{1,2})日/);
    if (!m) return '';
    const y = Number(m[1]) + 1911;
    return `${y}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
}

// ============================================
// 讀取 air_permits.xlsx → Map<emsno, {airExpiry, address, name}>
// ============================================
async function readAirPermits(district) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(CONFIG.AIR_EXCEL);

    // 找地區分頁
    const sheet = wb.getWorksheet(district) || wb.getWorksheet('總表');
    if (!sheet) return new Map();

    const result = new Map();
    let headers = null;

    sheet.eachRow((row, rowNum) => {
        const values = row.values.slice(1); // ExcelJS row.values[0] is empty
        if (rowNum === 1) {
            headers = values.map(v => String(v || '').trim());
            return;
        }
        if (!headers) return;

        const getVal = (key) => {
            const idx = headers.indexOf(key);
            return idx >= 0 ? String(values[idx] || '').trim() : '';
        };

        const emsno = getVal('ems_no');
        if (!emsno) return;

        result.set(emsno, {
            emsno,
            name: getVal('company_name'),
            address: getVal('address'),
            airExpiry: minguoSlashToISO(getVal('earliest_expiry_date')) || getVal('earliest_expiry_date'),
        });
    });

    return result;
}

// ============================================
// 讀取 water_permits.xlsx → Map<emsno, {waterExpiry, consultant, status}>
// ============================================
async function readWaterPermits(district) {
    const wb = new ExcelJS.Workbook();
    const waterPath = fs.existsSync(CONFIG.WATER_EXCEL) ? CONFIG.WATER_EXCEL : CONFIG.AIR_EXCEL.replace('air_', 'water_');
    await wb.xlsx.readFile(waterPath);

    const sheet = wb.getWorksheet(district) || wb.getWorksheet('總表');
    if (!sheet) return new Map();

    const result = new Map();
    let headers = null;

    sheet.eachRow((row, rowNum) => {
        const values = row.values.slice(1);
        if (rowNum === 1) {
            headers = values.map(v => String(v || '').trim());
            return;
        }
        if (!headers) return;

        const getVal = (key) => {
            const idx = headers.indexOf(key);
            return idx >= 0 ? String(values[idx] || '').trim() : '';
        };

        // 水污欄位名可能是 emsno 或 管制編號
        const emsno = getVal('emsno') || getVal('管制編號');
        if (!emsno) return;

        const status = getVal('status') || getVal('目前運作狀態');
        // 排除永久停工
        if (status.match(/停工|停業|歇業/)) return;

        result.set(emsno, {
            emsno,
            name: getVal('fac_name') || getVal('事業名稱'),
            consultant: getVal('代填表公司') || getVal('consultant'),
            waterExpiry: minguoChineseToISO(getVal('per_edate')) || minguoChineseToISO(getVal('許可證效期')) || '',
            status: status,
        });
    });

    return result;
}

// ============================================
// 合併空污+水污（同 GAS mergeAirWater 邏輯）
// ============================================
function mergeData(airMap, waterMap) {
    const merged = new Map();

    // 先加入空污
    airMap.forEach((air, emsno) => {
        merged.set(emsno, {
            emsno,
            name: air.name,
            address: air.address,
            consultant: '',
            waterExpiry: '',
            airExpiry: air.airExpiry,
            waterStatus: '',
            hasAir: true,
            hasWater: false,
        });
    });

    // 再合併水污
    waterMap.forEach((water, emsno) => {
        if (merged.has(emsno)) {
            const existing = merged.get(emsno);
            existing.name = existing.name || water.name;
            existing.consultant = water.consultant;
            existing.waterExpiry = water.waterExpiry;
            existing.waterStatus = water.status;
            existing.hasWater = true;
        } else {
            merged.set(emsno, {
                emsno,
                name: water.name,
                address: '',
                consultant: water.consultant,
                waterExpiry: water.waterExpiry,
                airExpiry: '',
                waterStatus: water.status,
                hasAir: false,
                hasWater: true,
            });
        }
    });

    return merged;
}

// ============================================
// 讀取 Google Sheets {地區}-空水合併 → Map<emsno, {waterExpiry, airExpiry}>
// ============================================
async function readSheetsDistrict(district) {
    const credPath = CONFIG.CREDENTIALS_PATH;
    if (!fs.existsSync(credPath)) {
        console.log('⚠️  找不到 google_credentials.json，跳過 Sheets 比對');
        return null;
    }

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: credPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // 先取得所有分頁名稱（各地區命名格式不一定統一）
        const meta = await sheets.spreadsheets.get({
            spreadsheetId: CONFIG.SPREADSHEET_ID,
            fields: 'sheets.properties.title'
        });
        const allSheetNames = meta.data.sheets.map(s => s.properties.title);

        // 自動查找：嘗試多種格式
        const districtBase = district.replace(/區$/, ''); // 三重區 → 三重
        const candidates = [
            `${district}-空水合併`,         // 三重區-空水合併
            `${districtBase}-空水合併`,      // 三重-空水合併 ← 三重的實際格式
            `${district} 新-空水合併`,       // 新莊區 新-空水合併
            `${district}(水) (合併後)`,      // 樹林區(水) (合併後)
        ];

        let sheetName = null;
        for (const candidate of candidates) {
            if (allSheetNames.includes(candidate)) {
                sheetName = candidate;
                break;
            }
        }

        // 如果還找不到，用模糊搜尋（包含地區名稱且包含「合併」）
        if (!sheetName) {
            sheetName = allSheetNames.find(n =>
                (n.includes(district) || n.includes(districtBase)) &&
                n.includes('合併') &&
                !n.includes('到期')  // 排除「-115年到期」分頁
            );
        }

        if (!sheetName) {
            console.log(`⚠️  Google Sheets 找不到「${district}」的合併分頁（嘗試過：${candidates.join(', ')}）`);
            return null;
        }

        console.log(`   📋 找到分頁：${sheetName}`);

        // 只讀 A, J, K 欄（emsno, 水到期, 空到期）
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: CONFIG.SPREADSHEET_ID,
            range: `'${sheetName}'!A:K`,  // 加單引號避免特殊字元問題
        });

        const rows = response.data.values || [];
        if (rows.length < 2) return new Map();

        const result = new Map();
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const emsno = String(row[0] || '').trim();
            if (!emsno) continue;

            result.set(emsno, {
                waterExpiry: String(row[9] || '').trim(), // J欄（index 9）
                airExpiry: String(row[10] || '').trim(),  // K欄（index 10）
            });
        }

        console.log(`📊 從 Google Sheets 讀取 ${result.size} 筆（${sheetName}）`);
        return result;

    } catch (err) {
        console.log(`⚠️  Google Sheets 讀取失敗：${err.message}`);
        return null;
    }
}


// ============================================
// 比對：找出異動的工廠
// ============================================
function compareDiff(newData, oldSheetsData) {
    if (!oldSheetsData) return { changed: [], added: [], removed: [] };

    const changed = [];
    const added = [];
    const removed = [];

    newData.forEach((newItem, emsno) => {
        if (!oldSheetsData.has(emsno)) {
            added.push(newItem);
        } else {
            const old = oldSheetsData.get(emsno);
            const waterChanged = newItem.waterExpiry && newItem.waterExpiry !== old.waterExpiry;
            const airChanged = newItem.airExpiry && newItem.airExpiry !== old.airExpiry;

            if (waterChanged || airChanged) {
                changed.push({
                    ...newItem,
                    oldWaterExpiry: old.waterExpiry,
                    oldAirExpiry: old.airExpiry,
                    waterChanged,
                    airChanged,
                });
            }
        }
    });

    oldSheetsData.forEach((_, emsno) => {
        if (!newData.has(emsno)) {
            removed.push({ emsno });
        }
    });

    return { changed, added, removed };
}

// ============================================
// 寫入 combined_permits.xlsx
// ============================================
async function writeCombined(district, mergedData, diff, today) {
    const filepaths = [CONFIG.COMBINED_EXCEL_LOCAL, CONFIG.COMBINED_EXCEL];

    // 讀取或建立 workbook
    let wb = new ExcelJS.Workbook();
    const localPath = CONFIG.COMBINED_EXCEL_LOCAL;
    if (fs.existsSync(localPath)) {
        try { await wb.xlsx.readFile(localPath); }
        catch { wb = new ExcelJS.Workbook(); }
    }

    const headers = CONFIG.OUTPUT_HEADERS;

    // ===== 主分頁（地區）=====
    let mainSheet = wb.getWorksheet(district);
    if (mainSheet) wb.removeWorksheet(mainSheet.id);
    mainSheet = wb.addWorksheet(district);

    mainSheet.columns = headers.map((h, i) => ({
        header: h, key: `col${i}`, width: [15, 30, 12, 16, 12, 12, 12, 25, 14, 16, 16, 40, 5][i] || 12
    }));

    // Header 樣式
    const headerRow = mainSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4A90D9' } };

    // 寫入資料
    mergedData.forEach(item => {
        const bgColor = item.hasWater && item.hasAir ? 'FFFCE5CD'
            : item.hasWater ? 'FFCFE2F3' : 'FFD9EAD3';

        const row = mainSheet.addRow([
            item.emsno, item.name, '', item.waterStatus, '', '', '',
            item.consultant, '', item.waterExpiry, item.airExpiry, item.address, ''
        ]);

        row.eachCell(cell => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        });

        // 6個月內到期 → 紅字
        const sixMonthsLater = new Date();
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
        const sixMonthsISO = sixMonthsLater.toISOString().split('T')[0];

        [10, 11].forEach(colIdx => { // J=10, K=11 (1-indexed)
            const cell = row.getCell(colIdx);
            const val = String(cell.value || '');
            if (val && val <= sixMonthsISO) {
                cell.font = { color: { argb: 'FFFF0000' }, bold: true };
            }
        });
    });

    mainSheet.autoResizeColumns && mainSheet.autoResizeColumns();
    mainSheet.views = [{ state: 'frozen', ySplit: 1 }];

    // ===== 變動分頁（只有異動的）=====
    const hasChanges = diff.changed.length > 0 || diff.added.length > 0 || diff.removed.length > 0;
    if (hasChanges) {
        const changeSheetName = `${district}_變動_${today}`.substring(0, 31);
        let changeSheet = wb.getWorksheet(changeSheetName);
        if (changeSheet) wb.removeWorksheet(changeSheet.id);
        changeSheet = wb.addWorksheet(changeSheetName);

        // 變動分頁欄位
        changeSheet.columns = [
            { header: '異動類型', key: 'type', width: 10 },
            { header: 'emsno', key: 'emsno', width: 15 },
            { header: '公司名稱', key: 'name', width: 30 },
            { header: '顧問公司', key: 'consultant', width: 25 },
            { header: '水污到期日(新)', key: 'waterExpiry', width: 16 },
            { header: '水污到期日(舊)', key: 'oldWaterExpiry', width: 16 },
            { header: '空污到期日(新)', key: 'airExpiry', width: 16 },
            { header: '空污到期日(舊)', key: 'oldAirExpiry', width: 16 },
            { header: '地址', key: 'address', width: 40 },
        ];

        const chHeaderRow = changeSheet.getRow(1);
        chHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        chHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE53935' } };

        diff.changed.forEach(item => {
            changeSheet.addRow({
                type: '到期日變動', emsno: item.emsno, name: item.name,
                consultant: item.consultant,
                waterExpiry: item.waterExpiry, oldWaterExpiry: item.oldWaterExpiry,
                airExpiry: item.airExpiry, oldAirExpiry: item.oldAirExpiry,
                address: item.address,
            });
        });

        diff.added.forEach(item => {
            changeSheet.addRow({
                type: '新增工廠', emsno: item.emsno, name: item.name,
                consultant: item.consultant,
                waterExpiry: item.waterExpiry, oldWaterExpiry: '-',
                airExpiry: item.airExpiry, oldAirExpiry: '-',
                address: item.address,
            });
        });

        diff.removed.forEach(item => {
            changeSheet.addRow({
                type: '已撤銷', emsno: item.emsno, name: '', consultant: '',
                waterExpiry: '', oldWaterExpiry: '', airExpiry: '', oldAirExpiry: '',
                address: '',
            });
        });

        changeSheet.views = [{ state: 'frozen', ySplit: 1 }];
        console.log(`📝 變動分頁「${changeSheetName}」：${diff.changed.length}筆變動 / ${diff.added.length}筆新增 / ${diff.removed.length}筆撤銷`);
    }

    // 儲存到本機 + OneDrive
    for (const fp of filepaths) {
        try {
            const dir = path.dirname(fp);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            await wb.xlsx.writeFile(fp);
            console.log(`💾 已儲存：${fp}`);
        } catch (err) {
            console.log(`⚠️  儲存失敗 ${fp}：${err.message}`);
        }
    }
}

// ============================================
// LINE 通知
// ============================================
async function sendLine(message) {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const userId = process.env.LINE_USER_ID;
    if (!token || !userId) return;

    try {
        await axios.post('https://api.line.me/v2/bot/message/push', {
            to: userId,
            messages: [{ type: 'text', text: message }]
        }, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        console.log('✅ LINE 通知已發送');
    } catch (err) {
        console.log(`⚠️  LINE 失敗：${err.message}`);
    }
}

// ============================================
// 主程式
// ============================================
async function main() {
    const args = parseArgs();
    if (!args.district) {
        console.log('❌ 請提供 --district 參數，例如：--district 三重區');
        process.exit(1);
    }

    const { district } = args;
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');

    console.log('═══════════════════════════════════════════════════════');
    console.log(`   🔍 許可證比對報告 — ${district}`);
    console.log('═══════════════════════════════════════════════════════\n');

    // 1. 讀取空污+水污
    console.log('📂 讀取 Excel 資料...');
    const airMap = await readAirPermits(district);
    const waterMap = await readWaterPermits(district);
    console.log(`   空污：${airMap.size} 筆 / 水污：${waterMap.size} 筆`);

    // 2. 合併
    const mergedData = mergeData(airMap, waterMap);
    console.log(`   合併後：${mergedData.size} 家工廠`);

    // 3. 讀取 Google Sheets 舊資料
    console.log('\n📊 讀取 Google Sheets...');
    const oldSheetsData = await readSheetsDistrict(district);

    // 4. 比對異動
    const diff = compareDiff(mergedData, oldSheetsData);
    if (oldSheetsData) {
        console.log(`\n🔍 比對結果：`);
        console.log(`   到期日變動：${diff.changed.length} 筆`);
        console.log(`   新增工廠：${diff.added.length} 筆`);
        console.log(`   已撤銷：${diff.removed.length} 筆`);
    }

    // 5. 篩出 6 個月內到期
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    const soonExpiring = [...mergedData.values()].filter(item => {
        const sixStr = sixMonthsLater.toISOString().split('T')[0];
        return (item.waterExpiry && item.waterExpiry <= sixStr) ||
            (item.airExpiry && item.airExpiry <= sixStr);
    });

    // 6. 寫入 combined_permits.xlsx
    console.log('\n💾 寫入 combined_permits.xlsx...');
    await writeCombined(district, mergedData, diff, today);

    // 7. LINE 通知
    const today_display = new Date().toLocaleDateString('zh-TW');
    const lines = [
        `📋 ${district} 許可證比對完成`,
        `📅 ${today_display}`,
        '',
        `📊 本次資料：${mergedData.size} 家工廠`,
    ];

    if (oldSheetsData) {
        lines.push(`🔄 異動：${diff.changed.length}筆變動 / ${diff.added.length}筆新增 / ${diff.removed.length}筆撤銷`);
    }

    if (soonExpiring.length > 0) {
        lines.push(`\n🚨 6個月內到期（${soonExpiring.length}家）：`);
        soonExpiring.slice(0, 5).forEach(item => {
            const exp = item.waterExpiry || item.airExpiry;
            lines.push(`  ⚠️ ${item.name} ${exp}`);
        });
        if (soonExpiring.length > 5) lines.push(`  ...等共 ${soonExpiring.length} 家`);
    } else {
        lines.push('\n✅ 近期無即將到期的許可證');
    }

    lines.push('\n💾 已更新 combined_permits.xlsx');

    await sendLine(lines.join('\n'));

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`   ✅ 完成！6個月內到期：${soonExpiring.length} 家`);
    console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(err => {
    console.error('❌ 比對錯誤:', err);
    process.exit(1);
});
