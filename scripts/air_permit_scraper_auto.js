/**
 * 空污操作許可證爬蟲 (Full-Automatic / 全自動版) v1
 * 
 * 📌 使用方式：
 *   node scripts/air_permit_scraper_auto.js --county "新北市" --district "板橋區"
 * 
 * 📌 參數說明：
 *   --county   縣市名稱 (必填)
 *   --district 鄉鎮區名稱 (必填)
 *   --headless 是否使用無頭模式 (可選，預設 false)
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
// 解析命令列參數
// ============================================
function parseArgs() {
    const args = process.argv.slice(2);
    const result = { county: '', district: '', headless: false };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--county' && args[i + 1]) {
            result.county = args[i + 1];
            i++;
        } else if (args[i] === '--district' && args[i + 1]) {
            result.district = args[i + 1];
            i++;
        } else if (args[i] === '--headless') {
            result.headless = true;
        }
    }

    return result;
}

const cmdArgs = parseArgs();

// 驗證參數
if (!cmdArgs.county || !cmdArgs.district) {
    console.log('❌ 錯誤：請提供縣市和區域參數');
    console.log('');
    console.log('使用方式：');
    console.log('  node scripts/air_permit_scraper_auto.js --county "新北市" --district "板橋區"');
    console.log('');
    console.log('參數說明：');
    console.log('  --county   縣市名稱 (必填)');
    console.log('  --district 鄉鎮區名稱 (必填)');
    console.log('  --headless 使用無頭模式 (可選)');
    process.exit(1);
}

// ============================================
// 設定區
// ============================================
const CONFIG = {
    HOME_URL: 'https://aodmis.moenv.gov.tw/opendata/ab/1',
    PAGE_DELAY: 3000,
    HEADLESS: cmdArgs.headless,
    EXCEL_FILENAME: 'air_permits.xlsx',
    ONE_DRIVE_PATH: 'C:\\Users\\jeten\\OneDrive\\Nick Sales\\00. 業務所需資料\\陌生開發資料區\\1. 許可證\\air_permits.xlsx',
    TARGET_COUNTY: cmdArgs.county,
    TARGET_DISTRICT: cmdArgs.district,
};

// ============================================
// 工具函式
// ============================================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// 自動選擇縣市
// ============================================
async function selectCounty(page, countyName) {
    console.log(`   🔽 選擇縣市: ${countyName}`);

    const success = await page.evaluate((county) => {
        const countySelect = document.querySelector('#cityCode');

        if (countySelect) {
            const options = Array.from(countySelect.options);
            const found = options.find(opt => opt.text === county || opt.value === county);

            if (found) {
                countySelect.value = found.value;
                countySelect.dispatchEvent(new Event('change', { bubbles: true }));
                return { success: true, value: found.value };
            }
            return { success: false, options: options.map(o => o.text).slice(0, 10) };
        }
        return { success: false, error: '#cityCode select not found' };
    }, countyName);

    if (!success.success) {
        console.log(`   ⚠️ 可用選項:`, success.options || success.error);
        throw new Error(`找不到縣市: ${countyName}`);
    }

    // 等待區域選單更新
    await sleep(2000);
    console.log(`   ✅ 縣市已選擇: ${countyName}`);
}

// ============================================
// 自動選擇區域
// ============================================
async function selectDistrict(page, districtName) {
    console.log(`   🔽 選擇區域: ${districtName}`);

    const result = await page.evaluate((district) => {
        const districtSelect = document.querySelector('#townCode');

        if (districtSelect) {
            const options = Array.from(districtSelect.options);
            const found = options.find(opt => opt.text === district || opt.value === district);

            if (found) {
                districtSelect.value = found.value;
                districtSelect.dispatchEvent(new Event('change', { bubbles: true }));
                return { success: true, value: found.value };
            }
            return { success: false, options: options.map(o => o.text).slice(0, 20) };
        }
        return { success: false, error: '#townCode select not found' };
    }, districtName);

    if (!result.success) {
        console.log(`   ⚠️ 可用選項:`, result.options || result.error);
        throw new Error(`找不到區域: ${districtName}`);
    }

    await sleep(500);
    console.log(`   ✅ 區域已選擇: ${districtName}`);
}

// ============================================
// 自動勾選「許可」並查詢
// ============================================
async function checkPermitAndQuery(page) {
    console.log(`   ☑️  確認「許可」已勾選...`);

    const result = await page.evaluate(() => {
        const permitCheckbox = document.querySelector('#scales');

        if (permitCheckbox && !permitCheckbox.checked) {
            permitCheckbox.click();
            return { checked: true, wasUnchecked: true };
        }

        return { checked: permitCheckbox?.checked || false, wasUnchecked: false };
    });

    if (result.wasUnchecked) {
        console.log('   🔧 已自動勾選「許可」');
    } else if (result.checked) {
        console.log('   ✅「許可」已勾選');
    }

    // 點擊查詢按鈕
    console.log('   🔍 點擊查詢按鈕...');
    await page.evaluate(() => {
        const btn = document.querySelector('.Orang_btn, button.btn-lg');
        if (btn) { btn.click(); return; }
        // 備用：文字匹配
        const buttons = document.querySelectorAll('button');
        for (const b of buttons) {
            if (b.textContent?.includes('查詢')) { b.click(); return; }
        }
    });

    console.log('   ⏳ 等待查詢結果載入...');
    await sleep(4000);
}

// ============================================
// 主程式
// ============================================
async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   🏭 空污操作許可證爬蟲 (全自動版) v1');
    console.log('   📊 輸出格式：Excel（每個地區一個分頁）');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`   🎯 目標: ${CONFIG.TARGET_COUNTY} ${CONFIG.TARGET_DISTRICT}`);
    console.log('═══════════════════════════════════════════════════════\n');

    const browser = await puppeteer.launch({
        headless: CONFIG.HEADLESS,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
        defaultViewport: null
    });

    const page = await browser.newPage();

    const allData = [];
    const processedEmsNos = new Set();
    let districtName = CONFIG.TARGET_DISTRICT;

    // 導航到列管查詢頁面（先到首頁再點擊導航，因為 Angular SPA 不支援直接進入子路由）
    async function navigateToLqPage() {
        console.log('📡 開啟首頁...');
        await page.goto(CONFIG.HOME_URL, { waitUntil: 'networkidle2' });
        await sleep(2000);

        console.log('📡 點擊「列管工廠資料公開」進入查詢頁...');
        const clicked = await page.evaluate(() => {
            const links = document.querySelectorAll('a');
            for (const link of links) {
                if (link.textContent?.trim() === '列管工廠資料公開') {
                    link.click();
                    return true;
                }
            }
            return false;
        });

        if (!clicked) throw new Error('找不到「列管工廠資料公開」連結');

        // 等待 Angular 路由切換完成，並確認 select 載入
        await page.waitForSelector('#cityCode', { timeout: 15000 });
        await sleep(2000);
        console.log('   ✅ 查詢頁面已載入');
    }

    // 恢復查詢狀態（從詳細頁返回後使用）
    // Angular SPA goBack 後查詢條件會全部重置，必須重新選擇並查詢
    async function ensureState(targetPage) {
        // 先 goBack 到列表頁（如果還在詳細頁）
        const onDetailPage = await page.evaluate(() => {
            return window.location.pathname.includes('/lv/');
        });
        if (onDetailPage) {
            await page.goBack();
            await sleep(1500);
        }

        // 確認 select 存在，不存在就重新導航
        const hasSelect = await page.evaluate(() => !!document.querySelector('#cityCode'));
        if (!hasSelect) {
            await navigateToLqPage();
        }

        await selectCounty(page, CONFIG.TARGET_COUNTY);
        await selectDistrict(page, CONFIG.TARGET_DISTRICT);
        await checkPermitAndQuery(page);

        // 如果不是第 1 頁，跳轉到目標頁
        if (targetPage > 1) {
            console.log(`   🔄 跳轉到第 ${targetPage} 頁...`);
            const jumped = await page.evaluate((tp) => {
                const pagination = document.querySelector('ul.pagination, .pagination');
                if (!pagination) return false;
                const links = pagination.querySelectorAll('a, li a');
                for (const link of links) {
                    if (link.textContent.trim() === String(tp)) {
                        link.click();
                        return true;
                    }
                }
                return false;
            }, targetPage);
            if (jumped) await sleep(CONFIG.PAGE_DELAY);
        }
    }

    try {
        // Step 1: 導航到查詢頁面
        await navigateToLqPage();

        // Step 2: 自動選擇縣市和區域
        console.log('\n🤖 自動選擇查詢條件...');
        await selectCounty(page, CONFIG.TARGET_COUNTY);
        await selectDistrict(page, CONFIG.TARGET_DISTRICT);

        // Step 3: 勾選「許可」並查詢
        await checkPermitAndQuery(page);

        console.log(`\n📍 開始爬取：${CONFIG.TARGET_COUNTY} ${districtName}\n`);

        // Step 4: 取得總頁數
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

        // Step 5: 開始爬取
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

                        // Angular SPA goBack 後查詢狀態會重置，必須每次都恢復
                        await ensureState(currentPage);
                    } else {
                        console.log(' ⏭️ 找不到');
                    }
                } catch (err) {
                    console.log(` ⚠️ ${err.message.substring(0, 40)}`);
                    // 發生錯誤後恢復狀態
                    try {
                        await ensureState(currentPage);
                    } catch (e) {
                        console.log(`   ❌ 恢復失敗: ${e.message.substring(0, 30)}`);
                    }
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

        console.log('\n📌 5 秒後自動關閉瀏覽器...');
        await sleep(5000);
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
    // 排序並返回第一個（最早的）
    return dates.sort()[0];
}

/**
 * 尋找最晚的到期日
 */
