import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const urls = [
    { name: '蔡兄弟鍍金 (最新)', url: 'https://wpmis.moenv.gov.tw/WPMIS/Application/OpenPlatformDownload.ashx?f=A000100930&file=A000100930.pdf&type=Link&type2=Rule&type3=CareerSewer' },
    { name: '金協利 (最新)', url: 'https://wpmis.moenv.gov.tw/WPMIS/Application/OpenPlatformDownload.ashx?f=A000055140&file=A000055140.pdf&type=Link&type2=Rule&type3=CareerSewer' }
];

async function extractTextFromPdf(buffer) {
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
}

// 模擬主程式的提取邏輯
function extractRepresentative(text) {
    if (!text.includes('代填表')) return '(沒代填表)';
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
        if (match && match[1]) return match[1].trim();
    }
    return '(正則沒抓到)';
}

async function test() {
    for (const item of urls) {
        console.log(`\n=== 檢查 ${item.name} ===`);
        try {
            const response = await axios.get(item.url, {
                responseType: 'arraybuffer',
                timeout: 60000,
                headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://waterpollutioncontrol.moenv.gov.tw/' }
            });
            const text = await extractTextFromPdf(response.data);

            // 1. 檢查是否有「精準」
            if (text.includes('精準') || text.includes('精 準')) {
                console.log('✅ 找到「精準」關鍵字！');
                const idx = text.indexOf('精');
                console.log('上下文:', text.substring(idx - 50, idx + 200).replace(/\s+/g, ' '));
            } else {
                console.log('❌ 沒找到「精準」關鍵字');
            }

            // 2. 測試現有正則
            console.log('現有提取結果:', extractRepresentative(text));

        } catch (err) {
            console.log('錯誤:', err.message);
        }
    }
}

test().catch(console.error);
