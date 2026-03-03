/**
 * 空污許可證定時爬蟲排程器
 *
 * 每兩週一個循環，每個工作天跑 1-2 區（共 12 區）
 * 跑完後同步 Supabase + LINE 通知
 *
 * 使用方式：
 *   node scripts/scheduled_air_scraper.js              # 自動判斷今天跑什麼
 *   node scripts/scheduled_air_scraper.js --dry-run    # 只看排程不執行
 *   node scripts/scheduled_air_scraper.js --force D1   # 強制跑指定天次
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
    D1:  { day: 1, week: 1, districts: [{ county: '新北市', district: '土城區' }] },
    D2:  { day: 2, week: 1, districts: [{ county: '新北市', district: '樹林區' }] },
    D3:  { day: 3, week: 1, districts: [{ county: '新北市', district: '三重區' }] },
    D4:  { day: 4, week: 1, districts: [{ county: '新北市', district: '五股區' }] },
    D5:  { day: 5, week: 1, districts: [{ county: '新北市', district: '新莊區' }] },
    // 第二週（偶數週）
    D6:  { day: 1, week: 2, districts: [{ county: '新北市', district: '中和區' }, { county: '新北市', district: '永和區' }] },
    D7:  { day: 2, week: 2, districts: [{ county: '新北市', district: '板橋區' }, { county: '新北市', district: '鶯歌區' }] },
    D8:  { day: 3, week: 2, districts: [{ county: '桃園市', district: '龜山區' }] },
    D9:  { day: 4, week: 2, districts: [{ county: '桃園市', district: '蘆竹區' }] },
    D10: { day: 5, week: 2, districts: [{ county: '新北市', district: '三峽區' }, { county: '新北市', district: '泰山區' }] },
};

// ============================================
// 判斷今天是排程的哪一天
// ============================================
function getTodayScheduleKey() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

    // 週末不跑
    if (dayOfWeek === 0 || dayOfWeek === 6) return null;

    // 計算這是第幾週（用 epoch week 判斷奇偶）
    // 基準：2026-03-02 是週一，定為第 1 週的起點
    const baseDate = new Date(2026, 2, 2); // 2026-03-02
    const diffMs = now.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7);
    const weekInCycle = (weekNumber % 2) + 1; // 1 或 2

    // 根據週次和星期幾找排程
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
    const result = { dryRun: false, force: null };

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--dry-run') {
            result.dryRun = true;
        } else if (args[i] === '--force' && args[i + 1]) {
            result.force = args[i + 1].toUpperCase();
            i++;
        }
    }

    return result;
}

// ============================================
// 執行單個區域的爬蟲
// ============================================
async function runScraper(county, district) {
    const scraperPath = path.join(__dirname, 'air_permit_scraper_auto.js');
    const nodePath = process.execPath;

    console.log(`\n🏭 開始爬取: ${county} ${district}`);
    const startTime = Date.now();

    try {
        const { stdout, stderr } = await execFileAsync(nodePath, [
            scraperPath,
            '--county', county,
            '--district', district
        ], {
            cwd: PROJECT_ROOT,
            timeout: 600000, // 10 分鐘超時
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        });

        const duration = Math.round((Date.now() - startTime) / 1000);

        // 從輸出中提取統計資訊
        const factoryMatch = stdout.match(/共處理 (\d+) 家工廠/);
        const permitMatch = stdout.match(/擷取 (\d+) 筆許可證/);
        const factories = factoryMatch ? parseInt(factoryMatch[1]) : 0;
        const permits = permitMatch ? parseInt(permitMatch[1]) : 0;

        console.log(`   ✅ ${county} ${district}: ${factories} 家工廠, ${permits} 筆許可證 (${duration}秒)`);

        return { success: true, county, district, factories, permits, duration };
    } catch (err) {
        const duration = Math.round((Date.now() - startTime) / 1000);
        const errorMsg = err.stderr?.substring(0, 200) || err.message?.substring(0, 200) || '未知錯誤';
        console.log(`   ❌ ${county} ${district}: ${errorMsg} (${duration}秒)`);

        return { success: false, county, district, error: errorMsg, duration };
    }
}

// ============================================
// 同步到 Supabase
// ============================================
async function syncToSupabase() {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dtzwgicsrkbnevzxjgcr.supabase.co';
    const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_KEY) {
        console.log('   ⚠️ 無 Supabase key，跳過同步');
        return { success: false, error: '無 Supabase key' };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
        const excelPath = path.join(PROJECT_ROOT, 'data', 'air_permits.xlsx');
        if (!fs.existsSync(excelPath)) {
            return { success: false, error: 'Excel 檔案不存在' };
        }

        const wb = XLSX.readFile(excelPath);
        const summary = wb.Sheets['總表'];
        if (!summary) return { success: false, error: '找不到總表' };

        const data = XLSX.utils.sheet_to_json(summary);
        console.log(`\n📤 同步 ${data.length} 筆到 Supabase...`);

        const records = data.map(row => ({
            ems_no: row.ems_no || '',
            county: row.county || '',
            company_name: row.company_name || '',
            address: row.address || '',
            process_id: extractProcessId(row.processes),
            process_name: row.processes || '',
            category: row.categories || '',
            permit_no: row.permit_nos || '',
            effective_date: null,
            expiry_date: row.latest_expiry_date || row.earliest_expiry_date || ''
        }));

        // 清空再插入
        await supabase.from('air_permits').delete().neq('id', 0);

        const BATCH_SIZE = 100;
        let inserted = 0;
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('air_permits').insert(batch);
            if (!error) inserted += batch.length;
        }

        console.log(`   ✅ 已同步 ${inserted}/${records.length} 筆`);
        return { success: true, count: inserted };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

function extractProcessId(processes) {
    if (!processes) return '';
    const match = processes.match(/^([A-Z]\d+)/);
    return match ? match[1] : '';
}

// ============================================
// LINE 通知
// ============================================
async function sendLineNotification(message) {
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const userId = process.env.LINE_USER_ID;

    if (!token || !userId) {
        console.log('   ⚠️ LINE 未設定（缺少 LINE_CHANNEL_ACCESS_TOKEN 或 LINE_USER_ID），跳過通知');
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
        console.log('   ✅ LINE 通知已發送');
    } catch (err) {
        const detail = err.response?.data?.message || err.message;
        console.log(`   ❌ LINE 通知失敗: ${detail}`);
    }
}

// ============================================
// 主程式
// ============================================
async function main() {
    const args = parseArgs();

    console.log('═══════════════════════════════════════════════════════');
    console.log('   🗓️  空污許可證定時爬蟲排程器');
    console.log('═══════════════════════════════════════════════════════');

    // 顯示完整排程表
    if (args.dryRun) {
        console.log('\n📋 排程表（兩週循環）：');
        const weekDays = ['', '週一', '週二', '週三', '週四', '週五'];
        for (const [key, s] of Object.entries(SCHEDULE)) {
            const districts = s.districts.map(d => `${d.county} ${d.district}`).join(' + ');
            const weekLabel = s.week === 1 ? '第1週' : '第2週';
            console.log(`   ${key}: ${weekLabel} ${weekDays[s.day]} → ${districts}`);
        }
    }

    // 決定今天要跑什麼
    let scheduleKey;
    if (args.force) {
        scheduleKey = args.force;
        if (!SCHEDULE[scheduleKey]) {
            console.log(`\n❌ 無效的天次: ${scheduleKey}（有效值: ${Object.keys(SCHEDULE).join(', ')}）`);
            process.exit(1);
        }
        console.log(`\n🔧 強制模式: ${scheduleKey}`);
    } else {
        scheduleKey = getTodayScheduleKey();
    }

    if (!scheduleKey) {
        const reason = new Date().getDay() === 0 || new Date().getDay() === 6 ? '今天是週末' : '今天無排程';
        console.log(`\n📅 ${reason}，不執行爬蟲`);
        if (args.dryRun) {
            console.log('\n📊 今天日期資訊：');
            const now = new Date();
            const baseDate = new Date(2026, 2, 2);
            const diffDays = Math.floor((now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
            const weekNumber = Math.floor(diffDays / 7);
            const weekInCycle = (weekNumber % 2) + 1;
            console.log(`   日期: ${now.toISOString().split('T')[0]}`);
            console.log(`   星期: ${now.getDay()}`);
            console.log(`   循環週次: 第 ${weekInCycle} 週`);
        }
        return;
    }

    const schedule = SCHEDULE[scheduleKey];
    const districtNames = schedule.districts.map(d => d.district).join(' + ');
    const today = new Date().toISOString().split('T')[0];

    console.log(`\n📅 ${today} (${scheduleKey})`);
    console.log(`📍 目標: ${districtNames}`);

    if (args.dryRun) {
        console.log('\n✅ Dry run 完成，不實際執行');
        return;
    }

    console.log('\n🚀 開始執行...\n');

    // 依序跑每個區域
    const results = [];
    for (const { county, district } of schedule.districts) {
        const result = await runScraper(county, district);
        results.push(result);
    }

    // 同步到 Supabase
    console.log('\n📤 同步到 Supabase...');
    const syncResult = await syncToSupabase();

    // 組合統計
    const successCount = results.filter(r => r.success).length;
    const totalPermits = results.filter(r => r.success).reduce((sum, r) => sum + r.permits, 0);
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

    // 組合 LINE 通知訊息
    let lineMsg;
    if (successCount === results.length) {
        const districtResults = results.map(r =>
            `📍 ${r.district}: ${r.factories}家 / ${r.permits}筆`
        ).join('\n');

        lineMsg = [
            `🏭 空污爬蟲完成`,
            `📅 ${today} (${scheduleKey})`,
            districtResults,
            `⏱️ 耗時 ${Math.round(totalDuration / 60)} 分鐘`,
            syncResult.success ? `📤 已同步 ${syncResult.count} 筆到 Supabase` : `⚠️ Supabase 同步: ${syncResult.error || '失敗'}`
        ].join('\n');
    } else {
        const details = results.map(r =>
            r.success
                ? `✅ ${r.district}: ${r.permits}筆`
                : `❌ ${r.district}: ${r.error?.substring(0, 50)}`
        ).join('\n');

        lineMsg = [
            `⚠️ 空污爬蟲部分完成`,
            `📅 ${today} (${scheduleKey})`,
            `成功 ${successCount}/${results.length} 區`,
            details
        ].join('\n');
    }

    // 發送 LINE 通知
    console.log('\n📱 發送 LINE 通知...');
    await sendLineNotification(lineMsg);

    // 最終統計
    console.log('\n═══════════════════════════════════════════════════════');
    console.log(`   📊 完成: ${successCount}/${results.length} 區成功, ${totalPermits} 筆許可證`);
    console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(err => {
    console.error('❌ 排程器錯誤:', err);
    // 嘗試發送錯誤通知
    sendLineNotification(`❌ 空污爬蟲排程器錯誤\n${err.message}`).catch(() => {});
    process.exit(1);
});
