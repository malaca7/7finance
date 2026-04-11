const { createClient } = require('@supabase/supabase-js');
const s = createClient(
  'https://divecpmkitjqkfyxnfds.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmVjcG1raXRqcWtmeXhuZmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUwMjY1MCwiZXhwIjoyMDkxMDc4NjUwfQ.aZZjxXuD8ZqLAPd3bqKO0YwqYitXnKM0DKqBAfJBkw0'
);

async function main() {
  // Check RLS policies on users table
  const { data, error } = await s.rpc('get_rls_policies', {});
  if (error) {
    console.log('rpc failed, trying raw SQL via admin API...');
    // Try via REST
    const resp = await fetch('https://divecpmkitjqkfyxnfds.supabase.co/rest/v1/rpc/get_rls_policies', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmVjcG1raXRqcWtmeXhuZmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUwMjY1MCwiZXhwIjoyMDkxMDc4NjUwfQ.aZZjxXuD8ZqLAPd3bqKO0YwqYitXnKM0DKqBAfJBkw0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmVjcG1raXRqcWtmeXhuZmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTUwMjY1MCwiZXhwIjoyMDkxMDc4NjUwfQ.aZZjxXuD8ZqLAPd3bqKO0YwqYitXnKM0DKqBAfJBkw0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
  }

  // Try login as admin and then query
  console.log('\n--- Testing admin login + users query ---');
  const anon = createClient(
    'https://divecpmkitjqkfyxnfds.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmVjcG1raXRqcWtmeXhuZmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MDI2NTAsImV4cCI6MjA5MTA3ODY1MH0.2Lr71tBmmVzquKIGn39y20sPDYcOcIrTbjwVGpwj8Xk'
  );

  // Get admin phone from service role
  const { data: adminUser } = await s.from('users').select('phone,auth_id').eq('role','admin').limit(1).single();
  console.log('Admin user:', adminUser);

  if (adminUser?.phone) {
    const authEmail = adminUser.phone.replace(/\D/g, '') + '@7finance.com';
    console.log('Auth email:', authEmail);
    
    // Sign in as admin
    const { data: authData, error: authErr } = await anon.auth.signInWithPassword({
      email: authEmail,
      password: 'admin123' // try common password
    });
    
    if (authErr) {
      console.log('Login error:', authErr.message);
      // Try other password
      const { data: authData2, error: authErr2 } = await anon.auth.signInWithPassword({
        email: authEmail,
        password: '123456'
      });
      if (authErr2) {
        console.log('Login error 2:', authErr2.message);
      } else {
        console.log('Logged in with 123456');
        const { data: users, error: usersErr } = await anon.from('users').select('id,name,role', { count: 'exact' });
        console.log('Users after login:', users?.length, 'error:', usersErr);
      }
    } else {
      console.log('Logged in successfully');
      const { data: users, error: usersErr } = await anon.from('users').select('id,name,role', { count: 'exact' });
      console.log('Users after login:', users?.length, 'error:', usersErr);
    }
  }

  // Also check RLS status
  const { data: rlsCheck } = await s.rpc('check_rls_enabled', { t: 'users' }).catch(() => ({ data: null }));
  console.log('\nRLS check result:', rlsCheck);

  // Direct query: check if RLS is enabled
  console.log('\n--- Checking users table with service role (bypasses RLS) ---');
  const { data: allUsers, count } = await s.from('users').select('id,name,role,phone,auth_id', { count: 'exact' });
  console.log('All users:', JSON.stringify(allUsers, null, 2));
}

main().catch(console.error);
