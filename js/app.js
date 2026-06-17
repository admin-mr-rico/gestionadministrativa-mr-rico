// ═══════════════════════════════════════════
// INICIALIZACIÓN SUPABASE (PRIMERO)
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
        console.error('⚠ Supabase CDN no se cargó. Usando datos locales.');
        resolve(false);
      }
      retries++;
    }, 100);
  });
}

async function initSupabaseClient() {
  // Esperar CDN
  const cdnOK = await waitForSupabase();
  if (!cdnOK) {
    supabaseAvailable = false;
    return false;
  }

  const SUPABASE_URL = window.SUPABASE_URL;
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

  console.log('DEBUG: SUPABASE_URL =', SUPABASE_URL);
  console.log('DEBUG: SUPABASE_ANON_KEY present =', !!SUPABASE_ANON_KEY);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('⚠ SUPABASE_URL o SUPABASE_ANON_KEY no están definidas. Usando datos locales.');
    supabaseAvailable = false;
    return false;
  }

  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabaseClient;
    console.log('✓ Supabase client inicializado correctamente');
    supabaseAvailable = true;
    return true;
  } catch (err) {
    console.error('⚠ Error al crear Supabase client:', err);
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
  nextUserId: 4,
  categories: ['Entradas','Platos Fuertes','Sopas','Ensaladas','Bebidas','Postres','Especiales'],
  menu: [
    { id:1, name:'Bandeja Paisa', price:28000, qty:15, cat:'Platos Fuertes', desc:'Fríjoles, chicharrón, carne molida, chorizo, morcilla, arroz, huevo, aguacate y arepa.', emoji:'🍱' },
    { id:2, name:'Sancocho de Gallina', price:22000, qty:10, cat:'Sopas', desc:'Sopa tradicional con gallina criolla, papa, yuca, plátano. Con arroz y aguacate.', emoji:'🍲' },
    { id:3, name:'Mojarra Frita', price:32000, qty:8, cat:'Platos Fuertes', desc:'Mojarra entera frita, crujiente. Acompañada de patacones y ensalada.', emoji:'🐟' },
    { id:4, name:'Lulada', price:6000, qty:20, cat:'Bebidas', desc:'Bebida refrescante de lulo con limón. Una delicia colombiana.', emoji:'🥤' },
    { id:5, name:'Arroz con Leche', price:8000, qty:12, cat:'Postres', desc:'Postre cremoso de arroz con leche, canela y panela.', emoji:'🍮' },
    { id:6, name:'Ensalada de Pollo', price:18000, qty:6, cat:'Ensaladas', desc:'Pechuga asada sobre lechugas, tomate cherry, zanahoria y aderezo de limón.', emoji:'🥗' }
  ],
  nextMenuId: 7,
  inventory: [
    { id:1, name:'Coca-Cola 250ml', qty:48, unit:'unidades', min:12, cat:'Bebidas', emoji:'🥤' },
    { id:2, name:'Agua mineral', qty:30, unit:'unidades', min:10, cat:'Bebidas', emoji:'💧' },
    { id:3, name:'Pechuga de pollo', qty:15, unit:'kg', min:5, cat:'Carnes', emoji:'🍗' },
    { id:4, name:'Arroz', qty:20, unit:'kg', min:8, cat:'Granos', emoji:'🍚' },
    { id:5, name:'Aceite vegetal', qty:8, unit:'litros', min:3, cat:'Condimentos', emoji:'🫙' },
    { id:6, name:'Fríjoles', qty:25, unit:'kg', min:10, cat:'Granos', emoji:'🫘' }
  ],
  nextInvId: 7,
  tables: [
    { id:1, name:'Mesa 1', cap:4, zone:'Interior' },
    { id:2, name:'Mesa 2', cap:4, zone:'Interior' },
    { id:3, name:'Mesa 3', cap:6, zone:'Interior' },
    { id:4, name:'Mesa 4', cap:2, zone:'Exterior' },
    { id:5, name:'Mesa 5', cap:4, zone:'Exterior' },
    { id:6, name:'Para llevar', cap:0, zone:'–' },
    { id:7, name:'Domicilio', cap:0, zone:'–' }
  ],
  nextTableId: 8,
  orders: [],
  nextOrderId: 1,
  currentOrder: [],
  selectedTable: null,
  activityLog: []
};

// ═══════════════════════════════════════════
// CARGAR PEDIDOS
// ═══════════════════════════════════════════
async function loadOrders() {
  if (!supabaseAvailable || !supabaseClient) {
    console.log('ℹ Usando pedidos locales (Supabase no disponible)');
    return;
  }
  
  try {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error loading orders from Supabase:', error);
      return;
    }

    state.orders = data || [];
    console.log('✓ Pedidos cargados de Supabase:', state.orders.length);
  } catch (err) {
    console.error('Exception loading orders:', err);
  }
}

function renderScreensAfterOrdersUpdate() {
  if (!state.currentUser) return;

  if (state.currentUser.role === 'cocina' && typeof renderKitchen === 'function') {
    renderKitchen();
  }
  if (state.currentUser.role === 'mesero' && typeof renderPickupAlerts === 'function') {
    renderPickupAlerts();
  }
  if (state.currentUser.role === 'admin' && typeof renderAdminVentas === 'function') {
    renderAdminVentas();
  }
}

function activarListenersTiempoReal() {
  if (!supabaseAvailable || !supabaseClient) {
    console.log('ℹ Realtime desactivado (Supabase no disponible)');
    return;
  }

  console.log('Activando listener realtime para orders...');

  const channel = supabaseClient.channel('orders-realtime');

  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'orders' },
    async (payload) => {
      console.log('🔴 EVENTO REALTIME RECIBIDO:', payload.eventType, payload.new || payload.old);
      try {
        await loadOrders();
        renderScreensAfterOrdersUpdate();
      } catch (err) {
        console.error('Error procesando evento realtime:', err);
      }
    }
  ).subscribe((status) => {
    console.log('Realtime subscription status:', status);
    if (status === 'SUBSCRIBED') {
      console.log('✓ Suscripción a realtime ACTIVA para orders');
    }
  });
}

// ═══════════════════════════════════════════
// INICIO (cuando carga todo)
// ═══════════════════════════════════════════

window.addEventListener('load', async () => {
  console.log('🚀 Window load event - inicializando app');

  // 1. Inicializar Supabase
  supabaseClient = window.initSupabase();

  // 2. Cargar datos
  await loadOrders();

  // 3. Activar listeners
  activarListenersTiempoReal();

  console.log('✓ App inicializada. Supabase disponible:', !!supabaseClient);
});

