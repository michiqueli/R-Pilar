// src/lib/supabaseAdmin.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY; 

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false, // 👈 ESTO elimina el error de "Multiple GoTrueClient instances"
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});