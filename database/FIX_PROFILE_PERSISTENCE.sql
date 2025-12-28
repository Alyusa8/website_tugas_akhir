-- =========================================
-- PROFILE UPDATE FIX - COMPREHENSIVE
-- =========================================
-- This script fixes the issue where profile updates revert after logout/login
-- Execute this in Supabase SQL Editor

-- Step 1: Drop all existing policies first (clean slate)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Step 2: Drop all existing triggers on public.users (to prevent conflict)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

-- Step 2b: Drop triggers that depend on the shared function (from other tables)
-- Using DO blocks to safely handle if tables don't exist
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_detection_sessions_updated_at ON detection_sessions;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_detection_images_updated_at ON detection_images;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- Step 3: Drop all existing functions
DROP FUNCTION IF EXISTS public.handle_user_update();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_user_profile(UUID, TEXT, TEXT, DATE, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_profile(UUID);

-- Step 4: Ensure table exists and has correct structure
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 6: Create fresh RLS policies
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Step 7: Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger to update updated_at on any profile change
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Step 9: Create function to handle new user creation from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 
             NEW.raw_user_meta_data->>'name', 
             split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 
             NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- RECREATE TRIGGERS FOR OTHER TABLES
-- =========================================
-- Recreate the triggers for other tables that use update_updated_at_column()
-- Using DO blocks to safely handle if tables don't exist

-- For detection_sessions table
DO $$
BEGIN
  CREATE TRIGGER update_detection_sessions_updated_at
    BEFORE UPDATE ON detection_sessions
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN OTHERS THEN
  NULL; -- Silently fail if table doesn't exist
END;
$$;

-- For detection_images table
DO $$
BEGIN
  CREATE TRIGGER update_detection_images_updated_at
    BEFORE UPDATE ON detection_images
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN OTHERS THEN
  NULL; -- Silently fail if table doesn't exist
END;
$$;

-- For sessions table
DO $$
BEGIN
  CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN OTHERS THEN
  NULL; -- Silently fail if table doesn't exist
END;
$$;

-- =========================================
-- IMPORTANT NOTES
-- =========================================
-- 
-- PROFILE SYNC POLICY:
-- - New user registration: SYNC full_name from auth.users metadata (via trigger on_auth_user_created)
-- - Profile updates: DO NOT sync from auth.users (user updates public.users directly)
-- - Email sync: SKIPPED (email changes managed by Supabase Auth)
--
-- This ensures:
-- 1. Initial profile data is created from auth metadata during registration ✓
-- 2. User edits to profile are NEVER overwritten by auth system ✓
-- 3. Profile persists after logout/login ✓

-- =========================================
-- VERIFICATION QUERIES
-- =========================================

-- Run these queries to verify the fix:

-- 1. Check that RLS is enabled and policies exist
-- SELECT tablename, *
-- FROM pg_policies 
-- WHERE tablename = 'users';

-- 2. Check that triggers exist
-- SELECT trigger_name, event_object_table, event_manipulation
-- FROM information_schema.triggers 
-- WHERE event_object_table = 'users' 
-- AND trigger_schema = 'public';

-- 3. Check that functions exist
-- SELECT routine_name, routine_type
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('update_updated_at_column', 'handle_new_user');

-- 4. Test query (run as authenticated user):
-- SELECT id, email, full_name FROM public.users WHERE id = auth.uid();

-- =========================================
-- IF YOU NEED TO RESET A USER'S PROFILE DATA
-- =========================================

-- Run this if you want to reset a specific user's profile (CAUTION!):
-- UPDATE public.users 
-- SET full_name = 'New Name'
-- WHERE id = 'user-uuid-here';

-- Or use direct SQL to update:
-- UPDATE public.users 
-- SET full_name = 'Jane Smith', phone = '123456789'
-- WHERE id = auth.uid();
