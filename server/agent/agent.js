/**
 * AI Agent 主迴圈
 * 接收用戶訊息 → OpenRouter (function calling) → 執行工具 → 回覆
 */

import { chatCompletion, getModel } from './openrouter.js';
import { SYSTEM_PROMPT } from './system-prompt.js';
import { toolDefinitions, executeTool } from '../tools/index.js';
import logger from '../lib/logger.js';

const MAX_ROUNDS = 5;

// 每位用戶的對話歷史（in-memory）
const conversations = new Map();

function getHistory(userId) {
    if (!conversations.has(userId)) {
        conversations.set(userId, []);
    }
    const history = conversations.get(userId);
    // 保留最近 20 則
    if (history.length > 20) {
        history.splice(0, history.length - 20);
    }
    return history;
}

/**
 * 處理用戶訊息，回傳 AI 回覆文字
 */
export async function processMessage(userId, userMessage) {
    const history = getHistory(userId);

    // 加入用戶訊息
    history.push({ role: 'user', content: userMessage });

    // 組合完整 messages
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
    ];

    let round = 0;
    while (round < MAX_ROUNDS) {
        round++;

        const response = await chatCompletion(messages, toolDefinitions, { userId });
        const choice = response.choices?.[0];

        if (!choice) {
            throw new Error('OpenRouter 回傳空結果');
        }

        const message = choice.message;

        // 如果有 tool_calls，執行工具
        if (message.tool_calls && message.tool_calls.length > 0) {
            // 把 assistant 的 tool_calls 訊息加入歷史
            messages.push({
                role: 'assistant',
                content: message.content || null,
                tool_calls: message.tool_calls,
            });

            // 執行每個工具
            for (const toolCall of message.tool_calls) {
                const toolName = toolCall.function.name;
                let toolArgs;
                try {
                    toolArgs = JSON.parse(toolCall.function.arguments || '{}');
                } catch {
                    toolArgs = {};
                }

                logger.info(`🔧 工具呼叫: ${toolName}(${JSON.stringify(toolArgs).substring(0, 80)})`);

                let result;
                try {
                    result = await executeTool(toolName, toolArgs, userId);
                } catch (err) {
                    result = { error: err.message };
                    logger.error(`工具 ${toolName} 執行失敗:`, err.message);
                }

                // 把工具結果加入 messages
                messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
                });
            }

            // 繼續下一輪讓 AI 處理工具結果
            continue;
        }

        // 沒有 tool_calls → 最終回覆
        const reply = message.content || '（無回覆內容）';

        // 加入歷史
        history.push({ role: 'assistant', content: reply });

        const model = getModel(userId);
        logger.info(`✅ Agent 完成 (${round} 輪, 模型: ${model})`);
        return reply;
    }

    // 超過最大輪數
    const fallback = '處理過程太複雜了，請嘗試更具體的問題。';
    history.push({ role: 'assistant', content: fallback });
    return fallback;
}
