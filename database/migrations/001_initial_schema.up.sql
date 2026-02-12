-- Up Migration: Crear Tablas Iniciales

-- Habilitar extensión para UUIDs si es necesario (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tipo ENUM para tendencia
CREATE TYPE trend_type AS ENUM ('up', 'down', 'stable');

-- 1. Tabla de Categorías
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Tabla de Proveedores (Suppliers)
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  website VARCHAR(255),
  contact_email VARCHAR(255)
);

-- 3. Tabla Principal de Materiales
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(3) DEFAULT 'COP',
  unit VARCHAR(50) NOT NULL,
  url VARCHAR(500),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  trend trend_type DEFAULT 'stable',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Historial de Precios
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  old_price DECIMAL(12, 2) NOT NULL,
  new_price DECIMAL(12, 2) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Crear Índices para Optimización
CREATE INDEX idx_materials_category ON materials(category_id);
CREATE INDEX idx_materials_supplier ON materials(supplier_id);
CREATE INDEX idx_price_history_material ON price_history(material_id);
CREATE INDEX idx_price_history_date ON price_history(changed_at DESC);
