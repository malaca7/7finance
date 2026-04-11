const { createClient } = require('@supabase/supabase-js');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmVjcG1raXRqcWtmeXhuZmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUwMjY1MCwiZXhwIjoyMDkxMDc4NjUwfQ.aZZjxXuD8ZqLAPd3bqKO0YwqYitXnKM0DKqBAfJBkw0';

const sb = createClient(
  'https://divecpmkitjqkfyxnfds.supabase.co',
  SERVICE_KEY,
  { auth: { persistSession: false } }
);

async function run() {
  // Check current columns
  const { data: cols, error: colErr } = await sb
    .from('users')
    .select('*')
    .limit(1);

  if (colErr) {
    console.log('Error querying users:', colErr.message);
  } else if (cols && cols.length > 0) {
    console.log('Current user columns:', Object.keys(cols[0]).join(', '));
  }

  // Use Supabase Management API to run SQL
  // Project ref: divecpmkitjqkfyxnfds
  const sql = `
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS userlink TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_userlink ON public.users(userlink) WHERE userlink IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_users_userlink_lower ON public.users(LOWER(userlink));
  `;

  // Try via pg_net or direct REST - Supabase doesn't expose raw SQL via REST
  // We need to create a temporary function
  const createFunc = await fetch('https://divecpmkitjqkfyxnfds.supabase.co/rest/v1/rpc/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': 'Bearer ' + SERVICE_KEY,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ sql }),
  });

  console.log('Query endpoint:', createFunc.status, await createFunc.text());

  // Alternative: use supabase-js to update a user with bio to trigger error info
  const { error: testErr } = await sb
    .from('users')
    .update({ bio: 'test' })
    .eq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Test bio column:', testErr ? testErr.message : 'Column exists!');
}

run().catch(console.error);
