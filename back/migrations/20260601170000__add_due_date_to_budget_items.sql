-- Añadir campos de vencimiento a las tablas de ítems de presupuesto
ALTER TABLE budget_model_items ADD COLUMN due_day INTEGER;
ALTER TABLE monthly_budget_items ADD COLUMN due_day INTEGER;
ALTER TABLE monthly_budget_items ADD COLUMN due_date DATE;
