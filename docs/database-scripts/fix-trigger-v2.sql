-- Temporary disable the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Create a better trigger that doesn't overwrite existing data
CREATE OR REPLACE FUNCTION public.handle_user_update_safe()
RETURNS TRIGGER AS $$
DECLARE
  existing_user record;
BEGIN
  -- Get existing user data
  SELECT * INTO existing_user FROM public.users WHERE id = NEW.id;
  
  -- Only update if user doesn't exist, or update only empty fields
  INSERT INTO public.users (id, email, full_name, avatar_url, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    -- Only update these fields if they are currently NULL or empty
    full_name = CASE 
      WHEN users.full_name IS NULL OR users.full_name = '' THEN 
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
      ELSE users.full_name
    END,
    avatar_url = CASE 
      WHEN users.avatar_url IS NULL OR users.avatar_url = '' THEN 
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
      ELSE users.avatar_url
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the new trigger
CREATE TRIGGER on_auth_user_updated_safe
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update_safe();