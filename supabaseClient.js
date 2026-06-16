// src/supabaseClient.js
// Usar el cliente de Supabase cargado por CDN (window.supabase)
// No usar `import` aquí porque la app se sirve sin bundler.
const supabaseUrl = window.SUPABASE_URL || window.env?.SUPABASE_URL;
const supabaseAnonKey = window.SUPABASE_ANON_KEY || window.env?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: No se encontraron las credenciales de Supabase en window.SUPABASE_URL ni en window.env');
}

export const supabaseClient = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Exponer para debug en consola
if (typeof window !== 'undefined') window.supabaseClient = supabaseClient;
