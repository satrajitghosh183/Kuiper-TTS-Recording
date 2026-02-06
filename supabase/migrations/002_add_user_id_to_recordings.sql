-- Migration: Add user_id to recordings for account-linked recordings
-- Links recordings to Supabase auth.users. recorder_name kept for display/backward compat.

-- Add user_id column (references auth.users)
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings(user_id);

-- For new recordings: we use user_id. The unique constraint (script_id, line_index, recorder_name)
-- remains - we'll use user_id as recorder_name for new records, so it stays unique per user per line.
-- No constraint change needed since we're using user_id string as recorder_name for now.
