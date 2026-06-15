// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'
// Al usar el script CDN del paso anterior, la variable 'supabase' se crea automáticamente de forma global
const supabaseUrl = window.env?.SUPABASE_URL;
const supabaseAnonKey = window.env?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: No se encontraron las credenciales de Supabase en window.env");
}

// Inicializamos el cliente usando el objeto global de la librería cargada
export const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
