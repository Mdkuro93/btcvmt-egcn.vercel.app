import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('records').select('id, created_at, unit_code').order('created_at', { ascending: false }).limit(5);
  console.log('Recent records:', data);
}
run();
