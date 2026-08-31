-- ============================================================
-- Digital Store - Fresh Reset + Seed Script (CORRECTED)
-- ============================================================
-- شغّل هذا الملف في Supabase SQL Editor
-- 1. يحذف كل البيانات مع الحفاظ على الهيكل والسياسات
-- 2. يعيد تعبئة Categories + Products + Variants + Inventory
-- ============================================================

-- ============================================================
-- المرحلة 1: حذف كل البيانات (مرتب حسب الاعتماديات)
-- ============================================================

-- تعطيل الفحوصات مؤقتاً لتسريع الحذف (اختياري)
-- نحذف من الأبناء أولاً ثم الآباء

DELETE FROM public.subscriptions;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.inventory_items;
DELETE FROM public.coupon_usages;
DELETE FROM public.favorites;
DELETE FROM public.notifications;
DELETE FROM public.admin_logs;
DELETE FROM public.wallet_transactions;
DELETE FROM public.deposit_requests;
DELETE FROM public.product_variants;
DELETE FROM public.products;
DELETE FROM public.coupons;
DELETE FROM public.categories;
DELETE FROM public.wallets;
DELETE FROM public.profiles;
DELETE FROM public.store_settings;
-- deposit_methods نحتفظ بها أو نحذفها ثم نعيدها
DELETE FROM public.deposit_methods;

-- حذف auth.users يتم عبر API فقط (انظر scripts/reset-users.mjs)
-- لا نحاول DELETE FROM auth.users هنا لأنه يتطلب صلاحيات خاصة


-- ============================================================
-- المرحلة 2: إعادة التعبئة
-- ============================================================

-- 2.1 إعدادات المتجر
INSERT INTO public.store_settings (key, value) VALUES
  ('store_name', 'Digital Store'),
  ('store_description', 'متجر المنتجات الرقمية — اشتراكات، برمجيات، مفاتيح، بطاقات هدايا'),
  ('default_currency', 'DZD'),
  ('default_language', 'ar'),
  ('maintenance_mode', 'false'),
  ('contact_email', 'contact@digitalstore.dz'),
  ('support_hours', '09:00 - 22:00')
ON CONFLICT (key) DO NOTHING;

-- 2.2 طرق الدفع
INSERT INTO public.deposit_methods (name, code, description, sort_order) VALUES
  ('CCP (Post Office)', 'ccp', 'Payment via Algerian Post Office check', 1),
  ('BaridiMob', 'baridimob', 'Mobile payment via Algerian Post Office', 2),
  ('Bank Transfer', 'bank_transfer', 'Direct bank transfer', 3),
  ('Cryptocurrency', 'crypto', 'Bitcoin, USDT, and other cryptocurrencies', 4),
  ('Manual Payment', 'manual', 'Pay directly when collecting', 5)
ON CONFLICT (code) DO NOTHING;

-- 2.3 الفئات (8 فئات) - نستخدم gen_random_uuid() لتجنب أخطاء UUID
INSERT INTO public.categories (name, slug, description, sort_order) VALUES
  ('Streaming & OTT', 'streaming', 'اشتراكات البث: Netflix، Amazon، Disney+', 1),
  ('IPTV', 'iptv', 'باقات IPTV قنوات رياضية و VOD و EPG', 2),
  ('Software', 'software', 'تراخيص برمجيات: Office، Adobe، Antivirus، OS', 3),
  ('Game Keys', 'game-keys', 'مفاتيح ألعاب: Steam، PlayStation، Xbox، Epic', 4),
  ('Gift Cards', 'gift-cards', 'بطاقات هدية رقمية', 5),
  ('VPN & Privacy', 'vpn', 'خدمات VPN والخصوصية', 6),
  ('AI Tools', 'ai-tools', 'أدوات الذكاء الاصطناعي', 7),
  ('Digital Accounts', 'digital-accounts', 'حسابات جاهزة', 8)
ON CONFLICT (slug) DO NOTHING;

