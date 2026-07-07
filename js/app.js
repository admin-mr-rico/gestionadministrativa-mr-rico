// ═══════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════
const state = {
  currentUser: null,
  users: [
    { id: 1, name: 'Administrador', username: 'admin', pass: '1211', role: 'admin' },
    { id: 2, name: 'Mesero Demo',   username: 'mesero', pass: '1211', role: 'mesero' },
    { id: 3, name: 'Cocinero Demo', username: 'cocina', pass: '1211', role: 'cocina' },
    { id: 4, name: 'Caja Demo',     username: 'caja', pass: '1912', role: 'caja' }
  ],
  nextUserId: 5,
  categories: ['Entradas','Platos Fuertes','Sopas','Ensaladas','Bebidas','Postres','Especiales'],
  menu: [
    { id:1, name:'Bandeja Paisa', price:28000, qty:15, cat:'Platos Fuertes', desc:'Fríjoles, chicharrón, carne molida, chorizo, morcilla, arroz, huevo, aguacate y arepa.', emoji:'🍱' },
    { id:2, name:'Sancocho de Gallina', price:22000, qty:10, cat:'Sopas', desc:'Sopa tradicional con gallina criolla, papa, yuca, plátano. Con arroz y aguacate.', emoji:'🍲' },
    { id:3, name:'Mojarra Frita', price:32000, qty:8, cat:'Platos Fuertes', desc:'Mojarra entera frita, crujiente. Acompañada de patacones y ensalada.', emoji:'🐟' },
    { id:4, name:'Lulada', price:6000, qty:20, cat:'Bebidas', desc:'Bebida refrescante de lulo con limón. Una delicia colombiana.', emoji:'🥤' },
    { id:5, name:'Arroz con Leche', price:8000, qty:12, cat:'Postres', desc:'Postre cremoso de arroz con leche, canela y panela.', emoji:'🍮' },
    { id:6, name:'Ensalada de Pollo', price:18000, qty:6, cat:'Ensaladas', desc:'Pechuga asada sobre lechugas, tomate cherry, zanahoria y aderezo de limón.', emoji:'🥗' },
    { id:7, name:'Michelada Ginger', price:12000, qty:15, cat:'Bebidas', desc:'Michelada preparada con cerveza y ginger ale.', emoji:'🍺' },
    { id:8, name:'Michelada Soda', price:12000, qty:15, cat:'Bebidas', desc:'Michelada preparada con cerveza y soda.', emoji:'🍺' }
  ],
  nextMenuId: 9,
  inventory: [
    { id:1, name:'Coca-Cola 250ml', qty:48, unit:'unidades', min:12, cat:'Bebidas', emoji:'🥤' },
    { id:2, name:'Agua mineral', qty:30, unit:'unidades', min:10, cat:'Bebidas', emoji:'💧' },
    { id:3, name:'Pechuga de pollo', qty:15, unit:'kg', min:5, cat:'Carnes', emoji:'🍗' },
    { id:4, name:'Arroz', qty:20, unit:'kg', min:8, cat:'Granos', emoji:'🍚' },
    { id:5, name:'Aceite vegetal', qty:8, unit:'litros', min:3, cat:'Condimentos', emoji:'🫙' },
    { id:6, name:'Fríjoles', qty:25, unit:'kg', min:10, cat:'Granos', emoji:'🫘' },
    { id:7, name:'Cerveza', qty:30, unit:'unidades', min:10, cat:'Bebidas', emoji:'🍺' }
  ],
  nextInvId: 8,
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
  menuCategories: [],
  activityLog: [],
  expandedMenuCategories: {},
  editingCategoryIndex: null,
  managingCategoryDishesIndex: null
};
let adminInvCategorySelected = '__categories__';
let kitchenInvCategorySelected = '__categories__';
let adminInvSubcatSelected = '__subcats__';
let kitchenInvSubcatSelected = '__subcats__';
let meseroCategorySelected = '__categories__';
let adminMenuCategorySelected = '__categories__';
let adminMenuSubcatSelected = '__subcats__';
let cajaCategorySelected = 'all';
if (typeof window.cajaOrder === 'undefined') window.cajaOrder = { currentOrder: [], selectedTable: null };

const DEFAULT_USERS = state.users.map(u => ({ ...u }));
const DEFAULT_MENU = state.menu.map(d => ({ ...d }));

// ──────────────────────────────────────────────────
// Función global para convertir hora a minutos (maneja AM/PM)
// ──────────────────────────────────────────────────
function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const clean = timeStr.trim();
  const isPM = clean.toLowerCase().includes('p.m.');
  const isAM = clean.toLowerCase().includes('a.m.');
  const match = clean.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  if (isPM && hours !== 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

// ──────────────────────────────────────────────────
// Supabase integration
// ──────────────────────────────────────────────────
let supabaseClient = null;
const SUPABASE_URL = window.SUPABASE_URL || window.env?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || window.env?.SUPABASE_ANON_KEY;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    initSupabase();
    console.log("¡Supabase configurado correctamente!");
  } catch (e) {
    console.warn('Error al inicializar Supabase:', e);
  }
} else {
  console.warn('Supabase no configurado en window.SUPABASE_URL ni en window.env.');
}

async function initSupabase() {
  await loadInitialState();
  attemptRestoreSession();
  activarListenersTiempoReal();
}

async function loadInitialState() {
  if (!supabaseClient) return;
  try {
    await Promise.all([
      loadMenu(),
      loadInventory(),
      loadUsers(),
      loadTables(),
      loadOrders(),
      loadActivityLog(),
      loadCategories(),
      loadMenuCategories()
    ]);
    await checkAndSeedDatabase();
  } catch (e) {
    console.error('Error loading initial state from Supabase', e);
  }
}

async function loadMenu() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from('menu').select('*');
  if (error) console.error("Error loading menu:", error);
  else if (data) {
    state.menu = data.map(m => ({ ...m, price: Number(m.price), qty: Number(m.qty) }));
    state.nextMenuId = state.menu.length ? Math.max(...state.menu.map(x => x.id)) + 1 : 1;
  }
}

async function loadInventory() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from('inventory').select('*');
  if (error) console.error("Error loading inventory:", error);
  else if (data) {
    state.inventory = data.map(i => ({ ...i, qty: Number(i.qty), min: Number(i.min) }));
    state.nextInvId = state.inventory.length ? Math.max(...state.inventory.map(x => x.id)) + 1 : 1;
  }
}

async function loadUsers() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from('users').select('*');
  if (error) console.error("Error loading users:", error);
  else if (data) {
    state.users = data;
    state.nextUserId = state.users.length ? Math.max(...state.users.map(x => x.id)) + 1 : 1;
  }
}

async function loadTables() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from('tables').select('*');
  if (error) console.error("Error loading tables:", error);
  else if (data) {
    state.tables = data.map(t => ({ ...t, cap: Number(t.cap) }));
    state.nextTableId = state.tables.length ? Math.max(...state.tables.map(x => x.id)) + 1 : 1;
  }
}

async function loadOrders() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from('orders').select('*');
  if (error) console.error("Error loading orders:", error);
  else if (data) {
    state.orders = data.map(o => ({
      ...o,
      table: o.table_name || o.table,
      items: o.items || [],
      total: Number(o.total)
    }));
    state.nextOrderId = state.orders.length ? Math.max(...state.orders.map(x => x.id)) + 1 : 1;
  }
}

async function loadActivityLog() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from('activity_log').select('*').order('id', { ascending: false }).limit(100);
  if (error) console.error("Error loading activity log:", error);
  else if (data) {
    state.activityLog = data;
  }
}

async function loadCategories() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from('categories').select('*').order('id', { ascending: true });
  if (error) console.error("Error loading categories:", error);
  else if (data && data.length) {
    state.categories = data.map(c => c.name);
  }
}

async function loadMenuCategories() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient.from('menu_categories').select('*');
  if (error) console.error("Error loading menu categories:", error);
  else if (data) {
    state.menuCategories = data;
  }
}

async function checkAndSeedDatabase() {
  if (!supabaseClient) return;
  try {
    const { data: remoteMenu } = await supabaseClient.from('menu').select('id');
    if (remoteMenu && remoteMenu.length === 0 && state.menu.length > 0) {
      await supabaseClient.from('menu').insert(state.menu);
    }
    const { data: remoteInventory } = await supabaseClient.from('inventory').select('id');
    if (remoteInventory && remoteInventory.length === 0 && state.inventory.length > 0) {
      await supabaseClient.from('inventory').insert(state.inventory);
    }
    const { data: remoteUsers } = await supabaseClient.from('users').select('id');
    if (remoteUsers && remoteUsers.length === 0 && state.users.length > 0) {
      await supabaseClient.from('users').insert(state.users);
    }
    const { data: remoteTables } = await supabaseClient.from('tables').select('id');
    if (remoteTables && remoteTables.length === 0 && state.tables.length > 0) {
      await supabaseClient.from('tables').insert(state.tables);
    }
    const { data: remoteCats } = await supabaseClient.from('categories').select('id');
    if (remoteCats && remoteCats.length === 0 && state.categories.length > 0) {
      await supabaseClient.from('categories').insert(state.categories.map(name => ({ name })));
    }
  } catch (e) {
    console.error("Error seeding database:", e);
  }
}

// ═══════════════════════════════════════════
//  LOGIN / LOGOUT
// ═══════════════════════════════════════════
let selectedRole = 'mesero';
function selectRole(btn) {
  document.querySelectorAll('.role-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  selectedRole = btn.dataset.role;
}

function doLogin() {
  const u = document.getElementById('login-user').value.trim().toLowerCase();
  const p = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');

  let user;
  if (selectedRole === 'admin') {
    user = state.users.find(x => x.role === 'admin' && x.username === u && x.pass === p);
  } else {
    user = state.users.find(x => x.role === selectedRole && x.username === u && x.pass === p);
  }

  if (!user) {
    const fb = DEFAULT_USERS.find(x => x.role === selectedRole && x.username === u && x.pass === p);
    if (fb) {
      user = { ...fb };
      if (!state.users.find(x => x.username === user.username && x.role === user.role)) {
        state.users.push(user);
      }
    }
  }

  if (!user) { err.style.display='block'; return; }
  err.style.display='none';
  state.currentUser = user;
  saveSession();

  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('header-user-badge').textContent = user.name;
  const labels = { mesero:'· Mesero', cocina:'· Cocina', admin:'· Administración', caja:'· Caja' };
  document.getElementById('header-role-label').textContent = labels[user.role] || '';

  logActivity(user.name, user.role, 'Inició sesión', '#FF6B1A');
  activateScreen(user.role);
}

function saveSession() {
  if (!state.currentUser) return;
  localStorage.setItem('mr-rico-session', JSON.stringify({ username: state.currentUser.username, role: state.currentUser.role }));
}

function restoreSession() {
  try {
    const saved = localStorage.getItem('mr-rico-session');
    if (!saved) return;
    const payload = JSON.parse(saved);
    if (!payload || !payload.username || !payload.role) return;
    const storedUser = state.users.find(x => x.role === payload.role && x.username === payload.username) || DEFAULT_USERS.find(x => x.role === payload.role && x.username === payload.username);
    if (!storedUser) return;
    state.currentUser = storedUser;
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app').style.display='flex';
    document.getElementById('header-user-badge').textContent = storedUser.name;
    const labels = { mesero:'· Mesero', cocina:'· Cocina', admin:'· Administración', caja:'· Caja' };
    document.getElementById('header-role-label').textContent = labels[storedUser.role] || '';
    activateScreen(storedUser.role);
  } catch (e) {
    console.error('Error restaurando sesión:', e);
  }
}

function doLogout() {
  if (state.currentUser) logActivity(state.currentUser.name, state.currentUser.role, 'Cerró sesión', '#9E9E9E');
  state.currentUser = null;
  state.currentOrder = [];
  state.selectedTable = null;
  localStorage.removeItem('mr-rico-session');
  document.getElementById('login-user').value='';
  document.getElementById('login-pass').value='';
  document.getElementById('app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
}

function attemptRestoreSession() {
  if (state.currentUser) return;
  restoreSession();
}

document.getElementById('login-pass').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });
window.addEventListener('load', () => { attemptRestoreSession(); if (window.history && 'scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'; });

// ═══════════════════════════════════════════
//  ROUTING
// ═══════════════════════════════════════════
function activateScreen(role) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  if (role === 'mesero') {
    document.getElementById('screen-mesero').classList.add('active');
    renderTableBtns();
    populateMeseroCat();
    renderMenuCards();
    renderPickupAlerts();
    renderMeseroPedidos();
  } else if (role === 'cocina') {
    document.getElementById('screen-cocina').classList.add('active');
    renderKitchen();
    renderKitchenInventory();
    if (!window._kitchenTimer) window._kitchenTimer = setInterval(() => { renderKitchen(); renderKitchenInventory(); }, 20000);
  } else if (role === 'admin') {
    document.getElementById('screen-admin').classList.add('active');
    renderAdminVentas();
    renderAdminMenu();
  } else if (role === 'caja') {
    document.getElementById('screen-caja').classList.add('active');
    cajaTab('ventas', document.querySelector('#screen-caja .tab'));
  }
}

// ═══════════════════════════════════════════
//  MESERO – PICKUP ALERTS
// ═══════════════════════════════════════════
function renderPickupAlerts() {
  const readyOrders = state.orders.filter(o => o.status === 'done' && !o.delivered);
  const sec = document.getElementById('pickup-section');
  if (state.currentUser?.role === 'mesero') {
    const prev = window._lastReadyOrdersCount || 0;
    if (readyOrders.length > prev) playAlertSound('ready');
    window._lastReadyOrdersCount = readyOrders.length;
  }
  if (!readyOrders.length) { sec.style.display='none'; return; }
  sec.style.display='block';
  sec.innerHTML = `<div class="pickup-banner">
    <div style="font-size:36px;">🔔</div>
    <div style="flex:1;">
      <h3>¡Pedido(s) listos para recoger!</h3>
      <p>${readyOrders.map(o=>`<strong>#${o.id} ${o.table}</strong>`).join(' · ')}</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:6px;">
      ${readyOrders.map(o=>`<button class="btn-sm" style="background:rgba(255,255,255,.25);color:#fff;border:1px solid rgba(255,255,255,.4);" onclick="markDelivered(${o.id})">✓ Entregar #${o.id}</button>`).join('')}
    </div>
  </div>`;
}

function markDelivered(id) {
  const o = state.orders.find(x=>x.id===id);
  if (o) {
    o.delivered=true;
    logActivity(state.currentUser.name,'mesero',`Entregó pedido #${o.id} (${o.table})`,'#28A745');
    if (supabaseClient) {
      supabaseClient.from('orders').update({ delivered: true }).eq('id', id)
        .then(({ error }) => { if (error) console.error(error); });
    }
  }
  renderPickupAlerts();
  renderMeseroPedidos();
  showToast(`✅ Pedido #${id} entregado`, 'success');
}

