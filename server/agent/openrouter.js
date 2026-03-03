/**
 * OpenRouter API 客戶端
 * 使用 OpenAI 相容的 function calling 格式
 */

import axios from 'axios';
import config from '../config.js';
import logger from '../lib/logger.js';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

// 每位用戶的模型偏好（in-memory）
const userModels = new Map();

/**
 * 取得用戶目前使用的模型
 */
export function getModel(userId) {
    return userModels.get(userId) || config.openrouterDefaultModel;
}

/**
 * 設定用戶使用的模型
 */
export function setModel(userId, model) {
    userModels.set(userId, model);
}

/**
 * 呼叫 OpenRouter chat completion
 * @param {Array} messages - OpenAI 格式的 messages
 * @param {Array} tools - OpenAI 格式的 tool definitions
 * @param {object} options - { model, userId }
 * @returns {object} OpenAI 格式的 response
 */
export async function chatCompletion(messages, tools, options = {}) {
    const model = options.model || getModel(options.userId);

    try {
        const response = await axios.post(`${OPENROUTER_BASE}/chat/completions`, {
            model,
            messages,
            tools: tools.length > 0 ? tools : undefined,
            tool_choice: tools.length > 0 ? 'auto' : undefined,
            temperature: 0.3,
            max_tokens: 2048,
        }, {
            headers: {
                'Authorization': `Bearer ${config.openrouterApiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://jetenv-line-agent.zeabur.app',
                'X-Title': 'JetEnv LINE AI Agent',
            },
            timeout: 60000, // 60 秒
        });

        return response.data;
    } catch (err) {
        const detail = err.response?.data?.error?.message || err.message;
        logger.error(`OpenRouter 呼叫失敗 (${model}):`, detail);
        throw new Error(`AI 模型回應失敗: ${detail}`);
    }
}
