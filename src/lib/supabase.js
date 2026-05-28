// src/lib/supabase.js
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Singleton para uso en componentes
let _client = null;
export function getClient() {
  if (!_client) _client = createClient();
  return _client;
}
