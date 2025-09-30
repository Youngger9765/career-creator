/**
 * Supabase Client for Realtime features
 * 用於 Presence、Broadcast、Database Changes
 */

import { createClient } from '@supabase/supabase-js';

// 檢查環境變數
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 開發環境提示
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase 環境變數未設定！\n' +
      '請在 .env.local 設定：\n' +
      '- NEXT_PUBLIC_SUPABASE_URL\n' +
      '- NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
      '從 https://app.supabase.com/project/YOUR_PROJECT/settings/api 取得'
  );
}

// 建立 Supabase client（單例）
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10, // 限制事件頻率，節省連線
          },
        },
      })
    : null;

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null;
};

// Export types
export type SupabaseClient = typeof supabase;
