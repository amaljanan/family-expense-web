-- ============================================================
-- Family Finance — Multi-Family Setup
-- Run this once in Supabase SQL Editor
-- ============================================================

-- 1. Create families table
CREATE TABLE IF NOT EXISTS families (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username       TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  family_name    TEXT NOT NULL,
  member1        TEXT NOT NULL,
  member2        TEXT NOT NULL,
  member1_emoji  TEXT NOT NULL DEFAULT '👨',
  member2_emoji  TEXT NOT NULL DEFAULT '👩',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE families DISABLE ROW LEVEL SECURITY;

-- 2. Insert the two families (both default password: family2024)
--    SHA-256 of 'family2024' = 071c00fa66449df33ffca0f3b71da9f9375eaf8feef471f348c9bac19e6f4914
INSERT INTO families (username, password_hash, family_name, member1, member2, member1_emoji, member2_emoji)
VALUES
  ('amalaiswarya', '071c00fa66449df33ffca0f3b71da9f9375eaf8feef471f348c9bac19e6f4914',
   'Amal & Aiswarya', 'Amal', 'Aiswarya', '👨', '👩'),
  ('heerahari',    '071c00fa66449df33ffca0f3b71da9f9375eaf8feef471f348c9bac19e6f4914',
   'Heera & Hari',   'Hari', 'Heera',    '👨', '👩')
ON CONFLICT (username) DO NOTHING;

-- 3. Add family_id to expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);

-- 4. Migrate existing expenses → Amal & Aiswarya family
UPDATE expenses
SET family_id = (SELECT id FROM families WHERE username = 'amalaiswarya')
WHERE family_id IS NULL;

-- 5. Add family_id to salaries
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id);

-- 6. Migrate existing salaries → Amal & Aiswarya family
UPDATE salaries
SET family_id = (SELECT id FROM families WHERE username = 'amalaiswarya')
WHERE family_id IS NULL;

-- 7. Drop old unique constraint on salaries (person,month,year) and add new one with family_id
DO $$
BEGIN
  BEGIN
    ALTER TABLE salaries DROP CONSTRAINT salaries_person_month_year_key;
  EXCEPTION WHEN undefined_object THEN NULL;
  END;
  BEGIN
    ALTER TABLE salaries ADD CONSTRAINT salaries_family_person_month_year_key
      UNIQUE (family_id, person, month, year);
  EXCEPTION WHEN duplicate_table THEN NULL;
  END;
END $$;

-- ============================================================
-- CREDENTIALS:
--   Family 1 → username: amalaiswarya  password: family2024
--   Family 2 → username: heerahari     password: family2024
--
-- ADMIN PASSWORD RESET (no old password needed):
--   Step 1: Get SHA-256 hash of new password from
--           https://emn178.github.io/online-tools/sha256.html
--   Step 2: Run:
--     UPDATE families
--     SET password_hash = '<new-hash>'
--     WHERE username = 'amalaiswarya';  -- or 'heerahari'
-- ============================================================
