-- ==============================================================================
-- ASSIGN ADMIN ROLE TO YOUR SPECIFIC EMAIL (honoreirad50@gmail.com)
-- ==============================================================================

-- 1. Ensure role column exists on profiles with default 'customer'
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';

-- 2. Update handle_new_user trigger function to auto-assign 'admin' to your email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  assigned_role TEXT := 'customer';
BEGIN
  -- Automatically grant 'admin' role to honoreirad50@gmail.com
  IF LOWER(NEW.email) = 'honoreirad50@gmail.com' THEN
    assigned_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = EXCLUDED.role,
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

  RETURN NEW;
END;
$$;

-- Secure execution
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

-- 3. Upgrade your profile to admin if you already signed up
UPDATE public.profiles 
SET role = 'admin' 
WHERE LOWER(email) = 'honoreirad50@gmail.com';
