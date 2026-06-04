import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eewikwqwtgmrlvyrfgit.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVld2lrd3F3dGdtcmx2eXJmZ2l0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzkwOTUsImV4cCI6MjA5MzUxNTA5NX0.BaoDhOsVuVha0b8L-7caSE6vtrzmeIDdg7z2DLooCWc';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkMismatches() {
  console.log('Querying database records for step or status mismatches...');
  const { data: records, error } = await supabase
    .from('records')
    .select('id, unit_code, project_name, current_step, status, submission_date, tax_notification_date');

  if (error) {
    console.error('Error fetching records:', error);
    return;
  }

  console.log(`Checking ${records.length} records...`);

  records.forEach(r => {
    if (r.current_step === 'GD3_Cho_TBThue' && r.status === 'WaitingVPDK') {
      console.log(`[MISMATCH] Unit: ${r.unit_code}, Project: ${r.project_name}, Step: ${r.current_step}, Status: ${r.status}`);
    }
    // Also log any other records where current_step GĐ3 has status of Submitted or WaitingVPDK instead of TaxPending
    else if (r.current_step === 'GD3_Cho_TBThue' && r.status !== 'TaxPending' && r.status !== 'Submitted') {
      console.log(`[MISMATCH GD3] Unit: ${r.unit_code}, Step: ${r.current_step}, Status: ${r.status}`);
    }
  });

  console.log('Done checking.');
}

checkMismatches();
