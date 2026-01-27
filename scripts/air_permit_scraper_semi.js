/**
 * 空污操作許可證爬蟲 (Semi-Automatic / 半自動版) v4
 * 
 * 📌 使用方式：
 *   1. 執行：node scripts/air_permit_scraper_semi.js
 *   2. 瀏覽器會自動開啟 aodmis 網站
 *   3. 【手動操作】選擇縣市、鄉鎮區，點擊「查詢」
 *   4. 腳本會自動偵測並勾選「許可」
 *   5. 等待 30 秒後，腳本會自動開始爬取資料
 *   6. Excel 檔案會儲存在 data/ 目錄（每個地區一個分頁）
 * 
 * 依賴：
 *   npm install puppeteer exceljs
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// 設定區
// ============================================
const CONFIG = {
    BASE_URL: 'https://aodmis.moenv.gov.tw/opendata/#/lq',
    WAIT_SECONDS: 30,   // 等待使用者手動操作的時間（縮短為 30 秒）
    PAGE_DELAY: 3000,   // 換頁/點擊後等待時間
    HEADLESS: false,    // 必須為 false 讓使用者操作
    EXCEL_FILENAME: 'air_permits.xlsx', // 固定檔名，所有地區存在同一個檔案
};

// ============================================
// 工具函式
// ============================================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function countdown(seconds) {
    return new Promise(resolve => {
        let remaining = seconds;
        const interval = setInterval(() => {
            process.stdout.write(`\r⏳ 剩餘 ${remaining} 秒...  `);
            remaining--;
            if (remaining < 0) {
                clearInterval(interval);
                console.log('\n');
                resolve();
            }
        }, 1000);
    });
}

// ============================================
// 主程式
// ============================================
async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   🏭 空污操作許可證爬蟲 (Semi-Automatic) v4');
    console.log('   📊 輸出格式：Excel（每個地區一個分頁）');
    console.log('═══════════════════════════════════════════════════════\n');

    const browser = await puppeteer.launch({
        headless: CONFIG.HEADLESS,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
        defaultViewport: null
    });

    const page = await browser.newPage();

    const allData = [];
    const processedEmsNos = new Set();
    let districtName = '未知地區'; // 用來命名 Excel 分頁

    try {
        // Step 1: 開啟網站
        console.log('📡 開啟網站...');
        await page.goto(CONFIG.BASE_URL, { waitUntil: 'networkidle2' });
        await sleep(2000);

        // Step 2: 提示使用者手動操作
        console.log('╔═══════════════════════════════════════════════════════╗');
        console.log('║  📋 請在瀏覽器中執行以下操作：                        ║');
        console.log('║                                                        ║');
        console.log('║  1️⃣  選擇「縣市」（例如：新北市）                      ║');
        console.log('║  2️⃣  選擇「鄉鎮區」（例如：五股區）                    ║');
        console.log('║  3️⃣  點擊橘色「查詢」按鈕                              ║');
        console.log('║                                                        ║');
        console.log('║  💡 「許可」勾選會自動處理！                           ║');
        console.log('║  📊 資料會儲存到同一個 Excel 檔，每個地區一個分頁     ║');
        console.log('║                                                        ║');
        console.log('╚═══════════════════════════════════════════════════════╝\n');

        // Step 3: 倒數計時
        await countdown(CONFIG.WAIT_SECONDS);

        // Step 4: 🔥 自動偵測並確保「許可」已勾選
        console.log('🔍 檢查設定狀態...');

        const checkResult = await page.evaluate(() => {
            const result = {
                countySelected: false,
                permitChecked: false,
                hasData: false,
                county: '',
                district: ''
            };

            // 檢查縣市是否已選擇（取得選項文字而非 value）
            const selects = document.querySelectorAll('select');
            if (selects[0] && selects[0].value && selects[0].value !== '') {
                result.countySelected = true;
                const selectedOption = selects[0].options[selects[0].selectedIndex];
                result.county = selectedOption ? selectedOption.textContent.trim() : selects[0].value;
            }
            if (selects[1] && selects[1].value) {
                const selectedOption = selects[1].options[selects[1].selectedIndex];
                result.district = selectedOption ? selectedOption.textContent.trim() : selects[1].value;
            }

            // 檢查「許可」checkbox
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            let permitCheckbox = null;

            for (const cb of checkboxes) {
                const label = cb.parentElement?.textContent || '';
                const nextLabel = cb.nextElementSibling?.textContent || '';
                if (label.includes('許可') || nextLabel.includes('許可')) {
                    permitCheckbox = cb;
                    result.permitChecked = cb.checked;
                    break;
                }
            }

            // 如果沒勾選，自動勾選
            if (permitCheckbox && !permitCheckbox.checked) {
                permitCheckbox.click();
                result.permitChecked = true;
                result.autoChecked = true;
            }

            // 檢查是否有資料
            const rows = document.querySelectorAll('table tbody tr');
            result.hasData = rows.length > 0;

            return result;
        });

        // 設定地區名稱（用於 Excel 分頁）
        districtName = checkResult.district || checkResult.county || '未知地區';

        console.log(`   📍 縣市：${checkResult.county || '(未選擇)'}`);
        console.log(`   📍 鄉鎮區：${checkResult.district || '(未選擇)'}`);
        console.log(`   📊 分頁名稱：${districtName}`);
        console.log(`   ☑️ 許可：${checkResult.permitChecked ? '已勾選' : '未勾選'}`);
        if (checkResult.autoChecked) {
            console.log('   🔧 已自動勾選「許可」！');
        }
        console.log(`   📊 資料：${checkResult.hasData ? '已載入' : '尚未載入'}`);

        // 如果沒有選擇縣市，提示錯誤
        if (!checkResult.countySelected) {
            console.log('\n⚠️ 請先選擇縣市！下次執行時記得選擇。');
            console.log('📌 10 秒後關閉瀏覽器...');
            await sleep(10000);
            await browser.close();
            return;
        }

        // 🔥 如果自動勾選了「許可」，必須重新查詢
        if (checkResult.autoChecked) {
            console.log('\n🔄 重新執行查詢（讓「許可」篩選生效）...');
            await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, input[type="button"]');
                for (const btn of buttons) {
                    if (btn.textContent?.includes('查詢') || btn.value?.includes('查詢')) {
                        btn.click();
                        return;
                    }
                }
                const warnBtn = document.querySelector('.btn-warning, button[class*="warning"]');
                if (warnBtn) warnBtn.click();
            });
            console.log('   ✅ 已重新查詢，等待結果載入...');
            await sleep(4000);
        }
        // 如果沒有資料，也嘗試點擊查詢按鈕
        else if (!checkResult.hasData) {
            console.log('\n🔍 偵測到尚未查詢，嘗試點擊查詢按鈕...');
            await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, input[type="button"]');
                for (const btn of buttons) {
                    if (btn.textContent?.includes('查詢') || btn.value?.includes('查詢')) {
                        btn.click();
                        return;
                    }
                }
                const warnBtn = document.querySelector('.btn-warning, button[class*="warning"]');
                if (warnBtn) warnBtn.click();
            });
            console.log('   ✅ 已點擊查詢');
            await sleep(3000);
        }

        console.log('\n🔄 等待頁面穩定...');
        await sleep(2000);
        console.log('🚀 開始自動爬取資料！\n');

        // Step 5: 取得總頁數
        const totalPages = await page.evaluate(() => {
            const paginationLinks = document.querySelectorAll('ul.pagination li a, .pagination a');
            let maxPage = 1;
            paginationLinks.forEach(link => {
                const num = parseInt(link.textContent.trim());
                if (!isNaN(num) && num > maxPage) {
                    maxPage = num;
                }
            });
            return maxPage;
        });
        console.log(`📊 檢測到共 ${totalPages} 頁資料\n`);

        // Step 6: 開始爬取
        let currentPage = 1;
        let totalFactories = 0;

        while (currentPage <= Math.min(totalPages, 50)) {
            console.log(`📄 處理第 ${currentPage}/${totalPages} 頁...`);
            await sleep(2000);

            // 擷取當頁所有工廠資料
            const pageData = await page.evaluate(() => {
                const results = [];
                const rows = document.querySelectorAll('table tbody tr');

                rows.forEach((row, idx) => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 5) {
                        const buttons = row.querySelectorAll('button, a');
                        let hasPermitBtn = false;
                        buttons.forEach(btn => {
                            if (btn.textContent.includes('許可')) hasPermitBtn = true;
                        });

                        if (hasPermitBtn) {
                            results.push({
                                rowIndex: idx,
                                county: cells[0]?.textContent?.trim() || '',
                                ems_no: cells[1]?.textContent?.trim() || '',
                                company_name: cells[2]?.textContent?.trim() || '',
                                address: cells[3]?.textContent?.trim() || '',
                            });
                        }
                    }
                });

                return results;
            });

            const newFactories = pageData.filter(f => !processedEmsNos.has(f.ems_no));
            console.log(`   找到 ${pageData.length} 家工廠，其中 ${newFactories.length} 家未處理`);

            if (newFactories.length === 0 && currentPage > 1) {
                console.log('   ⚠️ 此頁無新資料，可能已到達最後一頁');
                break;
            }

            totalFactories += newFactories.length;

            for (let i = 0; i < newFactories.length; i++) {
                const factory = newFactories[i];
                processedEmsNos.add(factory.ems_no);

                process.stdout.write(`   [${i + 1}/${newFactories.length}] ${factory.ems_no} ${factory.company_name.substring(0, 12)}...`);

                try {
                    const clicked = await page.evaluate((emsNo) => {
                        const rows = document.querySelectorAll('table tbody tr');
                        for (const row of rows) {
                            const cells = row.querySelectorAll('td');
                            if (cells[1]?.textContent?.trim() === emsNo) {
                                const btns = row.querySelectorAll('button, a');
                                for (const btn of btns) {
                                    if (btn.textContent.includes('許可')) {
                                        btn.click();
                                        return true;
                                    }
                                }
                            }
                        }
                        return false;
                    }, factory.ems_no);

                    if (clicked) {
                        await sleep(CONFIG.PAGE_DELAY);

                        const permits = await page.evaluate(() => {
                            const results = [];
                            const tables = document.querySelectorAll('table');

                            tables.forEach(table => {
                                const rows = table.querySelectorAll('tbody tr, tr');
                                rows.forEach(row => {
                                    const cells = row.querySelectorAll('td');
                                    if (cells.length >= 6) {
                                        const text = row.textContent;
                                        if (/\d{2,3}\/\d{1,2}\/\d{1,2}/.test(text)) {
                                            results.push({
                                                process_id: cells[0]?.textContent?.trim() || '',
                                                process_name: cells[1]?.textContent?.trim() || '',
                                                category: cells[2]?.textContent?.trim() || '',
                                                permit_no: cells[3]?.textContent?.trim() || '',
                                                effective_date: cells[4]?.textContent?.trim() || '',
                                                expiry_date: cells[5]?.textContent?.trim() || ''
                                            });
                                        }
                                    }
                                });
                            });

                            return results;
                        });

                        let addedCount = 0;
                        permits.forEach(permit => {
                            if (permit.expiry_date && permit.category) {
                                allData.push({
                                    county: factory.county,
                                    ems_no: factory.ems_no,
                                    company_name: factory.company_name,
                                    address: factory.address,
                                    ...permit
                                });
                                addedCount++;
                            }
                        });

                        console.log(` ✅ ${addedCount} 筆`);

                        await page.goBack();
                        await sleep(CONFIG.PAGE_DELAY);
                    } else {
                        console.log(' ⏭️ 找不到');
                    }
                } catch (err) {
                    console.log(` ⚠️ ${err.message.substring(0, 25)}`);
                    try { await page.goBack(); } catch (e) { }
                    await sleep(1500);
                }
            }

            // 翻頁
            if (currentPage < totalPages) {
                currentPage++;
                console.log(`\n➡️ 前往第 ${currentPage} 頁...`);

                const nextSuccess = await page.evaluate((targetPage) => {
                    const pagination = document.querySelector('ul.pagination, .pagination');
                    if (!pagination) return false;

                    const links = pagination.querySelectorAll('a, li a');
                    for (const link of links) {
                        const text = link.textContent.trim();
                        if (text === String(targetPage)) {
                            link.click();
                            return true;
                        }
                    }

                    for (const link of links) {
                        const text = link.textContent.trim();
                        if (text === '下一頁' || text === '>' || text === '›' || text === '»') {
                            link.click();
                            return true;
                        }
                    }

                    return false;
                }, currentPage);

                if (nextSuccess) {
                    await sleep(CONFIG.PAGE_DELAY);
                } else {
                    console.log('\n✅ 無法找到下一頁，結束爬取');
                    break;
                }
            } else {
                console.log('\n✅ 已處理完所有頁面');
                break;
            }
        }

        // 統計
        console.log('\n═══════════════════════════════════════════════════════');
        console.log(`   📊 統計：共處理 ${totalFactories} 家工廠，擷取 ${allData.length} 筆許可證`);
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (err) {
        console.error('\n❌ 爬取過程發生錯誤：', err.message);
    } finally {
        if (allData.length > 0) {
            await saveToExcel(allData, districtName);
        } else {
            console.log('⚠️ 沒有擷取到任何資料');
        }

        console.log('\n📌 10 秒後自動關閉瀏覽器...');
        await sleep(10000);
        await browser.close();
    }
}

// ============================================
// 資料合併函式
// ============================================

/**
 * 尋找最早的到期日
 */
