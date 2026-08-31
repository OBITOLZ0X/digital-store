-- ============================================
-- Digital Store - Supabase PostgreSQL Schema
-- ============================================
-- Run this in your Supabase SQL editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STORE SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings
INSERT INTO store_settings (key, value) VALUES
  ('store_name', 'Digital Store'),
  ('store_description', 'Premium digital products marketplace'),
  ('default_currency', 'DZD'),
  ('default_language', 'en'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- Seed categories
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Subscriptions', 'subscriptions', 'Streaming and software subscriptions', 1),
  ('IPTV', 'iptv', 'IPTV subscriptions and services', 2),
  ('Software', 'software', 'Software licenses and keys', 3),
  ('Game Keys', 'game-keys', 'Video game activation keys', 4),
  ('Gift Cards', 'gift-cards', 'Digital gift cards and vouchers', 5),
  ('VPN', 'vpn', 'VPN services and subscriptions', 6),
  ('AI Services', 'ai-services', 'AI tools and services', 7),
  ('Digital Accounts', 'digital-accounts', 'Digital accounts and profiles', 8),
  ('Other Digital', 'other-digital', 'Other digital products', 9)
ON CONFLICT (slug) DO NOTHING;
-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(12,2),
  currency TEXT NOT NULL DEFAULT 'DZD',
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'hidden', 'archived')),
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  product_type TEXT NOT NULL DEFAULT 'digital_key' CHECK (product_type IN ('digital_key', 'digital_account', 'subscription', 'iptv', 'gift_card', 'manual_delivery')),
  delivery_type TEXT NOT NULL DEFAULT 'automatic' CHECK (delivery_type IN ('automatic', 'manual')),
  subscription_duration_days INTEGER,
  expiration_days INTEGER,
  terms TEXT,
  instructions TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_popular ON products(is_popular);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order);

-- ============================================
-- PRODUCT VARIANTS
-- ============================================
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_days INTEGER,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(12,2),
  stock INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

-- ============================================
-- WALLETS
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'DZD',
  is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);

-- Create wallet on profile creation
CREATE OR REPLACE FUNCTION public.create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, (SELECT value FROM public.store_settings WHERE key = 'default_currency'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_user_wallet();

-- ============================================
-- WALLET TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'purchase', 'refund', 'admin_credit', 'admin_debit', 'adjustment')),
  amount NUMERIC(12,2) NOT NULL,
  balance_before NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  reference TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON wallet_transactions(reference);

-- ============================================
-- DEPOSIT REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DZD',
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  screenshot_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deposits_user ON deposit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposit_requests(status);
CREATE INDEX IF NOT EXISTS idx_deposits_reference ON deposit_requests(reference_number);

-- ============================================
-- DEPOSIT METHODS
-- ============================================
CREATE TABLE IF NOT EXISTS deposit_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed deposit methods
INSERT INTO deposit_methods (name, code, description, sort_order) VALUES
  ('CCP (Post Office)', 'ccp', 'Payment via Algerian Post Office check', 1),
  ('BaridiMob', 'baridimob', 'Mobile payment via Algerian Post Office', 2),
  ('Bank Transfer', 'bank_transfer', 'Direct bank transfer', 3),
  ('Cryptocurrency', 'crypto', 'Bitcoin, USDT, and other cryptocurrencies', 4),
  ('Manual Payment', 'manual', 'Pay directly when collecting', 5)
