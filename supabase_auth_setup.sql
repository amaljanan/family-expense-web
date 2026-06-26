-- ============================================================
-- Family Finance — Password Auth Setup
-- Run this once in Supabase SQL Editor
-- ============================================================

-- 1. Create the config table
CREATE TABLE IF NOT EXISTS app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Disable RLS (internal app, anon key is fine)
ALTER TABLE app_config DISABLE ROW LEVEL SECURITY;

-- 3. Insert default password  →  'family2024'
--    SHA-256 hash of 'family2024':
INSERT INTO app_config (key, value)
VALUES ('password_hash', '071c00fa66449df33ffca0f3b71da9f9375eaf8feef471f348c9bac19e6f4914')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- HOW TO RESET PASSWORD AS ADMIN (without old password):
--
--   1. Compute SHA-256 of your new password (e.g. via https://emn178.github.io/online-tools/sha256.html)
--   2. Run:
--        UPDATE app_config
--        SET value = '<new-sha256-hash>', updated_at = NOW()
--        WHERE key = 'password_hash';
-- ============================================================
