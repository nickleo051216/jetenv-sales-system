// 測試水污許可證 API - 嘗試不同的過濾方式
const API_KEY = '7854a04b-f171-47bb-9e42-4dd2ecc4745b';
const TAX_ID = '50970570';

async function testFilterQueries() {
    console.log(`🔍 測試不同的過濾方式查詢統編: ${TAX_ID}`);
    console.log('---');

    // 嘗試不同的 URL 格式
    const urls = [
        // 標準格式
        `https://data.moenv.gov.tw/api/v2/EMS_S_03?format=json&limit=100&api_key=${API_KEY}`,

        // 嘗試加入 ban 過濾參數
        `https://data.moenv.gov.tw/api/v2/EMS_S_03?format=json&limit=100&api_key=${API_KEY}&ban=${TAX_ID}`,

        // 嘗試用 filter 參數
        `https://data.moenv.gov.tw/api/v2/EMS_S_03?format=json&limit=100&api_key=${API_KEY}&filter=ban,eq,${TAX_ID}`,

        // 嘗試用 query 參數
        `https://data.moenv.gov.tw/api/v2/EMS_S_03?format=json&limit=100&api_key=${API_KEY}&query=${TAX_ID}`,
    ];

    for (const url of urls) {
        try {
            const shortUrl = url.replace(API_KEY, 'API_KEY').slice(0, 120) + '...';
            console.log(`\n📡 測試: ${shortUrl}`);

            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.log(`   ❌ 錯誤: ${data.error}`);
                continue;
            }

            console.log(`   📊 回傳: ${data.records?.length || 0} 筆`);

            // 檢查是否有找到目標統編
            const found = data.records?.filter(r => r.ban === TAX_ID) || [];
            if (found.length > 0) {
                console.log(`   ✅ 找到 ${found.length} 筆符合統編!`);
                found.forEach(r => {
                    console.log(`      - ${r.fac_name} | 到期: ${r.per_edate}`);
                });
            }

        } catch (error) {
            console.log(`   ❌ 例外: ${error.message}`);
        }
    }

    console.log('\n---');
    console.log('💡 如果以上都沒找到,表示 API 不支援過濾,需要改用其他方案');
}

testFilterQueries();
