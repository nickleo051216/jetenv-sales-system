/**
 * 工具：生成爬蟲執行指令
 */

import { SCHEDULE } from './schedule-info.js';

export const definition = {
    type: 'function',
    function: {
        name: 'generate_scraper_cmd',
        description: '生成空污爬蟲的執行指令，讓用戶可以在本機電腦複製貼上執行。可指定縣市+區域，或使用排程代碼（D1-D10）。',
        parameters: {
            type: 'object',
            properties: {
                county: {
                    type: 'string',
                    description: '縣市名稱（如：新北市、桃園市）',
                },
                district: {
                    type: 'string',
                    description: '區域名稱（如：土城區、板橋區）',
                },
                scheduleKey: {
                    type: 'string',
                    description: '排程代碼（D1-D10），會自動帶入對應的縣市和區域',
                },
                headless: {
                    type: 'boolean',
                    description: '是否使用無頭模式（預設 false，看得到瀏覽器）',
                },
            },
        },
    },
};

export async function execute({ county, district, scheduleKey, headless = false }) {
    const commands = [];

    if (scheduleKey) {
        const key = scheduleKey.toUpperCase();
        const schedule = SCHEDULE[key];
        if (!schedule) {
            return { error: `無效的排程代碼: ${key}，有效值: ${Object.keys(SCHEDULE).join(', ')}` };
        }

        // 使用排程器的 --force 指令
        commands.push({
            description: `執行排程 ${key}（${schedule.districts.map(d => d.district).join(' + ')}）`,
            command: `node scripts/scheduled_air_scraper.js --force ${key}`,
        });

        return { commands };
    }

    if (!county || !district) {
        return { error: '請指定縣市和區域，或使用排程代碼（D1-D10）' };
    }

    let cmd = `node scripts/air_permit_scraper_auto.js --county "${county}" --district "${district}"`;
    if (headless) cmd += ' --headless';

    commands.push({
        description: `爬取 ${county} ${district} 的空污許可證`,
        command: cmd,
    });

    commands.push({
        description: '爬完後同步到 Supabase（可選）',
        command: 'node scripts/sync_air_permits_to_supabase.js',
    });

    return {
        note: '請在專案根目錄下執行以上指令',
        commands,
    };
}
