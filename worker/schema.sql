-- =============================================================================
-- L'ÉTÉ — NariVibes Brand
-- Cloudflare D1 Database Schema
-- =============================================================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id          TEXT    PRIMARY KEY,
  name        TEXT    NOT NULL,
  material    TEXT,
  price       INTEGER NOT NULL,             -- in paise (₹ × 100)
  category    TEXT,
  collection  TEXT    DEFAULT 'Summer 2024',
  colors      TEXT    DEFAULT '[]',         -- JSON array of {name, hex} objects
  sizes       TEXT    DEFAULT '[]',         -- JSON array of size strings
  description TEXT,
  details     TEXT    DEFAULT '[]',         -- JSON array of detail strings
  images      TEXT    DEFAULT '[]',         -- JSON array of image URLs
  stock       INTEGER DEFAULT 0,
  featured    INTEGER DEFAULT 0,            -- 0 = false, 1 = true
  badge       TEXT,                         -- e.g. "New Arrival", "Bestseller"
  status      TEXT    DEFAULT 'active',     -- active | hidden | discontinued
  created_at  TEXT    DEFAULT (datetime('now'))
);

-- Migration for existing deployments (run once if products table already exists):
-- ALTER TABLE products ADD COLUMN status TEXT DEFAULT 'active';

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id                  TEXT    PRIMARY KEY,          -- e.g. LTE-20240815-XK9F
  customer_email      TEXT    NOT NULL,
  customer_name       TEXT,
  customer_phone      TEXT,
  shipping_address    TEXT,                          -- JSON object
  items               TEXT    NOT NULL,              -- JSON array of cart items
  subtotal            INTEGER NOT NULL,              -- in paise
  shipping            INTEGER DEFAULT 0,             -- in paise
  total               INTEGER NOT NULL,              -- in paise
  razorpay_order_id   TEXT,
  razorpay_payment_id TEXT,
  payment_status      TEXT    DEFAULT 'pending',     -- pending | paid | failed
  order_status        TEXT    DEFAULT 'placed',      -- placed | processing | shipped | delivered
  created_at          TEXT    DEFAULT (datetime('now'))
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_orders_email     ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_status   ON products(status);
