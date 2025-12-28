-- Fix the trigger function to preserve user profile updates
-- This will prevent the trigger from overwriting manually updated profile data

CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users SET
    email = NEW.email,
    -- Only update full_name from metadata if it doesn't exist in database (preserve user updates)
    full_name = CASE 
      WHEN full_name IS NULL OR full_name = '' THEN 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
      ELSE full_name  -- Keep existing database value
    END,
    -- Only update avatar_url from metadata if it doesn't exist in database
    avatar_url = CASE
      WHEN avatar_url IS NULL OR avatar_url = '' THEN
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
      ELSE avatar_url  -- Keep existing database value
    END,
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;