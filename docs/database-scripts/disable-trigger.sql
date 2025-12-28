-- Disable the problematic trigger completely
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- We'll handle user creation manually instead
-- The handle_new_user trigger for new users can stay