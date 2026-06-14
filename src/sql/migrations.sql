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
