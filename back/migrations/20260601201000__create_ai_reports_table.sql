-- Migración: Creación de la tabla de reportes de IA (ai_reports)
CREATE TABLE IF NOT EXISTS ai_reports (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    period VARCHAR(20) NOT NULL, -- formato 'YYYY-MM'
    type VARCHAR(20) NOT NULL,   -- 'MONTHLY', 'SEMESTRAL', 'ANNUAL'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_ai_reports_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Crear índice único para evitar reportes duplicados para un mismo usuario, periodo y tipo
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_reports_user_period_type ON ai_reports(user_id, period, type);
