/**
 * 許可證定時爬蟲排程器（空污 + 水污 合一版）
 *
 * 每兩週一個循環，每個工作天跑指定區域
 * 每個區域依序執行：空污 → 水污
 * 跑完後同步 Supabase（空污）+ 發送 LINE 通知
 *
 * 使用方式：
 *   node scripts/scheduled_scraper.js              # 自動判斷今天跑什麼
 *   node scripts/scheduled_scraper.js --dry-run    # 只看排程不執行
 *   node scripts/scheduled_scraper.js --force D3   # 強制跑指定天次
 *   node scripts/scheduled_scraper.js --type air   # 只跑空污
 *   node scripts/scheduled_scraper.js --type water # 只跑水污
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// ============================================
// 載入環境變數（從 .env.local）
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
// 排程表（兩週循環）
// ============================================
const SCHEDULE = {
    // 第一週（奇數週）
    D1: { day: 1, week: 1, districts: [{ county: '新北市', district: '土城區' }] },
    D2: { day: 2, week: 1, districts: [{ county: '新北市', district: '樹林區' }] },
    D3: { day: 3, week: 1, districts: [{ county: '新北市', district: '三重區' }] },
    D4: { day: 4, week: 1, districts: [{ county: '新北市', district: '五股區' }] },
    D5: { day: 5, week: 1, districts: [{ county: '新北市', district: '新莊區' }] },
    // 第二週（偶數週）
    D6: { day: 1, week: 2, districts: [{ county: '新北市', district: '中和區' }, { county: '新北市', district: '永和區' }] },
    D7: { day: 2, week: 2, districts: [{ county: '新北市', district: '板橋區' }, { county: '新北市', district: '鶯歌區' }] },
    D8: { day: 3, week: 2, districts: [{ county: '桃園市', district: '龜山區' }] },
    D9: { day: 4, week: 2, districts: [{ county: '桃園市', district: '蘆竹區' }] },
    D10: { day: 5, week: 2, districts: [{ county: '新北市', district: '三峽區' }, { county: '新北市', district: '泰山區' }] },
};

// ============================================
// 判斷今天是排程的哪一天
// ============================================
function getTodayScheduleKey() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

    if (dayOfWeek === 0 || dayOfWeek === 6) return null;

    // 基準：2026-03-02 是週一，定為第 1 週起點
    const baseDate = new Date(2026, 2, 2);
    const diffMs = now.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7);
    const weekInCycle = (weekNumber % 2) + 1; // 1 或 2

    for (const [key, schedule] of Object.entries(SCHEDULE)) {
        if (schedule.week === weekInCycle && schedule.day === dayOfWeek) {
            return key;
        }
    }
    return null;
}

// ============================================
// 解析命令列參數
// ============================================
function parseArgs() {
    const args = process.argv.slice(2);
    const result = { dryRun: false, force: null, type: 'all' }; // type: 'all' | 'air' | 'water'

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--dry-run') {
            result.dryRun = true;
        } else if (args[i] === '--force' && args[i + 1]) {
            result.force = args[i + 1].toUpperCase();
            i++;
        } else if (args[i] === '--type' && args[i + 1]) {
            result.type = args[i + 1].toLowerCase();
            i++;
        }
    }
    return result;
}

// ============================================
// 執行空污爬蟲
// ============================================
async function runAirScraper(county, district) {
    const scraperPath = path.join(__dirname, 'air_permit_scraper_auto.js');
    const nodePath = process.execPath;

    console.log(`  🏭 空污: ${county} ${district}`);
    const startTime = Date.now();

    try {
        const { stdout } = await execFileAsync(nodePath, [
            scraperPath, '--county', county, '--district', district, '--headless'
        ], {
            cwd: PROJECT_ROOT,
            timeout: 600000,
            maxBuffer: 10 * 1024 * 1024,
        });

        const duration = Math.round((Date.now() - startTime) / 1000);
        const factoryMatch = stdout.match(/共處理 (\d+) 家工廠/);
        const permitMatch = stdout.match(/擷取 (\d+) 筆許可證/);
        const factories = factoryMatch ? parseInt(factoryMatch[1]) : 0;
        const permits = permitMatch ? parseInt(permitMatch[1]) : 0;

        console.log(`     ✅ ${factories}家工廠, ${permits}筆許可證 (${duration}秒)`);
        return { success: true, type: 'air', county, district, factories, permits, duration };
    } catch (err) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        const errorMsg = err.stderr?.substring(0, 200) || err.message?.substring(0, 200) || '未知錯誤';
        console.log(`     ❌ ${errorMsg} (${duration}秒)`);
        return { success: false, type: 'air', county, district, error: errorMsg, duration };
    }
}

// ============================================
// 執行水污爬蟲
// ============================================
async function runWaterScraper(county, district) {
    const scraperPath = path.join(__dirname, 'water_permit_scraper_auto.js');
    const nodePath = process.execPath;

    console.log(`  💧 水污: ${county} ${district}`);
    const startTime = Date.now();

    try {
        const { stdout } = await execFileAsync(nodePath, [
            scraperPath, '--county', county, '--district', district, '--headless'
        ], {
            cwd: PROJECT_ROOT,
            timeout: 600000,
            maxBuffer: 10 * 1024 * 1024,
        });

        const duration = Math.round((Date.now() - startTime) / 1000);
        const permitMatch = stdout.match(/共處理\s*(\d+)\s*筆/);
        const permits = permitMatch ? parseInt(permitMatch[1]) : 0;

        console.log(`     ✅ ${permits}筆許可證 (${duration}秒)`);
        return { success: true, type: 'water', county, district, permits, duration };
    } catch (err) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        const errorMsg = err.stderr?.substring(0, 200) || err.message?.substring(0, 200) || '未知錯誤';
        console.log(`     ❌ ${errorMsg} (${duration}秒)`);
        return { success: false, type: 'water', county, district, error: errorMsg, duration };
    }
}

// ============================================
// 同步空污到 Supabase
// ============================================
async function syncAirToSupabase() {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://yeimehdcguwnwzkmopsu.supabase.co';
    const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_KEY) {
        console.log('  ⚠️ 無 Supabase key，跳過同步');
        return { success: false, error: '無 Supabase key' };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
        const excelPath = path.join(PROJECT_ROOT, 'data', 'air_permits.xlsx');
        if (!fs.existsSync(excelPath)) return { success: false, error: 'Excel 檔案不存在' };

        const wb = XLSX.readFile(excelPath);
        const summary = wb.Sheets['總表'];
        if (!summary) return { success: false, error: '找不到總表' };

        const data = XLSX.utils.sheet_to_json(summary);
        console.log(`\n  📤 同步空污 ${data.length} 筆到 Supabase...`);

        const records = data.map(row => ({
            ems_no: row.ems_no || '',
            county: row.county || '',
            company_name: row.company_name || '',
            address: row.address || '',
            process_id: (row.processes?.match(/^([A-Z]\d+)/)?.[1]) || '',
            process_name: row.processes || '',
            category: row.categories || '',
            permit_no: row.permit_nos || '',
            effective_date: null,
            expiry_date: row.latest_expiry_date || row.earliest_expiry_date || ''
        }));

        await supabase.from('air_permits').delete().neq('id', 0);

        let inserted = 0;
        for (let i = 0; i < records.length; i += 100) {
            const { error } = await supabase.from('air_permits').insert(records.slice(i, i + 100));
            if (!error) inserted += Math.min(100, records.length - i);
        }

        console.log(`  ✅ 已同步 ${inserted}/${records.length} 筆`);
        return { success: true, count: inserted };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// ============================================
// LINE 通知
// ============================================
async function sendLineNotification(message) {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const userId = process.env.LINE_USER_ID;

    if (!token || !userId) {
        console.log('  ⚠️ LINE 未設定，跳過通知');
        return;
    }

    try {
        await axios.post('https://api.line.me/v2/bot/message/push', {
            to: userId,
            messages: [{ type: 'text', text: message }]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('  ✅ LINE 通知已發送');
    } catch (err) {
        console.log(`  ❌ LINE 通知失敗: ${err.response?.data?.message || err.message}`);
    }
}

// ============================================
// 主程式
// ============================================
async function main() {
    const args = parseArgs();

    console.log('═══════════════════════════════════════════════════════');
    console.log('   🗓️  許可證定時爬蟲排程器（空污 + 水污）');
    console.log('═══════════════════════════════════════════════════════');

    if (args.dryRun) {
        console.log('\n📋 排程表（兩週循環）：');
        const weekDays = ['', '週一', '週二', '週三', '週四', '週五'];
        for (const [key, s] of Object.entries(SCHEDULE)) {
            const districts = s.districts.map(d => `${d.county} ${d.district}`).join(' + ');
            const weekLabel = s.week === 1 ? '第1週' : '第2週';
            console.log(`   ${key}: ${weekLabel} ${weekDays[s.day]} → ${districts}`);
        }
    }

    // 決定今天的排程
    let scheduleKey;
    if (args.force) {
        scheduleKey = args.force;
        if (!SCHEDULE[scheduleKey]) {
            console.log(`\n❌ 無效天次: ${scheduleKey}（有效值: ${Object.keys(SCHEDULE).join(', ')}）`);
            process.exit(1);
        }
        console.log(`\n🔧 強制模式: ${scheduleKey}`);
    } else {
        scheduleKey = getTodayScheduleKey();
    }

    if (!scheduleKey) {
        const reason = [0, 6].includes(new Date().getDay()) ? '今天是週末' : '今天無排程';
        console.log(`\n📅 ${reason}，不執行爬蟲`);
        return;
    }

    const schedule = SCHEDULE[scheduleKey];
    const districtNames = schedule.districts.map(d => d.district).join(' + ');
    const today = new Date().toISOString().split('T')[0];
    const typeLabel = args.type === 'air' ? '空污' : args.type === 'water' ? '水污' : '空污+水污';

    console.log(`\n📅 ${today} (${scheduleKey})`);
    console.log(`📍 目標: ${districtNames}`);
    console.log(`🔍 類型: ${typeLabel}`);

    if (args.dryRun) {
        console.log('\n✅ Dry run 完成，不實際執行');
        return;
    }

    console.log('\n🚀 開始執行...\n');

    // LINE 通知：開始執行
    await sendLineNotification([
        `🚀 爬蟲開始執行`,
        `📅 ${today} (${scheduleKey})`,
        `📍 ${districtNames}`,
        `🔍 ${typeLabel}`,
    ].join('\n'));

    // 依序跑每個區域（空污 → 水污）
    const allResults = [];
    for (const { county, district } of schedule.districts) {
        console.log(`\n📍 ${county} ${district}`);

        if (args.type === 'air' || args.type === 'all') {
            const r = await runAirScraper(county, district);
            allResults.push(r);
        }
        if (args.type === 'water' || args.type === 'all') {
            const r = await runWaterScraper(county, district);
            allResults.push(r);
        }
    }

    // 空污同步到 Supabase
    if (args.type === 'air' || args.type === 'all') {
        console.log('\n📤 同步空污到 Supabase...');
        await syncAirToSupabase();
    }

    // ============================================
    // 比對 Sheets + 產生 combined_permits + LINE 通知
    // （由 compare_and_report.js 負責發通知）
    // ============================================
    const compareScriptPath = path.join(__dirname, 'compare_and_report.js');
    const nodePath = process.execPath;

    for (const { county, district } of schedule.districts) {
        console.log(`\n🔍 比對 ${district}...`);
        try {
            const { stdout, stderr } = await execFileAsync(nodePath, [
                compareScriptPath,
                '--district', district,
                '--county', county,
            ], {
                cwd: PROJECT_ROOT,
                timeout: 120000,
                maxBuffer: 5 * 1024 * 1024,
            });
            if (stdout) process.stdout.write(stdout);
        } catch (err) {
            console.log(`  ⚠️ 比對失敗（${district}）: ${err.message?.substring(0, 100)}`);
        }
    }

    const successCount = allResults.filter(r => r.success).length;
    const totalDuration = allResults.reduce((s, r) => s + (r.duration || 0), 0);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`   📊 完成: ${successCount}/${allResults.length} 項成功，⏱️ 耗時 ${Math.round(totalDuration / 60)} 分鐘`);
    console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(err => {
    console.error('❌ 排程器錯誤:', err);
    sendLineNotification(`❌ 許可證爬蟲排程器錯誤\n${err.message}`).catch(() => { });
    process.exit(1);
});

