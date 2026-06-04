import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eewikwqwtgmrlvyrfgit.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVld2lrd3F3dGdtcmx2eXJmZ2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzkwOTUsImV4cCI6MjA5MzUxNTA5NX0.BaoDhOsVuVha0b8L-7caSE6vtrzmeIDdg7z2DLooCWc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanDuplicates() {
  console.log('Connecting to Supabase...');
  const { data: records, error } = await supabase
    .from('records')
    .select('id, unit_code, project_name, current_step, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching records:', error);
    return;
  }

  console.log(`Fetched ${records.length} records in total.`);

  // Group by project_name and unit_code (case insensitive and trimmed)
  const groups = {};
  records.forEach(r => {
    const key = `${(r.project_name || '').trim().toLowerCase()}|${(r.unit_code || '').trim().toLowerCase()}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(r);
  });

  const idsToDelete = [];
  let duplicatesCount = 0;

  for (const [key, list] of Object.entries(groups)) {
    if (list.length > 1) {
      console.log(`\nDuplicate found for key: "${key}" (${list.length} records)`);
      
      // Determine the best record to keep:
      // Prefer the one in the furthest progress or latest created_at
      // Let's sort by current_step progression or simply latest created_at.
      // Since they are ordered descending by created_at, list[0] is the latest one.
      const kept = list[0];
      console.log(`-> KEP_ID: ${kept.id} (Step: ${kept.current_step}, Status: ${kept.status}, Created: ${kept.created_at})`);
      
      const rest = list.slice(1);
      rest.forEach(dup => {
        console.log(`   DELETE_ID: ${dup.id} (Step: ${dup.current_step}, Status: ${dup.status}, Created: ${dup.created_at})`);
        idsToDelete.push(dup.id);
        duplicatesCount++;
      });
    }
  }

  if (idsToDelete.length > 0) {
    console.log(`\nDeleting ${idsToDelete.length} duplicate records...`);
    const { error: deleteError } = await supabase
      .from('records')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) {
      console.error('Error deleting duplicate records:', deleteError);
    } else {
      console.log('Successfully cleaned up all duplicate records!');
    }
  } else {
    console.log('\nNo duplicate records found.');
  }
}

cleanDuplicates();
