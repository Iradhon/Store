-- ==============================================================================
-- MIGRATION: 20261017173000_fix_performance_advisor.sql
-- Description: Optimizes RLS evaluation using (select auth.uid()), eliminates overlapping policies, and adds FK indexes.
-- ==============================================================================

-- Step 1: Cleanly drop all existing/duplicate policies on these tables
DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('profiles', 'products', 'orders', 'order_items')
  LOOP 
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP; 
END $$;

-- Step 2: Re-create Optimized PROFILES Policies
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id);

-- Step 3: Re-create Optimized PRODUCTS Policies (No overlapping SELECTs)
CREATE POLICY "products_select_policy"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "products_insert_policy"
  ON public.products FOR INSERT
  WITH CHECK ((select auth.role()) IN ('service_role', 'authenticated'));

CREATE POLICY "products_update_policy"
  ON public.products FOR UPDATE
  USING ((select auth.role()) IN ('service_role', 'authenticated'));

CREATE POLICY "products_delete_policy"
  ON public.products FOR DELETE
  USING ((select auth.role()) IN ('service_role', 'authenticated'));

-- Step 4: Re-create Optimized ORDERS Policies
CREATE POLICY "orders_select_policy"
  ON public.orders FOR SELECT
  USING (
    user_id = (select auth.uid()) OR user_id IS NULL
  );

CREATE POLICY "orders_insert_policy"
  ON public.orders FOR INSERT
  WITH CHECK (
    ((select auth.uid()) IS NOT NULL AND user_id = (select auth.uid())) OR
    ((select auth.uid()) IS NULL AND user_id IS NULL)
  );

-- Step 5: Re-create Optimized ORDER_ITEMS Policies
CREATE POLICY "order_items_select_policy"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = (select auth.uid()) OR orders.user_id IS NULL)
    )
  );

CREATE POLICY "order_items_insert_policy"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (
        ((select auth.uid()) IS NOT NULL AND orders.user_id = (select auth.uid())) OR
        ((select auth.uid()) IS NULL AND orders.user_id IS NULL)
      )
    )
  );

-- Step 6: Create Foreign Key Indexes for fast joins & lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