setInterval(() => { if (state.currentUser?.role === 'mesero') { renderPickupAlerts(); renderMeseroPedidos(); } }, 10000);

// ═══════════════════════════════════════════
//  MESERO – TABLES
// ═══════════════════════════════════════════
function renderTableBtns() {
  const g = document.getElementById('table-btn-grid');
  g.innerHTML = state.tables.map(t => `
    <button class="table-btn ${state.selectedTable===t.id?'selected':''}" onclick="selectTable(${t.id},'${t.name}')">${t.name}</button>
  `).join('');
}

function selectTable(id, name) {
  state.selectedTable = id;
  document.getElementById('order-table').value = name;
  renderTableBtns();
}

// ═══════════════════════════════════════════
//  MESERO – MENU
// ═══════════════════════════════════════════
function populateMeseroCat() {
  const nav = document.getElementById('mesero-cat-nav');
  if (!nav) return;
  nav.innerHTML = `<button class="btn-sm ${meseroCategorySelected==='__categories__' ? 'btn-primary' : ''}" onclick="selectMeseroCategory('__categories__')">📁 Categorías</button>` +
    `<button class="btn-sm ${meseroCategorySelected==='all' ? 'btn-primary' : ''}" onclick="selectMeseroCategory('all')">Ver todo</button>` +
    state.categories.map(c=>`<button class="btn-sm ${meseroCategorySelected===c ? 'btn-primary' : ''}" onclick="selectMeseroCategory('${c}')">${c}</button>`).join('');
}

function selectMeseroCategory(cat) {
  meseroCategorySelected = cat;
  populateMeseroCat();
  renderMenuCards();
}

function renderMenuCards() {
  const search = (document.getElementById('mesero-search')?.value||'').toLowerCase().trim();
  const grid = document.getElementById('menu-cards-grid');

  if (search) {
    const filtered = state.menu.filter(d => d.name.toLowerCase().includes(search) || (d.desc||'').toLowerCase().includes(search));
    if (!filtered.length) {
      grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🔍</div><p>Sin resultados</p></div>`;
      return;
    }
    grid.innerHTML = filtered.map(d => menuCardHTML(d, true)).join('');
    return;
  }

  if (meseroCategorySelected === '__categories__') {
    if (!state.categories.length) {
      grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1;"><div class="icon">📁</div><p>No hay categorías</p></div>`;
      return;
    }
    grid.innerHTML = state.categories.map(c => {
      const count = state.menu.filter(d=>d.cat===c).length;
      return `<div class="menu-card" style="cursor:pointer;" onclick="selectMeseroCategory('${c}')">
        <div class="menu-card-img" style="font-size:40px;">📁</div>
        <div class="menu-card-body" style="text-align:center;">
          <div class="menu-card-name">${c}</div>
          <div class="menu-card-desc">${count} plato${count===1?'':'s'}</div>
        </div>
      </div>`;
    }).join('');
    return;
  }

  const filtered = meseroCategorySelected === 'all' ? state.menu : state.menu.filter(d => d.cat === meseroCategorySelected);
  if (!filtered.length) {
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🍽️</div><p>Sin platos en esta categoría</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(d => menuCardHTML(d, true)).join('');
}

function menuCardHTML(d, forOrder=false, source='') {
  const sk = d.qty>5?'stock-ok':d.qty>0?'stock-low':'stock-out';
  const sl = d.qty>5?`${d.qty} disp.`:d.qty>0?`Solo ${d.qty}`:'Agotado';
  const dis = d.qty===0 ? 'style="opacity:.5;pointer-events:none;"' : '';
  const addFn = source === 'caja' ? `addToCajaOrder(${d.id})` : `addToOrder(${d.id})`;
  const actions = forOrder
    ? `<button class="btn-sm btn-add-order" onclick="${addFn}">+ Agregar</button>`
    : `<button class="btn-sm btn-edit" onclick="openMenuModal(${d.id})">✏️ Editar</button><button class="btn-sm btn-delete" onclick="deleteDish(${d.id})">🗑️</button>`;
  return `<div class="menu-card" ${dis}>
    <div class="menu-card-img">${d.emoji||'🍽️'}</div>
    <div class="menu-card-body">
      <div class="menu-card-cat">${d.cat}</div>
      <div class="menu-card-name">${d.name}</div>
      <div class="menu-card-desc">${d.desc.substring(0,65)}${d.desc.length>65?'…':''}</div>
      <div><span class="menu-card-price">$${d.price.toLocaleString()}</span><span class="menu-card-stock ${sk}">${sl}</span></div>
      <div class="menu-card-actions">${actions}</div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════
//  MESERO – ORDER
// ═══════════════════════════════════════════
let pendingMicheladaDishId = null;
let pendingMicheladaSource = null;

function showMicheladaModal(dishId, source) {
  pendingMicheladaDishId = dishId;
  pendingMicheladaSource = source;
  const modal = document.getElementById('michelada-modal');
  if (modal) modal.classList.add('open');
}

function selectMicheladaVariant(variant) {
  const d = state.menu.find(x => x.id === pendingMicheladaDishId);
  if (!d) return;
  const source = pendingMicheladaSource || 'mesero';
  
  if (source === 'edit') {
    if (!editOrderData) return;
    const existing = editOrderData.items.find(i => i.id === d.id);
    if (existing) {
      existing.qty++;
      existing.variant = variant;
    } else {
      editOrderData.items.push({ id: d.id, name: d.name, price: d.price, qty: 1, variant });
    }
    renderEditOrderItems();
    closeModal('edit-add-dish-modal');
    showToast(`✓ ${d.name} (${variant})`, 'success');
  } else if (source === 'caja') {
    const order = window.cajaOrder;
    const ex = order.currentOrder.find(i=>i.id===d.id);
    if (ex) {
      ex.qty++;
      ex.variant = variant;
    } else {
      order.currentOrder.push({id:d.id, name:d.name, price:d.price, qty:1, variant});
    }
    renderCajaOrderPanel();
    showToast(`✓ ${d.name} (${variant})`, 'success');
  } else {
    const ex = state.currentOrder.find(i=>i.id===d.id);
    if (ex) {
      ex.qty++;
      ex.variant = variant;
    } else {
      state.currentOrder.push({id:d.id, name:d.name, price:d.price, qty:1, variant});
    }
    renderOrderPanel();
    showToast(`✓ ${d.name} (${variant})`, 'success');
  }
  closeModal('michelada-modal');
}

function addToOrder(id) {
  const d = state.menu.find(x=>x.id===id);
  if (!d||d.qty===0) return;
  if (d.name.toLowerCase().includes('michelada')) {
    showMicheladaModal(id, 'mesero');
    return;
  }
  const ex = state.currentOrder.find(i=>i.id===id);
  if (ex) {
    ex.qty++;
  } else {
    state.currentOrder.push({id:d.id, name:d.name, price:d.price, qty:1});
  }
  renderOrderPanel();
  showToast(`✓ ${d.name}`, 'success');
}

function changeQty(id, delta) {
  const item = state.currentOrder.find(i=>i.id===id);
  if (!item) return;
  item.qty += delta;
  if (item.qty<=0) state.currentOrder = state.currentOrder.filter(i=>i.id!==id);
  renderOrderPanel();
}

function clearOrder() { state.currentOrder=[]; renderOrderPanel(); }

function renderOrderPanel() {
  const list = document.getElementById('order-items-list');
  const totSec = document.getElementById('order-total-section');
  if (!state.currentOrder.length) {
    list.innerHTML=`<div class="empty-state" style="padding:20px 0;"><div class="icon">🍽️</div><p>Sin platos</p><small>Selecciona del menú</small></div>`;
    totSec.style.display='none'; return;
  }
  const total = state.currentOrder.reduce((s,i)=>s+i.price*i.qty,0);
  list.innerHTML = state.currentOrder.map(item=>`
    <div class="order-item">
      <div class="order-item-name">${item.name}${item.variant ? ` (${item.variant})` : ''}</div>
      <div class="qty-control">
        <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
      </div>
      <div class="order-item-price">$${(item.price*item.qty).toLocaleString()}</div>
    </div>`).join('');
  document.getElementById('order-total-amount').textContent='$'+total.toLocaleString();
  totSec.style.display='flex';
}

async function sendOrder() {
  const tableName = document.getElementById('order-table').value;
  const notes = document.getElementById('order-notes').value.trim();
  if (!tableName) { showToast('⚠️ Selecciona una mesa', 'error'); return; }
  if (!state.currentOrder.length) { showToast('⚠️ El pedido está vacío', 'error'); return; }
  
  const total = state.currentOrder.reduce((s,i)=>s+i.price*i.qty,0);
  
  const order = {
    id: state.nextOrderId++,
    table: tableName,
    table_name: tableName,
    waiter: state.currentUser.name,
    waiter_id: state.currentUser.id,
    notes,
    items: [...state.currentOrder],
    total,
    status: 'pending',
    payment: 'pending',
    delivered: false,
    time: new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}),
    date: new Date().toLocaleDateString('es-CO'),
    inventoryupdated: false
  };

  const orderForDb = {
    id: order.id,
    table_name: order.table_name,
    waiter: order.waiter,
    waiter_id: order.waiter_id,
    notes: order.notes,
    items: order.items,
    total: order.total,
    status: order.status,
    payment: order.payment,
    delivered: order.delivered,
    time: order.time,
    date: order.date,
    inventoryupdated: order.inventoryupdated
  };

  state.orders.push(order);
  
  state.currentOrder.forEach(oi => {
    const d = state.menu.find(x=>x.id===oi.id);
    if (d) d.qty = Math.max(0, d.qty - oi.qty);
  });

  state.currentOrder = [];
  state.selectedTable = null;
  document.getElementById('order-notes').value='';
  document.getElementById('order-table').value='';
  
  renderTableBtns();
  renderOrderPanel();
  renderMenuCards();
  playAlertSound('kitchen');

  if (supabaseClient) {
    const { error } = await supabaseClient.from('orders').insert([orderForDb]);
    if (error) {
      console.error("Error al guardar en Supabase:", error.message);
      showToast('⚠️ Error al sincronizar pedido en la nube', 'error');
    } else {
      showToast('✅ ¡Pedido enviado a cocina en tiempo real!', 'success');
      logActivity(state.currentUser.name,'mesero',`Creó pedido #${order.id} – ${order.table_name} ($${order.total.toLocaleString()})`,'#FF6B1A');
      order.items.forEach(oi => {
        const d = state.menu.find(x => x.id === oi.id);
        if (d) {
          supabaseClient.from('menu').update({ qty: d.qty }).eq('id', d.id)
            .then(({ error }) => { if (error) console.error("Error updating menu qty:", error); });
        }
      });
    }
  } else {
    renderTablesGrid();
    showToast('✅ Guardado localmente (Modo sin internet)', 'success');
  }
  renderMeseroPedidos();
}

