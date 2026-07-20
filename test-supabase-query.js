import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://xyz.supabase.co', 'eyJhbGci...');
let query = supabase.from('records').select('*');
query = query.filter('and', 'eq', '(or(status.eq.Error,is_rejected.eq.true),or(unit_code.ilike.%a%,customer_name.ilike.%a%))');
console.log(query.url.toString());
