-- History dan Auto Screenshot Schema
-- Skema untuk menyimpan riwayat deteksi dan screenshot otomatis

-- =====================================================
-- DETECTION HISTORY TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS detection_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    object_detected TEXT NOT NULL,
    confidence NUMERIC(5, 2) NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('KIRI', 'KANAN')),
    position_x NUMERIC NOT NULL,
    position_y NUMERIC NOT NULL,
    position_width NUMERIC NOT NULL,
    position_height NUMERIC NOT NULL,
    screenshot_id UUID REFERENCES session_screenshots(id) ON DELETE SET NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_detection_history_user_id ON detection_history(user_id);
CREATE INDEX IF NOT EXISTS idx_detection_history_session_id ON detection_history(session_id);
CREATE INDEX IF NOT EXISTS idx_detection_history_detected_at ON detection_history(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_detection_history_object ON detection_history(object_detected);

-- =====================================================
-- AUTO SCREENSHOT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS auto_screenshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    screenshot_url TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('KIRI', 'KANAN')),
    trigger_reason TEXT NOT NULL CHECK (trigger_reason IN ('object_detected', 'interval', 'manual')),
    detection_count INT DEFAULT 0,
    objects_in_frame TEXT[] DEFAULT ARRAY[]::TEXT[],
    processed BOOLEAN DEFAULT FALSE,
    file_size INT,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_auto_screenshots_user_id ON auto_screenshots(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_screenshots_session_id ON auto_screenshots(session_id);
CREATE INDEX IF NOT EXISTS idx_auto_screenshots_captured_at ON auto_screenshots(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_auto_screenshots_processed ON auto_screenshots(processed);
CREATE INDEX IF NOT EXISTS idx_auto_screenshots_trigger_reason ON auto_screenshots(trigger_reason);

-- =====================================================
-- DETECTION STATISTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS detection_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    total_detections INT DEFAULT 0,
    unique_objects INT DEFAULT 0,
    most_detected_object TEXT,
    average_confidence NUMERIC(5, 2),
    detection_by_direction JSONB DEFAULT '{}'::JSONB,
    total_screenshots INT DEFAULT 0,
    processing_time INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes untuk performa query
CREATE INDEX IF NOT EXISTS idx_detection_stats_user_id ON detection_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_detection_stats_session_id ON detection_statistics(session_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on detection_history table
ALTER TABLE detection_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own detection history
CREATE POLICY "Users can view own detection history"
    ON detection_history FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own detection history
CREATE POLICY "Users can insert own detection history"
    ON detection_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own detection history
CREATE POLICY "Users can delete own detection history"
    ON detection_history FOR DELETE
    USING (auth.uid() = user_id);

-- Enable RLS on auto_screenshots table
ALTER TABLE auto_screenshots ENABLE ROW LEVEL SECURITY;

-- Users can only see their own auto screenshots
CREATE POLICY "Users can view own auto screenshots"
    ON auto_screenshots FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own auto screenshots
CREATE POLICY "Users can insert own auto screenshots"
    ON auto_screenshots FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own auto screenshots
CREATE POLICY "Users can delete own auto screenshots"
    ON auto_screenshots FOR DELETE
    USING (auth.uid() = user_id);

-- Enable RLS on detection_statistics table
ALTER TABLE detection_statistics ENABLE ROW LEVEL SECURITY;

-- Users can only see their own detection statistics
CREATE POLICY "Users can view own detection statistics"
    ON detection_statistics FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own detection statistics
CREATE POLICY "Users can insert own detection statistics"
    ON detection_statistics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own detection statistics
CREATE POLICY "Users can update own detection statistics"
    ON detection_statistics FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- STORAGE BUCKET POLICIES
-- =====================================================

-- Bucket for auto screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('auto-screenshots', 'auto-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Policy untuk upload auto screenshots
CREATE POLICY "Users can upload own auto screenshots"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'auto-screenshots' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy untuk download auto screenshots
CREATE POLICY "Users can download own auto screenshots"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'auto-screenshots'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy untuk delete auto screenshots
CREATE POLICY "Users can delete own auto screenshots"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'auto-screenshots'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
