const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmVjcG1raXRqcWtmeXhuZmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUwMjY1MCwiZXhwIjoyMDkxMDc4NjUwfQ.aZZjxXuD8ZqLAPd3bqKO0YwqYitXnKM0DKqBAfJBkw0';
const PROJECT = 'divecpmkitjqkfyxnfds';
const BASE = `https://${PROJECT}.supabase.co`;

const SQL = `
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS userlink TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_userlink ON public.users(userlink) WHERE userlink IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_userlink_lower ON public.users(LOWER(userlink));
`;

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': 'Bearer ' + SERVICE_KEY,
};

async function tryEndpoint(name, url, body) {
  try {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const text = await res.text();
    console.log(`[${name}] ${res.status}: ${text.slice(0, 200)}`);
    return res.status >= 200 && res.status < 300;
  } catch (e) {
    console.log(`[${name}] Error: ${e.message}`);
    return false;
  }
}

async function run() {
  // Try multiple known Supabase internal endpoints
  const attempts = [
    ['pg/query', `${BASE}/pg/query`, { query: SQL }],
    ['pg-meta/query', `${BASE}/pg-meta/default/query`, { query: SQL }],
    ['rest/rpc/exec', `${BASE}/rest/v1/rpc/exec`, { sql: SQL }],
  ];

  for (const [name, url, body] of attempts) {
    const ok = await tryEndpoint(name, url, body);
    if (ok) { console.log('SUCCESS!'); return; }
  }

  console.log('\n--- None of the endpoints worked. ---');
  console.log('Please run this SQL manually in the Supabase Dashboard SQL Editor:');
  console.log('URL: https://supabase.com/dashboard/project/' + PROJECT + '/sql/new');
  console.log('\n' + SQL);
}

run().catch(console.error);
