// @ts-nocheck
// Admin server actions
'use server'

import { getServerSupabase } from '@/lib/supabase/server-client'
import { generateId } from '@/lib/utils'
import type { ApiResult } from '@/lib/validations'

// Admin: approve deposit request
export async function approveDepositRequest(
  adminId: string,
  depositId: string
): Promise<ApiResult<{ success: boolean }>> {
  const supabase = getServerSupabase()

  try {
    // Get deposit request
    const { data: deposit, error: depError } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('id', depositId)
      .single()

    if (depError || !deposit) {
      return { success: false, error: 'Deposit request not found' }
    }

    if (deposit.status !== 'pending') {
      return { success: false, error: 'Deposit request already processed' }
    }

    const amount = Number(deposit.amount)
    const userId = deposit.user_id
    const currency = deposit.currency || 'DZD'

    // Get user wallet
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single()

    if (!wallet) {
      return { success: false, error: 'User wallet not found' }
    }

    const currentBalance = Number(wallet.balance)
    const newBalance = currentBalance + amount

    // Update wallet
    await supabase
      .from('wallets')
      .update({ balance: newBalance.toString(), updated_at: new Date().toISOString() })
      .eq('id', wallet.id)

    // Create transaction
    await supabase.from('wallet_transactions').insert({
      id: generateId(),
      user_id: userId,
      wallet_id: wallet.id,
      type: 'deposit',
      amount,
      balance_before: currentBalance,
      balance_after: newBalance,
      reference: deposit.reference_number || null,
      description: `Deposit approved: ${amount} ${currency}`,
      status: 'completed',
    })

    // Update deposit status
    await supabase
      .from('deposit_requests')
      .update({
        status: 'approved',
        admin_id: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', depositId)

    // Create notification
    await supabase.from('notifications').insert({
      id: generateId(),
      user_id: userId,
      type: 'deposit_approved',
      title: 'Deposit Approved',
      message: `Your deposit of ${amount} ${currency} has been approved.`,
      reference_id: depositId,
      is_read: false,
    })

    // Admin log
    await supabase.from('admin_logs').insert({
      id: generateId(),
      admin_id: adminId,
      action: 'deposit_approved',
      entity_type: 'deposit',
      entity_id: depositId,
      details: { amount, currency, user_id: userId },
      ip_address: 'server',
    })

    return { success: true, data: { success: true } }
  } catch (err) {
    return { success: false, error: `Approval failed: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Admin: reject deposit request
export async function rejectDepositRequest(
  adminId: string,
  depositId: string,
  reason: string
): Promise<ApiResult<{ success: boolean }>> {
  const supabase = getServerSupabase()

  try {
    const { data: deposit, error: depError } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('id', depositId)
      .single()

    if (depError || !deposit) {
      return { success: false, error: 'Deposit request not found' }
    }

    if (deposit.status !== 'pending') {
      return { success: false, error: 'Deposit request already processed' }
    }

    await supabase
      .from('deposit_requests')
      .update({
        status: 'rejected',
        admin_id: adminId,
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', depositId)

    // Notification
    await supabase.from('notifications').insert({
      id: generateId(),
      user_id: deposit.user_id,
      type: 'deposit_rejected',
      title: 'Deposit Rejected',
      message: `Your deposit request was rejected. Reason: ${reason}`,
      reference_id: depositId,
      is_read: false,
    })

    // Admin log
    await supabase.from('admin_logs').insert({
      id: generateId(),
      admin_id: adminId,
      action: 'deposit_rejected',
      entity_type: 'deposit',
      entity_id: depositId,
      details: { reason, user_id: deposit.user_id },
      ip_address: 'server',
    })

    return { success: true, data: { success: true } }
  } catch (err) {
    return { success: false, error: `Rejection failed: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Admin: credit user wallet
export async function adminCreditWallet(
  adminId: string,
  userId: string,
  amount: number,
  reason: string
): Promise<ApiResult<{ success: boolean }>> {
  const supabase = getServerSupabase()

  try {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single()

    if (!wallet) {
      return { success: false, error: 'User wallet not found' }
    }

    const currentBalance = Number(wallet.balance)
    const newBalance = currentBalance + amount

    await supabase
      .from('wallets')
      .update({ balance: newBalance.toString(), updated_at: new Date().toISOString() })
      .eq('id', wallet.id)

    await supabase.from('wallet_transactions').insert({
      id: generateId(),
      user_id: userId,
      wallet_id: wallet.id,
      type: 'admin_credit',
      amount,
      balance_before: currentBalance,
      balance_after: newBalance,
      reference: null,
      description: reason,
      status: 'completed',
    })

    await supabase.from('notifications').insert({
      id: generateId(),
      user_id: userId,
      type: 'purchase_completed',
      title: 'Balance Added',
      message: `Admin credited ${amount} to your wallet.`,
      is_read: false,
    })

    await supabase.from('admin_logs').insert({
      id: generateId(),
      admin_id: adminId,
      action: 'admin_credit',
      entity_type: 'wallet',
      entity_id: wallet.id,
      details: { amount, reason, user_id: userId },
      ip_address: 'server',
    })

    return { success: true, data: { success: true } }
  } catch (err) {
    return { success: false, error: `Credit failed: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Admin: debit user wallet
export async function adminDebitWallet(
  adminId: string,
  userId: string,
  amount: number,
  reason: string
): Promise<ApiResult<{ success: boolean }>> {
  const supabase = getServerSupabase()

  try {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId)
      .single()

    if (!wallet) {
      return { success: false, error: 'User wallet not found' }
    }

    const currentBalance = Number(wallet.balance)
    const newBalance = currentBalance - amount

    if (newBalance < 0) {
      return { success: false, error: 'Insufficient balance to debit' }
    }

    await supabase
      .from('wallets')
      .update({ balance: newBalance.toString(), updated_at: new Date().toISOString() })
      .eq('id', wallet.id)

    await supabase.from('wallet_transactions').insert({
      id: generateId(),
      user_id: userId,
      wallet_id: wallet.id,
      type: 'admin_debit',
      amount,
      balance_before: currentBalance,
      balance_after: newBalance,
      reference: null,
      description: reason,
      status: 'completed',
    })

    await supabase.from('admin_logs').insert({
      id: generateId(),
      admin_id: adminId,
      action: 'admin_debit',
      entity_type: 'wallet',
      entity_id: wallet.id,
      details: { amount, reason, user_id: userId },
      ip_address: 'server',
    })

    return { success: true, data: { success: true } }
  } catch (err) {
    return { success: false, error: `Debit failed: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Admin: freeze/unfreeze wallet
export async function toggleWalletFreeze(
  adminId: string,
  userId: string,
  freeze: boolean
): Promise<ApiResult<{ success: boolean }>> {
  const supabase = getServerSupabase()

  try {
    const { error } = await supabase
      .from('wallets')
      .update({ is_frozen: freeze, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (error) throw error

    await supabase.from('admin_logs').insert({
      id: generateId(),
      admin_id: adminId,
      action: freeze ? 'freeze_wallet' : 'unfreeze_wallet',
      entity_type: 'wallet',
      entity_id: null,
      details: { user_id: userId, frozen: freeze },
      ip_address: 'server',
    })

    return { success: true, data: { success: true } }
  } catch (err) {
    return { success: false, error: `Toggle failed: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}
