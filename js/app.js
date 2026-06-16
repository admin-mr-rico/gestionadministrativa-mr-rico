// ═══════════════════════════════════════════
//  STATE
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

// ──────────────────────────────────────────────────
// Supabase integration (basic)
// Deployment: 2026-06-14
// ──────────────────────────────────────────────────
import { supabaseClient } from '../supabaseClient.js';

let supabaseClient = null;
const SUPABASE_URL = window.SUPABASE_URL || window.env?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || window.env?.SUPABASE_ANON_KEY;

if (SUPABASE_URL && SUPABASE_ANON_KEY && typeof window !== 'undefined' && window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.supabaseClient = supabaseClient;
}

if (!supabaseClient) {
  console.error('Supabase no inicializado. Revisa env.js / variables de entorno / carga del CDN');
}

async function initSupabase() {
  if (!supabaseClient) {
    return;
  }

  await loadOrders();
  activarListenersTiempoReal();
}

async function loadOrders() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient
    .from('orders')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error('Error cargando orders desde Supabase:', error);
    return;
  }

  state.orders = data || [];
}

function renderScreensAfterOrdersUpdate() {
  if (state.currentUser?.role === 'cocina') renderKitchen();
  if (state.currentUser?.role === 'mesero') renderPickupAlerts();
  if (state.currentUser?.role === 'admin') renderAdminVentas();
}

function activarListenersTiempoReal() {
  if (!supabaseClient) return;

  supabaseClient
    .channel('orders-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      async payload => {
        console.log('Realtime orders event:', payload);
        await loadOrders();
        renderScreensAfterOrdersUpdate();
      }
    )
    .subscribe(status => {
      if (status === 'SUBSCRIBED') {
        console.log('Supabase realtime orders suscrito');
      } else {
        console.warn('Realtime subscription status:', status);
      }
    });
}

window.addEventListener('load', initSupabase);