function findLatestDate(dates) {
    if (!dates || dates.length === 0) return '';
    // 排序並返回最後一個（最晚的）
    return dates.sort().reverse()[0];
}

/**
 * 合併同一工廠的多個製程資料
 * @param {Array} data - 原始資料陣列（每個製程一筆）
 * @returns {Array} - 合併後的資料陣列（每個工廠一筆）
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

        // 累積製程資訊
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

    // 轉換為最終格式
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
        { header: 'district', key: 'district', width: 10 } // 總表額外欄位：來源地區
    ];

    // ========== 1. 先處理地區分頁（寫入本次資料）==========
    console.log(`\n📝 處理地區分頁...`);

    // 確保分頁名稱有效（Excel 限制：不能超過 31 字元，不能包含特殊字元）
    let safeSheetName = sheetName
        .replace(/[\\\/\?\*\[\]:]/g, '') // 移除不允許的字元
        .substring(0, 31); // 限制長度

    // 檢查是否已存在同名分頁 → 直接覆蓋（刪除舊的）
    const existingSheet = workbook.getWorksheet(safeSheetName);
    if (existingSheet) {
        workbook.removeWorksheet(existingSheet.id);
        console.log(`   🔄 已刪除舊的「${safeSheetName}」分頁，將重新寫入`);
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
        // 設定換行效果
        excelRow.getCell('processes').alignment = { wrapText: true, vertical: 'top' };
        excelRow.getCell('permit_nos').alignment = { wrapText: true, vertical: 'top' };
    });

    console.log(`   ✅ 已新增「${safeSheetName}」分頁，共 ${consolidatedData.length} 家工廠（${data.length} 個製程）`);

    // ========== 2. 重新創建「總表」分頁 ==========
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
            // 確保有資料才加入（避免空白列）
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
                // 設定換行效果
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
    console.log(`\n📁 已儲存到：${filepath}`);

    // 同步複製到 OneDrive
    const oneDrivePath = CONFIG.ONE_DRIVE_PATH;
    try {
        fs.copyFileSync(filepath, oneDrivePath);
        console.log(`☁️  已同步到 OneDrive：${oneDrivePath}`);
    } catch (err) {
        console.log(`⚠️  OneDrive 同步失敗：${err.message}`);
    }

    // 列出所有分頁
    const sheetNames = workbook.worksheets.map(ws => ws.name);
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
