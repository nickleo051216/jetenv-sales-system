import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 創建 Supabase 客戶端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 測試用：檢查連線
export const testConnection = async () => {
    try {
        const { data, error } = await supabase.from('clients').select('count');
        if (error) throw error;
        console.log('✅ Supabase 連線成功！');
        return true;
    } catch (error) {
        console.error('❌ Supabase 連線失敗:', error.message);
        return false;
    }
};
