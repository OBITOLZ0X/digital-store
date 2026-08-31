// @ts-nocheck
'use server'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { generateId } from '@/lib/utils'
import type { ApiResult } from '@/lib/validations'

export async function getNotifications(userId: string, limit=20): Promise<ApiResult<Record<string, unknown>[]>> {
  const supabase = getServerSupabase()
  try {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', {ascending:false}).limit(limit)
    if (error) throw error
    return { success: true, data: (data as unknown as Record<string, unknown>[]) || [] }
  } catch(e){ return { success:false, error: e instanceof Error?e.message:'Failed' } }
}
export async function markNotificationRead(userId: string, id: string): Promise<ApiResult<{success:boolean}>> {
  const s = getServerSupabase()
  try { const {error}=await s.from('notifications').update({is_read:true} as never).eq('id',id).eq('user_id',userId); if(error) throw error; return {success:true,data:{success:true}} } catch(e){ return {success:false,error:e instanceof Error?e.message:'Failed'} }
}
export async function markAllRead(userId: string): Promise<ApiResult<{success:boolean}>> {
  const s = getServerSupabase()
  try { const {error}=await s.from('notifications').update({is_read:true} as never).eq('user_id',userId).eq('is_read',false); if(error) throw error; return {success:true,data:{success:true}} } catch(e){ return {success:false,error:e instanceof Error?e.message:'Failed'} }
}
export async function createNotification(userId: string, type: string, title: string, message: string, referenceId?: string): Promise<void> {
  const s = getServerSupabase()
  await s.from('notifications').insert({ id: generateId(), user_id: userId, type, title, message, reference_id: referenceId||null, is_read:false } as never)
}

// Favorites
export async function getFavorites(userId: string): Promise<ApiResult<Record<string, unknown>[]>> {
  const s = getServerSupabase()
  try {
    const { data, error } = await s.from('favorites').select('*, product:products(*)').eq('user_id', userId).order('created_at',{ascending:false})
    if (error) throw error
    return { success: true, data: (data as unknown as Record<string, unknown>[]) || [] }
  } catch(e){ return { success:false, error: e instanceof Error?e.message:'Failed' } }
}
export async function toggleFavorite(userId: string, productId: string): Promise<ApiResult<{ favorited: boolean }>> {
  const s = getServerSupabase()
  try {
    const { data: existing } = await s.from('favorites').select('id').eq('user_id',userId).eq('product_id',productId).single()
    if (existing) {
      await s.from('favorites').delete().eq('user_id',userId).eq('product_id',productId)
      return { success:true, data:{ favorited:false } }
    } else {
      await s.from('favorites').insert({ id: generateId(), user_id: userId, product_id: productId } as never)
      return { success:true, data:{ favorited:true } }
    }
  } catch(e){ return { success:false, error: e instanceof Error?e.message:'Failed' } }
}
export async function isFavorited(userId: string, productId: string): Promise<boolean> {
  const s = getServerSupabase()
  const { data } = await s.from('favorites').select('id').eq('user_id',userId).eq('product_id',productId).single()
  return !!data
}

// Admin dashboard stats
export async function getAdminStats(): Promise<ApiResult<Record<string, unknown>>> {
  const s = getServerSupabase()
  try {
    const today = new Date(); today.setHours(0,0,0,0)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const [orders, users, deposits, inventory, subs] = await Promise.all([
      s.from('orders').select('total,created_at,status', { count:'exact' }),
      s.from('profiles').select('id,created_at', { count:'exact' }),
      s.from('deposit_requests').select('id,status', { count:'exact' }).eq('status','pending'),
      s.from('inventory_items').select('id,status', { count:'exact' }).eq('status','available'),
      s.from('subscriptions').select('id,status', { count:'exact' }).eq('status','active'),
    ])
    const allOrders = (orders.data as unknown as {total:number;created_at:string;status:string}[]) || []
    const totalSales = allOrders.filter(o=>o.status==='completed').reduce((a,c)=>a+Number(c.total),0)
    const todaysSales = allOrders.filter(o=>o.status==='completed' && new Date(o.created_at) >= today).reduce((a,c)=>a+Number(c.total),0)
    const monthlySales = allOrders.filter(o=>o.status==='completed' && new Date(o.created_at) >= monthStart).reduce((a,c)=>a+Number(c.total),0)
    return { success:true, data:{
      totalSales, todaysSales, monthlySales,
      totalUsers: users.count||0,
      pendingDeposits: deposits.count||0,
      availableInventory: inventory.count||0,
      activeSubscriptions: subs.count||0,
      totalOrders: orders.count||0,
      pendingOrders: allOrders.filter(o=>o.status==='pending').length,
    }}
  } catch(e){ return { success:false, error: e instanceof Error?e.message:'Failed' } }
}

export async function getAdminLogs(limit=50, offset=0): Promise<ApiResult<{logs:Record<string,unknown>[];total:number}>> {
  const s = getServerSupabase()
  try {
    const { data, error, count } = await s.from('admin_logs').select('*', {count:'exact'}).order('created_at',{ascending:false}).range(offset, offset+limit-1)
    if (error) throw error
    return { success:true, data:{ logs: (data as unknown as Record<string,unknown>[])||[], total: count||0 } }
  } catch(e){ return { success:false, error: e instanceof Error?e.message:'Failed' } }
}
