CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "name" varchar(100) NOT NULL,
  "email" varchar(150) UNIQUE NOT NULL,
  "password_hash" varchar NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "accounts" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "balance" decimal(15,2) NOT NULL DEFAULT 0.00,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "type" varchar(20) NOT NULL,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "transactions" (
  "id" uuid PRIMARY KEY,
  "account_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "type" varchar(20) NOT NULL,
  "amount" decimal(15,2) NOT NULL,
  "description" text,
  "date" date NOT NULL,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "budget_models" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid UNIQUE NOT NULL,
  "total_limit" decimal(15,2) NOT NULL,
  "created_at" timestamp DEFAULT (now()),
  "updated_at" timestamp
);

CREATE TABLE "budget_model_categories" (
  "id" uuid PRIMARY KEY,
  "budget_model_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "amount_limit" decimal(15,2) NOT NULL
);

CREATE TABLE "monthly_budgets" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "month" int NOT NULL,
  "year" int NOT NULL,
  "total_limit" decimal(15,2) NOT NULL,
  "created_at" timestamp DEFAULT (now())
);

CREATE TABLE "monthly_budget_categories" (
  "id" uuid PRIMARY KEY,
  "monthly_budget_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "amount_limit" decimal(15,2) NOT NULL
);

COMMENT ON COLUMN "users"."id" IS 'Generado automáticamente por Hibernate';

COMMENT ON COLUMN "accounts"."balance" IS 'Saldo actual disponible en la cuenta';

COMMENT ON COLUMN "categories"."user_id" IS 'Categorías personalizadas por usuario';

COMMENT ON COLUMN "categories"."type" IS 'Puede ser "income" o "expense"';

COMMENT ON COLUMN "transactions"."type" IS 'Identificador: "income" o "expense"';

COMMENT ON COLUMN "transactions"."date" IS 'Fecha en la que ocurrió la transacción';

COMMENT ON COLUMN "budget_models"."user_id" IS 'Relación 1 a 1: Un modelo activo por usuario';

COMMENT ON COLUMN "budget_models"."total_limit" IS 'Límite total predeterminado (el molde)';

COMMENT ON COLUMN "budget_model_categories"."amount_limit" IS 'Límite predeterminado para esta categoría';

COMMENT ON COLUMN "monthly_budgets"."month" IS 'Mes del presupuesto (1-12)';

COMMENT ON COLUMN "monthly_budgets"."year" IS 'Año del presupuesto (ej. 2026)';

COMMENT ON COLUMN "monthly_budgets"."total_limit" IS 'Límite total copiado del modelo para este mes específico';

COMMENT ON COLUMN "monthly_budget_categories"."amount_limit" IS 'Límite de categoría específico para este mes';

ALTER TABLE "accounts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "categories" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "users" ADD FOREIGN KEY ("id") REFERENCES "budget_models" ("user_id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "monthly_budgets" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "transactions" ADD FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "transactions" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "budget_model_categories" ADD FOREIGN KEY ("budget_model_id") REFERENCES "budget_models" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "budget_model_categories" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "monthly_budget_categories" ADD FOREIGN KEY ("monthly_budget_id") REFERENCES "monthly_budgets" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "monthly_budget_categories" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE DEFERRABLE INITIALLY IMMEDIATE;
