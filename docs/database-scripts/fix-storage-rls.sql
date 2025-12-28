-- ============================================
-- SUPABASE STORAGE BUCKET RLS POLICIES
-- ============================================
-- Run these in Supabase SQL Editor to fix image loading

-- 1. First, enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Public Read Access to eye_exam_screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Can Upload to eye_exam_screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users Can Delete Own eye_exam_screenshots" ON storage.objects;

-- 3. Create policy for PUBLIC READ access (allows anyone to view images)
CREATE POLICY "Public Read Access to eye_exam_screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'eye_exam_screenshots');

-- 4. Create policy for AUTHENTICATED UPLOAD (only logged-in users can upload)
CREATE POLICY "Authenticated Users Can Upload to eye_exam_screenshots"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'eye_exam_screenshots' 
  AND auth.role() = 'authenticated'
);

-- 5. Create policy for DELETE (users can delete their own files)
CREATE POLICY "Users Can Delete Own eye_exam_screenshots"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'eye_exam_screenshots'
  AND owner = auth.uid()
);

-- 6. Update bucket to allow public access
UPDATE storage.buckets
SET public = true
WHERE id = 'eye_exam_screenshots';

-- Verify policies were created
SELECT * FROM storage.policies WHERE bucket_id = 'eye_exam_screenshots';
