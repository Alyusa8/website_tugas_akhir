-- Test RLS policies for users table
-- Run this to check current policies

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Test if current user can update
-- Replace 'your-user-id' with actual user ID
SELECT 
  id, 
  email, 
  full_name,
  auth.uid() as current_user_id,
  (id = auth.uid()) as can_update
FROM users 
WHERE id = 'your-user-id';

-- Try manual update to test permissions
-- UPDATE users SET full_name = 'Test Update' WHERE id = auth.uid();