-- ============================================================
-- Family Finance — Enable Self-Registration
-- Run this in Supabase SQL Editor (one time)
-- ============================================================

-- Allow member2 to be NULL (for single-earner families)
ALTER TABLE families ALTER COLUMN member2      DROP NOT NULL;
ALTER TABLE families ALTER COLUMN member2_emoji DROP NOT NULL;

-- ============================================================
-- After running this, new families can be created directly
-- from the app's "Create Family" screen.
-- ============================================================
