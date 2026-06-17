// Configuración global de Supabase (NO usar export, solo asignar a window)

window.initSupabase = function() {
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase CDN no cargado');
    return null;
  }

  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('SUPABASE_URL o SUPABASE_ANON_KEY no definidas');
    return null;
  }

  try {
    const client = window.supabase.createClient(url, key);
    window.supabaseClient = client;
    console.log('✓ Supabase inicializado');
    return client;
  } catch (err) {
    console.error('Error inicializando Supabase:', err);
    return null;
  }
};