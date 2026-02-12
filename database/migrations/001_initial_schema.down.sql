-- Down Migration: Revertir Todo

-- Eliminar tablas en orden reverso para respetar llaves foráneas

DROP TABLE IF EXISTS price_history;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS categories;

-- Eliminar tipos personalizados
DROP TYPE IF EXISTS trend_type;

-- Eliminar extensión (Opcional, puede mantenerse)
-- DROP EXTENSION IF EXISTS "uuid-ossp";
