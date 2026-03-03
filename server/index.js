/**
 * JetEnv LINE AI Agent — Express Server
 *
 * POST /webhook  — LINE webhook（簽名驗證 → 200 OK → 非同步處理）
 * GET  /health   — 健康檢查
 */

import crypto from 'crypto';
import express from 'express';
import config from './config.js';
import logger from './lib/logger.js';
import { pushMessage } from './lib/line.js';
import { processMessage } from './agent/agent.js';

const app = express();

// LINE 簽名驗證需要 raw body
app.use('/webhook', express.raw({ type: '*/*' }));
app.use(express.json());

// ── 健康檢查 ──────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
    res.json({ service: 'JetEnv LINE AI Agent', status: 'running' });
});

// ── LINE Webhook ──────────────────────────────
app.post('/webhook', (req, res) => {
    // 1. 驗證 LINE 簽名
    const signature = req.headers['x-line-signature'];
    if (!signature) {
        return res.status(401).json({ error: 'Missing signature' });
    }

    const body = req.body;
    const expectedSignature = crypto
        .createHmac('sha256', config.lineChannelSecret)
        .update(body)
        .digest('base64');

    if (signature !== expectedSignature) {
        logger.warn('LINE 簽名驗證失敗');
        return res.status(401).json({ error: 'Invalid signature' });
    }

    // 2. 立即回 200 OK（LINE 要求 1 秒內回應）
    res.status(200).json({ status: 'ok' });

    // 3. 非同步處理事件
    const parsed = JSON.parse(body.toString('utf-8'));
    const events = parsed.events || [];

    for (const event of events) {
        handleEvent(event).catch(err => {
            logger.error('事件處理失敗:', err.message);
        });
    }
});

/**
 * 處理單個 LINE 事件
 */
async function handleEvent(event) {
    // 只處理文字訊息
    if (event.type !== 'message' || event.message?.type !== 'text') {
        return;
    }

    const userId = event.source?.userId;
    const userMessage = event.message.text.trim();

    if (!userId || !userMessage) return;

    logger.info(`📩 收到訊息 [${userId.substring(0, 8)}...]: ${userMessage.substring(0, 50)}`);

    try {
        const reply = await processMessage(userId, userMessage);
        await pushMessage(userId, reply);
        logger.info(`📤 已回覆 [${userId.substring(0, 8)}...]`);
    } catch (err) {
        logger.error('處理訊息失敗:', err.message);
        try {
            await pushMessage(userId, '抱歉，處理你的訊息時發生錯誤，請稍後再試。');
        } catch (_) {
            // 連錯誤通知都發不出去就算了
        }
    }
}

// ── 啟動 ──────────────────────────────────────
app.listen(config.port, () => {
    logger.info(`🚀 JetEnv LINE AI Agent 啟動 — port ${config.port}`);
    logger.info(`📡 Webhook: POST /webhook`);
    logger.info(`💚 Health:  GET /health`);
});
