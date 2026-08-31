// @ts-nocheck
// Purchase and inventory server actions
'use server'

import { getServerSupabase } from '@/lib/supabase/server-client'
import { generateId, generateOrderNumber, generateTransactionRef } from '@/lib/utils'
import type { ApiResult } from '@/lib/validations'

// Purchase a product variant with wallet
export async function purchaseProduct(
  userId: string,
  productId: string,
  variantId: string | null,
  quantity: number,
  couponCode?: string
): Promise<ApiResult<{
  orderId: string
  orderNumber: string
  total: number
  deliveryData: Record<string, unknown> | null
  message: string
}>> {
  const supabase = getServerSupabase()

  try {
    // 1. Get product + variant (variantId optional — base product price if no durations)
    let variant: any = null
    let product: any = null
    if (variantId) {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
        *,
        product:products (
          id,
          name,
          slug,
          status,
          product_type,
          delivery_type,
          instructions,
          subscription_duration_days,
          expiration_days,
          sku,
          price,
          stock
        )
      `)
        .eq('id', variantId)
        .eq('product_id', productId)
        .single()
      if (error || !data) return { success: false, error: 'Product or variant not found' }
      variant = data
      product = (data as any).product
    } else {
      // No variant selected — use base product
      const { data, error } = await supabase.from('products').select('*').eq('id', productId).single()
      if (error || !data) return { success: false, error: 'Product not found' }
      product = data
      // synthesize variant-like object from base product so rest of logic works
      variant = {
        id: null,
        product_id: productId,
        name: null,
        duration_days: product.subscription_duration_days || null,
        price: product.price,
        stock: product.stock,
        product,
      }
    }
    // 2. Verify product is active
    if (product.status !== 'active' && product.status !== 'hidden') {
      return { success: false, error: 'Product is not available for purchase' }
    }

    const unitPrice = Number(variant.price)
    const total = unitPrice * quantity

    // 3. Get and verify user wallet (lock row for update)
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance, currency, is_frozen')
      .eq('user_id', userId)
      .eq('is_frozen', false)
      .single()

    if (walletError || !wallet) {
      return { success: false, error: 'Wallet not found or is frozen' }
    }

    const balance = Number(wallet.balance)
    if (balance < total) {
      return { success: false, error: `Insufficient balance. Required: ${unitPrice * quantity}, Available: ${balance}` }
    }

    // 4. Check stock — for automatic delivery stock is managed via inventory_items, not variant.stock
    const isAutomatic = product.delivery_type === 'automatic'
    if (!isAutomatic) {
      if (variant.stock < quantity) {
        return { success: false, error: `Insufficient stock. Available: ${variant.stock}, Requested: ${quantity}` }
      }
    } else {
      // For automatic, verify inventory count separately (optional early check — reserveInventory will also verify)
      // Count available inventory for this product/variant to give a nicer error before wallet deduction
      let invCountQuery = supabase.from('inventory_items').select('id', { count: 'exact', head: true }).eq('product_id', productId).eq('status', 'available')
      if (variantId) invCountQuery = invCountQuery.eq('variant_id', variantId)
      else invCountQuery = invCountQuery.is('variant_id', null)
      const { count: availableInventory } = await invCountQuery as any
      if ((availableInventory || 0) < quantity) {
        // Also try generic stock fallback for variant products (same as reserveInventory)
        if (variantId) {
          const { count: genericCount } = await supabase.from('inventory_items').select('id', { count: 'exact', head: true }).eq('product_id', productId).eq('status', 'available').is('variant_id', null) as any
          if (((availableInventory || 0) + (genericCount || 0)) < quantity) {
            return { success: false, error: `No available inventory for this option. Available: ${availableInventory || 0}, Requested: ${quantity}` }
          }
        } else {
          return { success: false, error: `No available inventory for this product. Available: ${availableInventory || 0}, Requested: ${quantity}` }
        }
      }
    }

    // 5. Apply coupon if provided
    let discount = 0
    if (couponCode) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (!couponError && coupon) {
        // Check coupon validity
        const now = new Date()
        if (coupon.start_date && new Date(coupon.start_date) > now) {
          return { success: false, error: 'Coupon not yet active' }
        }
        if (coupon.expiration_date && new Date(coupon.expiration_date) < now) {
          return { success: false, error: 'Coupon expired' }
        }
        if (coupon.min_order_amount && total < Number(coupon.min_order_amount)) {
          return { success: false, error: 'Order amount too low for this coupon' }
        }

        // Check usage limits
        const { count: usageCount } = await supabase
          .from('coupon_usages')
          .select('*', { count: 'exact', head: true })
          .eq('coupon_id', coupon.id)

        if (coupon.usage_limit && usageCount >= coupon.usage_limit) {
          return { success: false, error: 'Coupon usage limit reached' }
        }

        const { count: userUsageCount } = await supabase
          .from('coupon_usages')
          .select('*', { count: 'exact', head: true })
          .eq('coupon_id', coupon.id)
          .eq('user_id', userId)

        if (coupon.per_user_limit && userUsageCount >= coupon.per_user_limit) {
          return { success: false, error: 'Coupon already used by this user' }
        }

        if (coupon.type === 'percentage') {
          discount = Math.min(total * (Number(coupon.discount_value) / 100), coupon.max_discount ? Number(coupon.max_discount) : total)
        } else {
          discount = Math.min(Number(coupon.discount_value), coupon.max_discount ? Number(coupon.max_discount) : Number(coupon.discount_value))
        }
      }
    }

    const finalTotal = Math.max(0, total - discount)

    // 6. Create order (attempt)
    const orderId = generateId()
    const orderNumber = generateOrderNumber()

    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      order_number: orderNumber,
      user_id: userId,
      status: 'processing',
      total: finalTotal,
      currency: wallet.currency,
      payment_method: 'wallet',
      delivery_status: 'pending',
    })

    if (orderError) throw orderError

    // 7. Create order item
    const { error: itemError } = await supabase.from('order_items').insert({
      id: generateId(),
      order_id: orderId,
      product_id: productId,
      variant_id: variantId,
      product_name: product.name,
      variant_name: variant.name,
      quantity,
      unit_price: unitPrice,
      total_price: finalTotal,
    })

    if (itemError) throw itemError

    const isManual = product.delivery_type === 'manual' || product.delivery_type === 'manual_delivery'
    // 8. Reserve inventory - try to get available items (skip for manual delivery)
    let reservedItems: Array<{ id: string; product_data: Record<string, unknown> }> = []
    if (isManual) {
      // manual: no inventory needed now — admin will fulfill later
    } else {
      const inventoryResult = await reserveInventory(supabase, productId, variantId, quantity)
      if (!inventoryResult.success) {
        // Keep order_items so admin can see what failed (inventory empty); just mark cancelled
        await supabase.from('orders').update({ status: 'cancelled', delivery_status: 'failed', notes: inventoryResult.error } as never).eq('id', orderId)
        return { success: false, error: inventoryResult.error }
      }
      reservedItems = inventoryResult.items as any
    }

    // 9. Deduct wallet balance atomically
    const { error: deductError } = await supabase.rpc('execute_transaction', {
      p_user_id: userId,
      p_wallet_id: wallet.id,
      p_amount: finalTotal,
      p_type: 'purchase',
      p_reference: `ORDER-${orderNumber}`,
      p_description: `Purchase of ${product.name}${variant.name ? ' - ' + variant.name : ''} (${quantity}x)`,
    })

    if (deductError) {
      // Payment failed — keep order + items for audit, mark cancelled/failed
      await supabase.from('orders').update({ status: 'cancelled', delivery_status: 'failed', notes: 'Payment failed' } as never).eq('id', orderId)
      // Release reserved inventory
      if (reservedItems.length) await supabase
        .from('inventory_items')
        .update({ status: 'available', reserved_until: null } as never)
        .in('id', reservedItems.map(i => i.id))
      return { success: false, error: 'Failed to process payment. Please try again.' }
    }

    // 10. Mark inventory as sold (only for automatic)
    if (!isManual && reservedItems.length > 0) {
      const soldIds = reservedItems.map(i => i.id)
      await supabase
        .from('inventory_items')
        .update({
          status: 'sold',
          sold_at: new Date().toISOString(),
          order_id: orderId,
        })
        .in('id', soldIds)
    }

    // 11. Create wallet transaction record
    await supabase.from('wallet_transactions').insert({
      id: generateId(),
      user_id: userId,
      wallet_id: wallet.id,
      type: 'purchase',
      amount: finalTotal,
      balance_before: balance,
      balance_after: balance - finalTotal,
      reference: `ORDER-${orderNumber}`,
      description: `Purchase of ${product.name}${variant.name ? ' - ' + variant.name : ''} (${quantity}x)`,
      status: 'completed',
    })

    // 12. Update order — automatic: completed+delivered, manual: processing+pending (admin fulfills)
    if (isManual) {
      await supabase.from('orders').update({ status: 'processing', delivery_status: 'pending' }).eq('id', orderId)
    } else {
      await supabase.from('orders').update({ status: 'completed', delivery_status: 'delivered' }).eq('id', orderId)
    }

    // 13. If subscription product, create subscription
    if (product.product_type === 'subscription' || product.product_type === 'iptv') {
      const startDate = new Date()
      const durationDays = variant.duration_days || product.subscription_duration_days || 30
      const expirationDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)

      const subId = generateId()
      await supabase.from('subscriptions').insert({
        id: subId,
        user_id: userId,
        product_id: productId,
        variant_id: variantId,
        order_id: orderId,
        status: 'active',
        start_date: startDate.toISOString(),
        expiration_date: expirationDate.toISOString(),
        auto_renew: false,
        credentials_ref: reservedItems[0]?.id || null,
      })
    }

    // 14. Create notification
    await supabase.from('notifications').insert({
      id: generateId(),
      user_id: userId,
      type: 'purchase_completed',
      title: 'Purchase Completed',
      message: `Your order ${orderNumber} has been completed successfully.`,
      reference_id: orderId,
      is_read: false,
    })

    // Build delivery data based on product type — for manual, no immediate delivery content (admin will deliver)
    const deliveryData = isManual ? null : buildDeliveryData(variant, reservedItems[0] || null)

    return {
      success: true,
      data: {
        orderId,
        orderNumber,
        total: finalTotal,
        deliveryData,
        message: isManual ? 'Order placed — admin will deliver your code/account shortly. Check Orders for updates.' : 'Purchase completed successfully!',
      },
    }
  } catch (err) {
    return { success: false, error: `Purchase failed: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Reserve inventory items
async function reserveInventory(
  supabase: ReturnType<typeof getServerSupabase>,
  productId: string,
  variantId: string | null,
  quantity: number
): Promise<{ success: boolean; items?: Array<{ id: string; product_data: Record<string, unknown> }>; error?: string }> {
  // Try to reserve available items with a timeout
  const now = new Date()
  const reservedUntil = new Date(now.getTime() + 15 * 60 * 1000).toISOString() // 15 min reservation

  // For variant products, filter by variant_id
  const filter = variantId
    ? `.eq('variant_id', '${variantId}')`
    : ''

  // Try to reserve items in a loop
  for (let attempt = 0; attempt < 3; attempt++) {
    // Get available items — try variant-specific first, then fallback to generic (variant_id null) stock
    let query = supabase
      .from('inventory_items')
      .select('id, product_data')
      .eq('product_id', productId)
      .eq('status', 'available')

    if (variantId) {
      //@ts-ignore - dynamic query building
      query = query.eq('variant_id', variantId)
    }

    let { data: items, error } = await query.limit(quantity)

    if (error) return { success: false, error: 'Failed to query inventory' }
    // Fallback: if variant-specific empty, try generic stock for same product (variant_id is null)
    if ((!items || items.length === 0) && variantId) {
      const { data: generic, error: gErr } = await supabase
        .from('inventory_items')
        .select('id, product_data')
        .eq('product_id', productId)
        .eq('status', 'available')
        .is('variant_id', null)
        .limit(quantity)
      if (gErr) return { success: false, error: 'Failed to query inventory' }
      items = generic as any
    }
    if (!items || items.length === 0) {
      return { success: false, error: 'No available inventory for this product' }
    }

    const selectedIds = items.slice(0, quantity).map(i => i.id)

    // Attempt to reserve them
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ status: 'reserved', reserved_until: reservedUntil })
      .in('id', selectedIds)
      .eq('status', 'available')

    if (!updateError) {
      return {
        success: true,
        items: items.slice(0, quantity).map(i => ({ id: i.id, product_data: i.product_data })),
      }
    }

    // If update failed (race condition), try again
    await new Promise(r => setTimeout(r, 100))
  }

  return { success: false, error: 'Could not reserve inventory. Please try again.' }
}

// Build delivery data for the response
function buildDeliveryData(
  variant: Record<string, unknown> & { product?: Record<string, unknown> },
  item: { product_data: Record<string, unknown> } | null
): Record<string, unknown> | null {
  if (!variant?.product) return null

  const product = variant.product
  const data: Record<string, unknown> = {
    productName: product.name,
    variantName: variant.name,
    productType: product.product_type,
    durationDays: variant.duration_days,
    expirationDate: null,
  }

  // Calculate expiration
  const durationDays = variant.duration_days || (product as { subscription_duration_days?: number }).subscription_duration_days || 30
  const expirationDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
  data.expirationDate = expirationDate.toISOString()

  // Product type specific data
  if (item) {
    switch (product.product_type) {
      case 'digital_key':
      case 'digital_account':
        data.credentials = item.product_data
        break
      case 'subscription':
      case 'iptv':
        data.serverUrl = item.product_data.server_url || null
        data.username = item.product_data.username || null
        data.password = item.product_data.password || null
        data.m3uUrl = item.product_data.m3u_url || null
        data.xtreamCodes = item.product_data.xtream_codes || null
        data.deviceLimit = item.product_data.device_limit || null
        break
      case 'gift_card':
        data.code = item.product_data.code || null
        data.pin = item.product_data.pin || null
        break
    }
  }

  if (product.instructions) {
    data.instructions = product.instructions
  }

  return data
}

// Get user's orders
export async function getUserOrders(userId: string): Promise<ApiResult<Array<Record<string, unknown>>>> {
  try {
    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          id,
          product_name,
          variant_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data: data || [] }
  } catch (err) {
    return { success: false, error: `Failed to get orders: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Get order by ID
export async function getOrder(orderId: string, userId?: string): Promise<ApiResult<Record<string, unknown>>> {
  try {
    const supabase = getServerSupabase()
    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          id,
          product_name,
          variant_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .eq('id', orderId)

    if (userId) {
      query = query.eq('user_id', userId) as typeof query
    }

    const { data, error } = await query.single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    return { success: false, error: `Failed to get order: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Admin: refund an order
export async function refundOrder(
  adminId: string,
  orderId: string,
  reason: string
): Promise<ApiResult<{ success: boolean }>> {
  try {
    const supabase = getServerSupabase()

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          *
        ),
        user:profiles (
          id
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.status === 'refunded') {
      return { success: false, error: 'Order already refunded' }
    }

    if (order.status === 'cancelled') {
      return { success: false, error: 'Cannot refund a cancelled order' }
    }

    const total = Number(order.total)

    // Update order status
    await supabase
      .from('orders')
      .update({ status: 'refunded' })
      .eq('id', orderId)

    // Return balance to wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', order.user_id)
      .single()

    if (wallet) {
      const newBalance = Number(wallet.balance) + total
      await supabase
        .from('wallets')
        .update({ balance: newBalance.toString(), updated_at: new Date().toISOString() })
        .eq('id', wallet.id)

      // Create transaction
      await supabase.from('wallet_transactions').insert({
        id: generateId(),
        user_id: order.user_id,
        wallet_id: wallet.id,
        type: 'refund',
        amount: total,
        balance_before: Number(wallet.balance),
        balance_after: newBalance,
        reference: `REFUND-${order.order_number}`,
        description: `Refund for order ${order.order_number}: ${reason}`,
        status: 'completed',
      })
    }

    // Create notification
    await supabase.from('notifications').insert({
      id: generateId(),
      user_id: order.user_id,
      type: 'refund_completed',
      title: 'Refund Completed',
      message: `Your order ${order.order_number} has been refunded.`,
      reference_id: orderId,
      is_read: false,
    })

    // Admin log
    await supabase.from('admin_logs').insert({
      id: generateId(),
      admin_id: adminId,
      action: 'refund',
      entity_type: 'order',
      entity_id: orderId,
      details: { reason, amount: total, order_number: order.order_number },
      ip_address: 'server',
    })

    return { success: true, data: { success: true } }
  } catch (err) {
    return { success: false, error: `Refund failed: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Cancel an order (user-initiated for pending orders)
export async function cancelOrder(userId: string, orderId: string): Promise<ApiResult<{ success: boolean }>> {
  try {
    const supabase = getServerSupabase()

    // Verify ownership and status
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status, user_id')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single()

    if (error || !order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.status !== 'pending' && order.status !== 'processing') {
      return { success: false, error: 'Order cannot be cancelled in its current state' }
    }

    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)

    return { success: true, data: { success: true } }
  } catch (err) {
    return { success: false, error: `Cancel failed: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}
