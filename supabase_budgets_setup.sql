-- Category budgets table
-- Stores one monthly limit per category per family (applies to every month)

CREATE TABLE IF NOT EXISTS category_budgets (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id     uuid NOT NULL,
  category_id   text NOT NULL,
  monthly_limit numeric(12,2) NOT NULL CHECK (monthly_limit > 0),
  created_at    timestamptz DEFAULT now(),
  UNIQUE (family_id, category_id)
);

ALTER TABLE category_budgets DISABLE ROW LEVEL SECURITY;
