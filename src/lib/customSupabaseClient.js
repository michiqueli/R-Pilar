import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iilvefqwfqscblnhipww.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbHZlZnF3ZnFzY2JsbmhpcHd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MjczMjcsImV4cCI6MjA4MzQwMzMyN30.GjCAE4olNne4dAamXA3pTcs6ktC0i7N8O1BxoYHcoUQ';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
