/**
 * 環境變數載入 + 驗證
 */

const required = [
    'LINE_CHANNEL_ACCESS_TOKEN',
    'LINE_CHANNEL_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENROUTER_API_KEY',
];

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
    console.error('❌ 缺少必要環境變數:', missing.join(', '));
    process.exit(1);
}

const config = {
    port: parseInt(process.env.PORT || '3000'),

    // LINE Bot
    lineChannelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    lineChannelSecret: process.env.LINE_CHANNEL_SECRET,

    // Supabase
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

    // OpenRouter
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    openrouterDefaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-sonnet-4',

    // MOENV (Taiwan EPA) API
    moenvApiKey: process.env.MOENV_API_KEY || '7854a04b-f171-47bb-9e42-4dd2ecc4745b',
};

export default config;
