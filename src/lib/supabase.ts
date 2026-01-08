import { createClient } from '@supabase/supabase-js';

// Seu Supabase pessoal
const SUPABASE_URL = 'https://dfrfeirfllwmdkenylwk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcmZlaXJmbGx3bWRrZW55bHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4ODQ2MDQsImV4cCI6MjA4MzQ2MDYwNH0.aTZoULCkcGOzEZbtCnBASpep3DKUqltHA79a2f4pOcU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