function findEarliestDate(dates) {
    if (!dates || dates.length === 0) return '';
    return dates.sort()[0];
}

/**
 * 尋找最晚的到期日
 */
function findLatestDate(dates) {
    if (!dates || dates.length === 0) return '';
    return dates.sort().reverse()[0];
}

/**
 * 合併同一工廠的多個製程資料
 */
function consolidateFactoryData(data) {
    const factoryMap = new Map();

    data.forEach(item => {
        const key = item.ems_no;

        if (!factoryMap.has(key)) {
            factoryMap.set(key, {
                county: item.county,
                ems_no: item.ems_no,
                company_name: item.company_name,
                address: item.address,
                processes: [],
                categories: new Set(),
                permit_nos: new Set(),
                expiry_dates: []
            });
        }

        const factory = factoryMap.get(key);

        if (item.process_id && item.process_name) {
            factory.processes.push(`${item.process_id} - ${item.process_name}`);
        }

        if (item.category) {
            factory.categories.add(item.category);
        }

        if (item.permit_no) {
            factory.permit_nos.add(item.permit_no);
        }

        if (item.expiry_date) {
            factory.expiry_dates.push(item.expiry_date);
        }
    });

    return Array.from(factoryMap.values()).map(factory => ({
        county: factory.county,
        ems_no: factory.ems_no,
        company_name: factory.company_name,
        address: factory.address,
        process_count: factory.processes.length,
        processes: factory.processes.join('\n'),
        categories: Array.from(factory.categories).join(', '),
        permit_nos: Array.from(factory.permit_nos).join('\n'),
        earliest_expiry_date: findEarliestDate(factory.expiry_dates),
        latest_expiry_date: findLatestDate(factory.expiry_dates)
    }));
}

