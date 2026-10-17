-- ==============================================================================
-- SUPABASE E-COMMERCE DATABASE SCHEMA & SECURITY POLICIES
-- ==============================================================================
-- Run this in your Supabase Project -> SQL Editor to set up tables, RLS, and seed data.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. PROFILES TABLE (Linked with Supabase auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger to automatically create a profile row when a new user signs up
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

-- Revoke public execution of handle_new_user (it only runs via trigger)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 3. PRODUCTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  rating NUMERIC(3, 1) DEFAULT 4.8,
  reviews_count INTEGER DEFAULT 0,
  in_stock BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products Policies: Anyone can view products
CREATE POLICY "Products are publicly viewable by everyone" 
  ON public.products FOR SELECT 
  USING (true);

-- Only authenticated users/service role can manage products
CREATE POLICY "Admins can manage products" 
  ON public.products FOR ALL 
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- ==============================================================================
-- 4. ORDERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  shipping_address JSONB NOT NULL,
  shipping_method TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  shipping_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders Policies:
-- 1. Anyone (including guest checkouts) can insert orders with valid user ownership
CREATE POLICY "Allow inserting valid orders" 
  ON public.orders FOR INSERT 
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- 2. Authenticated users can view their own orders
CREATE POLICY "Users can view their own orders" 
  ON public.orders FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ==============================================================================
-- 5. ORDER ITEMS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can view order items for their orders" 
  ON public.order_items FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );

-- ==============================================================================
-- 6. SEED PRODUCTS
-- ==============================================================================
INSERT INTO public.products (id, name, category, price, description, image, rating, reviews_count, in_stock, featured, created_at)
VALUES
  ('prod-1', 'Aurora Wireless Headphones', 'Audio', 249.99, 'Premium noise-cancelling wireless headphones with deep acoustic clarity and 40-hour battery life.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', 4.9, 128, true, true, '2026-03-01T10:00:00Z'),
  ('prod-2', 'Minimalist Studio Desk Lamp', 'Home', 89.00, 'Precision dimmable LED task light with sleek matte aluminum finish and warm ambient illumination.', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80', 4.7, 84, true, true, '2026-03-02T11:30:00Z'),
  ('prod-3', 'Nomad Canvas Backpack', 'Accessories', 135.50, 'Weather-resistant waxed canvas daypack with padded laptop sleeve and vegetable-tanned leather trim.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80', 4.8, 95, true, true, '2026-03-03T09:15:00Z'),
  ('prod-4', 'Chronos Smart Watch', 'Electronics', 299.00, 'Sapphire glass smartwatch with heart rate monitoring, titanium bezel, and always-on AMOLED display.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80', 4.9, 210, true, true, '2026-03-04T14:20:00Z'),
  ('prod-5', 'Acoustic Portable Speaker', 'Audio', 119.00, '360-degree high-fidelity Bluetooth speaker engineered with dual passive radiators and waterproof casing.', 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80', 4.6, 67, true, false, '2026-03-05T08:00:00Z'),
  ('prod-6', 'Mechanical Ergonomic Keyboard', 'Electronics', 179.99, 'Custom hot-swappable mechanical keyboard with lubricated switches and sculpted PBT keycaps.', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80', 4.9, 142, true, false, '2026-03-06T16:45:00Z'),
  ('prod-7', 'Artisan Ceramic Pour-Over Set', 'Home', 64.00, 'Handcrafted stoneware coffee dripper with heat-retaining double wall and matching serving carafe.', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80', 4.7, 53, true, false, '2026-03-07T12:10:00Z'),
  ('prod-8', 'Signature Leather Cardholder', 'Accessories', 48.00, 'Slim Italian full-grain leather wallet with 6 card slots and RFID protection shield.', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80', 4.8, 110, true, false, '2026-03-08T15:30:00Z'),
  ('prod-9', 'Linear Noise-Cancelling Earbuds', 'Audio', 189.99, 'True wireless in-ear monitors with adaptive transparency mode and wireless fast charging case.', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80', 4.7, 76, true, false, '2026-03-09T09:00:00Z'),
  ('prod-10', 'Modernist Matte Sunglasses', 'Accessories', 110.00, 'Polarized UV400 lenses housed in handcrafted acetate frames with Japanese titanium hinges.', 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80', 4.6, 49, true, false, '2026-03-10T11:20:00Z'),
  ('prod-11', 'Precision Wireless Mouse', 'Electronics', 95.00, 'Ultra-lightweight wireless gaming and productivity mouse with 8K polling rate and ergonomic contour.', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80', 4.8, 91, true, false, '2026-03-11T13:40:00Z'),
  ('prod-12', 'Scented Soy Candle Trio', 'Home', 52.00, 'Hand-poured pure botanical soy wax candles with notes of amber, cedarwood, and wild bergamot.', 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80', 4.9, 62, true, false, '2026-03-12T17:00:00Z'),
  ('prod-13', 'Studio Reference Monitor', 'Electronics', 380.00, 'Ultra-crisp 4K IPS display with factory color calibration and single-cable USB-C power delivery.', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80', 4.9, 38, true, false, '2026-03-13T10:15:00Z'),
  ('prod-14', 'Insulated Thermal Flask', 'Home', 38.00, 'Double-walled vacuum insulated stainless steel bottle keeping drinks cold for 24h or hot for 12h.', 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80', 4.8, 145, true, false, '2026-03-14T08:30:00Z'),
  ('prod-15', 'Minimalist Aluminum Pen', 'Accessories', 32.00, 'CNC machined anodized aluminum rollerball pen balanced for effortless all-day writing.', 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80', 4.7, 52, true, false, '2026-03-15T14:50:00Z'),
  ('prod-16', 'Vintage Turntable Record Player', 'Audio', 215.00, 'Belt-driven vinyl record player with built-in stereo speakers and Bluetooth wireless output.', 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=80', 4.8, 88, true, false, '2026-03-16T12:00:00Z')
ON CONFLICT (id) DO NOTHING;
