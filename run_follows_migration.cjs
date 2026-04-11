const fs = require('fs');

const SUPABASE_URL = 'https://divecpmkitjqkfyxnfds.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmVjcG1raXRqcWtmeXhuZmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUwMjY1MCwiZXhwIjoyMDkxMDc4NjUwfQ.aZZjxXuD8ZqLAPd3bqKO0YwqYitXnKM0DKqBAfJBkw0';

// Step 1: Create a temporary exec_sql function
// Step 2: Run the migration via that function
// Step 3: Drop the temporary function

async function run() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    db: { schema: 'public' },
    auth: { persistSession: false },
  });

  // First, create exec_sql function via raw SQL through pg endpoint
  // Actually, let's just use the supabase pg REST approach
  // The simplest approach - create the function first, then use it

  const createFnSQL = `
    CREATE OR REPLACE FUNCTION public._temp_exec(sql text)
    RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN EXECUTE sql; END; $$;
  `;

  // Try creating via PostgREST rpc - won't work without the function existing
  // Let's try using the SQL endpoint directly
  
  const pgEndpoint = SUPABASE_URL.replace('supabase.co', 'supabase.co') + '/pg';
  
  // Actually, Supabase doesn't expose raw SQL via REST. 
  // Let's try a different approach - use the query endpoint
  
  const sql = fs.readFileSync('./api_backend/migrations/follows_schema.sql', 'utf-8');
  
  // Split by semicolons and run each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute`);

  // Try via fetch to the SQL API
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    console.log('REST API status:', resp.status);
  } catch(e) {
    console.log('REST API error:', e.message);
  }

  // The only way to run DDL on Supabase without the Dashboard is via the Management API
  // or the Supabase CLI. Let's output the SQL for the user to paste.
  console.log('\n========================================');
  console.log('A tabela "follows" não existe no banco.');
  console.log('Execute o SQL abaixo no SQL Editor do Supabase:');
  console.log('https://supabase.com/dashboard/project/divecpmkitjqkfyxnfds/sql');
  console.log('========================================\n');
  console.log(sql);
}

run().catch(console.error);
