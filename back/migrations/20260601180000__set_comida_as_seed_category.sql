-- Cambiar la categoría 'Comida' a seed (no de usuario)
UPDATE categories SET is_user_created = FALSE WHERE name = 'Comida' AND type = 'EXPENSE';
