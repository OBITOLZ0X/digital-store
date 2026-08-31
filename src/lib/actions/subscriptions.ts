// @ts-nocheck
// Subscription server actions
'use server'

import { getServerSupabase } from '@/lib/supabase/server-client'
import { generateId } from '@/lib/utils'
import type { ApiResult } from '@/lib/validations'

// Get user subscriptions
export async function getUserSubscriptions(
  userId: string
): Promise<ApiResult<Array<{
  id: string
  product_id: string
  variant_id: string | null
  order_id: string
  status: string
  start_date: string
  expiration_date: string
  auto_renew: boolean
  credentials_ref: string | null
  product_name?: string
  variant_name?: string
  product_type?: string
  credentials?: Record<string, unknown>
}>>> {
  try {
    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        product:products (name, product_type),
        variant:product_variants (name),
        credentials:inventory_items (product_data)
      `)
      .eq('user_id', userId)
      .order('expiration_date', { ascending: false })

    if (error) throw error

    const result = (data || []).map((sub: Record<string, unknown>) => ({
      id: sub.id,
      product_id: sub.product_id,
      variant_id: sub.variant_id,
      order_id: sub.order_id,
      status: sub.status,
      start_date: sub.start_date,
      expiration_date: sub.expiration_date,
      auto_renew: sub.auto_renew,
      credentials_ref: sub.credentials_ref,
      product_name: (sub as { product?: { name?: string } }).product?.name,
      variant_name: (sub as { variant?: { name?: string } }).variant?.name,
      product_type: (sub as { product?: { product_type?: string } }).product?.product_type,
      credentials: (sub as { credentials?: { product_data?: Record<string, unknown> } }).credentials?.product_data || null,
    }))

    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: `Failed to get subscriptions: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Renew a subscription
export async function renewSubscription(
  userId: string,
  subscriptionId: string,
  variantId: string
): Promise<ApiResult<{ success: boolean; newExpiration: string; message: string }>> {
  const supabase = getServerSupabase()

  try {
    // Get current subscription
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        product:products (*),
        variant:product_variants (*)
      `)
      .eq('id', subscriptionId)
      .eq('user_id', userId)
      .single()

    if (subError || !sub) {
      return { success: false, error: 'Subscription not found' }
    }

    if (sub.status === 'cancelled') {
      return { success: false, error: 'Cannot renew a cancelled subscription' }
    }

    if (sub.status === 'expired') {
      return { success: false, error: 'Subscription has expired. Please create a new order.' }
    }

    // Get variant for price
    const variant = (sub as { variant?: Record<string, unknown> }).variant
    if (!variant) {
      return { success: false, error: 'Variant not found' }
    }

    const price = Number(variant.price)

    // Get and verify wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance, currency, is_frozen')
      .eq('user_id', userId)
      .eq('is_frozen', false)
      .single()

    if (walletError || !wallet) {
      return { success: false, error: 'Wallet not found or frozen' }
    }

    const balance = Number(wallet.balance)
    if (balance < price) {
      return { success: false, error: `Insufficient balance. Price: ${price}, Balance: ${balance}` }
    }

    // Get current expiration date
    const currentExpiration = new Date((sub as { expiration_date?: string }).expiration_date || sub.expiration_date)
    const durationDays = variant.duration_days || (sub as { product?: { subscription_duration_days?: number } }).product?.subscription_duration_days || 30
    const newExpiration = new Date(currentExpiration.getTime() + durationDays * 24 * 60 * 60 * 1000)

    // Deduct wallet
    const { error: deductError } = await supabase.rpc('execute_transaction', {
      p_user_id: userId,
      p_wallet_id: wallet.id,
      p_amount: price,
      p_type: 'purchase',
      p_reference: `RENEWAL-${subscriptionId}`,
      p_description: `Renewal of ${sub.product?.name || 'subscription'}`,
    })

    if (deductError) {
      return { success: false, error: 'Failed to process payment' }
    }

    // Update subscription expiration
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        expiration_date: newExpiration.toISOString(),
        updated_at: new Date().toISOString(),
        status: 'active',
      })
      .eq('id', subscriptionId)

    if (updateError) throw updateError

    // Record wallet transaction
    const newBalance = balance - price
    await supabase.from('wallet_transactions').insert({
      id: generateId(),
      user_id: userId,
      wallet_id: wallet.id,
      type: 'purchase',
      amount: price,
      balance_before: balance,
      balance_after: newBalance,
      reference: `RENEWAL-${subscriptionId}`,
      description: `Renewal of subscription`,
      status: 'completed',
    })

    // Create notification
    await supabase.from('notifications').insert({
      id: generateId(),
      user_id: userId,
      type: 'purchase_completed',
      title: 'Subscription Renewed',
      message: `Your subscription has been renewed. Expires on ${newExpiration.toLocaleDateString()}.`,
      reference_id: subscriptionId,
      is_read: false,
    })

    return {
      success: true,
      data: {
        success: true,
        newExpiration: newExpiration.toISOString(),
        message: 'Subscription renewed successfully!',
      },
    }
  } catch (err) {
    return { success: false, error: `Renewal failed: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Cancel a subscription
export async function cancelSubscription(
  userId: string,
  subscriptionId: string
): Promise<ApiResult<{ success: boolean }>> {
  try {
    const supabase = getServerSupabase()

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId)
      .eq('user_id', userId)

    if (error) throw error

    return { success: true, data: { success: true } }
  } catch (err) {
    return { success: false, error: `Cancel failed: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}
