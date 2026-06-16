-- SQL migration for Supabase / Postgres

-- Users
CREATE TABLE IF NOT EXISTS users (
  id integer PRIMARY KEY,
  name text,
  username text UNIQUE,
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
  name text,
  price integer,
  qty integer,
  cat text,
  desc text,
  emoji text,
  consumes jsonb
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id integer PRIMARY KEY,
  name text,
  qty numeric,
  unit text,
  min numeric,
  cat text,
  emoji text
);

-- Tables
CREATE TABLE IF NOT EXISTS tables (
  id integer PRIMARY KEY,
  name text,
  cap integer,
  zone text
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id integer PRIMARY KEY,
  table text,
  table_name text,
  waiter text,
  waiter_id integer,
  notes text,
  items jsonb,
  total numeric,
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
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime
      FOR TABLE users, categories, menu, inventory, tables, orders, activity_log;
  END IF;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE users;
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE categories;
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE menu;
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tables;
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE orders;
EXCEPTION WHEN duplicate_table THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
EXCEPTION WHEN duplicate_table THEN
  NULL;
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

