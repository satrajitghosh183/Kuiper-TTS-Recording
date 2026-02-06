-- =============================================================================
-- Kuyper TTS - Complete Database Schema
-- =============================================================================
--
-- This file contains the full schema for a fresh setup. Run it in the Supabase
-- SQL Editor (Dashboard > SQL Editor > New Query) to set up the database.
--
-- For existing projects, migrations are in supabase/migrations/:
--   001_add_phrase_and_recorder.sql  - Adds phrase_text, recorder_name
--   002_add_user_id_to_recordings.sql - Adds user_id for account-linked recordings
--
-- =============================================================================

-- =============================================================================
-- 1. SCRIPTS TABLE
-- =============================================================================
-- Stores script metadata and line content for recording prompts.
-- =============================================================================

CREATE TABLE IF NOT EXISTS scripts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    lines TEXT[] NOT NULL,
    line_count INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. RECORDINGS TABLE
-- =============================================================================
-- Stores metadata for each voice recording.
--
-- Columns:
--   user_id       - Links to auth.users for account-linked recordings (nullable for legacy)
--   recorder_name - Identifier for who recorded (user_id as string for new records)
--   phrase_text   - The exact text that was read (from scripts.lines)
--   storage_path  - Path in storage bucket: recordings/{recorder_name}/{script_id}/{filename}
--
-- Unique constraint: one recording per (script_id, line_index, recorder_name)
-- =============================================================================

CREATE TABLE IF NOT EXISTS recordings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recorder_name VARCHAR(255) NOT NULL,
    script_id INTEGER REFERENCES scripts(id) ON DELETE CASCADE,
    line_index INTEGER NOT NULL,
    phrase_text TEXT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    duration_seconds FLOAT DEFAULT 0,
    peak_amplitude FLOAT DEFAULT 0,
    rms_level FLOAT DEFAULT 0,
    is_valid BOOLEAN DEFAULT TRUE,
    file_size_bytes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(script_id, line_index, recorder_name)
);

-- Indexes for recordings
CREATE INDEX IF NOT EXISTS idx_recordings_script_id ON recordings(script_id);
CREATE INDEX IF NOT EXISTS idx_recordings_recorder_name ON recordings(recorder_name);
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_recordings_script_line ON recordings(script_id, line_index);

-- =============================================================================
-- 3. USER SETTINGS
-- =============================================================================
-- Per-user audio settings so preferences follow accounts across devices.
-- Settings are applied in useAudioRecorder via Web Audio API.
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    gain INTEGER NOT NULL DEFAULT 100,      -- 20–200 (percent, 100 = unity)
    bass INTEGER NOT NULL DEFAULT 0,        -- -12 to +12 dB
    treble INTEGER NOT NULL DEFAULT 0,      -- -12 to +12 dB
    device_id TEXT,                         -- optional input device id
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. STORAGE BUCKET
-- =============================================================================
-- Creates the recordings bucket if it doesn't exist.
-- Bucket stores audio files at: recordings/{recorder_name}/{script_id}/{filename}
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 5. STORAGE POLICIES
-- =============================================================================
-- Drop existing policies first for idempotency, then recreate.
-- =============================================================================

DROP POLICY IF EXISTS "Public read access for recordings" ON storage.objects;
CREATE POLICY "Public read access for recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'recordings');

DROP POLICY IF EXISTS "Service role insert recordings" ON storage.objects;
CREATE POLICY "Service role insert recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'recordings');

DROP POLICY IF EXISTS "Service role update recordings" ON storage.objects;
CREATE POLICY "Service role update recordings"
ON storage.objects FOR UPDATE
USING (bucket_id = 'recordings');

DROP POLICY IF EXISTS "Service role delete recordings" ON storage.objects;
CREATE POLICY "Service role delete recordings"
ON storage.objects FOR DELETE
USING (bucket_id = 'recordings');

-- =============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Enables RLS on all tables. Policies allow service role full access and
-- public read for scripts/recordings (backend uses service role for writes).
-- =============================================================================

ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Scripts policies
DROP POLICY IF EXISTS "Public read scripts" ON scripts;
CREATE POLICY "Public read scripts" ON scripts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manage scripts" ON scripts;
CREATE POLICY "Service role manage scripts" ON scripts FOR ALL USING (true);

-- Recordings policies
DROP POLICY IF EXISTS "Public read recordings" ON recordings;
CREATE POLICY "Public read recordings" ON recordings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role manage recordings" ON recordings;
CREATE POLICY "Service role manage recordings" ON recordings FOR ALL USING (true);

-- User settings policies (service role access from backend)
DROP POLICY IF EXISTS "Service role manage user settings" ON user_settings;
CREATE POLICY "Service role manage user settings" ON user_settings FOR ALL USING (true);

-- =============================================================================
-- DONE
-- =============================================================================
-- Next steps:
-- 1. Seed scripts via backend API or run seed_scripts_from_local.py
-- 2. Configure Supabase env vars in your backend (.env):
--    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or anon key for client)
-- =============================================================================
