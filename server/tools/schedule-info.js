/**
 * 工具：爬蟲排程查詢
 * 內嵌排程表（與 scripts/scheduled_air_scraper.js 的 SCHEDULE 一致）
 */

export const SCHEDULE = {
    D1:  { day: 1, week: 1, districts: [{ county: '新北市', district: '土城區' }] },
    D2:  { day: 2, week: 1, districts: [{ county: '新北市', district: '樹林區' }] },
    D3:  { day: 3, week: 1, districts: [{ county: '新北市', district: '三重區' }] },
    D4:  { day: 4, week: 1, districts: [{ county: '新北市', district: '五股區' }] },
    D5:  { day: 5, week: 1, districts: [{ county: '新北市', district: '新莊區' }] },
    D6:  { day: 1, week: 2, districts: [{ county: '新北市', district: '中和區' }, { county: '新北市', district: '永和區' }] },
    D7:  { day: 2, week: 2, districts: [{ county: '新北市', district: '板橋區' }, { county: '新北市', district: '鶯歌區' }] },
    D8:  { day: 3, week: 2, districts: [{ county: '桃園市', district: '龜山區' }] },
    D9:  { day: 4, week: 2, districts: [{ county: '桃園市', district: '蘆竹區' }] },
    D10: { day: 5, week: 2, districts: [{ county: '新北市', district: '三峽區' }, { county: '新北市', district: '泰山區' }] },
};

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

export const definition = {
    type: 'function',
    function: {
        name: 'get_schedule',
        description: '查看爬蟲排程表。可查今天要跑什麼區、完整的兩週排程表、或指定日期的排程。',
        parameters: {
            type: 'object',
            properties: {
                action: {
                    type: 'string',
                    enum: ['today', 'full', 'date'],
                    description: 'today=今天的排程, full=完整排程表, date=指定日期（預設 today）',
                },
                date: {
                    type: 'string',
                    description: '指定日期（YYYY-MM-DD 格式），action=date 時使用',
                },
            },
        },
    },
};

function getScheduleForDate(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    const dayOfWeek = d.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { date: d.toISOString().split('T')[0], dayOfWeek: WEEKDAY_NAMES[dayOfWeek], isWeekend: true };
    }

    const baseDate = new Date(2026, 2, 2); // 2026-03-02
    const diffDays = Math.floor((d.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffDays / 7);
    const weekInCycle = (weekNumber % 2) + 1;

    for (const [key, schedule] of Object.entries(SCHEDULE)) {
        if (schedule.week === weekInCycle && schedule.day === dayOfWeek) {
            return {
                date: d.toISOString().split('T')[0],
                dayOfWeek: `週${WEEKDAY_NAMES[dayOfWeek]}`,
                scheduleKey: key,
                weekInCycle,
                districts: schedule.districts,
            };
        }
    }

    return { date: d.toISOString().split('T')[0], dayOfWeek: `週${WEEKDAY_NAMES[dayOfWeek]}`, noSchedule: true };
}

export async function execute({ action = 'today', date } = {}) {
    if (action === 'full') {
        const weekDays = ['', '週一', '週二', '週三', '週四', '週五'];
        const table = Object.entries(SCHEDULE).map(([key, s]) => ({
            key,
            week: `第${s.week}週`,
            day: weekDays[s.day],
            districts: s.districts.map(d => `${d.county} ${d.district}`).join(' + '),
        }));
        return { schedule: table };
    }

    if (action === 'date' && date) {
        return getScheduleForDate(date);
    }

    // default: today
    return getScheduleForDate();
}
