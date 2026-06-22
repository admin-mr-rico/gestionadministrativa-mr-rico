// ═══════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════
const state = {
  currentUser: null,
  users: [
    { id: 1, name: 'Administrador', username: 'admin', pass: '12345', role: 'admin' },
    { id: 2, name: 'Mesero Demo',   username: 'mesero', pass: '12345', role: 'mesero' },
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
let supabaseClient = null;

// Leemos las variables directamente (de env.js o window.env en Vercel)
const SUPABASE_URL = window.SUPABASE_URL || window.env?.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || window.env?.SUPABASE_ANON_KEY;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    // Usamos window.supabase para asegurarnos de llamar a la librería de la CDN
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    initSupabase();
    console.log("¡Supabase configurado correctamente!");
  } catch (e) {
    console.warn('Error al inicializar Supabase:', e);
  }
} else {
  console.warn('Supabase no configurado en window.SUPABASE_URL ni en window.env. Revisa las variables de entorno.');
}

async function initSupabase() {
  await loadInitialState();
  
  activarListenersTiempoReal();
}

async function loadInitialState() {
  if (!supabaseClient) return;
  try {
    await loadMenu();
    await loadInventory();
    await loadUsers();
    await loadTables();
    await loadOrders();
    await loadActivityLog();
    await loadCategories();

    // Hacemos sembrado inicial (seed) sólo de lo que falte en Supabase
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
  // Traer los 100 más recientes
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

async function checkAndSeedDatabase() {
  if (!supabaseClient) return;
  try {
    // 1. Menu
    const { data: remoteMenu } = await supabaseClient.from('menu').select('id');
    if (remoteMenu && remoteMenu.length === 0 && state.menu.length > 0) {
      await supabaseClient.from('menu').insert(state.menu);
    }
    // 2. Inventory
    const { data: remoteInventory } = await supabaseClient.from('inventory').select('id');
    if (remoteInventory && remoteInventory.length === 0 && state.inventory.length > 0) {
      await supabaseClient.from('inventory').insert(state.inventory);
    }
    // 3. Users
    const { data: remoteUsers } = await supabaseClient.from('users').select('id');
    if (remoteUsers && remoteUsers.length === 0 && state.users.length > 0) {
      await supabaseClient.from('users').insert(state.users);
    }
    // 4. Tables
    const { data: remoteTables } = await supabaseClient.from('tables').select('id');
    if (remoteTables && remoteTables.length === 0 && state.tables.length > 0) {
      await supabaseClient.from('tables').insert(state.tables);
    }
    // 5. Categories
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
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');

  let user;
  if (selectedRole === 'admin') {
    user = state.users.find(x => x.role === 'admin' && x.username === u && x.pass === p);
  } else {
    user = state.users.find(x => x.role === selectedRole && x.username === u && x.pass === p);
  }

  if (!user) { err.style.display='block'; return; }
  err.style.display='none';
  state.currentUser = user;

  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('header-user-badge').textContent = user.name;
  const labels = { mesero:'· Mesero', cocina:'· Cocina', admin:'· Administración' };
  document.getElementById('header-role-label').textContent = labels[user.role];

  logActivity(user.name, user.role, 'Inició sesión', '#FF6B1A');
  activateScreen(user.role);
}

function doLogout() {
  if (state.currentUser) logActivity(state.currentUser.name, state.currentUser.role, 'Cerró sesión', '#9E9E9E');
  state.currentUser = null;
  state.currentOrder = [];
  state.selectedTable = null;
  document.getElementById('login-user').value='';
  document.getElementById('login-pass').value='';
  document.getElementById('app').style.display='none';
  document.getElementById('login-screen').style.display='flex';
}

document.getElementById('login-pass').addEventListener('keydown', e => { if(e.key==='Enter') doLogin(); });

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
  } else if (role === 'cocina') {
    document.getElementById('screen-cocina').classList.add('active');
    renderKitchen();
    renderKitchenInventory();
    if (!window._kitchenTimer) window._kitchenTimer = setInterval(() => { renderKitchen(); renderKitchenInventory(); }, 20000);
  } else if (role === 'admin') {
    document.getElementById('screen-admin').classList.add('active');
    renderAdminVentas();
    renderAdminMenu();
  }
}

// ═══════════════════════════════════════════
//  MESERO – PICKUP ALERTS
// ═══════════════════════════════════════════
function renderPickupAlerts() {
  const readyOrders = state.orders.filter(o => o.status === 'done' && !o.delivered);
  const sec = document.getElementById('pickup-section');
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
      supabaseClient.from('orders').update({ delivered: true }).eq('id', id).catch(e => console.error(e));
    }
  }
  renderPickupAlerts();
  showToast(`✅ Pedido #${id} entregado`, 'success');
}

