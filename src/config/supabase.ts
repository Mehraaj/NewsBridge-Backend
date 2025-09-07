import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Debug logging
console.log('Supabase URL exists:', !!supabaseUrl);
console.log('Supabase Service Role Key exists:', !!supabaseServiceRoleKey);
console.log('Supabase URL length:', supabaseUrl?.length);
console.log('Service Role Key length:', supabaseServiceRoleKey?.length);

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  db: {
    schema: 'public, auth'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  }
}); 