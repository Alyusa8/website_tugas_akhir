-- Detection Sessions Schema
-- This schema tracks user detection sessions and screenshots

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    preview_image TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at DESC);

-- =====================================================
-- SESSION SCREENSHOTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS session_screenshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('KIRI', 'KANAN')),
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_screenshots_session_id ON session_screenshots(session_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_captured_at ON session_screenshots(captured_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on sessions table
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
    ON sessions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own sessions
CREATE POLICY "Users can insert own sessions"
    ON sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own sessions
CREATE POLICY "Users can update own sessions"
    ON sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can only delete their own sessions
CREATE POLICY "Users can delete own sessions"
    ON sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Enable RLS on session_screenshots table
ALTER TABLE session_screenshots ENABLE ROW LEVEL SECURITY;

-- Users can only see screenshots from their own sessions
CREATE POLICY "Users can view own screenshots"
    ON session_screenshots FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = session_screenshots.session_id
            AND sessions.user_id = auth.uid()
        )
    );

-- Users can only insert screenshots to their own sessions
CREATE POLICY "Users can insert own screenshots"
    ON session_screenshots FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = session_screenshots.session_id
            AND sessions.user_id = auth.uid()
        )
    );

-- Users can only delete screenshots from their own sessions
CREATE POLICY "Users can delete own screenshots"
    ON session_screenshots FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM sessions
            WHERE sessions.id = session_screenshots.session_id
            AND sessions.user_id = auth.uid()
        )
    );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on sessions
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKET SETUP
-- =====================================================

-- Create storage bucket for detection screenshots
-- Run this in Supabase Dashboard > Storage > Create bucket
-- Bucket name: detection-screenshots
-- Public: false (requires authentication)

-- Storage policies (run in Supabase SQL Editor after creating bucket)
-- Allow users to upload to their own folder
CREATE POLICY "Users can upload own screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'detection-screenshots' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own screenshots
CREATE POLICY "Users can view own screenshots"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'detection-screenshots' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own screenshots
CREATE POLICY "Users can delete own screenshots"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'detection-screenshots' AND
    auth.uid()::text = (storage.foldername(name))[1]
);
