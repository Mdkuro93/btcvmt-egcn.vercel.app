import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://eewikwqwtgmrlvyrfgit.supabase.co').trim().replace(/\/$/, '');

const JWT_ANON_KEY_STANDARD = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVld2lrd3F3dGdtcmx2eXJmZ2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzkwOTUsImV4cCI6MjA5MzUxNTA5NX0.BaoDhOsVuVha0b8L-7caSE6vtrzmeIDdg7z2DLooCWc';

const getValidSupabaseKey = (): string => {
  const keyCandidate = import.meta.env.VITE_SUPABASE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (keyCandidate && keyCandidate.trim().startsWith('eyJ')) {
    return keyCandidate.trim();
  }
  return JWT_ANON_KEY_STANDARD;
};

const SUPABASE_KEY = getValidSupabaseKey();

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
