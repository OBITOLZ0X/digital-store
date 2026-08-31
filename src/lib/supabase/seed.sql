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
