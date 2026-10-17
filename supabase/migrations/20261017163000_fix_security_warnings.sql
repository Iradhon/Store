-- ==============================================================================
-- MIGRATION: 20261017163000_fix_security_warnings.sql
-- Description: Hardens RLS, sets function search_path, and restricts direct execution.
-- ==============================================================================

-- 1. Fix "Function Search Path Mutable" and revoke execution on handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

-- Revoke direct RPC execution from public/anon/authenticated roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Revoke execution and set search_path on rls_auto_enable() if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
    EXECUTE 'ALTER FUNCTION public.rls_auto_enable() SET search_path = public;';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public, anon, authenticated;';
  END IF;
END $$;

-- 3. Fix "RLS Policy Always True" on public.orders
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Allow inserting valid orders" ON public.orders;

CREATE POLICY "Allow inserting valid orders" 
  ON public.orders FOR INSERT 
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- 4. Fix "RLS Policy Always True" on public.order_items
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Allow inserting valid order items" ON public.order_items;

CREATE POLICY "Allow inserting valid order items" 
  ON public.order_items FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (
        (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()) OR
        (auth.uid() IS NULL AND orders.user_id IS NULL)
      )
    )
  );
