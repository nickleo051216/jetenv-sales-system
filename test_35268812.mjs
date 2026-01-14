// 測試統編 35268812 的資料查詢
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
    const taxId = '35268812';
    const emsNo = 'F1500549';

    console.log('=======================================');
    console.log('測試統編:', taxId);
    console.log('管編:', emsNo);
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

    // 2. 查詢 water_permits (用管編)
    console.log('\n=== 2. water_permits (用管編) ===');
    const { data: w2, error: e2 } = await supabase
        .from('water_permits')
        .select('*')
        .eq('ems_no', emsNo);

    if (e2) console.log('錯誤:', e2.message);
    console.log('找到:', w2?.length || 0, '筆');
    if (w2?.length) {
        w2.forEach(p => {
            console.log(`  - 許可號: ${p.per_no}, 到期: ${p.per_edate}, 設施: ${p.fac_name}`);
        });
    }

    // 3. 查詢 air_permits (用管編)
    console.log('\n=== 3. air_permits (用管編) ===');
    const { data: a, error: e3 } = await supabase
        .from('air_permits')
        .select('*')
        .eq('ems_no', emsNo);

    if (e3) console.log('錯誤:', e3.message);
    console.log('找到:', a?.length || 0, '筆');
    if (a?.length) {
        a.forEach(p => {
            console.log(`  - 許可號: ${p.permit_no}, 類別: ${p.category}, 到期: ${p.expiry_date}, 製程: ${p.process_name}`);
        });
    }

    // 4. 查詢 factories (用統編)
    console.log('\n=== 4. factories (用統編) ===');
    const { data: f, error: e4 } = await supabase
        .from('factories')
        .select('*')
        .eq('uniformno', taxId);

    if (e4) console.log('錯誤:', e4.message);
    console.log('找到:', f?.length || 0, '筆');
    if (f?.length) {
        f.forEach(p => {
            console.log(`  - 公司: ${p.company_name}, 委託項目: ${p.service_items}`);
        });
    }

    console.log('\n=======================================');
    console.log('查詢完成');
}

testQuery().catch(console.error);