// Auto refresh for mesero pickup alerts
setInterval(() => { if (state.currentUser?.role === 'mesero') renderPickupAlerts(); }, 10000);

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
  const cats = ['', ...state.categories];
  const sel = document.getElementById('mesero-cat');
  sel.innerHTML = `<option value="">Todas las categorías</option>` + state.categories.map(c=>`<option>${c}</option>`).join('');
}

function renderMenuCards() {
  const search = (document.getElementById('mesero-search')?.value||'').toLowerCase();
  const cat    = document.getElementById('mesero-cat')?.value||'';
  let filtered = state.menu.filter(d => {
    const ms = !search || d.name.toLowerCase().includes(search) || d.desc.toLowerCase().includes(search);
    const mc = !cat || d.cat===cat;
    return ms && mc;
  });
  const grid = document.getElementById('menu-cards-grid');
  if (!filtered.length) {
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🔍</div><p>Sin resultados</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(d => menuCardHTML(d, true)).join('');
}

function menuCardHTML(d, forOrder=false) {
  const sk = d.qty>5?'stock-ok':d.qty>0?'stock-low':'stock-out';
  const sl = d.qty>5?`${d.qty} disp.`:d.qty>0?`Solo ${d.qty}`:'Agotado';
  const dis = d.qty===0 ? 'style="opacity:.5;pointer-events:none;"' : '';
  const actions = forOrder
    ? `<button class="btn-sm btn-add-order" onclick="addToOrder(${d.id})">+ Agregar</button>`
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
function addToOrder(id) {
  const d = state.menu.find(x=>x.id===id);
  if (!d||d.qty===0) return;
  const ex = state.currentOrder.find(i=>i.id===id);
  if (ex) ex.qty++; else state.currentOrder.push({id:d.id,name:d.name,price:d.price,qty:1});
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
      <div class="order-item-name">${item.name}</div>
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
    table_name: tableName, // Corregido para que coincida con tu columna SQL de Supabase
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
    inventoryUpdated: false
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

  // Enviar directamente a la base de datos en la nube
  if (supabaseClient) {
    const { error } = await supabaseClient
      .from('orders')
      .insert([order]);

    if (error) {
      console.error("Error al guardar en Supabase:", error.message);
      showToast('⚠️ Error al sincronizar pedido en la nube', 'error');
    } else {
      showToast('✅ ¡Pedido enviado a cocina en tiempo real!', 'success');
      logActivity(state.currentUser.name,'mesero',`Creó pedido #${order.id} – ${order.table_name} ($${order.total.toLocaleString()})`,'#FF6B1A');
      
      // Actualizar el stock de los platos en Supabase de forma inmediata
      order.items.forEach(oi => {
        const d = state.menu.find(x => x.id === oi.id);
        if (d) {
          supabaseClient.from('menu').update({ qty: d.qty }).eq('id', d.id).catch(e => console.error("Error updating menu qty:", e));
        }
      });
    }
  } else {
    renderTablesGrid();
    showToast('✅ Guardado localmente (Modo sin internet)', 'success');
  }
}

// ═══════════════════════════════════════════
//  COCINA
// ═══════════════════════════════════════════
function renderKitchen() {
  const filter = document.getElementById('kitchen-filter').value;
  const orders = state.orders.filter(o=>!filter||o.status===filter);
  document.getElementById('k-pending').textContent   = state.orders.filter(o=>o.status==='pending').length;
  document.getElementById('k-preparing').textContent = state.orders.filter(o=>o.status==='preparing').length;
  document.getElementById('k-done').textContent      = state.orders.filter(o=>o.status==='done').length;
  const grid = document.getElementById('kitchen-grid');
  if (!orders.length) {
    grid.innerHTML=`<div class="empty-state" style="grid-column:1/-1;"><div class="icon">🍳</div><p>Sin órdenes</p></div>`; return;
  }
  const sClass={pending:'',preparing:'preparing',done:'done'};
  const sLabel={pending:'Pendiente',preparing:'Preparando',done:'Listo'};
  const sBadge={pending:'status-pending',preparing:'status-preparing',done:'status-done'};
  grid.innerHTML = [...orders].reverse().map(o=>`
    <div class="kitchen-card ${sClass[o.status]}">
      <div class="kitchen-card-header">
        <div>
          <div class="kitchen-table">${o.table} <span style="font-size:11px;font-weight:400;color:var(--gray-400);">#${o.id}</span></div>
          <div class="kitchen-time">${o.time} · ${o.waiter}</div>
        </div>
        <span class="kitchen-status ${sBadge[o.status]}">${sLabel[o.status]}</span>
      </div>
      <div class="kitchen-items">${o.items.map(i=>`<div class="kitchen-item"><div><span class="kitchen-item-qty">×${i.qty}</span>${i.name}</div></div>`).join('')}</div>
      ${o.notes?`<div class="kitchen-notes">📝 ${o.notes}</div>`:''}
      <div class="kitchen-actions">${kitchenActionBtns(o)}</div>
    </div>`).join('');
}

function kitchenActionBtns(o) {
  if (o.status==='pending')    return `<button class="btn-status btn-preparing" onclick="setOrderStatus(${o.id},'preparing')">🔥 Preparar</button>`;
  if (o.status==='preparing')  return `<button class="btn-status btn-done" onclick="setOrderStatus(${o.id},'done')">✅ Listo</button>`;
  return `<span style="font-size:12px;color:var(--green);font-weight:700;">✅ Entregado al mesero</span>`;
}

function setOrderStatus(id, status) {
  const o = state.orders.find(x=>x.id===id);
  if (!o) return;
  const prev = o.status;
  o.status = status;
  const lbl = {preparing:'comenzó preparación de',done:'marcó como listo el'};
  logActivity(state.currentUser.name,'cocina',`${lbl[status]||'actualizó'} pedido #${o.id} (${o.table})`,'#FF6B1A');
  if (status === 'done' && !o.inventoryUpdated) {
    updateInventoryForOrder(o);
  }
  renderKitchen();
  showToast(status==='done'?'✅ Pedido listo – mesero notificado':'🔥 Preparando pedido', 'success');

  // Guardar en Supabase de forma inmediata
  if (supabaseClient) {
    supabaseClient
      .from('orders')
      .update({ status: status, inventoryUpdated: o.inventoryUpdated })
      .eq('id', id)
      .catch(e => console.error("Error al actualizar estado en Supabase:", e));
  }
}

function updateInventoryForOrder(order) {
  if (!order || order.inventoryUpdated) return;
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
            supabaseClient.from('inventory').update({ qty: inv.qty }).eq('id', inv.id).catch(e => console.error(e));
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
          supabaseClient.from('inventory').update({ qty: inv.qty }).eq('id', inv.id).catch(e => console.error(e));
        }
      }
    }
  });
  order.inventoryUpdated = true;
  renderInvGrid();
  renderKitchenInventory();
  renderAdminVentas();
  renderTablesGrid();
}

