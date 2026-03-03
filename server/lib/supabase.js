/**
 * Supabase 客戶端（使用 Service Role Key，繞過 RLS）
 */

import { createClient } from '@supabase/supabase-js';
import config from '../config.js';

const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);

export default supabase;
