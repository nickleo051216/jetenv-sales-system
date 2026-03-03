/**
 * 工具：切換 AI 模型
 */

import { getModel, setModel } from '../agent/openrouter.js';

const POPULAR_MODELS = [
    { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4' },
    { id: 'anthropic/claude-haiku-4', name: 'Claude Haiku 4' },
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro' },
    { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3' },
    { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick' },
];

export const definition = {
    type: 'function',
    function: {
        name: 'switch_model',
        description: '切換 AI 模型。可指定模型 ID 或列出可用模型清單。',
        parameters: {
            type: 'object',
            properties: {
                model: {
                    type: 'string',
                    description: '模型 ID（如：openai/gpt-4o、anthropic/claude-sonnet-4），不指定則列出可用模型',
                },
                action: {
                    type: 'string',
                    enum: ['switch', 'list', 'current'],
                    description: 'switch=切換模型, list=列出可用模型, current=查看目前模型（預設 switch）',
                },
            },
        },
    },
};

export async function execute({ model, action = 'switch' }, userId) {
    if (action === 'list') {
        return {
            currentModel: getModel(userId),
            availableModels: POPULAR_MODELS,
            note: '也可以使用 OpenRouter 支援的任何模型 ID',
        };
    }

    if (action === 'current') {
        return { currentModel: getModel(userId) };
    }

    // switch
    if (!model) {
        return {
            error: '請指定模型 ID',
            currentModel: getModel(userId),
            availableModels: POPULAR_MODELS,
        };
    }

    // 嘗試模糊匹配
    let targetModel = model;
    if (!model.includes('/')) {
        const match = POPULAR_MODELS.find(m =>
            m.name.toLowerCase().includes(model.toLowerCase()) ||
            m.id.toLowerCase().includes(model.toLowerCase())
        );
        if (match) targetModel = match.id;
    }

    const previousModel = getModel(userId);
    setModel(userId, targetModel);

    return {
        previousModel,
        newModel: targetModel,
        note: '模型已切換，下次對話將使用新模型回覆',
    };
}