// ============================================
// 儲存 Excel（總表 + 每個地區一個分頁）
// ============================================
async function saveToExcel(data, sheetName) {
    const filepath = path.join(__dirname, '..', 'data', CONFIG.EXCEL_FILENAME);

    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // 建立或載入現有的 Excel 檔案
    let workbook = new ExcelJS.Workbook();

    if (fs.existsSync(filepath)) {
        try {
            await workbook.xlsx.readFile(filepath);
            console.log(`📂 載入現有 Excel 檔案：${CONFIG.EXCEL_FILENAME}`);
        } catch (err) {
            console.log(`⚠️ 無法讀取現有檔案，建立新檔案`);
            workbook = new ExcelJS.Workbook();
        }
    }

    // 表頭定義（合併後的格式）
    const headerColumns = [
        { header: 'county', key: 'county', width: 10 },
        { header: 'ems_no', key: 'ems_no', width: 15 },
        { header: 'company_name', key: 'company_name', width: 30 },
        { header: 'address', key: 'address', width: 40 },
        { header: 'process_count', key: 'process_count', width: 12 },
        { header: 'processes', key: 'processes', width: 35 },
        { header: 'categories', key: 'categories', width: 20 },
        { header: 'permit_nos', key: 'permit_nos', width: 25 },
        { header: 'earliest_expiry_date', key: 'earliest_expiry_date', width: 18 },
        { header: 'latest_expiry_date', key: 'latest_expiry_date', width: 18 },
        { header: 'district', key: 'district', width: 10 }
    ];

    // ========== 1. 先處理地區分頁（寫入本次資料）==========
    // 💡 策略：先寫入地區分頁，這樣後續重建總表時可以讀取到本次資料
    console.log(`\n📝 處理地區分頁...`);

    // 確保分頁名稱有效（Excel 限制：不能超過 31 字元，不能包含特殊字元）
    let safeSheetName = sheetName
        .replace(/[\\\/\?\*\[\]:]/g, '') // 移除不允許的字元
        .substring(0, 31); // 限制長度

    // 檢查是否已存在同名分頁
    let existingSheet = workbook.getWorksheet(safeSheetName);
    if (existingSheet) {
        // 如果已存在，加上時間戳記
        const timestamp = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }).replace(':', '');
        safeSheetName = `${safeSheetName}_${timestamp}`.substring(0, 31);
        console.log(`   ⚠️ 地區分頁已存在，改用名稱：${safeSheetName}`);
    }

    // 新增地區分頁
    const newDistrictSheet = workbook.addWorksheet(safeSheetName);

    // 設定表頭（地區分頁不需要 district 欄位）
    const districtHeaders = headerColumns.filter(h => h.key !== 'district');
    newDistrictSheet.columns = districtHeaders;

    // 設定表頭樣式
    newDistrictSheet.getRow(1).font = { bold: true };
    newDistrictSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    // 🔥 合併同一工廠的多個製程資料
    const consolidatedData = consolidateFactoryData(data);
    console.log(`   🔄 合併: ${data.length} 筆製程 → ${consolidatedData.length} 家工廠`);

    // 新增合併後的資料到地區分頁
    consolidatedData.forEach(row => {
        const excelRow = newDistrictSheet.addRow(row);
        excelRow.getCell('processes').alignment = { wrapText: true, vertical: 'top' };
        excelRow.getCell('permit_nos').alignment = { wrapText: true, vertical: 'top' };
    });

    console.log(`   ✅ 已新增「${safeSheetName}」分頁，共 ${consolidatedData.length} 家工廠（${data.length} 個製程）`);

    // ========== 2. 重新創建「總表」分頁 ==========
    // 💡 策略：刪除舊總表，從所有地區分頁（包含剛才新增的）讀取資料
    console.log(`\n🔄 重新創建總表（整合所有地區）...`);

    // 刪除舊的總表（如果存在）
    const oldSummary = workbook.getWorksheet('總表');
    if (oldSummary) {
        workbook.removeWorksheet(oldSummary.id);
        console.log('   🗑️  已刪除舊總表');
    }

    // 創建新的總表
    const summarySheet = workbook.addWorksheet('總表');
    summarySheet.columns = headerColumns;

    // 設定表頭樣式
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };

    console.log('   📋 已創建新總表');

    // 從所有地區分頁（包含剛才新增的）讀取資料並加入總表
    const allDistrictSheets = workbook.worksheets.filter(ws => ws.name !== '總表');
    let summaryTotalRows = 0;

    for (const districtSheet of allDistrictSheets) {
        const districtName = districtSheet.name;
        let count = 0;

        for (let i = 2; i <= districtSheet.rowCount; i++) {
            const row = districtSheet.getRow(i);
            const emsNo = row.getCell(2).value;
            if (emsNo) {
                const summaryRow = summarySheet.addRow({
                    county: row.getCell(1).value,
                    ems_no: row.getCell(2).value,
                    company_name: row.getCell(3).value,
                    address: row.getCell(4).value,
                    process_count: row.getCell(5).value,
                    processes: row.getCell(6).value,
                    categories: row.getCell(7).value,
                    permit_nos: row.getCell(8).value,
                    earliest_expiry_date: row.getCell(9).value,
                    latest_expiry_date: row.getCell(10).value,
                    district: districtName
                });
                summaryRow.getCell('processes').alignment = { wrapText: true, vertical: 'top' };
                summaryRow.getCell('permit_nos').alignment = { wrapText: true, vertical: 'top' };
                count++;
            }
        }

        console.log(`   📄 從「${districtName}」加入 ${count} 筆`);
        summaryTotalRows += count;
    }

    console.log(`   ✅ 總表共 ${summaryTotalRows} 筆資料（來自 ${allDistrictSheets.length} 個地區）`);

    // ========== 3. 儲存檔案 ==========
    await workbook.xlsx.writeFile(filepath);

    // 列出所有分頁
    const sheetNames = workbook.worksheets.map(ws => ws.name);

    console.log(`\n📁 已儲存到：${filepath}`);
    console.log(`\n📑 目前所有分頁（共 ${sheetNames.length} 個）：`);
    sheetNames.forEach((name, idx) => {
        const marker = name === '總表' ? '📊' : '📄';
        console.log(`   ${marker} ${idx + 1}. ${name}`);
    });
    console.log('\n💡 可直接用 Excel 開啟或匯入 Supabase air_permits 表');
}

// ============================================
// 執行
// ============================================
main().catch(console.error);
