import fs from 'fs'
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
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'));
$$ LANGUAGE sql SECURITY DEFINER STABLE;
`
console.log(sql)
