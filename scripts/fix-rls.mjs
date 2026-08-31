import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
const env = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
for (const l of env.split('\n')) { const m=l.match(/^([^=]+)=(.*)/); if(m) process.env[m[1].trim()]=m[2].trim().replace(/^"|"$/g,'') }
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const sql = `
-- Fix RLS recursion by using is_admin() for all admin policies, and fix orders visibility
DROP POLICY IF EXISTS "Admins can manage deposit requests" ON public.deposit_requests;
CREATE POLICY "Admins can manage deposit requests" ON public.deposit_requests FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products" ON public.products FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage variants" ON public.product_variants;
CREATE POLICY "Admins manage variants" ON public.product_variants FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins view inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Admins manage inventory" ON public.inventory_items;
CREATE POLICY "Admins view inventory" ON public.inventory_items FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins manage inventory" ON public.inventory_items FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage orders" ON public.orders;
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins view order items" ON public.order_items;
CREATE POLICY "Admins view order items" ON public.order_items FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins manage subscriptions" ON public.subscriptions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage coupons" ON public.coupons;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins view coupon usages" ON public.coupon_usages;
CREATE POLICY "Admins view coupon usages" ON public.coupon_usages FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins view logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins insert logs" ON public.admin_logs;
CREATE POLICY "Admins view logs" ON public.admin_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins insert logs" ON public.admin_logs FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage notifications" ON public.notifications;
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage store settings" ON public.store_settings;
CREATE POLICY "Admins manage store settings" ON public.store_settings FOR ALL USING (public.is_admin());

-- Ensure is_admin is stable and security definer (already)
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;
`
// Supabase JS cannot run raw SQL directly, need to use via postgres query using service role's REST? We use supabase dashboard SQL editor alternative: use the SQL via fetch to supabase rest postgrest? 
// Instead use the fact that service role can bypass RLS and we can try to execute via the "exec" workaround: Use the supabase query to call the SQL via the hidden pg function if exists, otherwise we instruct user.
// For now, try using fetch to the SQL endpoint if available (supabase cloud allows via /rest? but not)
// We'll attempt to use the supabase-js rpc for raw sql if the project has a helper, else we will print instructions.

console.log('This script prints the SQL to run manually in Supabase SQL Editor:')
console.log(sql)
console.log('\n--- Attempting via service role using direct postgres connection is not supported via JS. Please run the above SQL in Supabase Dashboard → SQL Editor → New Query → Run ---')
`