// ═══════════════════════════════════════════
//  MESERO – VER / EDITAR / ELIMINAR PEDIDOS
// ═══════════════════════════════════════════
function renderMeseroPedidos() {
  const container = document.getElementById('mesero-pedidos-list');
  if (!container) return;
  const misPedidos = state.orders.filter(o => o.waiter_id === state.currentUser?.id);
  // Orden descendente (más reciente primero)
  misPedidos.sort((a, b) => {
    return parseTimeToMinutes(b.time) - parseTimeToMinutes(a.time);
  });
  if (!misPedidos.length) {
    container.innerHTML = `<div class="empty-state" style="padding:20px 0;"><div class="icon">📋</div><p>No has creado pedidos</p></div>`;
    return;
  }
  container.innerHTML = misPedidos.map(o => `
    <div class="order-item-card" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid var(--gray-100);">
      <div>
        <strong>#${o.id}</strong> · ${o.table} · ${o.time} · 
        <span class="badge ${o.status==='done'?'badge-success':o.status==='preparing'?'badge-warning':'badge-secondary'}">${o.status}</span>
        <span class="badge ${o.payment==='paid'?'badge-success':'badge-secondary'}">${o.payment}</span>
        <div style="font-size:12px;color:var(--gray-400);">${o.items.map(i=>`${i.qty}× ${i.name}${i.variant?' ('+i.variant+')':''}`).join(', ')}</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn-sm btn-edit" onclick="openEditOrderModal(${o.id})">✏️ Editar</button>
        <button class="btn-sm btn-delete" onclick="deleteOrder(${o.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

// ═══════════════════════════════════════════
//  EDICIÓN DE PEDIDOS (Mesero y Caja)
// ═══════════════════════════════════════════
let editOrderData = null;
let editOrderSelectedTable = null;

function openEditOrderModal(orderId) {
  const modal = document.getElementById('edit-order-modal');
  if (!modal) {
    console.error('Modal de edición no encontrado en el DOM');
    showToast('Error: el modal de edición no está disponible', 'error');
    return;
  }
  const order = state.orders.find(o => o.id === orderId);
  if (!order) {
    showToast('Pedido no encontrado', 'error');
    return;
  }
  editOrderData = {
    ...order,
    items: order.items.map(item => ({ ...item })),
    originalId: order.id
  };
  editOrderSelectedTable = order.table_name || order.table;
  document.getElementById('edit-order-id').value = order.id;
  document.getElementById('edit-order-notes').value = order.notes || '';
  renderEditTableGrid();
  renderEditOrderItems();
  const results = document.getElementById('edit-add-dish-results');
  if (results) results.innerHTML = '';
  const search = document.getElementById('edit-dish-search');
  if (search) search.value = '';
  modal.classList.add('open');
}

function renderEditTableGrid() {
  const grid = document.getElementById('edit-table-btn-grid');
  if (!grid) return;
  grid.innerHTML = state.tables.map(t => `
    <button class="table-btn ${editOrderSelectedTable === t.name ? 'selected' : ''}" 
            onclick="selectEditTable('${t.name}')">${t.name}</button>
  `).join('');
}

function selectEditTable(tableName) {
  editOrderSelectedTable = tableName;
  renderEditTableGrid();
}

function renderEditOrderItems() {
  const container = document.getElementById('edit-order-items');
  if (!container) return;
  if (!editOrderData || !editOrderData.items.length) {
    container.innerHTML = `<div class="empty-state" style="padding:12px 0;"><p>Sin platos</p></div>`;
    return;
  }
  container.innerHTML = editOrderData.items.map((item, idx) => `
    <div class="edit-order-item" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;padding:6px;background:var(--gray-50);border-radius:6px;">
      <span style="flex:1;font-size:13px;">${item.name}${item.variant ? ' ('+item.variant+')' : ''}</span>
      <input type="number" class="form-control" style="width:70px;" value="${item.qty}" min="1" 
             data-idx="${idx}" onchange="updateEditItemQtyByIndex(${idx}, this)">
      <button class="btn-sm btn-delete" onclick="removeEditItemByIndex(${idx})">✕</button>
    </div>
  `).join('');
  const total = editOrderData.items.reduce((sum, i) => sum + (i.price || 0) * i.qty, 0);
  const totalEl = document.getElementById('edit-order-total');
  if (totalEl) totalEl.textContent = '$' + total.toLocaleString();
}

function updateEditItemQtyByIndex(idx, input) {
  const newQty = parseInt(input.value) || 0;
  if (newQty <= 0) {
    editOrderData.items.splice(idx, 1);
  } else {
    editOrderData.items[idx].qty = newQty;
  }
  renderEditOrderItems();
}

function removeEditItemByIndex(idx) {
  editOrderData.items.splice(idx, 1);
  if (editOrderData.items.length === 0) {
    if (confirm('El pedido quedará vacío. ¿Deseas eliminarlo?')) {
      deleteOrder(editOrderData.originalId);
      closeModal('edit-order-modal');
      return;
    }
  }
  renderEditOrderItems();
}

function openEditAddDishModal() {
  const modal = document.getElementById('edit-add-dish-modal');
  if (!modal) {
    showToast('Error: modal de agregar plato no disponible', 'error');
    return;
  }
  modal.classList.add('open');
  populateEditDishCategories();
  renderEditDishMenu();
}

function populateEditDishCategories() {
  const nav = document.getElementById('edit-dish-cat-nav');
  if (!nav) return;
  nav.innerHTML = `<button class="btn-sm" onclick="filterEditDishMenu('all')">Ver todo</button>` +
    state.categories.map(c => `<button class="btn-sm" onclick="filterEditDishMenu('${c}')">${c}</button>`).join('');
}

let editDishCategoryFilter = 'all';

function filterEditDishMenu(cat) {
  editDishCategoryFilter = cat;
  renderEditDishMenu();
}

function renderEditDishMenu() {
  const search = document.getElementById('edit-dish-search')?.value?.toLowerCase() || '';
  const grid = document.getElementById('edit-add-dish-results');
  if (!grid) return;
  let filtered = state.menu.filter(d => {
    const matchName = d.name.toLowerCase().includes(search);
    const matchCat = editDishCategoryFilter === 'all' || d.cat === editDishCategoryFilter;
    return matchName && matchCat && d.qty > 0;
  });
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state" style="padding:12px 0;"><div class="icon">🔍</div><p>Sin platos disponibles</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(d => `
    <div class="menu-card" style="cursor:pointer;" onclick="addDishToEditOrder(${d.id})">
      <div class="menu-card-img" style="font-size:28px;">${d.emoji||'🍽️'}</div>
      <div class="menu-card-body" style="padding:8px;">
        <div class="menu-card-name" style="font-size:13px;">${d.name}</div>
        <div class="menu-card-price" style="font-size:14px;">$${d.price.toLocaleString()}</div>
        <div class="menu-card-stock ${d.qty>5?'stock-ok':'stock-low'}" style="font-size:10px;">${d.qty} disp.</div>
      </div>
    </div>
  `).join('');
}

function addDishToEditOrder(dishId) {
  const dish = state.menu.find(d => d.id === dishId);
  if (!dish) return;
  if (dish.name.toLowerCase().includes('michelada')) {
    showMicheladaModal(dishId, 'edit');
    return;
  }
  const existing = editOrderData.items.find(i => i.id === dishId);
  if (existing) {
    existing.qty++;
  } else {
    editOrderData.items.push({ id: dish.id, name: dish.name, price: dish.price, qty: 1 });
  }
  renderEditOrderItems();
  closeModal('edit-add-dish-modal');
  showToast(`✓ ${dish.name} agregado`, 'success');
}

function saveEditOrder() {
  const orderId = parseInt(document.getElementById('edit-order-id').value);
  const originalOrder = state.orders.find(o => o.id === orderId);
  if (!originalOrder || !editOrderData) return;
  const newNotes = document.getElementById('edit-order-notes').value.trim();
  const newTable = editOrderSelectedTable;
  if (!newTable) {
    showToast('⚠️ Selecciona una mesa', 'error');
    return;
  }
  if (!editOrderData.items.length) {
    showToast('⚠️ El pedido no puede estar vacío', 'error');
    return;
  }
  originalOrder.table = newTable;
  originalOrder.table_name = newTable;
  originalOrder.notes = newNotes;
  originalOrder.items = editOrderData.items.map(i => ({ ...i }));
  originalOrder.total = editOrderData.items.reduce((sum, i) => sum + (i.price || 0) * i.qty, 0);
  if (supabaseClient) {
    supabaseClient.from('orders').update({
      table_name: newTable,
      notes: newNotes,
      items: originalOrder.items,
      total: originalOrder.total
    }).eq('id', orderId)
      .then(({ error }) => { if (error) console.error('Error actualizando pedido:', error); });
  }
  renderMeseroPedidos();
  renderCajaMisPedidos();
  renderKitchen();
  renderAdminVentas();
  renderCajaVentas();
  renderPickupAlerts();
  closeModal('edit-order-modal');
  showToast('✅ Pedido actualizado', 'success');
}

function deleteOrder(id) {
  if (!confirm('¿Eliminar este pedido permanentemente?')) return;
  state.orders = state.orders.filter(o => o.id !== id);
  if (supabaseClient) {
    supabaseClient.from('orders').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error(error); });
  }
  renderMeseroPedidos();
  renderPickupAlerts();
  renderKitchen();
  showToast('🗑️ Pedido eliminado', 'success');
}

// ═══════════════════════════════════════════
//  COCINA
// ═══════════════════════════════════════════
function renderKitchen() {
  const filter = document.getElementById('kitchen-filter').value;
  let orders = state.orders.filter(o => (o.status === 'pending' || o.status === 'preparing') && (o.status === filter || !filter));
  // Orden ascendente (más antiguo primero) para priorizar
  orders.sort((a, b) => {
    return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
  });
  document.getElementById('k-pending').textContent   = state.orders.filter(o=>o.status==='pending').length;
  document.getElementById('k-preparing').textContent = state.orders.filter(o=>o.status==='preparing').length;
  document.getElementById('k-done').textContent      = state.orders.filter(o=>o.status==='done').length;
  const grid = document.getElementById('kitchen-grid');
  if (!orders.length) {
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🍳</div><p>Sin órdenes pendientes</p></div>`;
    return;
  }
  const sClass={pending:'',preparing:'preparing',done:'done'};
  const sLabel={pending:'Pendiente',preparing:'Preparando',done:'Listo'};
  const sBadge={pending:'status-pending',preparing:'status-preparing',done:'status-done'};
  grid.innerHTML = orders.map(o=>`
    <div class="kitchen-card ${sClass[o.status]}">
      <div class="kitchen-card-header">
        <div>
          <div class="kitchen-table">${o.table} <span style="font-size:11px;font-weight:400;color:var(--gray-400);">#${o.id}</span></div>
          <div class="kitchen-time">${o.time} · ${o.waiter}</div>
        </div>
        <span class="kitchen-status ${sBadge[o.status]}">${sLabel[o.status]}</span>
      </div>
      <div class="kitchen-items">${o.items.map(i=>`<div class="kitchen-item"><div><span class="kitchen-item-qty">×${i.qty}</span>${i.name}${i.variant?' ('+i.variant+')':''}</div></div>`).join('')}</div>
      ${o.notes?`<div class="kitchen-notes">📝 ${o.notes}</div>`:''}
      <div class="kitchen-actions">${kitchenActionBtns(o)}</div>
    </div>`).join('');
}

function kitchenActionBtns(o) {
  if (o.status==='pending')    return `<button class="btn-status btn-preparing" onclick="setOrderStatus(${o.id},'preparing')">🔥 Preparar</button>`;
  if (o.status==='preparing')  return `<button class="btn-status btn-done" onclick="setOrderStatus(${o.id},'done')">✅ Listo</button>`;
  return `<span style="font-size:12px;color:var(--green);font-weight:700;">✅ Listo</span>`;
}

function setOrderStatus(id, status) {
  const o = state.orders.find(x=>x.id===id);
  if (!o) return;
  const prev = o.status;
  o.status = status;
  const lbl = {preparing:'comenzó preparación de',done:'marcó como listo el'};
  logActivity(state.currentUser.name,'cocina',`${lbl[status]||'actualizó'} pedido #${o.id} (${o.table})`,'#FF6B1A');
  if (status === 'done' && !o.inventoryupdated) {
    updateInventoryForOrder(o);
  }
  renderKitchen();
  if (status === 'done') {
    window._lastReadyOrdersCount = (window._lastReadyOrdersCount || 0) + 1;
  }
  showToast(status==='done'?'✅ Pedido listo – mesero notificado':'🔥 Preparando pedido', 'success');

  if (supabaseClient) {
    supabaseClient.from('orders').update({ status: status, inventoryupdated: o.inventoryupdated }).eq('id', id)
      .then(({ error }) => { if (error) console.error("Error al actualizar estado en Supabase:", error); });
  }
}

function updateInventoryForOrder(order) {
  if (!order || order.inventoryupdated) return;
  order.items.forEach(it => {
    const menuItem = state.menu.find(m=>m.id===it.id || m.name===it.name);
    const qty = it.qty || 1;
    if (menuItem && menuItem.consumes && Array.isArray(menuItem.consumes)) {
      menuItem.consumes.forEach(c => {
        const inv = state.inventory.find(x=>x.id===c.invId || x.name===c.name);
        if (inv) {
          inv.qty = Math.max(0, inv.qty - (c.qty || 1) * qty);
          logActivity('Sistema','inventario',`Consumió ${ (c.qty||1)*qty } ${inv.unit} de ${inv.name} por pedido #${order.id}`,'#6F42C1');
          if (supabaseClient) {
            supabaseClient.from('inventory').update({ qty: inv.qty }).eq('id', inv.id)
              .then(({ error }) => { if (error) console.error(error); });
          }
        }
      });
    } else {
      let inv = null;
      if (menuItem && menuItem.cat) inv = state.inventory.find(x=>x.cat===menuItem.cat && x.unit==='unidades') || state.inventory.find(x=>x.cat===menuItem.cat);
      if (!inv) inv = state.inventory.find(x=>x.cat==='Bebidas' && x.unit==='unidades');
      if (!inv) inv = state.inventory.reduce((a,b)=> a.qty>b.qty ? a : b, state.inventory[0]);
      if (inv) {
        inv.qty = Math.max(0, inv.qty - qty);
        logActivity('Sistema','inventario',`Consumió ${qty} ${inv.unit} de ${inv.name} por pedido #${order.id}`,'#6F42C1');
        if (supabaseClient) {
          supabaseClient.from('inventory').update({ qty: inv.qty }).eq('id', inv.id)
            .then(({ error }) => { if (error) console.error(error); });
        }
      }
    }
  });
  order.inventoryupdated = true;
  renderInvGrid();
  renderKitchenInventory();
  renderAdminVentas();
  renderTablesGrid();
}

