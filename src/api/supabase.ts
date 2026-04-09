import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://divecpmkitjqkfyxnfds.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdmVjcG1raXRqcWtmeXhuZmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MDI2NTAsImV4cCI6MjA5MTA3ODY1MH0.2Lr71tBmmVzquKIGn39y20sPDYcOcIrTbjwVGpwj8Xk';

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
