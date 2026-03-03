/**
 * 工具註冊表
 * 匯出所有工具的定義和執行器
 */

import * as queryPermits from './query-permits.js';
import * as queryExpiring from './query-expiring.js';
import * as queryFactories from './query-factories.js';
import * as queryRegulations from './query-regulations.js';
import * as dataStats from './data-stats.js';
import * as scheduleInfo from './schedule-info.js';
import * as scraperCommands from './scraper-commands.js';
import * as switchModel from './switch-model.js';

// 所有工具模組
const tools = [
    queryPermits,
    queryExpiring,
    queryFactories,
    queryRegulations,
    dataStats,
    scheduleInfo,
    scraperCommands,
    switchModel,
];

// OpenAI function calling 格式的工具定義
export const toolDefinitions = tools.map(t => t.definition);

// 工具名稱 → 執行函式的映射
const executors = new Map();
for (const tool of tools) {
    const name = tool.definition.function.name;
    executors.set(name, tool.execute);
}

/**
 * 執行指定工具
 * @param {string} name - 工具名稱
 * @param {object} args - 工具參數
 * @param {string} userId - LINE 用戶 ID
 */
export async function executeTool(name, args, userId) {
    const executor = executors.get(name);
    if (!executor) {
        return { error: `未知工具: ${name}` };
    }
    return executor(args, userId);
}