function renderKitchenInventory() {
  const nav = document.getElementById('kitchen-inv-category-nav');
  const el = document.getElementById('kitchen-inventory');
  const categories = [...new Set(state.inventory.map(i=>i.cat).filter(Boolean))].sort();

  if (nav) {
    nav.innerHTML = `<button class="btn-sm ${kitchenInvCategorySelected==='__categories__' ? 'btn-primary' : ''}" onclick="selectKitchenInvCategory('__categories__')">Categorías</button>` +
      `<button class="btn-sm ${kitchenInvCategorySelected==='all' ? 'btn-primary' : ''}" onclick="selectKitchenInvCategory('all')">Ver todo</button>` +
      categories.map(c=>`<button class="btn-sm ${kitchenInvCategorySelected===c ? 'btn-primary' : ''}" onclick="selectKitchenInvCategory('${c}')">${c}</button>`).join('');
  }

  if (kitchenInvCategorySelected === '__categories__') {
    const subcatNav = document.getElementById('kitchen-inv-subcat-nav');
    if (subcatNav) subcatNav.innerHTML = '';
    if (!categories.length) {
      el.innerHTML = `<div class="empty-state"><div class="icon">📦</div><p>No hay categorías de inventario</p></div>`;
      return;
    }
    el.innerHTML = categories.map(c => {
      return `<div class="inv-card" style="cursor:pointer;" onclick="selectKitchenInvCategory('${c}')">
        <div style="font-size:24px;">📁</div>
        <div style="font-weight:700;margin-top:10px;">${c}</div>
      </div>`;
    }).join('');
    return;
  }

  let items = kitchenInvCategorySelected === 'all'
    ? state.inventory
    : state.inventory.filter(i => i.cat === kitchenInvCategorySelected);

  const subcatNav = document.getElementById('kitchen-inv-subcat-nav');
  if (kitchenInvCategorySelected !== 'all') {
    const subcats = [...new Set(items.map(i=>i.subcat).filter(Boolean))].sort();
    if (subcats.length) {
      if (subcatNav) {
        subcatNav.innerHTML = `<button class="btn-sm ${kitchenInvSubcatSelected==='__subcats__' ? 'btn-primary' : ''}" onclick="selectKitchenInvSubcat('__subcats__')">📁 Subcategorías</button>` +
          `<button class="btn-sm ${kitchenInvSubcatSelected==='all' ? 'btn-primary' : ''}" onclick="selectKitchenInvSubcat('all')">Ver todo</button>` +
          subcats.map(s=>`<button class="btn-sm ${kitchenInvSubcatSelected===s ? 'btn-primary' : ''}" onclick="selectKitchenInvSubcat('${s}')">${s}</button>`).join('');
      }
      if (kitchenInvSubcatSelected === '__subcats__') {
        el.innerHTML = subcats.map(s => {
          const count = items.filter(i=>i.subcat===s).length;
          return `<div class="inv-card" style="cursor:pointer;" onclick="selectKitchenInvSubcat('${s}')">
            <div style="font-size:22px;">📂</div>
            <div style="font-weight:700;margin-top:10px;">${s}</div>
            <div style="font-size:12px;color:var(--gray-500);margin-top:4px;">${count} insumo${count===1?'':'s'}</div>
          </div>`;
        }).join('');
        const noSubcatCount = items.filter(i=>!i.subcat).length;
        if (noSubcatCount) {
          el.innerHTML += `<div class="inv-card" style="cursor:pointer;" onclick="selectKitchenInvSubcat('__none__')">
            <div style="font-size:22px;">📄</div>
            <div style="font-weight:700;margin-top:10px;">Sin subcategoría</div>
            <div style="font-size:12px;color:var(--gray-500);margin-top:4px;">${noSubcatCount} insumo${noSubcatCount===1?'':'s'}</div>
          </div>`;
        }
        return;
      }
      if (kitchenInvSubcatSelected === '__none__') items = items.filter(i=>!i.subcat);
      else if (kitchenInvSubcatSelected !== 'all') items = items.filter(i=>i.subcat===kitchenInvSubcatSelected);
    } else if (subcatNav) {
      subcatNav.innerHTML = '';
    }
  } else if (subcatNav) {
    subcatNav.innerHTML = '';
  }

  if (!items.length) {
    el.innerHTML = `<div class="empty-state"><div class="icon">📦</div><p>No hay insumos${kitchenInvCategorySelected==='all' ? '' : ' en esta categoría'}</p></div>`;
    return;
  }

  el.innerHTML = items.map(inv => {
    const pct = Math.min(100, Math.round((inv.qty/Math.max(inv.qty,inv.min*2))*100));
    const color = inv.qty>inv.min ? 'var(--green)' : inv.qty>0 ? 'var(--yellow)' : 'var(--red)';
    const label = inv.qty>inv.min ? 'OK' : inv.qty>0 ? 'Bajo' : 'Agotado';
    return `<div style="background:var(--gray-50);border-radius:10px;padding:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <div><strong>${inv.emoji} ${inv.name}</strong><div style="font-size:12px;color:var(--gray-500);">${inv.cat}${inv.subcat?' · '+inv.subcat:''}</div></div>
        <div style="text-align:right;color:${color};font-weight:800;">${inv.qty} ${inv.unit}</div>
      </div>
      <div class="inv-bar"><div class="inv-bar-fill" style="width:${pct}%;background:${color};"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--gray-500);margin-top:8px;"><span>Mínimo ${inv.min}</span><span>${label}</span></div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════
//  ADMIN TABS
// ═══════════════════════════════════════════
function adminTab(tab, btn) {
  document.querySelectorAll('#screen-admin .tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  ['ventas','menu','inventario','mesas','personal','usuarios','historial'].forEach(t=>{
    const el = document.getElementById('admin-tab-'+t);
    if (el) el.style.display = t===tab ? '' : 'none';
  });
  if (tab==='ventas')     renderAdminVentas();
  if (tab==='menu')       renderAdminMenu();
  if (tab==='inventario') renderInvGrid();
  if (tab==='mesas')      renderTablesGrid();
  if (tab==='personal')   renderPersonnel();
  if (tab==='usuarios')   renderUsersGrid();
  if (tab==='historial')  renderHistorial();
}

// ═══════════════════════════════════════════
//  ADMIN – VENTAS
// ═══════════════════════════════════════════
function renderAdminVentas() {
  const today = new Date().toLocaleDateString('es-CO');
  const tod = state.orders.filter(o=>o.date===today);
  const total = tod.reduce((s,o)=>s+o.total,0);
  const avg = tod.length ? Math.round(total/tod.length) : 0;

  const dishCount = {};
  state.menu.forEach(d=>dishCount[d.name]=0);
  tod.forEach(o=>o.items.forEach(i=>{ dishCount[i.name] = (dishCount[i.name]||0) + i.qty; }));
  const top = tod.length ? Object.entries(dishCount).sort((a,b)=>b[1]-a[1])[0] : null;
  const least = tod.length ? Object.entries(dishCount).sort((a,b)=>a[1]-b[1])[0] : null;

  const pendingPayments = tod.filter(o=>o.payment==='pending').length;
  const lowInv = state.inventory.filter(inv=>inv.qty<=inv.min).length;
  const outDishes = state.menu.filter(d=>d.qty===0).length;

  document.getElementById('a-total-sales').textContent  = '$'+total.toLocaleString();
  document.getElementById('a-total-orders').textContent = tod.length;
  document.getElementById('a-total-tables').textContent = state.tables.length;
  document.getElementById('a-pending-payments').textContent = pendingPayments;
  document.getElementById('a-top-dish').textContent = top ? top[0] : '–';
  document.getElementById('a-low-inventory').textContent = lowInv;
  document.getElementById('a-out-dishes').textContent = outDishes;
  document.getElementById('a-least-sold').textContent = least ? least[0] : '–';

  const lowListEl = document.getElementById('low-inv-list');
  const lowItems = state.inventory.filter(inv=>inv.qty<=inv.min);
  if (lowListEl) {
    if (!lowItems.length) lowListEl.innerHTML = '<div style="color:var(--gray-400);">Ninguno</div>';
    else lowListEl.innerHTML = lowItems.map(i=>`<div style="padding:6px 0;">${i.emoji||'📦'} <strong>${i.name}</strong> · ${i.qty} ${i.unit} <span style="color:var(--gray-400);">(mín ${i.min})</span></div>`).join('');
  }

  const outEl = document.getElementById('out-and-least');
  if (outEl) {
    const outNames = state.menu.filter(d=>d.qty===0).map(d=>`<div style="padding:6px 0;">${d.emoji||'🚫'} <strong>${d.name}</strong></div>`).join('');
    const leastHtml = least ? `<div style="padding:6px 0;margin-top:8px;color:var(--gray-600);">Menos vendido: <strong>${least[0]}</strong> (${least[1]} uds)</div>` : '';
    outEl.innerHTML = (outNames||'<div style="color:var(--gray-400);">Ninguno agotado</div>') + leastHtml;
  }

  const tbody = document.getElementById('sales-tbody');
  if (!tod.length) { tbody.innerHTML=`<tr><td colspan="10" style="text-align:center;color:var(--gray-400);padding:32px;">Sin pedidos hoy</td></tr>`; return; }
  const sColor={pending:'#FFF8E1',preparing:'#FFF0E8',done:'#E8F5E9'};
  const sText={pending:'⏳ Pendiente',preparing:'🔥 Preparando',done:'✅ Listo'};

  tod.sort((a,b) => {
    return parseTimeToMinutes(b.time) - parseTimeToMinutes(a.time);
  });

  tbody.innerHTML = tod.map(o=>{
    const itemsHtml = `<ul style="list-style:none;padding:0;margin:0;">${o.items.map(i=>{
      const unitPrice = i.price || (state.menu.find(m=>m.id===i.id)||{}).price || 0;
      const subtotal = unitPrice * i.qty;
      return `<li style="padding:4px 0;">${i.qty}× ${i.name}${i.variant?' ('+i.variant+')':''} — <small style="color:var(--gray-400);">$${unitPrice.toLocaleString()} c/u</small> <strong style="margin-left:8px;">$${subtotal.toLocaleString()}</strong></li>`;
    }).join('')}</ul>`;

    const deliveryHtml = o.status !== 'done'
      ? `<span class="badge" style="background:var(--gray-100);color:var(--gray-500);">–</span>`
      : o.delivered
        ? `<span class="badge" style="background:#E8F5E9;color:var(--green);">✅ Entregado</span>`
        : `<span class="badge" style="background:#FFF8E1;color:var(--yellow);">⏳ Sin entregar</span>`;

    return `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>${o.table}</td>
      <td>${o.waiter}</td>
      <td style="font-size:12px;">${itemsHtml}</td>
      <td><strong style="color:var(--orange);">$${o.total.toLocaleString()}</strong></td>
      <td><span class="badge" style="background:${sColor[o.status]};color:var(--gray-800);">${sText[o.status]}</span></td>
      <td>
        <span class="badge ${o.payment==='paid'?'pay-paid':'pay-pending'}">${o.payment==='paid'?'✅ Pagado':'⏳ Pendiente'}</span>
      </td>
      <td>${deliveryHtml}</td>
      <td style="color:var(--gray-400);font-size:12px;">${o.time}</td>
      <td>
        ${o.payment!=='paid'?`<button class="btn-sm btn-green" onclick="openPaymentModal(${o.id})">Cobrar</button>`:''}
      </td>
    </tr>`;
  }).join('');

  const totalRow = document.createElement('tr');
  totalRow.style.fontWeight = 'bold';
  totalRow.style.borderTop = '2px solid var(--gray-400)';
  totalRow.innerHTML = `<td colspan="4" style="text-align:right;">Total ventas del día</td><td colspan="6" style="color:var(--orange);">$${total.toLocaleString()}</td>`;
  tbody.appendChild(totalRow);
}

function openPaymentModal(id) {
  document.getElementById('payment-order-id').value = id;
  document.getElementById('payment-method').value = 'efectivo';
  document.getElementById('payment-modal').classList.add('open');
}

function playAlertSound(type) {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(ctx.destination);

  const makeTone = (freq, duration) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = 0.18;
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  if (type === 'kitchen') {
    makeTone(880, 0.18);
    makeTone(660, 0.14);
    makeTone(1040, 0.1);
  } else if (type === 'ready') {
    makeTone(880, 0.22);
    makeTone(1040, 0.16);
    makeTone(760, 0.12);
  } else {
    makeTone(740, 0.18);
    makeTone(980, 0.12);
  }
}

function confirmPayment() {
  const id = parseInt(document.getElementById('payment-order-id').value);
  const method = document.getElementById('payment-method').value;
  const o = state.orders.find(x=>x.id===id);
  if (!o) return;
  o.payment = 'paid';
  o.payment_method = method;
  logActivity(state.currentUser.name, state.currentUser.role, `Registró pago ${method==='efectivo'?'Efectivo':'Transferencia'} para pedido #${o.id}`,'#28A745');
  if (supabaseClient) {
    supabaseClient.from('orders').update({ payment: 'paid', payment_method: method }).eq('id', id)
      .then(({ error }) => { if (error) console.error(error); });
  }
  closeModal('payment-modal');
  renderAdminVentas();
  renderCajaVentas();
  renderTablesGrid();
  showToast('💰 Pago registrado','success');
}

// ═══════════════════════════════════════════
//  ADMIN – MENU
// ═══════════════════════════════════════════
function populateAdminCatFilter() {
  const sel = document.getElementById('admin-cat-filter');
  sel.innerHTML = `<option value="">Todas las categorías</option>` + state.categories.map(c=>`<option>${c}</option>`).join('');
}

function renderAdminMenu() {
  populateAdminCatFilter();
  const search = (document.getElementById('admin-search')?.value||'').toLowerCase();
  const cat    = document.getElementById('admin-cat-filter')?.value||'';
  let filtered = state.menu.filter(d => {
    const ms = !search || d.name.toLowerCase().includes(search);
    const mc = !cat || d.cat===cat;
    return ms && mc;
  });
  const grid = document.getElementById('admin-menu-grid');
  const header = `<div style="display:flex;justify-content:flex-end;margin-bottom:10px;gap:8px;">
    <button class="btn-sm btn-edit" onclick="openCatModal()" style="padding:8px 16px;">🏷️ Gestionar Categorías</button>
  </div>`;
  if (!filtered.length) { grid.innerHTML=header+`<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🍽️</div><p>Sin platos</p></div>`; return; }
  grid.innerHTML = header + filtered.map(d=>menuCardHTML(d,false)).join('');
}

// ═══════════════════════════════════════════
//  ADMIN – INVENTORY
// ═══════════════════════════════════════════
function renderInvGrid() {
  const grid = document.getElementById('inv-grid');
  const categories = [...new Set(state.inventory.map(i=>i.cat).filter(Boolean))].sort();
  const categoryNav = document.getElementById('inv-category-nav');
  if (categoryNav) {
    categoryNav.innerHTML = `<button class="btn-sm ${adminInvCategorySelected==='__categories__' ? 'btn-primary' : ''}" onclick="selectInvCategory('__categories__')">Categorías</button>` +
      `<button class="btn-sm ${adminInvCategorySelected==='all' ? 'btn-primary' : ''}" onclick="selectInvCategory('all')">Ver todo</button>` +
      categories.map(c=>`<button class="btn-sm ${adminInvCategorySelected===c ? 'btn-primary' : ''}" onclick="selectInvCategory('${c}')">${c}</button>`).join('');
  }

  if (!state.inventory.length) { grid.innerHTML=`<div class="empty-state"><div class="icon">📦</div><p>Sin insumos</p></div>`; return; }

  if (adminInvCategorySelected === '__categories__') {
    const subcatNav = document.getElementById('inv-subcat-nav');
    if (subcatNav) subcatNav.innerHTML = '';
    if (!categories.length) { grid.innerHTML=`<div class="empty-state"><div class="icon">📦</div><p>No hay categorías</p></div>`; return; }
    grid.innerHTML = categories.map(c => {
      return `<div class="inv-card" style="cursor:pointer;flex-direction:column;align-items:stretch;gap:12px;" onclick="selectInvCategory('${c}')">
        <div style="font-size:28px;">📁</div>
        <div style="font-size:18px;font-weight:700;">${c}</div>
      </div>`;
    }).join('');
    return;
  }

  let items = state.inventory;
  if (adminInvCategorySelected !== 'all') items = state.inventory.filter(i=>i.cat===adminInvCategorySelected);

  const subcatNav = document.getElementById('inv-subcat-nav');
  if (adminInvCategorySelected !== 'all') {
    const subcats = [...new Set(items.map(i=>i.subcat).filter(Boolean))].sort();
    if (subcats.length) {
      if (subcatNav) {
        subcatNav.innerHTML = `<button class="btn-sm ${adminInvSubcatSelected==='__subcats__' ? 'btn-primary' : ''}" onclick="selectInvSubcat('__subcats__')">📁 Subcategorías</button>` +
          `<button class="btn-sm ${adminInvSubcatSelected==='all' ? 'btn-primary' : ''}" onclick="selectInvSubcat('all')">Ver todo</button>` +
          subcats.map(s=>`<button class="btn-sm ${adminInvSubcatSelected===s ? 'btn-primary' : ''}" onclick="selectInvSubcat('${s}')">${s}</button>`).join('');
      }
      if (adminInvSubcatSelected === '__subcats__') {
        grid.innerHTML = subcats.map(s => {
          const count = items.filter(i=>i.subcat===s).length;
          return `<div class="inv-card" style="cursor:pointer;flex-direction:column;align-items:stretch;gap:12px;" onclick="selectInvSubcat('${s}')">
            <div style="font-size:26px;">📂</div>
            <div style="font-size:16px;font-weight:700;">${s}</div>
            <div style="color:var(--gray-500);font-size:12px;">${count} insumo${count===1?'':'s'}</div>
          </div>`;
        }).join('');
        const noSubcatCount = items.filter(i=>!i.subcat).length;
        if (noSubcatCount) {
          grid.innerHTML += `<div class="inv-card" style="cursor:pointer;flex-direction:column;align-items:stretch;gap:12px;" onclick="selectInvSubcat('__none__')">
            <div style="font-size:26px;">📄</div>
            <div style="font-size:16px;font-weight:700;">Sin subcategoría</div>
            <div style="color:var(--gray-500);font-size:12px;">${noSubcatCount} insumo${noSubcatCount===1?'':'s'}</div>
          </div>`;
        }
        return;
      }
      if (adminInvSubcatSelected === '__none__') items = items.filter(i=>!i.subcat);
      else if (adminInvSubcatSelected !== 'all') items = items.filter(i=>i.subcat===adminInvSubcatSelected);
    } else {
      if (subcatNav) subcatNav.innerHTML = '';
    }
  } else if (subcatNav) {
    subcatNav.innerHTML = '';
  }

  if (!items.length) { grid.innerHTML=`<div class="empty-state"><div class="icon">📦</div><p>No hay insumos${adminInvCategorySelected==='all' ? '' : ' en esta categoría'}</p></div>`; return; }
  grid.innerHTML = items.map(inv=>{
    const pct = Math.min(100, Math.round((inv.qty/Math.max(inv.qty,inv.min*2))*100));
    const color = inv.qty>inv.min ? 'var(--green)' : inv.qty>0 ? 'var(--yellow)' : 'var(--red)';
    const label = inv.qty>inv.min ? 'OK' : inv.qty>0 ? 'Bajo' : 'Agotado';
    return `<div class="inv-card" style="flex-direction:column;align-items:stretch;gap:8px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:32px;">${inv.emoji}</span>
        <div style="flex:1;">
          <div class="inv-name">${inv.name}</div>
          <div class="inv-cat">${inv.cat}${inv.subcat?' · '+inv.subcat:''}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:20px;font-weight:800;color:${color};">${inv.qty}</div>
          <div style="font-size:11px;color:var(--gray-400);">${inv.unit}</div>
        </div>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--gray-400);margin-bottom:4px;">
          <span>Mínimo: ${inv.min} ${inv.unit}</span>
          <span class="badge" style="background:${inv.qty>inv.min?'#E8F5E9':inv.qty>0?'#FFF8E1':'#FFEBEE'};color:${color};">${label}</span>
        </div>
        <div class="inv-bar"><div class="inv-bar-fill" style="width:${pct}%;background:${color};"></div></div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn-sm btn-edit" style="flex:1;" onclick="openInvModal(${inv.id})">✏️ Editar</button>
        <button class="btn-sm btn-delete" onclick="deleteInv(${inv.id})">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function openInvModal(id) {
  const m = document.getElementById('inv-modal');
  if (id) {
    const inv = state.inventory.find(x=>x.id===id);
    document.getElementById('inv-modal-title').textContent='Editar Insumo';
    document.getElementById('edit-inv-id').value=id;
    document.getElementById('inv-name').value=inv.name;
    document.getElementById('inv-qty').value=inv.qty;
    document.getElementById('inv-unit').value=inv.unit;
    document.getElementById('inv-min').value=inv.min;
    document.getElementById('inv-cat').value=inv.cat;
    document.getElementById('inv-subcat').value=inv.subcat||'';
    document.getElementById('inv-emoji').value=inv.emoji||'';
  } else {
    document.getElementById('inv-modal-title').textContent='Agregar Insumo';
    document.getElementById('edit-inv-id').value='';
    ['inv-name','inv-qty','inv-unit','inv-min','inv-cat','inv-subcat','inv-emoji'].forEach(i=>document.getElementById(i).value='');
  }
  m.classList.add('open');
}

function saveInv() {
  const name = document.getElementById('inv-name').value.trim();
  const qty  = parseInt(document.getElementById('inv-qty').value)||0;
  const unit = document.getElementById('inv-unit').value.trim()||'unidades';
  const min  = parseInt(document.getElementById('inv-min').value)||0;
  const cat  = document.getElementById('inv-cat').value.trim()||'General';
  const subcat = document.getElementById('inv-subcat').value.trim()||null;
  const emoji= document.getElementById('inv-emoji').value.trim()||'📦';
  const editId=parseInt(document.getElementById('edit-inv-id').value);
  if (!name) { showToast('⚠️ El nombre es obligatorio', 'error'); return; }
  if (editId) {
    const inv=state.inventory.find(x=>x.id===editId);
    if (inv) {
      Object.assign(inv,{name,qty,unit,min,cat,subcat,emoji});
      if (supabaseClient) {
        supabaseClient.from('inventory').upsert([inv])
          .then(({ error }) => { if (error) console.error(error); });
      }
    }
    showToast('✅ Insumo actualizado','success');
  } else {
    const newInv = {id:state.nextInvId++,name,qty,unit,min,cat,subcat,emoji};
    state.inventory.push(newInv);
    if (supabaseClient) {
      supabaseClient.from('inventory').insert([newInv])
        .then(({ error }) => { if (error) console.error(error); });
    }
    showToast('✅ Insumo agregado','success');
  }
  closeModal('inv-modal');
  renderInvGrid();
}

function selectInvCategory(cat) {
  adminInvCategorySelected = cat;
  adminInvSubcatSelected = '__subcats__';
  renderInvGrid();
}

function selectInvSubcat(subcat) {
  adminInvSubcatSelected = subcat;
  renderInvGrid();
}

function selectKitchenInvCategory(cat) {
  kitchenInvCategorySelected = cat;
  kitchenInvSubcatSelected = '__subcats__';
  renderKitchenInventory();
}

function selectKitchenInvSubcat(subcat) {
  kitchenInvSubcatSelected = subcat;
  renderKitchenInventory();
}

function resetEndOfDay() {
  if (!confirm('¿Reiniciar datos del día? Esto eliminará pedidos y actividad de hoy.')) return;
  const today = new Date().toLocaleDateString('es-CO');
  const todayOrders = state.orders.filter(o => o.date === today);
  state.orders = state.orders.filter(o => o.date !== today);
  state.nextOrderId = state.orders.length ? Math.max(...state.orders.map(x=>x.id)) + 1 : 1;
  state.currentOrder = [];
  state.selectedTable = null;
  state.activityLog = state.activityLog.filter(l => l.log_date !== today);
  state.nextTableId = state.tables.length ? Math.max(...state.tables.map(x=>x.id)) + 1 : 1;
  kitchenInvCategorySelected = '__categories__';
  adminInvCategorySelected = '__categories__';
  kitchenInvSubcatSelected = '__subcats__';
  adminInvSubcatSelected = '__subcats__';
  meseroCategorySelected = '__categories__';
  adminMenuCategorySelected = '__categories__';
  adminMenuSubcatSelected = '__subcats__';
  state.expandedMenuCategories = {};
  state.editingCategoryIndex = null;
  state.managingCategoryDishesIndex = null;
  if (supabaseClient) {
    supabaseClient.from('orders').delete().eq('date', today)
      .then(({ error }) => { if (error) console.error('Error borrando pedidos de hoy:', error); });
    supabaseClient.from('activity_log').delete().eq('log_date', today)
      .then(({ error }) => { if (error) console.error('Error borrando actividad de hoy:', error); });
  }
  renderAdminVentas();
  renderHistorial();
  renderPersonnel();
  renderTablesGrid();
  renderMenuCards();
  renderPickupAlerts();
  renderKitchenInventory();
  renderInvGrid();
  if (document.getElementById('screen-cocina').classList.contains('active')) renderKitchen();
  if (document.getElementById('screen-mesero').classList.contains('active')) renderPickupAlerts();
  showToast(todayOrders.length ? '🔄 Datos del día reiniciados' : 'ℹ️ No había pedidos de hoy para reiniciar','success');
}

function deleteInv(id) {
  if (!confirm('¿Eliminar este insumo?')) return;
  state.inventory=state.inventory.filter(x=>x.id!==id);
  if (supabaseClient) {
    supabaseClient.from('inventory').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error(error); });
  }
  renderInvGrid();
  showToast('🗑️ Eliminado','success');
}

// ═══════════════════════════════════════════
//  ADMIN – MESAS
// ═══════════════════════════════════════════
function renderTablesGrid() {
  const grid = document.getElementById('tables-grid');
  if (!state.tables.length) { grid.innerHTML=`<div class="empty-state"><div class="icon">🪑</div><p>Sin mesas</p></div>`; return; }
  grid.innerHTML = state.tables.map(t=>{
    const active = state.orders.filter(o=>o.table===t.name && o.payment !== 'paid');
    const occupied = active.length>0;
    const waiters = [...new Set(active.map(a=>a.waiter))].join(', ');
    const ordersList = active.map(a=>`#${a.id}`).join(', ');
    return `
    <div class="card" style="text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">🪑</div>
      <div style="font-size:16px;font-weight:800;color:var(--gray-800);">${t.name} ${occupied?`<div style="margin-top:6px;"><span class="badge" style="background:#FFF0E8;color:var(--orange);">Ocupada</span></div>`:''}</div>
      <div style="font-size:12px;color:var(--gray-400);margin:4px 0;">${t.zone}</div>
      ${t.cap>0?`<div style="font-size:12px;color:var(--orange);font-weight:600;">${t.cap} personas</div>`:''}
      ${occupied?`<div style="font-size:12px;color:var(--gray-600);margin-top:8px;">Mesero(s): <strong>${waiters}</strong><br>Pedidos: ${ordersList}</div>`:''}
      <div style="display:flex;gap:6px;margin-top:12px;justify-content:center;">
        <button class="btn-sm btn-edit" onclick="openTableModal(${t.id})">✏️ Editar</button>
        <button class="btn-sm btn-delete" onclick="deleteTable(${t.id})">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function openTableModal(id) {
  const m = document.getElementById('table-modal');
  if (id) {
    const t=state.tables.find(x=>x.id===id);
    document.getElementById('table-modal-title').textContent='Editar Mesa';
    document.getElementById('edit-table-id').value=id;
    document.getElementById('table-name').value=t.name;
    document.getElementById('table-cap').value=t.cap;
    document.getElementById('table-zone').value=t.zone;
  } else {
    document.getElementById('table-modal-title').textContent='Agregar Mesa';
    ['edit-table-id','table-name','table-cap','table-zone'].forEach(i=>document.getElementById(i).value='');
  }
  m.classList.add('open');
}

function saveTable() {
  const name=document.getElementById('table-name').value.trim();
  const cap=parseInt(document.getElementById('table-cap').value)||0;
  const zone=document.getElementById('table-zone').value.trim()||'Interior';
  const editId=parseInt(document.getElementById('edit-table-id').value);
  if (!name) { showToast('⚠️ El nombre es obligatorio','error'); return; }
  if (editId) {
    const t=state.tables.find(x=>x.id===editId);
    if (t) {
      Object.assign(t,{name,cap,zone});
      if (supabaseClient) {
        supabaseClient.from('tables').upsert([t])
          .then(({ error }) => { if (error) console.error(error); });
      }
    }
    showToast('✅ Mesa actualizada','success');
  } else {
    const newTable = {id:state.nextTableId++,name,cap,zone};
    state.tables.push(newTable);
    if (supabaseClient) {
      supabaseClient.from('tables').insert([newTable])
        .then(({ error }) => { if (error) console.error(error); });
    }
    showToast('✅ Mesa agregada','success');
  }
  closeModal('table-modal');
  renderTablesGrid();
}

function deleteTable(id) {
  if (!confirm('¿Eliminar esta mesa?')) return;
  state.tables=state.tables.filter(x=>x.id!==id);
  if (supabaseClient) {
    supabaseClient.from('tables').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error(error); });
  }
  renderTablesGrid();
  showToast('🗑️ Mesa eliminada','success');
}

// ═══════════════════════════════════════════
//  ADMIN – PERSONAL
// ═══════════════════════════════════════════
async function logActivity(person, role, action, color) {
  const item = { person, role, action, color, time: new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}), log_date: new Date().toLocaleDateString('es-CO') };
  state.activityLog.unshift(item);
  if (state.activityLog.length > 100) state.activityLog.pop();
  if (supabaseClient) {
    const { error } = await supabaseClient.from('activity_log').insert([item]);
    if (error) console.error("Error al registrar actividad en Supabase:", error);
  }
}

function renderPersonnel() {
  const logEl = document.getElementById('personnel-log');
  if (!state.activityLog.length) {
    logEl.innerHTML=`<div class="empty-state" style="padding:24px 0;"><div class="icon">📋</div><p>Sin actividad</p></div>`;
  } else {
    logEl.innerHTML = state.activityLog.slice(0,30).map(l=>`
      <div class="log-item">
        <div class="log-dot" style="background:${l.color};"></div>
        <div style="flex:1;">
          <div class="log-text"><strong>${l.person}</strong> · ${l.action}</div>
        </div>
        <div class="log-time">${l.time}</div>
      </div>`).join('');
  }

  const waiterStats={};
  state.orders.forEach(o=>{ waiterStats[o.waiter]=(waiterStats[o.waiter]||{name:o.waiter,count:0,total:0}); waiterStats[o.waiter].count++; waiterStats[o.waiter].total+=o.total; });
  const wEl=document.getElementById('waiter-stats');
  const ws=Object.values(waiterStats);
  wEl.innerHTML = ws.length ? ws.map(w=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100);">
      <div><div style="font-size:14px;font-weight:700;">${w.name}</div><div style="font-size:11px;color:var(--gray-400);">${w.count} pedido(s)</div></div>
      <div style="font-size:15px;font-weight:800;color:var(--orange);">$${w.total.toLocaleString()}</div>
    </div>`).join('')
    : `<div style="color:var(--gray-400);font-size:13px;padding:12px 0;">Sin actividad de meseros</div>`;

  const kitchenDone=state.orders.filter(o=>o.status==='done'||o.status==='preparing');
  const kEl=document.getElementById('kitchen-stats');
  kEl.innerHTML = kitchenDone.length
    ? `<div style="padding:12px 0;"><span style="font-size:24px;font-weight:900;color:var(--green);">${kitchenDone.length}</span> <span style="font-size:13px;color:var(--gray-400);">órdenes procesadas</span></div>`
    + kitchenDone.slice(0,5).map(o=>`<div style="font-size:12px;padding:6px 0;border-bottom:1px solid var(--gray-100);color:var(--gray-600);">#${o.id} · ${o.table} · ${o.time}</div>`).join('')
    : `<div style="color:var(--gray-400);font-size:13px;padding:12px 0;">Sin actividad de cocina</div>`;
}

// ═══════════════════════════════════════════
//  ADMIN – USUARIOS
// ═══════════════════════════════════════════
function renderUsersGrid() {
  const grid = document.getElementById('users-grid');
  const nonAdmin = state.users.filter(u=>u.role!=='admin');
  if (!nonAdmin.length) { grid.innerHTML=`<div class="empty-state"><div class="icon">👥</div><p>Sin usuarios de personal</p></div>`; return; }
  const roleIcon={mesero:'🧑‍🍽️',cocina:'👨‍🍳'};
  const roleLbl={mesero:'Mesero',cocina:'Cocina'};
  grid.innerHTML = nonAdmin.map(u=>`
    <div class="user-card">
      <div class="user-avatar">${roleIcon[u.role]||'👤'}</div>
      <div class="user-info">
        <div class="user-name">${u.name}</div>
        <div style="font-size:12px;color:var(--gray-400);">@${u.username}</div>
        <span class="user-role-badge role-${u.role}">${roleLbl[u.role]||u.role}</span>
      </div>
      <div class="user-actions">
        <button class="btn-sm btn-edit" onclick="openUserModal(${u.id})">✏️</button>
        <button class="btn-sm btn-delete" onclick="deleteUser(${u.id})">🗑️</button>
      </div>
    </div>`).join('');
}

function openUserModal(id) {
  document.getElementById('user-modal-error').style.display='none';
  const m = document.getElementById('user-modal');
  if (id) {
    const u=state.users.find(x=>x.id===id);
    document.getElementById('user-modal-title').textContent='Editar Usuario';
    document.getElementById('edit-user-id').value=id;
    document.getElementById('user-name').value=u.name;
    document.getElementById('user-role').value=u.role;
    document.getElementById('user-username').value=u.username;
    document.getElementById('user-pass').value=u.pass;
  } else {
    document.getElementById('user-modal-title').textContent='Agregar Usuario';
    ['edit-user-id','user-name','user-username','user-pass'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('user-role').value='mesero';
  }
  m.classList.add('open');
}

function saveUser() {
  const name=document.getElementById('user-name').value.trim();
  const role=document.getElementById('user-role').value;
  const username=document.getElementById('user-username').value.trim().toLowerCase();
  const pass=document.getElementById('user-pass').value;
  const editId=parseInt(document.getElementById('edit-user-id').value);
  const errEl=document.getElementById('user-modal-error');

  if (!name||!username||!pass) { showToast('⚠️ Todos los campos son obligatorios','error'); return; }

  const dup = state.users.find(u => u.username===username && u.id!==(editId||null));
  if (dup) { errEl.style.display='block'; return; }
  errEl.style.display='none';

  if (editId) {
    const u=state.users.find(x=>x.id===editId);
    if (u) {
      Object.assign(u,{name,role,username,pass});
      if (supabaseClient) {
        supabaseClient.from('users').upsert([u])
          .then(({ error }) => { if (error) console.error(error); });
      }
    }
    logActivity(state.currentUser.name,'admin',`Editó usuario @${username} (${role})`,'#6F42C1');
    showToast('✅ Usuario actualizado','success');
  } else {
    const newUser = {id:state.nextUserId++,name,role,username,pass};
    state.users.push(newUser);
    if (supabaseClient) {
      supabaseClient.from('users').insert([newUser])
        .then(({ error }) => { if (error) console.error(error); });
    }
    logActivity(state.currentUser.name,'admin',`Creó usuario @${username} (${role})`,'#6F42C1');
    showToast('✅ Usuario creado','success');
  }
  closeModal('user-modal');
  renderUsersGrid();
}

function deleteUser(id) {
  const u=state.users.find(x=>x.id===id);
  if (!u) return;
  if (!confirm(`¿Eliminar usuario @${u.username}?`)) return;
  state.users=state.users.filter(x=>x.id!==id);
  if (supabaseClient) {
    supabaseClient.from('users').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error(error); });
  }
  logActivity(state.currentUser.name,'admin',`Eliminó usuario @${u.username}`,'#DC3545');
  renderUsersGrid();
  showToast('🗑️ Usuario eliminado','success');
}

// ═══════════════════════════════════════════
//  ADMIN – CATEGORÍAS
// ═══════════════════════════════════════════
function openCatModal() {
  renderCatList();
  document.getElementById('cat-modal').classList.add('open');
}

function renderCatList() {
  const list = document.getElementById('cat-list');
  if (!state.categories.length) {
    list.innerHTML = `<div style="padding:20px;text-align:center;color:var(--gray-400);">No hay categorías creadas aún</div>`;
    return;
  }

  list.innerHTML = state.categories.map((cat, idx) => {
    const subcats = state.menuCategories.filter(mc => mc.parent_cat === cat).map(mc => mc.subcat);
    const showSubcats = state.expandedMenuCategories && state.expandedMenuCategories[cat];
    
    const subcatsHtml = showSubcats ? `
      <div style="background:var(--gray-50);border-radius:8px;padding:10px;margin-top:8px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <input class="form-control" id="new-subcat-input-${idx}" placeholder="Nueva subcategoría (ej: Hamburguesas)" style="flex:1;">
          <button class="btn-sm btn-primary" onclick="addSubcategory('${cat}', ${idx})">+ Agregar</button>
        </div>
        ${subcats.length ? `
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${subcats.map(sc => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--white);border-radius:6px;border-left:3px solid var(--orange);">
                <span style="font-size:13px;font-weight:600;">📂 ${sc}</span>
                <button class="btn-sm btn-delete" onclick="deleteSubcategory('${cat}', '${sc}')">🗑️</button>
              </div>
            `).join('')}
          </div>
        ` : `<div style="color:var(--gray-400);font-size:12px;padding:8px;">Sin subcategorías</div>`}
      </div>
    ` : '';

    const isEditing = state.editingCategoryIndex === idx;
    const catDisplay = isEditing
      ? `<div style="display:flex;gap:8px;align-items:center;flex:1;">
          <input class="form-control" id="edit-cat-input" value="${cat}" style="flex:1;">
          <button class="btn-sm btn-primary" onclick="saveCategoryEdit(${idx})">Guardar</button>
          <button class="btn-sm btn-secondary" onclick="cancelCategoryEdit()">Cancelar</button>
        </div>`
      : `<div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:16px;font-weight:700;">📁 ${cat}</span>
          <span style="font-size:11px;color:var(--gray-400);">(${subcats.length} subcategorías)</span>
        </div>`;

    return `
    <div style="padding:12px 0;border-bottom:1px solid var(--gray-100);">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div style="flex:1;">${catDisplay}</div>
        <div style="display:flex;gap:6px;">
          <button class="btn-sm btn-blue" onclick="toggleMenuCategorySubcats('${cat}')">
            ${showSubcats ? '📂 Ocultar' : '📂 Ver'} subcategorías
          </button>
          ${!isEditing ? `<button class="btn-sm btn-edit" onclick="startEditMenuCategory(${idx})">✏️ Editar</button>` : ''}
          <button class="btn-sm btn-delete" onclick="deleteCategory(${idx})">🗑️</button>
        </div>
      </div>
      ${subcatsHtml}
    </div>`;
  }).join('');
}

function toggleMenuCategorySubcats(cat) {
  if (!state.expandedMenuCategories) state.expandedMenuCategories = {};
  state.expandedMenuCategories[cat] = !state.expandedMenuCategories[cat];
  renderCatList();
}

function addSubcategory(parentCat, idx) {
  const input = document.getElementById(`new-subcat-input-${idx}`);
  const subcat = input.value.trim();
  if (!subcat) { showToast('⚠️ El nombre no puede estar vacío', 'error'); return; }
  
  const existing = state.menuCategories.find(mc => mc.parent_cat === parentCat && mc.subcat === subcat);
  if (existing) { showToast('Ya existe esa subcategoría en esta carpeta', 'error'); return; }
  
  const newMenuCat = { parent_cat: parentCat, subcat: subcat };
  state.menuCategories.push(newMenuCat);
  input.value = '';
  renderCatList();
  showToast('✅ Subcategoría agregada', 'success');
  
  if (supabaseClient) {
    supabaseClient.from('menu_categories').insert([newMenuCat])
      .then(({ error }) => { if (error) console.error(error); });
  }
}

function deleteSubcategory(parentCat, subcat) {
  if (!confirm(`¿Eliminar subcategoría "${subcat}"? Los platos en ella seguirán existiendo pero sin subcategoría.`)) return;
  state.menuCategories = state.menuCategories.filter(mc => !(mc.parent_cat === parentCat && mc.subcat === subcat));
  state.menu.forEach(d => { if (d.cat === parentCat && d.subcat === subcat) d.subcat = null; });
  renderCatList();
  renderAdminMenu();
  renderMenuCards();
  showToast('🗑️ Subcategoría eliminada', 'success');
  
  if (supabaseClient) {
    supabaseClient.from('menu_categories').delete().eq('parent_cat', parentCat).eq('subcat', subcat)
      .then(({ error }) => { if (error) console.error(error); });
    state.menu.forEach(d => {
      if (d.cat === parentCat && d.subcat === subcat) {
        supabaseClient.from('menu').update({ subcat: null }).eq('id', d.id)
          .then(({ error }) => { if (error) console.error(error); });
      }
    });
  }
}

function startEditMenuCategory(idx) {
  state.editingCategoryIndex = idx;
  renderCatList();
}

function cancelCategoryEdit() {
  state.editingCategoryIndex = null;
  renderCatList();
}

function saveCategoryEdit(idx) {
  const val = document.getElementById('edit-cat-input').value.trim();
  if (!val) { showToast('⚠️ La categoría no puede quedar vacía','error'); return; }
  if (state.categories.includes(val) && state.categories[idx] !== val) { showToast('Ya existe esa categoría','error'); return; }
  const oldVal = state.categories[idx];
  state.categories[idx] = val;
  state.editingCategoryIndex = null;
  state.menu.forEach(d => { if (d.cat === oldVal) d.cat = val; });
  state.menuCategories.forEach(mc => { if (mc.parent_cat === oldVal) mc.parent_cat = val; });
  
  renderCatList();
  populateMeseroCat();
  renderDishCatSelect();
  renderAdminMenu();
  renderMenuCards();
  showToast('✅ Categoría actualizada','success');

  if (supabaseClient) {
    supabaseClient.from('categories').update({ name: val }).eq('name', oldVal)
      .then(({ error }) => { if (error) console.error(error); });
    supabaseClient.from('menu').update({ cat: val }).eq('cat', oldVal)
      .then(({ error }) => { if (error) console.error(error); });
    supabaseClient.from('menu_categories').update({ parent_cat: val }).eq('parent_cat', oldVal)
      .then(({ error }) => { if (error) console.error(error); });
  }
}

function addCategory() {
  const val=document.getElementById('new-cat-input').value.trim();
  if (!val) return;
  if (state.categories.includes(val)) { showToast('Ya existe esa categoría','error'); return; }
  state.categories.push(val);
  document.getElementById('new-cat-input').value='';
  renderCatList();
  populateMeseroCat();
  renderDishCatSelect();
  showToast('✅ Categoría agregada','success');

  if (supabaseClient) {
    supabaseClient.from('categories').insert([{ name: val }])
      .then(({ error }) => { if (error) console.error(error); });
  }
}

function deleteCategory(idx) {
  const cat = state.categories[idx];
  if (!confirm(`¿Eliminar categoría "${cat}"? Los platos en ella seguirán existiendo pero sin categoría.`)) return;
  state.categories.splice(idx, 1);
  state.menu.forEach(d => { if (d.cat === cat) { d.cat = ''; d.subcat = null; } });
  state.menuCategories = state.menuCategories.filter(mc => mc.parent_cat !== cat);
  renderCatList();
  populateMeseroCat();
  renderDishCatSelect();
  renderAdminMenu();
  renderMenuCards();
  showToast('🗑️ Categoría eliminada','success');

  if (supabaseClient) {
    supabaseClient.from('categories').delete().eq('name', cat)
      .then(({ error }) => { if (error) console.error(error); });
    supabaseClient.from('menu').update({ cat: '', subcat: null }).eq('cat', cat)
      .then(({ error }) => { if (error) console.error(error); });
    supabaseClient.from('menu_categories').delete().eq('parent_cat', cat)
      .then(({ error }) => { if (error) console.error(error); });
  }
}

function renderDishCatSelect() {
  const sel=document.getElementById('dish-cat');
  if (sel) sel.innerHTML=state.categories.map(c=>`<option>${c}</option>`).join('');
}

function renderDishSubcatSelect() {
  const catInput = document.getElementById('dish-cat');
  const subcatInput = document.getElementById('dish-subcat');
  if (!subcatInput) return;
  const selectedCat = catInput?.value || '';
  const subcats = selectedCat ? state.menuCategories.filter(mc => mc.parent_cat === selectedCat).map(mc => mc.subcat) : [];
  subcatInput.innerHTML = `<option value="">Sin subcategoría</option>` + subcats.map(s => `<option>${s}</option>`).join('');
}

function renderConsumesModal(consumes) {
  const container = document.getElementById('dish-consumes-list');
  container.innerHTML = '';
  consumes.forEach(c => addConsumeRow(c.invId, c.qty));
}

function addConsumeRow(invId, qty) {
  const container = document.getElementById('dish-consumes-list');
  const row = document.createElement('div');
  row.className = 'consume-row';
  row.style.display='flex'; row.style.gap='8px'; row.style.alignItems='center';
  const sel = document.createElement('select');
  sel.className='form-control'; sel.style.flex='1';
  sel.innerHTML = state.inventory.map(i=>`<option value="${i.id}">${i.emoji||''} ${i.name} (${i.unit})</option>`).join('');
  if (invId) sel.value = invId;
  const qin = document.createElement('input'); qin.type='number'; qin.className='form-control'; qin.style.width='100px'; qin.min='0'; qin.step='any'; qin.value = qty||1;
  const btn = document.createElement('button'); btn.className='btn-sm btn-delete'; btn.type='button'; btn.textContent='Eliminar';
  btn.onclick = ()=>{ container.removeChild(row); };
  row.appendChild(sel); row.appendChild(qin); row.appendChild(btn);
  container.appendChild(row);
}

// ═══════════════════════════════════════════
//  CAJA – NUEVO PEDIDO (similar a mesero)
// ═══════════════════════════════════════════
function cajaTab(tab, btn) {
  document.querySelectorAll('#screen-caja .tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  ['ventas','mesas','historial','pedido'].forEach(t=>{
    const el = document.getElementById('caja-tab-'+t);
    if (el) el.style.display = t===tab ? '' : 'none';
  });
  if (tab==='ventas') renderCajaVentas();
  if (tab==='mesas') renderCajaTables();
  if (tab==='historial') renderCajaHistory();
  if (tab==='pedido') renderCajaPedido();
}

function renderCajaPedido() {
  const container = document.getElementById('caja-pedido-container');
  if (!container) return;
  container.innerHTML = `
    <div class="header-bar">
      <div>
        <div class="screen-title">Tomar Pedido 💼</div>
        <div class="screen-subtitle">Selecciona los platos y crea el pedido</div>
      </div>
      <div class="inline-flex">
        <div class="search-bar" style="min-width:200px;"><input type="text" placeholder="Buscar plato..." id="caja-search" oninput="renderCajaMenu()"></div>
      </div>
    </div>

    <div id="caja-cat-nav" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;"></div>

    <div class="grid-2" style="align-items:start;">
      <div id="caja-menu-grid" class="menu-grid"></div>

      <div class="order-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <strong style="font-size:16px;">🛒 Pedido Actual</strong>
          <button class="btn-sm btn-delete" onclick="clearCajaOrder()">Limpiar</button>
        </div>

        <div class="form-group" style="margin-bottom:10px;">
          <label>MESA</label>
          <div class="table-grid" id="caja-table-btn-grid"></div>
          <input type="hidden" id="caja-order-table">
        </div>

        <div class="form-group" style="margin-bottom:10px;">
          <label>NOTAS</label>
          <textarea class="form-control" id="caja-order-notes" rows="2" placeholder="Sin cebolla, alergia..."></textarea>
        </div>

        <div id="caja-order-items-list">
          <div class="empty-state" style="padding:20px 0;">
            <div class="icon">🍽️</div>
            <p>Sin platos</p><small>Selecciona del menú</small>
          </div>
        </div>

        <div class="order-total" id="caja-order-total-section" style="display:none;">
          <span class="total-label">Total</span>
          <span class="total-amount" id="caja-order-total-amount">$0</span>
        </div>

        <button class="btn-send-order" onclick="sendCajaOrder()">📤 Enviar a Cocina</button>
      </div>
    </div>

    <!-- MIS PEDIDOS (Caja) -->
    <div style="margin-top:40px;">
      <div class="header-bar">
        <div>
          <div class="screen-title" style="font-size:18px;">Mis Pedidos 📋</div>
          <div class="screen-subtitle">Pedidos que has creado desde Caja</div>
        </div>
      </div>
      <div id="caja-mis-pedidos"></div>
    </div>
  `;
  if (!window.cajaOrder) window.cajaOrder = { currentOrder: [], selectedTable: null };
  renderCajaTableBtns();
  populateCajaCat();
  renderCajaMenu();
  renderCajaMisPedidos();
}

function renderCajaMisPedidos() {
  const container = document.getElementById('caja-mis-pedidos');
  if (!container) return;
  const misPedidos = state.orders.filter(o => o.waiter_id === state.currentUser?.id);
  // Orden descendente (más reciente primero)
  misPedidos.sort((a, b) => {
    return parseTimeToMinutes(b.time) - parseTimeToMinutes(a.time);
  });
  if (!misPedidos.length) {
    container.innerHTML = `<div class="empty-state" style="padding:20px 0;"><div class="icon">📋</div><p>No has creado pedidos desde Caja</p></div>`;
    return;
  }
  container.innerHTML = misPedidos.map(o => `
    <div class="order-item-card" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid var(--gray-100);">
      <div>
        <strong>#${o.id}</strong> · ${o.table} · ${o.time} · 
        <span class="badge ${o.status==='done'?'badge-success':o.status==='preparing'?'badge-warning':'badge-secondary'}">${o.status}</span>
        <span class="badge ${o.payment==='paid'?'badge-success':'badge-secondary'}">${o.payment}</span>
        <div style="font-size:12px;color:var(--gray-400);">${o.items.map(i=>`${i.qty}× ${i.name}${i.variant?' ('+i.variant+')':''}`).join(', ')}</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn-sm btn-edit" onclick="openEditOrderModal(${o.id})">✏️ Editar</button>
        <button class="btn-sm btn-delete" onclick="deleteOrder(${o.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

function renderCajaTableBtns() {
  const g = document.getElementById('caja-table-btn-grid');
  if (!g) return;
  g.innerHTML = state.tables.map(t => `
    <button class="table-btn ${window.cajaOrder.selectedTable===t.id?'selected':''}" onclick="selectCajaTable(${t.id},'${t.name}')">${t.name}</button>
  `).join('');
}

function selectCajaTable(id, name) {
  window.cajaOrder.selectedTable = id;
  document.getElementById('caja-order-table').value = name;
  renderCajaTableBtns();
}

function populateCajaCat() {
  const nav = document.getElementById('caja-cat-nav');
  if (!nav) return;
  nav.innerHTML = `<button class="btn-sm ${cajaCategorySelected==='all'?'btn-primary':''}" onclick="selectCajaCategory('all')">Ver todo</button>` +
    state.categories.map(c=>`<button class="btn-sm ${cajaCategorySelected===c?'btn-primary':''}" onclick="selectCajaCategory('${c}')">${c}</button>`).join('');
}

function selectCajaCategory(cat) {
  cajaCategorySelected = cat;
  renderCajaMenu();
}

function renderCajaMenu() {
  const search = (document.getElementById('caja-search')?.value||'').toLowerCase().trim();
  const grid = document.getElementById('caja-menu-grid');
  let filtered = state.menu.filter(d => {
    const matchName = d.name.toLowerCase().includes(search);
    const matchCat = cajaCategorySelected === 'all' || d.cat === cajaCategorySelected;
    return matchName && matchCat;
  });
  if (!filtered.length) {
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🔍</div><p>Sin resultados</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(d => menuCardHTML(d, true, 'caja')).join('');
}

function addToCajaOrder(id) {
  const d = state.menu.find(x=>x.id===id);
  if (!d||d.qty===0) return;
  if (d.name.toLowerCase().includes('michelada')) {
    showMicheladaModal(id, 'caja');
    return;
  }
  const order = window.cajaOrder;
  const ex = order.currentOrder.find(i=>i.id===id);
  if (ex) {
    ex.qty++;
  } else {
    order.currentOrder.push({id:d.id, name:d.name, price:d.price, qty:1});
  }
  renderCajaOrderPanel();
  showToast(`✓ ${d.name}`, 'success');
}

function changeCajaQty(id, delta) {
  const order = window.cajaOrder;
  const item = order.currentOrder.find(i=>i.id===id);
  if (!item) return;
  item.qty += delta;
  if (item.qty<=0) order.currentOrder = order.currentOrder.filter(i=>i.id!==id);
  renderCajaOrderPanel();
}

function clearCajaOrder() {
  window.cajaOrder.currentOrder = [];
  renderCajaOrderPanel();
}

function renderCajaOrderPanel() {
  const list = document.getElementById('caja-order-items-list');
  const totSec = document.getElementById('caja-order-total-section');
  const order = window.cajaOrder;
  if (!order.currentOrder.length) {
    list.innerHTML=`<div class="empty-state" style="padding:20px 0;"><div class="icon">🍽️</div><p>Sin platos</p><small>Selecciona del menú</small></div>`;
    totSec.style.display='none'; return;
  }
  const total = order.currentOrder.reduce((s,i)=>s+i.price*i.qty,0);
  list.innerHTML = order.currentOrder.map(item=>`
    <div class="order-item">
      <div class="order-item-name">${item.name}${item.variant ? ` (${item.variant})` : ''}</div>
      <div class="qty-control">
        <button class="qty-btn" onclick="changeCajaQty(${item.id},-1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeCajaQty(${item.id},1)">+</button>
      </div>
      <div class="order-item-price">$${(item.price*item.qty).toLocaleString()}</div>
    </div>`).join('');
  document.getElementById('caja-order-total-amount').textContent='$'+total.toLocaleString();
  totSec.style.display='flex';
}

async function sendCajaOrder() {
  const tableName = document.getElementById('caja-order-table').value;
  const notes = document.getElementById('caja-order-notes').value.trim();
  if (!tableName) { showToast('⚠️ Selecciona una mesa', 'error'); return; }
  const order = window.cajaOrder;
  if (!order.currentOrder.length) { showToast('⚠️ El pedido está vacío', 'error'); return; }
  
  const total = order.currentOrder.reduce((s,i)=>s+i.price*i.qty,0);
  
  const newOrder = {
    id: state.nextOrderId++,
    table: tableName,
    table_name: tableName,
    waiter: state.currentUser.name,
    waiter_id: state.currentUser.id,
    notes,
    items: [...order.currentOrder],
    total,
    status: 'pending',
    payment: 'pending',
    delivered: false,
    time: new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}),
    date: new Date().toLocaleDateString('es-CO'),
    inventoryupdated: false
  };

  const orderForDb = {
    id: newOrder.id,
    table_name: newOrder.table_name,
    waiter: newOrder.waiter,
    waiter_id: newOrder.waiter_id,
    notes: newOrder.notes,
    items: newOrder.items,
    total: newOrder.total,
    status: newOrder.status,
    payment: newOrder.payment,
    delivered: newOrder.delivered,
    time: newOrder.time,
    date: newOrder.date,
    inventoryupdated: newOrder.inventoryupdated
  };

  state.orders.push(newOrder);
  
  order.currentOrder.forEach(oi => {
    const d = state.menu.find(x=>x.id===oi.id);
    if (d) d.qty = Math.max(0, d.qty - oi.qty);
  });

  order.currentOrder = [];
  window.cajaOrder.selectedTable = null;
  document.getElementById('caja-order-notes').value='';
  document.getElementById('caja-order-table').value='';
  
  renderCajaTableBtns();
  renderCajaOrderPanel();
  renderCajaMenu();
  playAlertSound('kitchen');

  if (supabaseClient) {
    const { error } = await supabaseClient.from('orders').insert([orderForDb]);
    if (error) {
      console.error("Error al guardar en Supabase:", error.message);
      showToast('⚠️ Error al sincronizar pedido en la nube', 'error');
    } else {
      showToast('✅ ¡Pedido enviado a cocina en tiempo real!', 'success');
      logActivity(state.currentUser.name,'caja',`Creó pedido #${newOrder.id} – ${newOrder.table_name} ($${newOrder.total.toLocaleString()})`,'#FF6B1A');
      newOrder.items.forEach(oi => {
        const d = state.menu.find(x => x.id === oi.id);
        if (d) {
          supabaseClient.from('menu').update({ qty: d.qty }).eq('id', d.id)
            .then(({ error }) => { if (error) console.error("Error updating menu qty:", error); });
        }
      });
    }
  } else {
    showToast('✅ Guardado localmente (Modo sin internet)', 'success');
  }
  renderCajaVentas();
  renderCajaTables();
  renderCajaMisPedidos();
}

// ═══════════════════════════════════════════
//  CAJA – VENTAS, MESAS, HISTORIAL
// ═══════════════════════════════════════════
function renderCajaVentas() {
  const today = new Date().toLocaleDateString('es-CO');
  const tod = state.orders.filter(o=>o.date===today);
  const total = tod.reduce((s,o)=>s+o.total,0);
  const dishCount = {};
  state.menu.forEach(d=>dishCount[d.name]=0);
  tod.forEach(o=>o.items.forEach(i=>{ dishCount[i.name] = (dishCount[i.name]||0) + i.qty; }));
  const top = Object.entries(dishCount).sort((a,b)=>b[1]-a[1])[0];
  const pendingPayments = tod.filter(o=>o.payment==='pending').length;
  document.getElementById('c-total-sales').textContent = '$'+total.toLocaleString();
  document.getElementById('c-total-orders').textContent = tod.length;
  document.getElementById('c-pending-payments').textContent = pendingPayments;
  document.getElementById('c-top-dish').textContent = top ? top[0] : '–';
  const tbody=document.getElementById('caja-sales-tbody');
  if (!tod.length) { tbody.innerHTML=`<tr><td colspan="10" style="text-align:center;color:var(--gray-400);padding:32px;">Sin pedidos hoy</td></tr>`; return; }
  const sColor={pending:'#FFF8E1',preparing:'#FFF0E8',done:'#E8F5E9'};
  const sText={pending:'⏳ Pendiente',preparing:'🔥 Preparando',done:'✅ Listo'};
  
  tod.sort((a,b) => {
    return parseTimeToMinutes(b.time) - parseTimeToMinutes(a.time);
  });

  tbody.innerHTML = tod.map(o=>{
    const itemsHtml = `<ul style="list-style:none;padding:0;margin:0;">${o.items.map(i=>{
      const unitPrice = i.price || (state.menu.find(m=>m.id===i.id)||{}).price || 0;
      const subtotal = unitPrice * i.qty;
      return `<li style="padding:4px 0;">${i.qty}× ${i.name}${i.variant?' ('+i.variant+')':''} — <small style="color:var(--gray-400);">$${unitPrice.toLocaleString()} c/u</small> <strong style="margin-left:8px;">$${subtotal.toLocaleString()}</strong></li>`;
    }).join('')}</ul>`;
    const deliveryHtml = o.status !== 'done'
      ? `<span class="badge" style="background:var(--gray-100);color:var(--gray-500);">–</span>`
      : o.delivered
        ? `<span class="badge" style="background:#E8F5E9;color:var(--green);">✅ Entregado</span>`
        : `<span class="badge" style="background:#FFF8E1;color:var(--yellow);">⏳ Sin entregar</span>`;
    return `
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>${o.table}</td>
      <td>${o.waiter}</td>
      <td style="font-size:12px;">${itemsHtml}</td>
      <td><strong style="color:var(--orange);">$${o.total.toLocaleString()}</strong></td>
      <td><span class="badge" style="background:${sColor[o.status]};color:var(--gray-800);">${sText[o.status]}</span></td>
      <td><span class="badge ${o.payment==='paid'?'pay-paid':'pay-pending'}">${o.payment==='paid'?'✅ '+(o.payment_method==='transferencia'?'Transferencia':'Efectivo'):'⏳ Pendiente'}</span></td>
      <td>${deliveryHtml}</td>
      <td style="color:var(--gray-400);font-size:12px;">${o.time}</td>
      <td>${o.payment!=='paid'?`<button class="btn-sm btn-green" onclick="openPaymentModal(${o.id})">Cobrar</button>`:''}</td>
    </tr>`;
  }).join('');

  const totalRow = document.createElement('tr');
  totalRow.style.fontWeight = 'bold';
  totalRow.style.borderTop = '2px solid var(--gray-400)';
  totalRow.innerHTML = `<td colspan="4" style="text-align:right;">Total ventas del día</td><td colspan="6" style="color:var(--orange);">$${total.toLocaleString()}</td>`;
  tbody.appendChild(totalRow);
}

function renderCajaTables() {
  const grid = document.getElementById('caja-tables-grid');
  if (!state.tables.length) { grid.innerHTML=`<div class="empty-state"><div class="icon">🪑</div><p>Sin mesas</p></div>`; return; }
  grid.innerHTML = state.tables.map(t=>{
    const active = state.orders.filter(o=>o.table===t.name && o.payment !== 'paid');
    const occupied = active.length>0;
    const waiters = [...new Set(active.map(a=>a.waiter))].join(', ');
    const ordersList = active.map(a=>`#${a.id}`).join(', ');
    return `
    <div class="card" style="text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">🪑</div>
      <div style="font-size:16px;font-weight:800;color:var(--gray-800);">${t.name} ${occupied?`<div style="margin-top:6px;"><span class="badge" style="background:#FFF0E8;color:var(--orange);">Ocupada</span></div>`:''}</div>
      <div style="font-size:12px;color:var(--gray-400);margin:4px 0;">${t.zone}</div>
      ${t.cap>0?`<div style="font-size:12px;color:var(--orange);font-weight:600;">${t.cap} personas</div>`:''}
      ${occupied?`<div style="font-size:12px;color:var(--gray-600);margin-top:8px;">Mesero(s): <strong>${waiters}</strong><br>Pedidos: ${ordersList}</div>`:''}
    </div>`;
  }).join('');
}

function renderCajaHistory() {
  const tbody=document.getElementById('caja-history-tbody');
  if (!state.orders.length) { tbody.innerHTML=`<tr><td colspan="9" style="text-align:center;color:var(--gray-400);padding:32px;">Sin pedidos</td></tr>`; return; }
  const sColor={pending:'#FFF8E1',preparing:'#FFF0E8',done:'#E8F5E9'};
  const sText={pending:'⏳ Pendiente',preparing:'🔥 Preparando',done:'✅ Listo'};
  const sorted = [...state.orders].sort((a,b) => {
    const dateA = a.date.split('/').reverse().join('-');
    const dateB = b.date.split('/').reverse().join('-');
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return parseTimeToMinutes(b.time) - parseTimeToMinutes(a.time);
  });
  tbody.innerHTML = sorted.map(o=>`
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>${o.table}</td>
      <td style="font-size:12px;">${o.waiter}</td>
      <td style="font-size:12px;">${o.items.map(i=>`${i.qty}× ${i.name}${i.variant?' ('+i.variant+')':''}`).join('<br>')}</td>
      <td style="font-size:12px;color:var(--gray-400);">${o.notes||'–'}</td>
      <td><strong style="color:var(--orange);">$${o.total.toLocaleString()}</strong></td>
      <td><span class="badge" style="background:${sColor[o.status]};color:var(--gray-800);">${sText[o.status]}</span></td>
      <td><span class="badge ${o.payment==='paid'?'pay-paid':'pay-pending'}">${o.payment==='paid'?'✅ '+(o.payment_method==='transferencia'?'Transferencia':'Efectivo'):'⏳ Pendiente'}</span></td>
      <td style="color:var(--gray-400);font-size:11px;">${o.date}<br>${o.time}</td>
    </tr>`).join('');
}

// ═══════════════════════════════════════════
//  ADMIN – HISTORIAL
// ═══════════════════════════════════════════
function renderHistorial() {
  const tbody=document.getElementById('history-tbody');
  if (!state.orders.length) { tbody.innerHTML=`<tr><td colspan="9" style="text-align:center;color:var(--gray-400);padding:32px;">Sin pedidos</td></tr>`; return; }
  const sColor={pending:'#FFF8E1',preparing:'#FFF0E8',done:'#E8F5E9'};
  const sText={pending:'⏳ Pendiente',preparing:'🔥 Preparando',done:'✅ Listo'};
  const sorted = [...state.orders].sort((a,b) => {
    const dateA = a.date.split('/').reverse().join('-');
    const dateB = b.date.split('/').reverse().join('-');
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return parseTimeToMinutes(b.time) - parseTimeToMinutes(a.time);
  });
  tbody.innerHTML = sorted.map(o=>`
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>${o.table}</td>
      <td style="font-size:12px;">${o.waiter}</td>
      <td style="font-size:12px;">${o.items.map(i=>`${i.qty}× ${i.name}${i.variant?' ('+i.variant+')':''}`).join('<br>')}</td>
      <td style="font-size:12px;color:var(--gray-400);">${o.notes||'–'}</td>
      <td><strong style="color:var(--orange);">$${o.total.toLocaleString()}</strong></td>
      <td><span class="badge" style="background:${sColor[o.status]};color:var(--gray-800);">${sText[o.status]}</span></td>
      <td><span class="badge ${o.payment==='paid'?'pay-paid':'pay-pending'}">${o.payment==='paid'?'✅ Pagado':'⏳ Pendiente'}</span></td>
      <td style="color:var(--gray-400);font-size:11px;">${o.date}<br>${o.time}</td>
    </tr>`).join('');

  const today = new Date().toLocaleDateString('es-CO');
  const total = state.orders.filter(o=>o.date===today).reduce((s,o)=>s+o.total,0);
  const totalRow = document.createElement('tr');
  totalRow.style.fontWeight = 'bold';
  totalRow.style.borderTop = '2px solid var(--gray-400)';
  totalRow.innerHTML = `<td colspan="5" style="text-align:right;">Total ventas del día</td><td colspan="4" style="color:var(--orange);">$${total.toLocaleString()}</td>`;
  tbody.appendChild(totalRow);
}

// ═══════════════════════════════════════════
//  MENU MODAL
// ═══════════════════════════════════════════
function openMenuModal(id) {
  renderDishCatSelect();
  const m=document.getElementById('menu-modal');
  if (id) {
    const d=state.menu.find(x=>x.id===id);
    document.getElementById('menu-modal-title').textContent='Editar Plato';
    document.getElementById('edit-dish-id').value=id;
    document.getElementById('dish-name').value=d.name;
    document.getElementById('dish-price').value=d.price;
    document.getElementById('dish-qty').value=d.qty;
    document.getElementById('dish-cat').value=d.cat;
    renderDishSubcatSelect();
    document.getElementById('dish-subcat').value=d.subcat||'';
    document.getElementById('dish-desc').value=d.desc;
    document.getElementById('dish-emoji').value=d.emoji||'';
    renderConsumesModal(d.consumes||[]);
  } else {
    document.getElementById('menu-modal-title').textContent='Agregar Plato';
    document.getElementById('edit-dish-id').value='';
    ['dish-name','dish-price','dish-qty','dish-desc','dish-emoji'].forEach(i=>document.getElementById(i).value='');
    document.getElementById('dish-cat').value='';
    renderDishSubcatSelect();
    document.getElementById('dish-subcat').value='';
    renderConsumesModal([]);
  }
  m.classList.add('open');
}

function saveDish() {
  const name=document.getElementById('dish-name').value.trim();
  const price=parseInt(document.getElementById('dish-price').value);
  const qty=parseInt(document.getElementById('dish-qty').value);
  const cat=document.getElementById('dish-cat').value;
  const subcat=document.getElementById('dish-subcat').value.trim()||null;
  const desc=document.getElementById('dish-desc').value.trim();
  const emoji=document.getElementById('dish-emoji').value.trim()||'🍽️';
  const editId=parseInt(document.getElementById('edit-dish-id').value);
  if (!name||isNaN(price)||isNaN(qty)) { showToast('⚠️ Nombre, precio y cantidad son obligatorios','error'); return; }
  const consumes = [];
  document.querySelectorAll('#dish-consumes-list .consume-row').forEach(r=>{
    const invId = parseInt(r.querySelector('select')?.value);
    const cqty = parseFloat(r.querySelector('input')?.value) || 0;
    const inv = state.inventory.find(x=>x.id===invId);
    if (inv && cqty>0) consumes.push({ invId: inv.id, name: inv.name, qty: cqty });
  });
  if (editId) {
    const d=state.menu.find(x=>x.id===editId);
    if (d) {
      Object.assign(d,{name,price,qty,cat,subcat,desc,emoji,consumes});
      if (supabaseClient) {
        supabaseClient.from('menu').upsert([d])
          .then(({ error }) => { if (error) console.error(error); });
      }
    }
    showToast('✅ Plato actualizado','success');
  } else {
    const newDish = {id:state.nextMenuId++,name,price,qty,cat,subcat,desc,emoji,consumes};
    state.menu.push(newDish);
    if (supabaseClient) {
      supabaseClient.from('menu').insert([newDish])
        .then(({ error }) => { if (error) console.error(error); });
    }
    showToast('✅ Plato agregado','success');
  }
  closeModal('menu-modal');
  renderAdminMenu();
  populateMeseroCat();
  renderMenuCards();
}

function deleteDish(id) {
  if (!confirm('¿Eliminar este plato?')) return;
  state.menu=state.menu.filter(x=>x.id!==id);
  if (supabaseClient) {
    supabaseClient.from('menu').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error(error); });
  }
  renderAdminMenu();
  renderMenuCards();
  showToast('🗑️ Plato eliminado','success');
}

// ═══════════════════════════════════════════
//  MODAL HELPERS
// ═══════════════════════════════════════════
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) { if(e.target===this) this.classList.remove('open'); });
});

