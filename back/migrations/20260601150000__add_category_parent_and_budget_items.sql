-- 1. Añadir parent_category_id e is_user_created a la tabla categories
ALTER TABLE categories ADD COLUMN parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
ALTER TABLE categories ADD COLUMN is_user_created BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Modificar budget_models y monthly_budgets para incorporar porcentajes
ALTER TABLE budget_models ADD COLUMN percent_vida NUMERIC(5, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE budget_models ADD COLUMN percent_ocio NUMERIC(5, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE budget_models ADD COLUMN percent_inversion_deuda NUMERIC(5, 2) NOT NULL DEFAULT 0.00;

ALTER TABLE monthly_budgets ADD COLUMN percent_vida NUMERIC(5, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE monthly_budgets ADD COLUMN percent_ocio NUMERIC(5, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE monthly_budgets ADD COLUMN percent_inversion_deuda NUMERIC(5, 2) NOT NULL DEFAULT 0.00;

-- 3. Eliminar las tablas obsoletas
DROP TABLE IF EXISTS budget_model_categories CASCADE;
DROP TABLE IF EXISTS monthly_budget_categories CASCADE;

-- 4. Crear la tabla budget_model_items
CREATE TABLE budget_model_items (
    id UUID PRIMARY KEY,
    budget_model_id UUID NOT NULL REFERENCES budget_models(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    amount_limit NUMERIC(15, 2) NOT NULL
);

-- 5. Crear la tabla monthly_budget_items
CREATE TABLE monthly_budget_items (
    id UUID PRIMARY KEY,
    monthly_budget_id UUID NOT NULL REFERENCES monthly_budgets(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    amount_limit NUMERIC(15, 2) NOT NULL,
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL
);
