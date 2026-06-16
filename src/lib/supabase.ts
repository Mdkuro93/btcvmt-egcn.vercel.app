import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl) {
  console.error("Cảnh báo: Chưa cấu hình VITE_SUPABASE_URL trong file .env");
}

if (!supabaseAnonKey) {
  console.error("Cảnh báo: Chưa cấu hình VITE_SUPABASE_ANON_KEY trong file .env");
}

const SUPABASE_URL = (supabaseUrl || 'https://placeholder.supabase.co').trim().replace(/\/$/, '');
const SUPABASE_KEY = (supabaseAnonKey || 'placeholder-key').trim();

if (!SUPABASE_KEY) {
  console.error('[Config] VITE_SUPABASE_KEY chưa được cấu hình!');
}

if (!import.meta.env.VITE_ADMIN_SECRET) {
  console.warn('[Config] VITE_ADMIN_SECRET chưa cấu hình');
}
const ADMIN_SECRET = (
  import.meta.env.VITE_ADMIN_SECRET || ''
).trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: {
      'x-admin-key': ADMIN_SECRET
    }
  },
  realtime: {
    params: { 
      eventsPerSecond: 10 
    }
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

if (import.meta.env.DEV) {
  console.log('[Key Check]', {
    type: SUPABASE_KEY.startsWith('eyJ') ? 'JWT ✅' : 
          SUPABASE_KEY.startsWith('sb_') ? 'Publishable ⚠️ (Cần đổi sang JWT anon key để dùng Realtime RLS)' : 
          'Chưa cấu hình ❌',
    url: SUPABASE_URL
  });
}
