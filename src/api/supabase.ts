import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hyhxydsqnywtszvcouvp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5aHh5ZHNxbnl3dHN6dmNvdXZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MDQ5MTQsImV4cCI6MjA5MTA4MDkxNH0.J9SUzrzfBv4ctN0kMQrd5DuP8t4-2IXPM7dF7U4j5bs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const apiCall = async <T>(table: string, query: any = {}) => {
  let request = supabase.from(table).select('*');
  
  if (query.id) request = request.eq('id', query.id);
  if (query.userId) request = request.eq('usuario_id', query.userId);
  
  const { data, error } = await request;
  if (error) return { success: false, error: error.message };
  return { success: true, data: data as T };
};
