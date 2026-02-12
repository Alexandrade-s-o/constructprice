-- Estructura de Base de Datos para ConstructPrice (Tiempo Real)

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  price DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'COP',
  unit VARCHAR(50) NOT NULL,
  url VARCHAR(500),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  trend ENUM('up', 'down', 'stable') DEFAULT 'stable',
  description TEXT
);

CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  old_price DECIMAL(12, 2) NOT NULL,
  new_price DECIMAL(12, 2) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento de consultas
CREATE INDEX idx_materials_category ON materials(category_id);
CREATE INDEX idx_price_history_material ON price_history(material_id);
CREATE INDEX idx_price_history_date ON price_history(changed_at);
