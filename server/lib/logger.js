/**
 * 簡易日誌工具
 */

function timestamp() {
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

const logger = {
    info: (...args) => console.log(`[${timestamp()}]`, ...args),
    error: (...args) => console.error(`[${timestamp()}] ❌`, ...args),
    warn: (...args) => console.warn(`[${timestamp()}] ⚠️`, ...args),
};

export default logger;
