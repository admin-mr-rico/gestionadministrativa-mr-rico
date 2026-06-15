// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = window.SUPABASE_URL || window.env?.SUPABASE_URL;
const supabaseAnonKey = window.SUPABASE_ANON_KEY || window.env?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: No se encontraron las credenciales de Supabase en window.SUPABASE_URL ni en window.env");
}

// Inicializamos el cliente usando el objeto global de la librería cargada
export const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
