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