-- 2.4 المنتجات + Variants + Inventory عبر DO block (لتجنب hardcoding UUIDs)
DO $$
DECLARE
  cat_streaming UUID;
  cat_iptv UUID;
  cat_software UUID;
  cat_game UUID;
  cat_gift UUID;
  cat_vpn UUID;
  cat_ai UUID;
  cat_accounts UUID;
  prod_netflix UUID;
  prod_iptv UUID;
  prod_win UUID;
  prod_office UUID;
  prod_steam UUID;
  prod_vpn UUID;
  prod_anydesk UUID;
  prod_midj UUID;
BEGIN
  SELECT id INTO cat_streaming FROM public.categories WHERE slug='streaming' LIMIT 1;
  SELECT id INTO cat_iptv FROM public.categories WHERE slug='iptv' LIMIT 1;
  SELECT id INTO cat_software FROM public.categories WHERE slug='software' LIMIT 1;
  SELECT id INTO cat_game FROM public.categories WHERE slug='game-keys' LIMIT 1;
  SELECT id INTO cat_gift FROM public.categories WHERE slug='gift-cards' LIMIT 1;
  SELECT id INTO cat_vpn FROM public.categories WHERE slug='vpn' LIMIT 1;
  SELECT id INTO cat_ai FROM public.categories WHERE slug='ai-tools' LIMIT 1;
  SELECT id INTO cat_accounts FROM public.categories WHERE slug='digital-accounts' LIMIT 1;

  -- المنتج 1: Netflix Premium (variants only, price=0 في الأعلى)
  INSERT INTO public.products (id, name, slug, description, short_description, category_id, images, price, compare_at_price, currency, stock, sku, status, is_featured, is_popular, tags, product_type, delivery_type, subscription_duration_days, instructions)
  VALUES (gen_random_uuid(), 'Netflix Premium', 'netflix-premium', 'حساب Netflix فردي 4K UHD على 4 أجهزة. تسليم فوري بعد الدفع.', '4K على 4 أجهزة', cat_streaming, ARRAY['https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&h=400&fit=crop'], 0, NULL, 'DZD', 0, 'NETFLIX-P', 'active', true, true, ARRAY['netflix','streaming','4K'], 'subscription', 'automatic', 30, 'بيانات الدخول تسلم فورا. لا تغير كلمة المرور.')
  ON CONFLICT (slug) DO NOTHING RETURNING id INTO prod_netflix;

  -- إذا كان المنتج موجود مسبقا (ON CONFLICT DO NOTHING) فلن يرجع id، نجلبه
  IF prod_netflix IS NULL THEN SELECT id INTO prod_netflix FROM public.products WHERE slug='netflix-premium' LIMIT 1; END IF;

  INSERT INTO public.product_variants (id, product_id, name, duration_days, price, compare_at_price, stock, sku, sort_order) VALUES
    (gen_random_uuid(), prod_netflix, 'شهر واحد', 30, 1200, 1500, 25, 'NETFLIX-1M', 1),
    (gen_random_uuid(), prod_netflix, '3 أشهر', 90, 3200, 4000, 18, 'NETFLIX-3M', 2),
    (gen_random_uuid(), prod_netflix, '12 شهر', 365, 11000, 14000, 10, 'NETFLIX-12M', 3)
  ON CONFLICT DO NOTHING;

  -- المنتج 2: IPTV Premium
  INSERT INTO public.products (id, name, slug, description, short_description, category_id, images, price, compare_at_price, currency, stock, sku, status, is_featured, is_popular, tags, product_type, delivery_type, subscription_duration_days, instructions)
  VALUES (gen_random_uuid(), 'IPTV Premium — قنوات عالمية', 'iptv-premium', '10,000+ قناة عالمية، VOD، EPG. Xtream Codes + M3U. دعم 24 ساعة.', '10k+ قناة رياضية وأفلام', cat_iptv, ARRAY['https://images.unsplash.com/photo-1593359677879-a4bb92f367d8?w=600&h=400&fit=crop'], 0, NULL, 'DZD', 0, 'IPTV-PREM', 'active', true, true, ARRAY['iptv','xtream','m3u'], 'iptv', 'automatic', 30, 'M3U و Xtream Codes يرسلان خلال دقائق.')
  ON CONFLICT (slug) DO NOTHING RETURNING id INTO prod_iptv;
  IF prod_iptv IS NULL THEN SELECT id INTO prod_iptv FROM public.products WHERE slug='iptv-premium' LIMIT 1; END IF;

  INSERT INTO public.product_variants (id, product_id, name, duration_days, price, stock, sku, sort_order) VALUES
    (gen_random_uuid(), prod_iptv, 'شهر واحد', 30, 1200, 12, 'IPTV-1M', 1),
    (gen_random_uuid(), prod_iptv, '3 أشهر', 90, 3000, 8, 'IPTV-3M', 2),
    (gen_random_uuid(), prod_iptv, '12 شهر', 365, 4500, 5, 'IPTV-12M', 3)
  ON CONFLICT DO NOTHING;

  -- المنتج 3: Windows 11 Pro (بدون variants - سعر ثابت)
  INSERT INTO public.products (id, name, slug, description, short_description, category_id, images, price, compare_at_price, currency, stock, sku, status, is_featured, is_popular, tags, product_type, delivery_type)
  VALUES (gen_random_uuid(), 'Windows 11 Pro — تفعيل نهائي', 'windows-11-pro-lifetime', 'مفتاح تفعيل Windows 11 Pro صالح نهائيا. ترخيص واحد.', 'ترخيص نهائي', cat_software, ARRAY['https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=600&h=400&fit=crop'], 2500, 4000, 'DZD', 150, 'WIN11PRO-L', 'active', true, true, ARRAY['windows','microsoft'], 'digital_key', 'automatic')
  ON CONFLICT (slug) DO NOTHING RETURNING id INTO prod_win;
  IF prod_win IS NULL THEN SELECT id INTO prod_win FROM public.products WHERE slug='windows-11-pro-lifetime' LIMIT 1; END IF;

  INSERT INTO public.inventory_items (id, product_id, variant_id, product_data, status)
  SELECT gen_random_uuid(), prod_win, NULL, jsonb_build_object('key', 'XXXXX-XXXXX-XXXXX-XXXXX-'||LPAD(gs::text,5,'0')), 'available'
  FROM generate_series(1,15) gs;

  -- المنتج 4: Office 365 Family
  INSERT INTO public.products (id, name, slug, description, short_description, category_id, images, price, compare_at_price, currency, stock, sku, status, is_featured, tags, product_type, delivery_type, subscription_duration_days)
  VALUES (gen_random_uuid(), 'Microsoft Office 365 عائلة', 'office-365-family', 'Office 365 Family — 6 أجهزة، Word، Excel، PowerPoint، OneDrive 1TB.', '6 أجهزة · 1TB سحابة', cat_software, ARRAY['https://images.unsplash.com/photo-1542281788-513404313145?w=600&h=400&fit=crop'], 3500, 5000, 'DZD', 80, 'OFFICE365-FAM', 'active', true, ARRAY['office','microsoft'], 'subscription', 'automatic', 365)
  ON CONFLICT (slug) DO NOTHING RETURNING id INTO prod_office;
  IF prod_office IS NULL THEN SELECT id INTO prod_office FROM public.products WHERE slug='office-365-family' LIMIT 1; END IF;

  INSERT INTO public.inventory_items (id, product_id, product_data, status)
  SELECT gen_random_uuid(), prod_office, jsonb_build_object('license', 'OFFICE365-FAM-'||LPAD(gs::text,4,'0'), 'email', 'license'||gs||'@digitalstore.dz'), 'available'
  FROM generate_series(1,10) gs;

  -- المنتج 5: Steam Gift Card 50€
  INSERT INTO public.products (id, name, slug, description, short_description, category_id, images, price, compare_at_price, currency, stock, sku, status, is_popular, tags, product_type, delivery_type)
  VALUES (gen_random_uuid(), 'بطاقة هدية Steam 50 يورو', 'steam-gift-card-50-eur', 'رمز هدية Steam بقيمة 50€ لإضافة رصيد.', '50€ · صالح عالميا', cat_gift, ARRAY['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=400&fit=crop'], 7500, 8500, 'DZD', 30, 'STEAM-50EUR', 'active', ARRAY['steam','gift'], 'gift_card', 'automatic')
  ON CONFLICT (slug) DO NOTHING RETURNING id INTO prod_steam;

  -- المنتج 6: ExpressVPN
  INSERT INTO public.products (id, name, slug, description, short_description, category_id, images, price, currency, stock, sku, status, is_featured, is_popular, tags, product_type, delivery_type, subscription_duration_days)
  VALUES (gen_random_uuid(), 'ExpressVPN — عام كامل', 'expressvpn-1-year', 'ExpressVPN 12 شهر. 105 دولة، تشفير AES-256.', '12 شهر · 105 دولة', cat_vpn, ARRAY['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop'], 0, 'DZD', 0, 'EXPRESSVPN-1Y', 'active', true, ARRAY['vpn','privacy'], 'subscription', 'automatic', 365)
  ON CONFLICT (slug) DO NOTHING RETURNING id INTO prod_vpn;
  IF prod_vpn IS NULL THEN SELECT id INTO prod_vpn FROM public.products WHERE slug='expressvpn-1-year' LIMIT 1; END IF;

  INSERT INTO public.product_variants (id, product_id, name, duration_days, price, stock, sku, sort_order) VALUES
    (gen_random_uuid(), prod_vpn, 'شهر واحد', 30, 800, 20, 'EXPR-VPN-1M', 1),
    (gen_random_uuid(), prod_vpn, '12 شهر', 365, 4000, 10, 'EXPR-VPN-1Y', 2)
  ON CONFLICT DO NOTHING;

  -- المنتج 7: AnyDesk Pro
  INSERT INTO public.products (id, name, slug, description, short_description, category_id, images, price, compare_at_price, currency, stock, sku, status, is_popular, tags, product_type, delivery_type, subscription_duration_days)
  VALUES (gen_random_uuid(), 'AnyDesk Pro — سنة كاملة', 'anydesk-pro-year', 'ترخيص AnyDesk Pro لجهاز واحد لمدة سنة.', 'جهاز واحد · سنة كاملة', cat_software, ARRAY['https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop'], 2200, 3500, 'DZD', 70, 'ANYDESK-PRO-1Y', 'active', ARRAY['anydesk','remote'], 'subscription', 'automatic', 365)
  ON CONFLICT (slug) DO NOTHING RETURNING id INTO prod_anydesk;

  -- المنتج 8: MidJourney Pro
  INSERT INTO public.products (id, name, slug, description, short_description, category_id, images, price, compare_at_price, currency, stock, sku, status, is_featured, is_popular, tags, product_type, delivery_type, subscription_duration_days)
  VALUES (gen_random_uuid(), 'MidJourney Pro — 12 شهر', 'midjourney-pro-12m', 'حساب MidJourney Pro 12 شهر. صور 4K، Discord VIP.', 'صور 4K · Discord VIP', cat_ai, ARRAY['https://images.unsplash.com/photo-1620641788421-7a1c342ead82?w=600&h=400&fit=crop'], 6000, 9000, 'DZD', 30, 'MIDJ-P-12M', 'active', true, ARRAY['midjourney','ai'], 'subscription', 'automatic', 365)
  ON CONFLICT (slug) DO NOTHING RETURNING id INTO prod_midj;

END $$;

-- تحقق نهائي
SELECT '✅ تمت إعادة التعبئة' AS status,
       (SELECT COUNT(*) FROM public.categories) AS categories,
       (SELECT COUNT(*) FROM public.products) AS products,
       (SELECT COUNT(*) FROM public.product_variants) AS variants,
       (SELECT COUNT(*) FROM public.inventory_items) AS inventory;