function renderKitchenInventory() {
  const el = document.getElementById('kitchen-inventory');
  el.innerHTML = state.inventory.map(inv=>{
    const pct = Math.min(100, Math.round((inv.qty/Math.max(inv.qty,inv.min*2))*100));
    const color = inv.qty>inv.min ? 'var(--green)' : inv.qty>0 ? 'var(--yellow)' : 'var(--red)';
    return `<div style="background:var(--gray-50);border-radius:8px;padding:10px 12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:12px;font-weight:600;">${inv.emoji} ${inv.name}</span>
        <span style="font-size:13px;font-weight:800;color:${color};">${inv.qty} ${inv.unit}</span>
      </div>
      <div class="inv-bar"><div class="inv-bar-fill" style="width:${pct}%;background:${color};"></div></div>
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
  const top = Object.entries(dishCount).sort((a,b)=>b[1]-a[1])[0];
  const least = Object.entries(dishCount).sort((a,b)=>a[1]-b[1])[0];

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
  if (!tod.length) { tbody.innerHTML=`<tr><td colspan="9" style="text-align:center;color:var(--gray-400);padding:32px;">Sin pedidos hoy</td></tr>`; return; }
  const sColor={pending:'#FFF8E1',preparing:'#FFF0E8',done:'#E8F5E9'};
  const sText={pending:'⏳ Pendiente',preparing:'🔥 Preparando',done:'✅ Listo'};

  tbody.innerHTML = [...tod].reverse().map(o=>{
    const itemsHtml = `<ul style="list-style:none;padding:0;margin:0;">${o.items.map(i=>{
      const unitPrice = i.price || (state.menu.find(m=>m.id===i.id)||{}).price || 0;
      const subtotal = unitPrice * i.qty;
      return `<li style="padding:4px 0;">${i.qty}× ${i.name} — <small style="color:var(--gray-400);">$${unitPrice.toLocaleString()} c/u</small> <strong style="margin-left:8px;">$${subtotal.toLocaleString()}</strong></li>`;
    }).join('')}</ul>`;

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
      <td style="color:var(--gray-400);font-size:12px;">${o.time}</td>
      <td>
        ${o.payment!=='paid'?`<button class="btn-sm btn-green" onclick="markPaid(${o.id})">Marcar Pagado</button>`:''}
      </td>
    </tr>`;
  }).join('');
}