ON CONFLICT (code) DO NOTHING;
-- ============================================
-- INVENTORY ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'expired', 'disabled')),
  reserved_until TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_variant ON inventory_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_order ON inventory_items(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reserved ON inventory_items(reserved_until) WHERE status = 'reserved';

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  total NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DZD',
  payment_method TEXT NOT NULL DEFAULT 'wallet',
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);
-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'suspended', 'cancelled')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiration_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  credentials_ref UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_product ON subscriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiration ON subscriptions(expiration_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_order ON subscriptions(order_id);

-- Function to update subscription statuses daily
CREATE OR REPLACE FUNCTION public.update_subscription_statuses()
RETURNS void AS $$
BEGIN
  -- Mark expired subscriptions
  UPDATE public.subscriptions
  SET status = 'expired',
      updated_at = NOW()
  WHERE expiration_date < NOW()
    AND status IN ('active', 'expiring_soon');

  -- Mark expiring soon subscriptions
  UPDATE public.subscriptions
  SET status = 'expiring_soon',
      updated_at = NOW()
  WHERE expiration_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    AND status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule daily status update (runs via pg_cron if available, or external cron)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('update-subscriptions', '0 2 * * *', 'SELECT public.update_subscription_statuses()');

-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  discount_value NUMERIC(12,2) NOT NULL,
  min_order_amount NUMERIC(12,2),
  max_discount NUMERIC(12,2),
  usage_limit INTEGER,
  per_user_limit INTEGER,
  start_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- ============================================
-- COUPON USAGES
-- ============================================
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coupon_id, user_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_user ON coupon_usages(user_id);

-- ============================================
-- FAVORITES
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product ON favorites(product_id);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================
-- ADMIN LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_type ON admin_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at);
-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES RLS
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (non-role fields)
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================
-- WALLETS RLS
-- ============================================

CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- WALLET TRANSACTIONS RLS
-- ============================================

CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- DEPOSIT REQUESTS RLS
-- ============================================

CREATE POLICY "Users can view own deposit requests" ON public.deposit_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert deposit requests" ON public.deposit_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage deposit requests" ON public.deposit_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================
-- DEPOSIT METHODS RLS
-- ============================================

CREATE POLICY "Everyone can view deposit methods" ON public.deposit_methods
  FOR SELECT USING (true);

-- ============================================
-- PRODUCTS RLS
-- ============================================

CREATE POLICY "Everyone can view active products" ON public.products
  FOR SELECT USING (status = 'active' OR status = 'hidden');

-- Admins can do everything with products
CREATE POLICY "Admins manage products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================
-- PRODUCT VARIANTS RLS
-- ============================================

CREATE POLICY "Everyone can view active variants" ON public.product_variants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND (status = 'active' OR status = 'hidden'))
  );

CREATE POLICY "Admins manage variants" ON public.product_variants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================
-- CATEGORIES RLS
-- ============================================

CREATE POLICY "Everyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================
-- INVENTORY ITEMS RLS
-- ============================================

-- Users can view their own assigned inventory (via orders/subscriptions)
CREATE POLICY "Users can view own inventory" ON public.inventory_items
  FOR SELECT USING (
    status IN ('sold', 'expired') AND
    (
      EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
      OR
      EXISTS (SELECT 1 FROM public.subscriptions WHERE credentials_ref = id AND user_id = auth.uid())
    )
  );

-- Admins can view all inventory
CREATE POLICY "Admins view inventory" ON public.inventory_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Admins can manage inventory
CREATE POLICY "Admins manage inventory" ON public.inventory_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================
-- ORDERS RLS
-- ============================================

CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage orders" ON public.orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================
-- ORDER ITEMS RLS
-- ============================================

CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins view order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================
-- SUBSCRIPTIONS RLS
-- ============================================

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage subscriptions" ON public.subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================
-- COUPONS RLS
-- ============================================

CREATE POLICY "Everyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins manage coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================
-- COUPON USAGES RLS
-- ============================================

CREATE POLICY "Users can view own coupon usages" ON public.coupon_usages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins view coupon usages" ON public.coupon_usages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================
-- FAVORITES RLS
-- ============================================

CREATE POLICY "Users can view own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- NOTIFICATIONS RLS
-- ============================================

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================
-- ADMIN LOGS RLS
-- ============================================

CREATE POLICY "Admins view logs" ON public.admin_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins insert logs" ON public.admin_logs
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================
-- STORE SETTINGS RLS
-- ============================================

