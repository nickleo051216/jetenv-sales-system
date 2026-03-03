/**
 * LINE Messaging API 工具函式
 */

import axios from 'axios';
import config from '../config.js';
import logger from './logger.js';

const LINE_API = 'https://api.line.me/v2/bot/message';
const MAX_TEXT_LENGTH = 4900; // LINE 限制 5000，留點餘裕

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.lineChannelAccessToken}`,
};

/**
 * 用 replyToken 回覆訊息（只能用一次，且需在收到訊息後短時間內使用）
 */
export async function replyMessage(replyToken, text) {
    const messages = splitText(text).map(t => ({ type: 'text', text: t }));
    // LINE reply 最多 5 則訊息
    const batch = messages.slice(0, 5);

    try {
        await axios.post(`${LINE_API}/reply`, {
            replyToken,
            messages: batch,
        }, { headers });
    } catch (err) {
        logger.error('LINE reply 失敗:', err.response?.data?.message || err.message);
        throw err;
    }
}

/**
 * 用 userId 主動推播訊息
 */
export async function pushMessage(userId, text) {
    const messages = splitText(text).map(t => ({ type: 'text', text: t }));
    const batch = messages.slice(0, 5);

    try {
        await axios.post(`${LINE_API}/push`, {
            to: userId,
            messages: batch,
        }, { headers });
    } catch (err) {
        logger.error('LINE push 失敗:', err.response?.data?.message || err.message);
        throw err;
    }
}

/**
 * 將過長文字分割成多則訊息
 */
function splitText(text) {
    if (text.length <= MAX_TEXT_LENGTH) return [text];

    const parts = [];
    let remaining = text;
    while (remaining.length > 0) {
        if (remaining.length <= MAX_TEXT_LENGTH) {
            parts.push(remaining);
            break;
        }
        // 在最近的換行處分割
        let splitIdx = remaining.lastIndexOf('\n', MAX_TEXT_LENGTH);
        if (splitIdx === -1 || splitIdx < MAX_TEXT_LENGTH * 0.5) {
            splitIdx = MAX_TEXT_LENGTH;
        }
        parts.push(remaining.substring(0, splitIdx));
        remaining = remaining.substring(splitIdx).replace(/^\n/, '');
    }
    return parts;
}
