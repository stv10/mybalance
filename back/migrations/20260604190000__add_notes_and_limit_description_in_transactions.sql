-- Migración para añadir columna de observaciones (notes) y limitar descripción (description) a 32 caracteres

-- 1. Truncar descripciones existentes que superen los 32 caracteres
UPDATE transactions 
SET description = SUBSTRING(description FROM 1 FOR 32)
WHERE LENGTH(description) > 32;

-- 2. Cambiar tipo de la columna description a VARCHAR(32)
ALTER TABLE transactions 
ALTER COLUMN description TYPE VARCHAR(32);

-- 3. Añadir la columna notes para almacenar las observaciones/comentarios
ALTER TABLE transactions 
ADD COLUMN notes VARCHAR(256);
