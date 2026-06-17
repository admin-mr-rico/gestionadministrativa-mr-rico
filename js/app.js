// ═══════════════════════════════════════════
// INICIALIZACIÓN SUPABASE
// ═══════════════════════════════════════════

let supabaseClient = null;
let supabaseAvailable = false;

// Esperar a que Supabase CDN esté disponible
function waitForSupabase(maxRetries = 50) {
  return new Promise((resolve) => {
    let retries = 0;
    const checkInterval = setInterval(() => {
      if (typeof window.supabase !== 'undefined') {
        clearInterval(checkInterval);
        console.log('✓ Supabase CDN cargado');
        resolve(true);
      } else if (retries >= maxRetries) {
        clearInterval(checkInterval);
        console.error('⚠ Supabase CDN no disponible. App usando datos locales.');
        resolve(false);
      }
      retries++;
    }, 100);
  });
}

async function initSupabaseClient() {
  const cdnOK = await waitForSupabase();
  if (!cdnOK) {
    supabaseAvailable = false;
    return false;
  }

  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('⚠ env.js no cargó las credenciales de Supabase.');
    supabaseAvailable = false;
    return false;
  }

  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabaseClient;
    console.log('✓ Supabase client inicializado');
    supabaseAvailable = true;
    return true;
  } catch (err) {
    console.error('✗ Error inicializando Supabase:', err);
    supabaseAvailable = false;
    return false;
  }
}

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
const state = {
  currentUser: null,
  users: [
    { id: 1, name: 'Administrador', username: 'admin', pass: '1821', role: 'admin' },
    { id: 2, name: 'Mesero Demo',   username: 'mesero', pass: '1234', role: 'mesero' },
    { id: 3, name: 'Cocinero Demo', username: 'cocina', pass: '1234', role: 'cocina' }
  ],
  orders: [],
  activityLog: []
};

// ═══════════════════════════════════════════
// FUNCIONES PRINCIPALES (PLACEHOLDER)
// ═══════════════════════════════════════════

async function loadOrders() {
  if (!supabaseAvailable || !supabaseClient) {
    console.log('ℹ Modo local (sin Supabase)');
    return;
  }
  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .order('id', { ascending: false });
    if (error) throw error;
    state.orders = data || [];
    console.log('✓ Pedidos:', state.orders.length);
  } catch (err) {
    console.error('Error loadOrders:', err);
  }
}

function activarListenersTiempoReal() {
  if (!supabaseAvailable || !supabaseClient) return;

  supabaseClient
    .channel('orders-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async (payload) => {
      console.log('🔴 EVENTO REALTIME:', payload.eventType);
      await loadOrders();
      renderScreensAfterOrdersUpdate();
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') console.log('✓ Realtime ACTIVO');
    });
}

function renderScreensAfterOrdersUpdate() {
  if (state.currentUser?.role === 'cocina') renderKitchen();
  if (state.currentUser?.role === 'mesero') renderPickupAlerts();
  if (state.currentUser?.role === 'admin') renderAdminVentas();
}

function renderKitchen() {
  console.log('→ renderKitchen()');
  // TODO: implementar renderizado de cocina
}

function renderPickupAlerts() {
  console.log('→ renderPickupAlerts()');
  // TODO: implementar alertas de pickup
}

function renderAdminVentas() {
  console.log('→ renderAdminVentas()');
  // TODO: implementar dashboard de ventas
}

function doLogin() {
  console.log('→ doLogin()');
  // TODO: implementar lógica de login
}

// ═══════════════════════════════════════════
// INICIO
// ═══════════════════════════════════════════

window.addEventListener('load', async () => {
  console.log('🚀 App iniciando...');
  await initSupabaseClient();
  await loadOrders();
  activarListenersTiempoReal();
  console.log('✓ App lista. Supabase:', supabaseAvailable);
});

