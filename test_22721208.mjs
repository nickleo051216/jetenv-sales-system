// 測試統編 22721208 的資料查詢
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// 手動讀取 .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        envVars[match[1].trim()] = match[2].trim();
    }
});

const supabase = createClient(
    envVars.VITE_SUPABASE_URL,
    envVars.VITE_SUPABASE_ANON_KEY
);

async function testQuery() {
    const taxId = '22721208';

    console.log('=======================================');
    console.log('測試統編:', taxId);
    console.log('=======================================\n');

    // 1. 查詢 water_permits (用統編)
    console.log('=== 1. water_permits (用統編) ===');
    const { data: w1, error: e1 } = await supabase
        .from('water_permits')
        .select('*')
        .in('ban', [taxId, taxId.replace(/^0+/, '')]);

    if (e1) console.log('錯誤:', e1.message);
    console.log('找到:', w1?.length || 0, '筆');
    if (w1?.length) {
        w1.forEach(p => {
            console.log(`  - 管編: ${p.ems_no}, 許可到期: ${p.per_edate}, 設施: ${p.fac_name}`);
        });
    }

    // 獲取管編用於後續查詢
    let emsNo = null;
    if (w1?.length) {
        emsNo = w1[0].ems_no;
    }

    // 2. 查詢 air_permits (用管編)
    if (emsNo) {
        console.log('\n=== 2. air_permits (用管編 ' + emsNo + ') ===');
        const { data: a, error: e2 } = await supabase
            .from('air_permits')
            .select('*')
            .eq('ems_no', emsNo);

        if (e2) console.log('錯誤:', e2.message);
        console.log('找到:', a?.length || 0, '筆');
        if (a?.length) {
            a.forEach(p => {
                console.log(`  - 許可號: ${p.permit_no}, 類別: ${p.category}, 到期: ${p.expiry_date}, 製程: ${p.process_name}`);
            });
        }
    } else {
        console.log('\n=== 2. air_permits ===');
        console.log('無法查詢，因為未找到管編');
    }

    // 3. 查詢 factories (用統編)
    console.log('\n=== 3. factories (用統編) ===');
    const { data: f, error: e3 } = await supabase
        .from('factories')
        .select('*')
        .eq('uniformno', taxId);

    if (e3) console.log('錯誤:', e3.message);
    console.log('找到:', f?.length || 0, '筆');
    if (f?.length) {
        f.forEach(p => {
            console.log(`  - 公司: ${p.company_name}, 委託項目: ${p.service_items}`);
        });
    }

    // 4. 測試政府 API (EMS_S_01 和 EMS_S_03)
    console.log('\n=== 4. 測試政府 API ===');
    try {
        // EMS_S_01 - 基本資料
        const res1 = await fetch(`https://prtr.moenv.gov.tw/FacilityWeb/OpenData.ashx?Source=EMS_S_01&SearchValue=${taxId}`);
        const data1 = await res1.json();
        console.log('EMS_S_01 回應類型:', Array.isArray(data1) ? '陣列' : typeof data1);
        console.log('EMS_S_01 資料筆數:', Array.isArray(data1) ? data1.length : (data1.records ? data1.records.length : 0));

        if (Array.isArray(data1) && data1.length > 0) {
            console.log('  管編列表:', data1.map(r => r.EMS_NO || r.ems_no).join(', '));
        }

        // EMS_S_03 - 許可資料
        if (emsNo) {
            const res3 = await fetch(`https://prtr.moenv.gov.tw/FacilityWeb/OpenData.ashx?Source=EMS_S_03&SearchValue=${emsNo}`);
            const data3 = await res3.json();
            console.log('\nEMS_S_03 回應類型:', Array.isArray(data3) ? '陣列' : typeof data3);
            const permits = Array.isArray(data3) ? data3 : (data3.records || []);
            console.log('EMS_S_03 許可筆數:', permits.length);
            permits.forEach(p => {
                console.log(`  - 許可號: ${p.PER_NO}, 類別: ${p.PER_TYPE}, 到期: ${p.PER_EDATE}`);
            });
        }
    } catch (err) {
        console.log('API 錯誤:', err.message);
    }

    console.log('\n=======================================');
    console.log('查詢完成');
}

testQuery().catch(console.error);
