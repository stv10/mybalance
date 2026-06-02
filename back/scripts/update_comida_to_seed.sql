-- Script para actualizar la categoría 'Comida' existente en producción a tipo Seed (Sistema)
-- Este script cambia 'is_user_created' a FALSE para evitar que los usuarios la eliminen.

UPDATE categories 
SET is_user_created = FALSE 
WHERE name = 'Comida' 
  AND type = 'EXPENSE';