// ═══════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════
let toastTimer;
function showToast(msg, type='') {
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.className='toast show '+type;
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>t.className='toast',2800);
}

// ============================================================================
//   INTEGRACIÓN FINAL: EXPOSICIÓN GLOBAL Y TIEMPO REAL
// ============================================================================

if (typeof window !== 'undefined') {
  window.selectRole = selectRole;
  window.doLogin = doLogin;
  window.doLogout = doLogout;
  window.activateScreen = activateScreen;
  window.markDelivered = markDelivered;
  window.selectTable = selectTable;
  window.addToOrder = addToOrder;
  window.changeQty = changeQty;
  window.clearOrder = clearOrder;
  window.sendOrder = sendOrder;
  window.setOrderStatus = setOrderStatus;
  window.adminTab = adminTab;
  window.openInvModal = openInvModal;
  window.saveInv = saveInv;
  window.deleteInv = deleteInv;
  window.openTableModal = openTableModal;
  window.saveTable = saveTable;
  window.deleteTable = deleteTable;
  window.openUserModal = openUserModal;
  window.saveUser = saveUser;
  window.deleteUser = deleteUser;
  window.openCatModal = openCatModal;
  window.startEditCategory = startEditMenuCategory;
  window.cancelCategoryEdit = cancelCategoryEdit;
  window.saveCategoryEdit = saveCategoryEdit;
  window.addCategory = addCategory;
  window.deleteCategory = deleteCategory;
  window.openMenuModal = openMenuModal;
  window.saveDish = saveDish;
  window.deleteDish = deleteDish;
  window.openPaymentModal = openPaymentModal;
  window.confirmPayment = confirmPayment;
  window.cajaTab = cajaTab;
  window.selectInvCategory = selectInvCategory;
  window.selectInvSubcat = selectInvSubcat;
  window.selectKitchenInvCategory = selectKitchenInvCategory;
  window.selectKitchenInvSubcat = selectKitchenInvSubcat;
  window.selectMeseroCategory = selectMeseroCategory;
  window.resetEndOfDay = resetEndOfDay;
  window.renderKitchen = renderKitchen;
  window.renderAdminMenu = renderAdminMenu;
  window.renderMenuCards = renderMenuCards;
  window.renderDishCatSelect = renderDishCatSelect;
  window.renderDishSubcatSelect = renderDishSubcatSelect;
  window.toggleMenuCategorySubcats = toggleMenuCategorySubcats;
  window.addSubcategory = addSubcategory;
  window.deleteSubcategory = deleteSubcategory;
  window.startEditMenuCategory = startEditMenuCategory;
  window.closeModal = closeModal;
  window.addConsumeRow = addConsumeRow;
  // Mesero
  window.renderMeseroPedidos = renderMeseroPedidos;
  window.openEditOrderModal = openEditOrderModal;
  window.saveEditOrder = saveEditOrder;
  window.deleteOrder = deleteOrder;
  window.updateEditItemQtyByIndex = updateEditItemQtyByIndex;
  window.removeEditItemByIndex = removeEditItemByIndex;
  window.openEditAddDishModal = openEditAddDishModal;
  window.selectEditTable = selectEditTable;
  window.renderEditTableGrid = renderEditTableGrid;
  window.renderEditOrderItems = renderEditOrderItems;
  window.populateEditDishCategories = populateEditDishCategories;
  window.filterEditDishMenu = filterEditDishMenu;
  window.renderEditDishMenu = renderEditDishMenu;
  window.addDishToEditOrder = addDishToEditOrder;
  // Caja
  window.renderCajaPedido = renderCajaPedido;
  window.selectCajaTable = selectCajaTable;
  window.addToCajaOrder = addToCajaOrder;
  window.changeCajaQty = changeCajaQty;
  window.clearCajaOrder = clearCajaOrder;
  window.sendCajaOrder = sendCajaOrder;
  window.selectCajaCategory = selectCajaCategory;
  window.renderCajaMenu = renderCajaMenu;
  window.populateCajaCat = populateCajaCat;
  window.renderCajaMisPedidos = renderCajaMisPedidos;
  // Michelada modal
  window.showMicheladaModal = showMicheladaModal;
  window.selectMicheladaVariant = selectMicheladaVariant;
}

