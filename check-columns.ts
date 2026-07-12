import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  // Query a single row from projects to see columns
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Projects schema check error:', error);
  } else {
    console.log('Sample project row:', projects?.[0]);
  }

  // Also let's check all projects
  const { data: allProjects, error: apError } = await supabase
    .from('projects')
    .select('*');

  if (apError) {
    console.error('All projects query error:', apError);
  } else {
    console.log('All projects inside database (count):', allProjects?.length);
    console.log('All projects:', allProjects);
  }
}

run();
