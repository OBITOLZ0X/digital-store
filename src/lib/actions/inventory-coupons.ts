// @ts-nocheck
// Inventory & Coupon actions
'use server'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { generateId } from '@/lib/utils'
import type { ApiResult } from '@/lib/validations'

export async function addInventoryItem(
  adminId: string,
  productId: string,
  variantId: string | null,
  productData: Record<string, unknown>
): Promise<ApiResult<{ id: string }>> {
  const supabase = getServerSupabase()
  try {
    const { data, error } = await supabase.from('inventory_items').insert({
      id: generateId(),
      product_id: productId,
      variant_id: variantId,
      product_data: productData as never,
      status: 'available',
    }).select('id').single()
    if (error) throw error
    await supabase.from('admin_logs').insert({
      id: generateId(), admin_id: adminId, action: 'inventory_added',
      entity_type: 'inventory', entity_id: data.id, details: { productId } as never, ip_address: 'server'
    })
    return { success: true, data: { id: data.id } }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Failed' } }
}

export async function bulkImportInventory(
  adminId: string,
  productId: string,
  variantId: string | null,
  items: string[]
): Promise<ApiResult<{ count: number }>> {
  const supabase = getServerSupabase()
  try {
    const rows = items.map(raw => {
      let data: Record<string, unknown>
      try { data = JSON.parse(raw) } catch { data = { key: raw, raw } }
      return { id: generateId(), product_id: productId, variant_id: variantId, product_data: data as never, status: 'available' as const }
    })
    const { error } = await supabase.from('inventory_items').insert(rows as never)
    if (error) throw error
    await supabase.from('admin_logs').insert({
      id: generateId(), admin_id: adminId, action: 'inventory_bulk_import',
      entity_type: 'inventory', details: { productId, count: rows.length } as never, ip_address: 'server'
    })
    return { success: true, data: { count: rows.length } }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Failed' } }
}

export async function getInventory(
  productId?: string,
  status?: string,
  limit = 50,
  offset = 0
): Promise<ApiResult<{ items: Record<string, unknown>[]; total: number }>> {
  const supabase = getServerSupabase()
  try {
    let q = supabase.from('inventory_items').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset+limit-1)
    if (productId) q = q.eq('product_id', productId)
    if (status) q = q.eq('status', status)
    const { data, error, count } = await q
    if (error) throw error
    return { success: true, data: { items: (data as unknown as Record<string, unknown>[]) || [], total: count || 0 } }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Failed' } }
}

export async function updateInventoryStatus(
  adminId: string, itemId: string, status: 'available'|'reserved'|'sold'|'expired'|'disabled'
): Promise<ApiResult<{ success: boolean }>> {
  const supabase = getServerSupabase()
  try {
    const { error } = await supabase.from('inventory_items').update({ status, updated_at: new Date().toISOString() } as never).eq('id', itemId)
    if (error) throw error
    await supabase.from('admin_logs').insert({
      id: generateId(), admin_id: adminId, action: 'inventory_status_changed',
      entity_type: 'inventory', entity_id: itemId, details: { status } as never, ip_address: 'server'
    })
    return { success: true, data: { success: true } }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Failed' } }
}

export async function deleteInventoryItem(adminId: string, itemId: string): Promise<ApiResult<{ success: boolean }>> {
  const supabase = getServerSupabase()
  try {
    const { error } = await supabase.from('inventory_items').delete().eq('id', itemId)
    if (error) throw error
    await supabase.from('admin_logs').insert({
      id: generateId(), admin_id: adminId, action: 'inventory_deleted',
      entity_type: 'inventory', entity_id: itemId, details: {} as never, ip_address: 'server'
    })
    return { success: true, data: { success: true } }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Failed' } }
}

// Coupons
export async function getAllCoupons(): Promise<ApiResult<Record<string, unknown>[]>> {
  const supabase = getServerSupabase()
  try {
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return { success: true, data: (data as unknown as Record<string, unknown>[]) || [] }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Failed' } }
}
export async function createCoupon(adminId: string, d: { code: string; type: 'percentage'|'fixed'; discount_value: number; min_order_amount?: number; max_discount?: number; usage_limit?: number; per_user_limit?: number; expiration_date?: string; is_active?: boolean }): Promise<ApiResult<{ id: string }>> {
  const supabase = getServerSupabase()
  try {
    const { data, error } = await supabase.from('coupons').insert({
      id: generateId(), code: d.code.toUpperCase(), type: d.type, discount_value: d.discount_value,
      min_order_amount: d.min_order_amount ?? null, max_discount: d.max_discount ?? null,
      usage_limit: d.usage_limit ?? null, per_user_limit: d.per_user_limit ?? null,
      expiration_date: d.expiration_date ?? null, is_active: d.is_active ?? true
    } as never).select('id').single()
    if (error) throw error
    await supabase.from('admin_logs').insert({ id: generateId(), admin_id: adminId, action: 'coupon_created', entity_type: 'coupon', entity_id: (data as {id:string}).id, details: { code: d.code } as never, ip_address: 'server' })
    return { success: true, data: { id: (data as {id:string}).id } }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Failed' } }
}
export async function toggleCoupon(adminId: string, id: string, active: boolean): Promise<ApiResult<{ success: boolean }>> {
  const supabase = getServerSupabase()
  try {
    const { error } = await supabase.from('coupons').update({ is_active: active } as never).eq('id', id)
    if (error) throw error
    return { success: true, data: { success: true } }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Failed' } }
}
export async function deleteCoupon(adminId: string, id: string): Promise<ApiResult<{ success: boolean }>> {
  const supabase = getServerSupabase()
  try {
    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) throw error
    await supabase.from('admin_logs').insert({ id: generateId(), admin_id: adminId, action: 'coupon_deleted', entity_type: 'coupon', entity_id: id, details: {} as never, ip_address: 'server' })
    return { success: true, data: { success: true } }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Failed' } }
}
export async function validateCoupon(code: string, userId: string, orderTotal: number): Promise<ApiResult<{ valid: boolean; discount: number; coupon?: Record<string, unknown> }>> {
  const supabase = getServerSupabase()
  try {
    const { data: coupon, error } = await supabase.from('coupons').select('*').eq('code', code.toUpperCase()).eq('is_active', true).single()
    if (error || !coupon) return { success: true, data: { valid: false, discount: 0 } }
    const c = coupon as unknown as Record<string, unknown> & { type: string; discount_value: number; min_order_amount: number|null; max_discount: number|null; expiration_date: string|null; usage_limit: number|null; per_user_limit: number|null }
    if (c.expiration_date && new Date(c.expiration_date) < new Date()) return { success: true, data: { valid: false, discount: 0 } }
    if (c.min_order_amount && orderTotal < Number(c.min_order_amount)) return { success: true, data: { valid: false, discount: 0 } }
    let discount = c.type === 'percentage' ? orderTotal * (Number(c.discount_value)/100) : Number(c.discount_value)
    if (c.max_discount) discount = Math.min(discount, Number(c.max_discount))
    return { success: true, data: { valid: true, discount, coupon: c } }
  } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Failed' } }
}
