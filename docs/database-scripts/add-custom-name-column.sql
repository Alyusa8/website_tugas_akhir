-- ============================================
-- ADD custom_name COLUMN TO detection_sessions
-- ============================================
-- Run this in Supabase SQL Editor

ALTER TABLE detection_sessions
ADD COLUMN IF NOT EXISTS custom_name VARCHAR(255);

-- Verify column was added
SELECT id, session_id, custom_name FROM detection_sessions LIMIT 5;