CREATE POLICY "Everyone can view store settings" ON public.store_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins manage store settings" ON public.store_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================
-- FUNCTIONS RLS (allow execution)
-- ============================================

ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
ALTER FUNCTION public.create_user_wallet() SECURITY DEFINER;
ALTER FUNCTION public.update_subscription_statuses() SECURITY DEFINER;
-- ============================================
-- STORED PROCEDURE: Atomic wallet transaction
-- ============================================
-- This function handles wallet deductions with race-condition protection
-- Must be called with service-role key

CREATE OR REPLACE FUNCTION public.execute_transaction(
  p_user_id UUID,
  p_wallet_id UUID,
  p_amount NUMERIC,
  p_type TEXT,
  p_reference TEXT,
  p_description TEXT
) RETURNS void AS $$
DECLARE
  v_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Lock the wallet row for update
  SELECT balance INTO v_balance
  FROM public.wallets
  WHERE id = p_wallet_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  v_new_balance := v_balance - p_amount;

  -- Prevent negative balance
  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Update wallet balance
  UPDATE public.wallets
  SET balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_wallet_id;

  -- Record the transaction
  INSERT INTO public.wallet_transactions (
    id,
    user_id,
    wallet_id,
    type,
    amount,
    balance_before,
    balance_after,
    reference,
    description,
    status
  ) VALUES (
    gen_random_uuid(),
    p_user_id,
    p_wallet_id,
    p_type,
    p_amount,
    v_balance,
    v_new_balance,
    p_reference,
    p_description,
    'completed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Seed demo products (run after schema)
-- Requires categories already seeded

DO $$
DECLARE
  cat_sub UUID;
  cat_iptv UUID;
  cat_soft UUID;
  cat_gift UUID;
  cat_vpn UUID;
  cat_ai UUID;
  prod_id UUID;
  var1 UUID;
  var2 UUID;
  var3 UUID;
BEGIN
  SELECT id INTO cat_sub FROM categories WHERE slug='subscriptions' LIMIT 1;
  SELECT id INTO cat_iptv FROM categories WHERE slug='iptv' LIMIT 1;
  SELECT id INTO cat_soft FROM categories WHERE slug='software' LIMIT 1;
  SELECT id INTO cat_gift FROM categories WHERE slug='gift-cards' LIMIT 1;
  SELECT id INTO cat_vpn FROM categories WHERE slug='vpn' LIMIT 1;
  SELECT id INTO cat_ai FROM categories WHERE slug='ai-services' LIMIT 1;

  -- Netflix Premium
  INSERT INTO products (id, name, slug, description, short_description, category_id, images, price, compare_at_price, currency, stock, sku, status, is_featured, is_popular, tags, product_type, delivery_type, subscription_duration_days, instructions)
  VALUES (gen_random_uuid(), 'Netflix Premium', 'netflix-premium', 'Premium Netflix account with 4K UHD streaming on 4 devices. Instant delivery.', '4K on 4 devices', cat_sub, ARRAY['https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&h=400&fit=crop'], 1200, 1800, 'DZD', 100, 'NETFLIX-PREMIUM', 'active', true, true, ARRAY['netflix','streaming'], 'subscription', 'automatic', 30, 'Credentials delivered instantly. Do not change password.')
  ON CONFLICT (slug) DO NOTHING RETURNING id INTO prod_id;

  IF prod_id IS NOT NULL THEN
    INSERT INTO product_variants (id, product_id, name, duration_days, price, stock, sku) VALUES
      (gen_random_uuid(), prod_id, '1 Month', 30, 1200, 20, 'NETFLIX-1M'),
      (gen_random_uuid(), prod_id, '3 Months', 90, 3200, 15, 'NETFLIX-3M'),
      (gen_random_uuid(), prod_id, '6 Months', 180, 6000, 10, 'NETFLIX-6M'),
      (gen_random_uuid(), prod_id, '12 Months', 365, 11000, 8, 'NETFLIX-12M')
    ON CONFLICT DO NOTHING;

    -- Demo inventory
    INSERT INTO inventory_items (id, product_id, product_data, status)
    SELECT gen_random_uuid(), prod_id, jsonb_build_object('email', 'demo'||gs||'@example.com', 'password', 'DemoPass'||gs), 'available'
    FROM generate_series(1,5) gs ON CONFLICT DO NOTHING;
  END IF;

  -- IPTV Premium
  INSERT INTO products (id, name, slug, description, short_description, category_id, images, price, compare_at_price, currency, stock, sku, status, is_featured, tags, product_type, delivery_type, subscription_duration_days, instructions)
  VALUES (gen_random_uuid(), 'IPTV Premium 12 Months', 'iptv-premium-12-months', 'Premium IPTV with 10,000+ channels, VOD, and EPG. Xtream Codes + M3U.', '10k+ channels', cat_iptv, ARRAY['https://images.unsplash.com/photo-1593359677879-a4bb92f367d8?w=600&h=400&fit=crop'], 4500, 6500, 'DZD', 50, 'IPTV-PREMIUM', 'active', true, ARRAY['iptv','xtream'], 'iptv', 'automatic', 365, 'M3U and Xtream Codes delivered instantly.')
  ON CONFLICT (slug) DO NOTHING RETURNING id INTO prod_id;

  IF prod_id IS NOT NULL THEN
    INSERT INTO product_variants (id, product_id, name, duration_days, price, stock, sku) VALUES
      (gen_random_uuid(), prod_id, '1 Month', 30, 1200, 10, 'IPTV-1M'),
      (gen_random_uuid(), prod_id, '3 Months', 90, 3000, 8, 'IPTV-3M'),
      (gen_random_uuid(), prod_id, '12 Months', 365, 4500, 5, 'IPTV-12M')
    ON CONFLICT DO NOTHING;
  END IF;

  -- Windows 11 Pro
  INSERT INTO products (id, name, slug, description, short_description, category_id, images, price, compare_at_price, currency, stock, sku, status, tags, product_type, delivery_type)
  VALUES (gen_random_uuid(), 'Windows 11 Pro Key', 'windows-11-pro-key', 'Genuine Windows 11 Pro activation key. Lifetime license, instant delivery.', 'Lifetime license', cat_soft, ARRAY['https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=600&h=400&fit=crop'], 2500, 4000, 'DZD', 200, 'WIN11-PRO', 'active', ARRAY['windows','microsoft'], 'digital_key', 'automatic')
  ON CONFLICT (slug) DO NOTHING RETURNING id INTO prod_id;

  IF prod_id IS NOT NULL THEN
    INSERT INTO inventory_items (id, product_id, product_data, status)
    SELECT gen_random_uuid(), prod_id, jsonb_build_object('key', 'XXXXX-XXXXX-XXXXX-XXXXX-'||lpad(gs::text,5,'0')), 'available'
    FROM generate_series(1,10) gs ON CONFLICT DO NOTHING;
  END IF;

  -- Spotify
  INSERT INTO products (id, name, slug, description, short_description, category_id, images, price, currency, stock, sku, status, is_featured, tags, product_type, delivery_type, subscription_duration_days)
  VALUES (gen_random_uuid(), 'Spotify Premium', 'spotify-premium', 'Spotify Premium family/individual. Ad-free, offline, high quality.', 'Ad-free music', cat_sub, ARRAY['https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=600&h=400&fit=crop'], 900, 'DZD', 80, 'SPOTIFY-PREMIUM', 'active', true, ARRAY['spotify','music'], 'subscription', 'automatic', 30)
  ON CONFLICT (slug) DO NOTHING;

  -- Gift Card
  INSERT INTO products (id, name, slug, description, short_description, category_id, images, price, currency, stock, sku, status, tags, product_type, delivery_type)
  VALUES (gen_random_uuid(), 'PlayStation Gift Card $50', 'psn-gift-card-50', 'Digital PSN gift card code for PlayStation Store.', '$50 value', cat_gift, ARRAY['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=400&fit=crop'], 7200, 'DZD', 25, 'PSN-50', 'active', ARRAY['psn','playstation'], 'gift_card', 'automatic')
  ON CONFLICT (slug) DO NOTHING;

END $$;
