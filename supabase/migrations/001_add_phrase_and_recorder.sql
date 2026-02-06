-- Migration: Add phrase_text and recorder_name to recordings
-- Run this in Supabase SQL Editor if you have an existing recordings table

-- Add new columns
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS recorder_name VARCHAR(255);
ALTER TABLE recordings ADD COLUMN IF NOT EXISTS phrase_text TEXT;

-- Backfill: set defaults for existing rows
UPDATE recordings SET recorder_name = 'unknown' WHERE recorder_name IS NULL;
UPDATE recordings r SET phrase_text = COALESCE(
  (SELECT s.lines[r.line_index + 1] FROM scripts s WHERE s.id = r.script_id),
  ''
) WHERE phrase_text IS NULL OR phrase_text = '';

-- Make NOT NULL
ALTER TABLE recordings ALTER COLUMN recorder_name SET NOT NULL;
ALTER TABLE recordings ALTER COLUMN phrase_text SET NOT NULL;

-- Drop old unique constraint (name may vary)
ALTER TABLE recordings DROP CONSTRAINT IF EXISTS recordings_script_id_line_index_key;

-- Add new unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS recordings_script_line_recorder_unique
  ON recordings(script_id, line_index, recorder_name);
