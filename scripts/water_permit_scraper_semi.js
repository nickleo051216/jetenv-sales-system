/**
 * 水污染防治許可證爬蟲 (Semi-Automatic / 半自動版) v4
 * 
 * 📌 使用方式：
 *   1. 執行：node scripts/water_permit_scraper_semi.js
 *   2. 瀏覽器會自動開啟水污染查詢網站
 *   3. 【手動操作】選擇縣市、鄉鎮區，點擊「查詢」
 *   4. 腳本會自動偵測到資料後開始爬取
 * 
 * 依賴：
 *   npm install puppeteer exceljs pdfjs-dist axios
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
    BASE_URL: 'https://waterpollutioncontrol.moenv.gov.tw/view/QueryList.aspx',
    WAIT_SECONDS: 60,
    PAGE_DELAY: 3000,
    HEADLESS: false,
    HEADLESS: false,
    EXCEL_FILENAME: 'water_permits.xlsx',
    ONE_DRIVE_PATH: 'C:\\Users\\jeten\\OneDrive\\Nick Sales\\00. 業務所需資料\\陌生開發資料區\\1. 許可證\\water_permits.xlsx',
};

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

// 使用 pdfjs-dist 提取 PDF 文字
async function extractTextFromPdf(buffer) {
    try {
        const uint8Array = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
        const pdf = await loadingTask.promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
        }
        return fullText;
    } catch (err) {
        return '';
    }
}

// 下載 PDF
async function downloadPdf(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': 'https://waterpollutioncontrol.moenv.gov.tw/'
            }
        });
        return response.data;
    } catch (err) {
        return null;
    }
}

// 從「許可證首頁」PDF 提取效期
function extractExpiryDate(text) {
    const patterns = [
        /自\s*(\d{2,3})年(\d{1,2})月(\d{1,2})日\s*起\s*至?\s*(\d{2,3})年(\d{1,2})月(\d{1,2})日\s*止/,
        /至(\d{2,3})年(\d{1,2})月(\d{1,2})日止/,
        /(\d{2,3})年(\d{1,2})月(\d{1,2})日\s*止/
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            if (match.length >= 7) {
                return `${match[4]}年${match[5]}月${match[6]}日`;
            } else if (match.length >= 4) {
                return `${match[1]}年${match[2]}月${match[3]}日`;
            }
        }
    }
    return '';
}

// 從「核准文件」PDF 提取代填表公司
function extractRepresentative(text) {
    if (!text.includes('代填表')) return '';

    const cleanText = text.replace(/\s+/g, ' ');

    const patterns = [
        /\(一\)代填表公司?\s*\(?機構\)?\s*名稱\s*([^\n\r（(○□]{3,40})/,
        /代填表公\s*司\s*\(機\s*構\)\s*名稱\s*([^\n\r（(○□]{3,40})/,
        /代填表公司[（(]機構[）)]名稱\s*([^\n\r（(○□]{3,40})/,
        /代填表公司.*?名稱[：:\s]*([^\n\r（(○□]{3,40})/,
        /代填表.*?名稱\s+([^\s（(○□]{3,}(有限公司|股份有限公司|技師事務所|工程顧問|環保科技|環境))/
    ];

    for (const pattern of patterns) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
            let name = match[1].trim();
            name = name.replace(/[_│├─┤\s]+/g, '').trim();
            name = name.replace(/\d{3}號.*$/, '').trim();
            name = name.replace(/\(二\).*$/, '').trim();
            if (name.length >= 4 && name.length <= 35) {
                if (isValidCompanyName(name)) {
                    return name;
                } else {
                    return '空白';
                }
            }
        }
    }
    return '';
}

// 判斷是否為有效的公司/事務所名稱
function isValidCompanyName(name) {
    if (!name || typeof name !== 'string') return false;

    const trimmed = name.trim();
    if (trimmed.length < 4 || trimmed.length > 40) return false;

    const invalidKeywords = [
        '連絡電話', '負責人', '地址', '填表人', '座落位置',
        '註', '設置', '監測', '資料', '及地址'
    ];

    for (const kw of invalidKeywords) {
        if (trimmed.includes(kw)) return false;
    }

    const validKeywords = [
        '有限公司', '股份有限公司', '公司',
        '事務所', '技師事務所', '工程顧問',
        '環保', '環境', '工程', '科技', '企業', '顧問', '實業'
    ];

    for (const kw of validKeywords) {
        if (trimmed.includes(kw)) return true;
    }

    return false;
}

// ============================================
// 主程式
// ============================================
async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   💧 水污染防治許可證爬蟲 v4');
    console.log('   📊 效期從 H.pdf 抓取，代填表公司從核准文件抓取');
    console.log('═══════════════════════════════════════════════════════\n');

    const browser = await puppeteer.launch({
        headless: CONFIG.HEADLESS,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized'],
        defaultViewport: null
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);

    const allData = [];
    let districtName = '未知地區';

    // 初始化 Excel 變數
    const dataDir = path.join(__dirname, '..', 'data');
    const localFilepath = path.join(dataDir, CONFIG.EXCEL_FILENAME);
    const oneDrivePath = CONFIG.ONE_DRIVE_PATH;

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    let workbook = new ExcelJS.Workbook();
    let loaded = false;

    // 優先讀取 OneDrive 檔案
    if (fs.existsSync(oneDrivePath)) {
        try {
            console.log(`📖 讀取 OneDrive 檔案: ${oneDrivePath}`);
            await workbook.xlsx.readFile(oneDrivePath);
            loaded = true;
        } catch (e) {
            console.log('⚠️ 無法讀取 OneDrive 檔案，嘗試本地檔案...');
        }
    }

    if (!loaded && fs.existsSync(localFilepath)) {
        try {
            console.log(`📖 讀取本地檔案: ${localFilepath}`);
            await workbook.xlsx.readFile(localFilepath);
        } catch (e) { workbook = new ExcelJS.Workbook(); }
    }

    const headers = [
        { header: '縣市', key: 'county', width: 10 },
        { header: '地區', key: 'district', width: 10 },
        { header: '管制編號', key: 'control_no', width: 15 },
        { header: '事業名稱', key: 'company_name', width: 30 },
        { header: '行業別', key: 'industry', width: 20 },
        { header: '目前運作狀態', key: 'operation_status', width: 12 },
        { header: '許可證效期', key: 'expiry_date', width: 18 },
        { header: '代填表公司', key: 'representative', width: 30 },
        { header: '來源', key: 'source', width: 12 }
    ];

    try {
        console.log('📡 開啟網站...');
        await page.goto(CONFIG.BASE_URL, { waitUntil: 'networkidle2' });

        console.log('╔═══════════════════════════════════════════════════════╗');
        console.log('║  📋 請在瀏覽器中：                                    ║');
        console.log('║  1️⃣  選擇「縣市」與「鄉鎮區」                          ║');
        console.log('║  2️⃣  點擊「查詢」按鈕                                  ║');
        console.log('╚═══════════════════════════════════════════════════════╝\n');

        await countdown(CONFIG.WAIT_SECONDS);

        // 抓取地區資訊
        const locationInfo = await page.evaluate(() => {
            const containers = document.querySelectorAll('.select2-selection__rendered');
            return {
                county: containers[0]?.textContent?.replace('×', '').trim() || '',
                district: containers[1]?.textContent?.replace('×', '').trim() || ''
            };
        });
        districtName = locationInfo.district || '未知地區';
        console.log(`📍 目標地區：${locationInfo.county} ${districtName}\n`);

        let pageCount = 0;
        let currentPage = 1;
        let previousFirstId = null; // 用於偵測重複頁面防止無限迴圈

        while (currentPage <= 50) {
            console.log(`📄 處理第 ${currentPage} 頁...`);
            await sleep(2000);

            const factories = await page.evaluate(() => {
                const list = [];
                const rows = document.querySelectorAll('table#ContentPlaceHolder1_gvQuery tbody tr');

                rows.forEach((row, idx) => {
                    const cells = row.querySelectorAll('td');
                    if (cells.length >= 6) {
                        const ruleBtn = row.querySelector('a[id*="hlk_Rule"]');
                        if (ruleBtn) {
                            list.push({
                                btnId: ruleBtn.id,
                                county: cells[1]?.textContent?.trim() || '',
                                district: cells[2]?.textContent?.trim() || '',
                                control_no: cells[3]?.textContent?.trim() || '',
                                company_name: cells[4]?.textContent?.trim() || '',
                                industry: cells[5]?.textContent?.trim() || ''
                            });
                        }
                    }
                });
                return list;
            });

            if (factories.length === 0) {
                console.log('   ⚠️ 無資料');
                break;
            }

            // 偵測是否重複（有些網站最後一頁按「下一頁」會停在原位）
            const currentFirstId = factories[0].control_no;
            if (currentFirstId === previousFirstId) {
                console.log('   ⚠️ 偵測到重複內容，停止翻頁');
                break;
            }
            previousFirstId = currentFirstId;

            console.log(`   找到 ${factories.length} 筆`);

            for (let i = 0; i < factories.length; i++) {
                const factory = factories[i];
                process.stdout.write(`   [${i + 1}/${factories.length}] ${factory.company_name.substring(0, 12)}... `);

                try {
                    // 進入詳情頁 - 增加重試機制
                    let retries = 3;
                    while (retries > 0) {
                        try {
                            await Promise.all([
                                page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }), // 增加到 60s
                                page.click(`#${factory.btnId}`)
                            ]);
                            await sleep(2000);
                            break; // 成功就跳出
                        } catch (navError) {
                            console.log(`      ⚠️ 進入詳情頁失敗，重試中... (剩餘 ${retries - 1} 次)`);
                            retries--;
                            if (retries === 0) throw navError;
                            await sleep(3000);
                        }
                    }

                    // 抓取「目前運作狀態」
                    const operationStatus = await page.evaluate(() => {
                        const ths = Array.from(document.querySelectorAll('th'));
                        const targetTh = ths.find(th => th.textContent.includes('目前運作狀態'));
                        if (targetTh) {
                            const td = targetTh.nextElementSibling;
                            return td ? td.textContent.trim() : '';
                        }
                        return '';
                    });
                    factory.operation_status = operationStatus || '';

                    // 點擊「許可證(文件) - 核准」頁籤
                    await page.evaluate(() => {
                        const labels = Array.from(document.querySelectorAll('label'));
                        const target = labels.find(l => l.textContent.includes('許可證(文件) - 核准'));
                        if (target) target.click();
                    });
                    await sleep(2500);

                    // 找 PDF 連結 - 取所有「核准文件」連結（按順序）和第一個「許可證首頁」
                    const pdfUrls = await page.evaluate(() => {
                        const links = Array.from(document.querySelectorAll('a[href*="Download.ashx"]'));
                        const result = { approvalList: [], frontPage: null };

                        for (const link of links) {
                            const href = link.href;
                            if (href.includes('.pdf')) {
                                if (href.includes('H.pdf') && !result.frontPage) {
                                    result.frontPage = href; // 第一個許可證首頁
                                } else if (!href.includes('H.pdf')) {
                                    // 收集所有核准文件連結
                                    result.approvalList.push(href);
                                }
                            }
                        }
                        return result;
                    });

                    // 從「許可證首頁」(H.pdf) 抓效期
                    if (pdfUrls.frontPage) {
                        const pdfBuffer = await downloadPdf(pdfUrls.frontPage);
                        if (pdfBuffer) {
                            const pdfText = await extractTextFromPdf(pdfBuffer);
                            factory.expiry_date = extractExpiryDate(pdfText) || '無法解析';
                        } else {
                            factory.expiry_date = '下載失敗';
                        }
                    } else {
                        factory.expiry_date = '無H.pdf';
                    }

                    // 從「核准文件」抓代填表公司 - 遍歷列表直到找到為止
                    if (pdfUrls.approvalList && pdfUrls.approvalList.length > 0) {
                        console.log(`      共找到 ${pdfUrls.approvalList.length} 個核准文件，開始搜尋代填表資料...`);

                        for (let k = 0; k < pdfUrls.approvalList.length; k++) {
                            const url = pdfUrls.approvalList[k];
                            // 只檢查前 5 個以節省時間
                            if (k >= 5) break;

                            const pdfBuffer = await downloadPdf(url);
                            if (pdfBuffer) {
                                const pdfText = await extractTextFromPdf(pdfBuffer);
                                const rep = extractRepresentative(pdfText);
                                if (rep) {
                                    factory.representative = rep;
                                    console.log(`      在第 ${k + 1} 個 PDF 找到代填表公司: ${rep}`);
                                    break; // 找到就停止
                                }
                            }
                        }
                        if (!factory.representative) console.log('      所有 PDF 皆無代填表公司');
                    } else {
                        factory.representative = '無核准文件';
                    }

                    if (factory.expiry_date && factory.expiry_date !== '無法解析' && factory.expiry_date !== '無H.pdf') {
                        console.log(`✅ ${factory.expiry_date}`);
                    } else {
                        console.log(`⚠️ ${factory.expiry_date}`);
                    }

                    allData.push(factory);

                    // 返回列表
                    await Promise.all([
                        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { }),
                        page.goBack()
                    ]);
                    await sleep(2000);

                } catch (err) {
                    console.log(`❌ ${err.message.substring(0, 25)}`);
                    factory.expiry_date = '錯誤';
                    factory.representative = '';
                    allData.push(factory);

                    try {
                        await page.goBack({ waitUntil: 'domcontentloaded' });
                    } catch (e) {
                        await page.goto(CONFIG.BASE_URL, { waitUntil: 'domcontentloaded' });
                        break;
                    }
                    await sleep(1000);
                }
            }

            // 翻頁 - 使用正確的「下一頁」按鈕選擇器
            const hasNext = await page.evaluate(() => {
                const nextBtn = document.querySelector('#ContentPlaceHolder1_lkb_PageNext2') ||
                    document.querySelector('#ContentPlaceHolder1_lkb_PageNext');
                if (nextBtn && !nextBtn.disabled) {
                    nextBtn.click();
                    return true;
                }
                return false;
            });

            // 每頁處理完後立即存檔
            let safeDistrictName = districtName.replace(/[\\\/\?\*\[\]:]/g, '').substring(0, 28);
            let districtSheet = workbook.getWorksheet(safeDistrictName);

            if (!districtSheet) {
                districtSheet = workbook.addWorksheet(safeDistrictName);
            }
            // 確保 columns 定義存在
            districtSheet.columns = headers.filter(h => h.key !== 'source');
            if (districtSheet.rowCount === 0) {
                districtSheet.getRow(1).values = headers.filter(h => h.key !== 'source').map(h => h.header);
                districtSheet.getRow(1).font = { bold: true };
                districtSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
            }

            // 同步到 總表
            let summarySheet = workbook.getWorksheet('總表');
            if (!summarySheet) {
                summarySheet = workbook.addWorksheet('總表');
                summarySheet.columns = headers;
                summarySheet.getRow(1).font = { bold: true };
                summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0C0C0' } };
            }

            // 加入資料並去重 (以分頁工作表為主)
            factories.forEach(factory => {
                // 檢查分頁是否已存在 (管制編號)
                const existsInDistrict = Array.from({ length: districtSheet.rowCount }, (_, i) => districtSheet.getRow(i + 1).getCell(3).value)
                    .includes(factory.control_no);
                if (!existsInDistrict) {
                    districtSheet.addRow([
                        factory.county,
                        factory.district,
                        factory.control_no,
                        factory.company_name,
                        factory.industry,
                        factory.operation_status,
                        factory.expiry_date,
                        factory.representative
                    ]);
                }

                // 檢查總表是否已存在
                const existsInSummary = Array.from({ length: summarySheet.rowCount }, (_, i) => summarySheet.getRow(i + 1).getCell(3).value)
                    .includes(factory.control_no);
                if (!existsInSummary) {
                    summarySheet.addRow([
                        factory.county,
                        factory.district,
                        factory.control_no,
                        factory.company_name,
                        factory.industry,
                        factory.operation_status,
                        factory.expiry_date,
                        factory.representative,
                        safeDistrictName
                    ]);
                }
            });

            console.log(`   ✅ 更新「${safeDistrictName}」，目前該區共 ${districtSheet.rowCount - 1} 筆，總表共 ${summarySheet.rowCount - 1} 筆`);
            console.log(`   ✅ 更新「${safeDistrictName}」，目前該區共 ${districtSheet.rowCount - 1} 筆，總表共 ${summarySheet.rowCount - 1} 筆`);
            await saveWorkbookToAllPaths(workbook, [localFilepath, oneDrivePath]);


            if (hasNext) {
                console.log(`\n➡️ 前往第 ${currentPage + 1} 頁...`);
                await sleep(3000);
                currentPage++;
            } else {
                console.log('\n✅ 已處理完所有頁面');
                break;
            }
        }

        console.log(`\n📊 共處理 ${allData.length} 筆`);

    } catch (err) {
        console.error('\n❌ 錯誤:', err.message);
    } finally {
        // 最後重建總表
        await rebuildSummary();
        console.log('\n📌 10 秒後關閉...');
        await sleep(10000);
        await browser.close();
    }
}

// Excel 儲存
// 重建總表並存檔
async function rebuildSummary() {
    const dataDir = path.join(__dirname, '..', 'data');
    const localFilepath = path.join(dataDir, CONFIG.EXCEL_FILENAME);
    const oneDrivePath = CONFIG.ONE_DRIVE_PATH;

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    let workbook = new ExcelJS.Workbook();
    let loaded = false;
    if (fs.existsSync(oneDrivePath)) {
        try { await workbook.xlsx.readFile(oneDrivePath); loaded = true; } catch (e) { }
    }
    if (!loaded && fs.existsSync(localFilepath)) {
        try { await workbook.xlsx.readFile(localFilepath); loaded = true; } catch (e) { }
    }

    if (!loaded) return;

    const headers = [
        { header: '縣市', key: 'county', width: 10 },
        { header: '地區', key: 'district', width: 10 },
        { header: '管制編號', key: 'control_no', width: 15 },
        { header: '事業名稱', key: 'company_name', width: 30 },
        { header: '行業別', key: 'industry', width: 20 },
        { header: '目前運作狀態', key: 'operation_status', width: 12 },
        { header: '許可證效期', key: 'expiry_date', width: 18 },
        { header: '代填表公司', key: 'representative', width: 30 },
        { header: '來源', key: 'source', width: 12 }
    ];

    // 總表
    let summary = workbook.getWorksheet('總表');
    if (summary) workbook.removeWorksheet(summary.id);
    summary = workbook.addWorksheet('總表');
    summary.columns = headers;
    summary.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summary.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    let totalRows = 0;
    workbook.eachSheet(ws => {
        if (ws.name === '總表') return;
        for (let i = 2; i <= ws.rowCount; i++) {
            const row = ws.getRow(i);
            // 簡單檢查是否有資料
            const val = row.getCell(3).value;
            if (val) {
                summary.addRow({
                    county: row.getCell(1).value,
                    district: row.getCell(2).value,
                    control_no: row.getCell(3).value,
                    company_name: row.getCell(4).value,
                    industry: row.getCell(5).value,
                    operation_status: row.getCell(6).value,
                    expiry_date: row.getCell(7).value,
                    representative: row.getCell(8).value,
                    source: ws.name
                });
                totalRows++;
            }
        }
    });
    console.log(`   📊 總表重建完成，共 ${totalRows} 筆`);

    await saveWorkbookToAllPaths(workbook, [localFilepath, oneDrivePath]);
    console.log(`💾 已最終儲存至所有路徑`);
}

main().catch(console.error);

async function saveWorkbookToAllPaths(workbook, filepaths) {
    for (const fp of filepaths) {
        try {
            const dir = path.dirname(fp);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            await saveWorkbookWithRetry(workbook, fp);
            console.log(`      -> 已儲存: ${fp}`);
        } catch (err) {
            console.error(`      ❌ 儲存失敗: ${fp}`, err.message);
        }
    }
}

async function saveWorkbookWithRetry(workbook, filepath) {
    let retries = 5;
    while (retries > 0) {
        try {
            await workbook.xlsx.writeFile(filepath);
            return;
        } catch (error) {
            if (error.code === 'EBUSY' || error.message.includes('busy') || error.message.includes('locked')) {
                console.log(`   ⚠️ Excel 檔案被鎖定 (${path.basename(filepath)})，請關閉檔案！${retries} 秒後重試...`);
                await sleep(5000);
                retries--;
            } else {
                throw error;
            }
        }
    }
    throw new Error(`無法寫入 Excel 檔案 (${filepath})`);
}
