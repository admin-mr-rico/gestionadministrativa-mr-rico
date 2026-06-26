-- SQL migration for Supabase / Postgres

-- Users
CREATE TABLE IF NOT EXISTS users (
  id integer PRIMARY KEY,
  name text NOT NULL,
  username text UNIQUE NOT NULL,
  pass text,
  role text NOT NULL
);

-- Categories (optional)
CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL
);

-- Menu
CREATE TABLE IF NOT EXISTS menu (
  id integer PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL,
  qty integer DEFAULT 0,
  cat text,
  "desc" text,
  emoji text,
  consumes jsonb
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id integer PRIMARY KEY,
  name text NOT NULL,
  qty numeric DEFAULT 0,
  unit text,
  min integer DEFAULT 0,
  cat text,
  emoji text
);

-- Tables
CREATE TABLE IF NOT EXISTS tables (
  id integer PRIMARY KEY,
  name text NOT NULL,
  cap integer DEFAULT 0,
  zone text
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id integer PRIMARY KEY,
  table_name text,
  waiter text,
  waiter_id integer,
  notes text,
  items jsonb,
  total numeric DEFAULT 0,
  status text,
  payment text,
  delivered boolean DEFAULT false,
  time text,
  date text,
  inventoryUpdated boolean DEFAULT false
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id serial PRIMARY KEY,
  person text,
  role text,
  action text,
  color text,
  time text
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
CREATE INDEX IF NOT EXISTS idx_menu_cat ON menu(cat);

-- ══════════════════════════════════════════════════════════
-- CONFIGURACIÓN DE TIEMPO REAL (REALTIME) Y SEGURIDAD (RLS)
-- ══════════════════════════════════════════════════════════

-- 1. Habilitar la réplica en tiempo real para todas las tablas clave
-- Si la publicación 'supabase_realtime' ya existe, añadimos las tablas de forma segura
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  ALTER PUBLICATION supabase_realtime ADD TABLE menu;
  ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
  ALTER PUBLICATION supabase_realtime ADD TABLE tables;
  ALTER PUBLICATION supabase_realtime ADD TABLE users;
  ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
  ALTER PUBLICATION supabase_realtime ADD TABLE categories;
EXCEPTION WHEN OTHERS THEN
  -- Puede fallar si ya están agregadas o la publicación no existe en este entorno todavía.
  -- Si no existe, puedes crearla ejecutando: CREATE PUBLICATION supabase_realtime;
END $$;

-- 2. Configuración de RLS (Seguridad a Nivel de Fila)
-- Para garantizar que el cliente anónimo (anon_key) pueda leer y escribir datos sin autenticación OAuth compleja:

-- Opción A: Desactivar RLS por completo (Recomendado para entornos locales/desarrollo interno rápido)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- Opción B: Si prefieres mantener RLS activo, ejecuta estas políticas abiertas en la consola SQL de Supabase:
-- CREATE POLICY "Permitir todo a anon" ON users FOR ALL TO public USING (true) WITH CHECK (true);
-- CREATE POLICY "Permitir todo a anon" ON menu FOR ALL TO public USING (true) WITH CHECK (true);
-- CREATE POLICY "Permitir todo a anon" ON inventory FOR ALL TO public USING (true) WITH CHECK (true);
-- CREATE POLICY "Permitir todo a anon" ON tables FOR ALL TO public USING (true) WITH CHECK (true);
-- CREATE POLICY "Permitir todo a anon" ON orders FOR ALL TO public USING (true) WITH CHECK (true);
-- CREATE POLICY "Permitir todo a anon" ON activity_log FOR ALL TO public USING (true) WITH CHECK (true);
-- CREATE POLICY "Permitir todo a anon" ON categories FOR ALL TO public USING (true) WITH CHECK (true);