// 2. LISTENERS REALTIME
function activarListenersTiempoReal() {
  if (!supabaseClient) return;
  supabaseClient
    .channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      const table = payload.table;
      console.log(`¡Cambio en la tabla ${table} en la nube!`, payload);
      let reloadPromise;
      if (table === 'menu') reloadPromise = loadMenu();
      else if (table === 'inventory') reloadPromise = loadInventory();
      else if (table === 'users') reloadPromise = loadUsers();
      else if (table === 'tables') reloadPromise = loadTables();
      else if (table === 'orders') reloadPromise = loadOrders();
      else if (table === 'activity_log') reloadPromise = loadActivityLog();
      else if (table === 'categories') reloadPromise = loadCategories();
      else return;
      reloadPromise.then(() => refreshUIForTable(table));
    })
    .subscribe();
}

function refreshUIForTable(table) {
  if (!state.currentUser) return;
  const role = state.currentUser.role;
  if (table === 'orders') {
    if (role === 'mesero') {
      renderPickupAlerts();
      renderTableBtns();
      renderMeseroPedidos();
    } else if (role === 'cocina') {
      renderKitchen();
    } else if (role === 'admin') {
      renderAdminVentas();
      renderHistorial();
      renderTablesGrid();
      renderPersonnel();
    } else if (role === 'caja') {
      renderCajaVentas();
      renderCajaTables();
      renderCajaHistory();
      renderCajaMisPedidos();
    }
  } else if (table === 'menu') {
    if (role === 'mesero') {
      renderMenuCards();
    } else if (role === 'admin') {
      renderAdminMenu();
    }
  } else if (table === 'inventory') {
    if (role === 'cocina') {
      renderKitchenInventory();
    } else if (role === 'admin') {
      renderInvGrid();
      renderAdminVentas();
    }
  } else if (table === 'tables') {
    if (role === 'mesero') {
      renderTableBtns();
    } else if (role === 'admin') {
      renderTablesGrid();
    } else if (role === 'caja') {
      renderCajaTables();
    }
  } else if (table === 'users') {
    if (role === 'admin') renderUsersGrid();
  } else if (table === 'activity_log') {
    if (role === 'admin') renderPersonnel();
  } else if (table === 'categories') {
    populateMeseroCat();
    renderDishCatSelect();
    if (role === 'mesero') renderMenuCards();
    else if (role === 'admin') renderAdminMenu();
  } else if (table === 'menu_categories') {
    if (role === 'mesero') renderMenuCards();
    else if (role === 'admin') renderAdminMenu();
  }
}