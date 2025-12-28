-- ============================================
-- DETECTION SESSIONS TABLE
-- ============================================
DROP TABLE IF EXISTS detection_images CASCADE;
DROP TABLE IF EXISTS detection_sessions CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE TABLE IF NOT EXISTS detection_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,  -- UUID dari frontend
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds DECIMAL(10, 2),
  total_screenshots INT DEFAULT 0,
  direction_summary JSONB,  -- {"KIRI": 2, "KANAN": 1, "DEPAN": 0}
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add index untuk faster queries
CREATE INDEX IF NOT EXISTS idx_detection_sessions_user_id ON detection_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_detection_sessions_session_id ON detection_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_detection_sessions_created_at ON detection_sessions(created_at DESC);

-- ============================================
-- DETECTION IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS detection_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES detection_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url VARCHAR(1024) NOT NULL,  -- Storage path/URL
  direction VARCHAR(50),  -- KIRI, DEPAN, KANAN
  confidence DECIMAL(5, 4),  -- 0.0000 - 1.0000
  bbox_data JSONB,  -- {x1, y1, x2, y2} untuk visualization
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES detection_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add index untuk faster queries
CREATE INDEX IF NOT EXISTS idx_detection_images_session_id ON detection_images(session_id);
CREATE INDEX IF NOT EXISTS idx_detection_images_user_id ON detection_images(user_id);
CREATE INDEX IF NOT EXISTS idx_detection_images_captured_at ON detection_images(captured_at DESC);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on both tables
ALTER TABLE detection_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE detection_images ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR detection_sessions
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own detection sessions" ON detection_sessions;
DROP POLICY IF EXISTS "Users can create their own detection sessions" ON detection_sessions;
DROP POLICY IF EXISTS "Users can update their own detection sessions" ON detection_sessions;
DROP POLICY IF EXISTS "Users can delete their own detection sessions" ON detection_sessions;

-- Users can view their own sessions
CREATE POLICY "Users can view their own detection sessions"
ON detection_sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users can create sessions for themselves
CREATE POLICY "Users can create their own detection sessions"
ON detection_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update their own detection sessions"
ON detection_sessions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete their own detection sessions"
ON detection_sessions FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR detection_images
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own detection images" ON detection_images;
DROP POLICY IF EXISTS "Users can create detection images for their sessions" ON detection_images;
DROP POLICY IF EXISTS "Users can delete their own detection images" ON detection_images;

-- Users can view their own images
CREATE POLICY "Users can view their own detection images"
ON detection_images FOR SELECT
USING (auth.uid() = user_id);

-- Users can upload images for their sessions
CREATE POLICY "Users can create detection images for their sessions"
ON detection_images FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own images
CREATE POLICY "Users can delete their own detection images"
ON detection_images FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_detection_sessions_updated_at
BEFORE UPDATE ON detection_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