function markPaid(id) {
  const o = state.orders.find(x=>x.id===id);
  if (o) {
    o.payment='paid';
    logActivity(state.currentUser.name,'admin',`Marcó pedido #${o.id} como PAGADO ($${o.total.toLocaleString()})`,'#28A745');
    if (supabaseClient) {
      supabaseClient.from('orders').update({ payment: 'paid' }).eq('id', id).catch(e => console.error(e));
    }
  }
  renderAdminVentas();
  renderTablesGrid();
  showToast('💰 Pedido marcado como pagado', 'success');
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
  if (!state.inventory.length) { grid.innerHTML=`<div class="empty-state"><div class="icon">📦</div><p>Sin insumos</p></div>`; return; }
  grid.innerHTML = state.inventory.map(inv=>{
    const pct = Math.min(100, Math.round((inv.qty/Math.max(inv.qty,inv.min*2))*100));
    const color = inv.qty>inv.min ? 'var(--green)' : inv.qty>0 ? 'var(--yellow)' : 'var(--red)';
    const label = inv.qty>inv.min ? 'OK' : inv.qty>0 ? 'Bajo' : 'Agotado';
    return `<div class="inv-card" style="flex-direction:column;align-items:stretch;gap:8px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:32px;">${inv.emoji}</span>
        <div style="flex:1;">
          <div class="inv-name">${inv.name}</div>
          <div class="inv-cat">${inv.cat}</div>
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
    document.getElementById('inv-emoji').value=inv.emoji||'';
  } else {
    document.getElementById('inv-modal-title').textContent='Agregar Insumo';
    document.getElementById('edit-inv-id').value='';
    ['inv-name','inv-qty','inv-unit','inv-min','inv-cat','inv-emoji'].forEach(i=>document.getElementById(i).value='');
  }
  m.classList.add('open');
}

function saveInv() {
  const name = document.getElementById('inv-name').value.trim();
  const qty  = parseInt(document.getElementById('inv-qty').value)||0;
  const unit = document.getElementById('inv-unit').value.trim()||'unidades';
  const min  = parseInt(document.getElementById('inv-min').value)||0;
  const cat  = document.getElementById('inv-cat').value.trim()||'General';
  const emoji= document.getElementById('inv-emoji').value.trim()||'📦';
  const editId=parseInt(document.getElementById('edit-inv-id').value);
  if (!name) { showToast('⚠️ El nombre es obligatorio', 'error'); return; }
  if (editId) {
    const inv=state.inventory.find(x=>x.id===editId);
    if (inv) {
      Object.assign(inv,{name,qty,unit,min,cat,emoji});
      if (supabaseClient) {
        supabaseClient.from('inventory').upsert([inv]).catch(e => console.error(e));
      }
    }
    showToast('✅ Insumo actualizado','success');
  } else {
    const newInv = {id:state.nextInvId++,name,qty,unit,min,cat,emoji};
    state.inventory.push(newInv);
    if (supabaseClient) {
      supabaseClient.from('inventory').insert([newInv]).catch(e => console.error(e));
    }
    showToast('✅ Insumo agregado','success');
  }
  closeModal('inv-modal');
  renderInvGrid();
}

function deleteInv(id) {
  if (!confirm('¿Eliminar este insumo?')) return;
  state.inventory=state.inventory.filter(x=>x.id!==id);
  if (supabaseClient) {
    supabaseClient.from('inventory').delete().eq('id', id).catch(e => console.error(e));
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
        supabaseClient.from('tables').upsert([t]).catch(e => console.error(e));
      }
    }
    showToast('✅ Mesa actualizada','success');
  } else {
    const newTable = {id:state.nextTableId++,name,cap,zone};
    state.tables.push(newTable);
    if (supabaseClient) {
      supabaseClient.from('tables').insert([newTable]).catch(e => console.error(e));
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
    supabaseClient.from('tables').delete().eq('id', id).catch(e => console.error(e));
  }
  renderTablesGrid();
  showToast('🗑️ Mesa eliminada','success');
}

// ═══════════════════════════════════════════
//  ADMIN – PERSONAL
// ═══════════════════════════════════════════
function logActivity(person, role, action, color) {
  const item = { person, role, action, color, time: new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}) };
  state.activityLog.unshift(item);
  if (state.activityLog.length > 100) state.activityLog.pop();
  if (supabaseClient) {
    supabaseClient.from('activity_log').insert([item]).catch(e => console.error("Error al registrar actividad en Supabase:", e));
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
        supabaseClient.from('users').upsert([u]).catch(e => console.error(e));
      }
    }
    logActivity(state.currentUser.name,'admin',`Editó usuario @${username} (${role})`,'#6F42C1');
    showToast('✅ Usuario actualizado','success');
  } else {
    const newUser = {id:state.nextUserId++,name,role,username,pass};
    state.users.push(newUser);
    if (supabaseClient) {
      supabaseClient.from('users').insert([newUser]).catch(e => console.error(e));
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
    supabaseClient.from('users').delete().eq('id', id).catch(e => console.error(e));
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
  document.getElementById('cat-list').innerHTML = state.categories.map((c,i)=>{
    if (state.editingCategoryIndex === i) {
      return `
      <div style="display:flex;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100);">
        <input class="form-control" id="edit-cat-input" value="${c}">
        <button class="btn-sm btn-primary" onclick="saveCategoryEdit(${i})">Guardar</button>
        <button class="btn-sm btn-secondary" onclick="cancelCategoryEdit()">Cancelar</button>
      </div>`;
    }
    return `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--gray-100);">
      <span style="font-size:14px;font-weight:600;">🏷️ ${c}</span>
      <div style="display:flex;gap:6px;">
        <button class="btn-sm btn-edit" onclick="startEditCategory(${i})">✏️ Editar</button>
        <button class="btn-sm btn-delete" onclick="deleteCategory(${i})">Eliminar</button>
      </div>
    </div>`;
  }).join('');
}

function startEditCategory(i) {
  state.editingCategoryIndex = i;
  renderCatList();
}

function cancelCategoryEdit() {
  state.editingCategoryIndex = null;
  renderCatList();
}

function saveCategoryEdit(i) {
  const val = document.getElementById('edit-cat-input').value.trim();
  if (!val) { showToast('⚠️ La categoría no puede quedar vacía','error'); return; }
  if (state.categories.includes(val) && state.categories[i] !== val) { showToast('Ya existe esa categoría','error'); return; }
  const oldVal = state.categories[i];
  state.categories[i] = val;
  state.editingCategoryIndex = null;
  renderCatList();
  populateMeseroCat();
  renderDishCatSelect();
  renderAdminMenu();
  showToast('✅ Categoría actualizada','success');

  if (supabaseClient) {
    supabaseClient.from('categories').update({ name: val }).eq('name', oldVal).catch(e => console.error(e));
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
    supabaseClient.from('categories').insert([{ name: val }]).catch(e => console.error(e));
  }
}

function deleteCategory(i) {
  if (!confirm('¿Eliminar categoría?')) return;
  const val = state.categories[i];
  state.categories.splice(i,1);
  renderCatList();
  populateMeseroCat();
  renderDishCatSelect();
  showToast('🗑️ Categoría eliminada','success');

  if (supabaseClient) {
    supabaseClient.from('categories').delete().eq('name', val).catch(e => console.error(e));
  }
}

function renderDishCatSelect() {
  const sel=document.getElementById('dish-cat');
  if (sel) sel.innerHTML=state.categories.map(c=>`<option>${c}</option>`).join('');
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
//  ADMIN – HISTORIAL
// ═══════════════════════════════════════════
function renderHistorial() {
  const tbody=document.getElementById('history-tbody');
  if (!state.orders.length) { tbody.innerHTML=`<tr><td colspan="9" style="text-align:center;color:var(--gray-400);padding:32px;">Sin pedidos</td></tr>`; return; }
  const sColor={pending:'#FFF8E1',preparing:'#FFF0E8',done:'#E8F5E9'};
  const sText={pending:'⏳ Pendiente',preparing:'🔥 Preparando',done:'✅ Listo'};
  tbody.innerHTML=[...state.orders].reverse().map(o=>`
    <tr>
      <td><strong>#${o.id}</strong></td>
      <td>${o.table}</td>
      <td style="font-size:12px;">${o.waiter}</td>
      <td style="font-size:12px;">${o.items.map(i=>`${i.qty}× ${i.name}`).join('<br>')}</td>
      <td style="font-size:12px;color:var(--gray-400);">${o.notes||'–'}</td>
      <td><strong style="color:var(--orange);">$${o.total.toLocaleString()}</strong></td>
      <td><span class="badge" style="background:${sColor[o.status]};color:var(--gray-800);">${sText[o.status]}</span></td>
      <td><span class="badge ${o.payment==='paid'?'pay-paid':'pay-pending'}">${o.payment==='paid'?'✅ Pagado':'⏳ Pendiente'}</span></td>
      <td style="color:var(--gray-400);font-size:11px;">${o.date}<br>${o.time}</td>
    </tr>`).join('');
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
    document.getElementById('dish-desc').value=d.desc;
    document.getElementById('dish-emoji').value=d.emoji||'';
    renderConsumesModal(d.consumes||[]);
  } else {
    document.getElementById('menu-modal-title').textContent='Agregar Plato';
    document.getElementById('edit-dish-id').value='';
    ['dish-name','dish-price','dish-qty','dish-desc','dish-emoji'].forEach(i=>document.getElementById(i).value='');
    renderConsumesModal([]);
  }
  m.classList.add('open');
}

function saveDish() {
  const name=document.getElementById('dish-name').value.trim();
  const price=parseInt(document.getElementById('dish-price').value);
  const qty=parseInt(document.getElementById('dish-qty').value);
  const cat=document.getElementById('dish-cat').value;
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
      Object.assign(d,{name,price,qty,cat,desc,emoji,consumes});
      if (supabaseClient) {
        supabaseClient.from('menu').upsert([d]).catch(e => console.error(e));
      }
    }
    showToast('✅ Plato actualizado','success');
  } else {
    const newDish = {id:state.nextMenuId++,name,price,qty,cat,desc,emoji,consumes};
    state.menu.push(newDish);
    if (supabaseClient) {
      supabaseClient.from('menu').insert([newDish]).catch(e => console.error(e));
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
    supabaseClient.from('menu').delete().eq('id', id).catch(e => console.error(e));
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

// 1. EXPOSICIÓN GLOBAL: Permite que los botones del HTML (onclick) encuentren las funciones del módulo
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
  window.markPaid = markPaid;
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
  window.startEditCategory = startEditCategory;
  window.cancelCategoryEdit = cancelCategoryEdit;
  window.saveCategoryEdit = saveCategoryEdit;
  window.addCategory = addCategory;
  window.deleteCategory = deleteCategory;
  window.openMenuModal = openMenuModal;
  window.saveDish = saveDish;
  window.deleteDish = deleteDish;
  window.closeModal = closeModal;
  window.addConsumeRow = addConsumeRow;
}

// 2. LISTENERS REALTIME: Actualiza la pantalla de cada dispositivo en vivo sin recargar la página
function activarListenersTiempoReal() {
  if (!supabaseClient) return; // Evita errores si Supabase no está conectado todavía

  // Escuchar cambios en cualquier tabla del esquema público
  supabaseClient
    .channel('db-changes')
    .on(
      'postgres_changes', 
      { event: '*', schema: 'public' }, 
      (payload) => {
        const table = payload.table;
        console.log(`¡Cambio en la tabla ${table} en la nube!`, payload);
        
        // Recargar de forma optimizada solo la tabla que cambió
        let reloadPromise;
        if (table === 'menu') reloadPromise = loadMenu();
        else if (table === 'inventory') reloadPromise = loadInventory();
        else if (table === 'users') reloadPromise = loadUsers();
        else if (table === 'tables') reloadPromise = loadTables();
        else if (table === 'orders') reloadPromise = loadOrders();
        else if (table === 'activity_log') reloadPromise = loadActivityLog();
        else if (table === 'categories') reloadPromise = loadCategories();
        else return; // Tabla no rastreada

        reloadPromise.then(() => {
          refreshUIForTable(table);
        });
      }
    )
    .subscribe();
}

function refreshUIForTable(table) {
  if (!state.currentUser) return;
  const role = state.currentUser.role;

  if (table === 'orders') {
    if (role === 'mesero') {
      renderPickupAlerts();
      renderTableBtns();
    } else if (role === 'cocina') {
      renderKitchen();
    } else if (role === 'admin') {
      renderAdminVentas();
      renderHistorial();
      renderTablesGrid();
      renderPersonnel();
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
      renderAdminVentas(); // Para actualizar platos agotados/insumos bajos
    }
  } else if (table === 'tables') {
    if (role === 'mesero') {
      renderTableBtns();
    } else if (role === 'admin') {
      renderTablesGrid();
    }
  } else if (table === 'users') {
    if (role === 'admin') {
      renderUsersGrid();
    }
  } else if (table === 'activity_log') {
    if (role === 'admin') {
      renderPersonnel();
    }
  } else if (table === 'categories') {
    populateMeseroCat();
    renderDishCatSelect();
    if (role === 'mesero') {
      renderMenuCards();
    } else if (role === 'admin') {
      renderAdminMenu();
    }
  }
}
