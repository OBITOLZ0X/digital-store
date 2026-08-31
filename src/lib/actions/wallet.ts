// @ts-nocheck
// Wallet server actions
'use server'

import { getServerSupabase } from '@/lib/supabase/server-client'
import { generateTransactionRef, generateId, formatCurrency } from '@/lib/utils'
import { TRANSACTION_TYPES } from '@/lib/constants'
import type { ApiResult } from '@/lib/validations'

// Get user wallet
export async function getWallet(userId: string): Promise<ApiResult<{ balance: number; currency: string; is_frozen: boolean }>> {
  try {
    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('wallets')
      .select('balance, currency, is_frozen')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    return { success: false, error: `Failed to get wallet: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Get wallet transactions
export async function getWalletTransactions(
  userId: string,
  limit = 50,
  offset = 0
): Promise<ApiResult<{
  transactions: Array<{
    id: string
    type: string
    amount: number
    balance_before: number
    balance_after: number
    reference: string | null
    description: string | null
    status: string
    created_at: string
  }>
  total: number
}>> {
  try {
    const supabase = getServerSupabase()
    const { data: transactions, error: txError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (txError) throw txError

    const { count } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return {
      success: true,
      data: {
        transactions: transactions || [],
        total: count || 0,
      },
    }
  } catch (err) {
    return { success: false, error: `Failed to get transactions: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}

// Deposit request submission
export async function submitDepositRequest(
  userId: string,
  amount: number,
  paymentMethod: string,
  referenceNumber?: string,
  screenshotUrl?: string,
  notes?: string
): Promise<ApiResult<{ id: string }>> {
  try {
    const supabase = getServerSupabase()
    const { error } = await supabase.from('deposit_requests').insert({
      user_id: userId,
      amount,
      currency: 'DZD',
      payment_method: paymentMethod,
      reference_number: referenceNumber || null,
      screenshot_url: screenshotUrl || null,
      notes: notes || null,
      status: 'pending',
    })

    if (error) throw error
    return { success: true, data: { id: '' } }
  } catch (err) {
    return { success: false, error: `Failed to submit deposit: ${err instanceof Error ? err.message : 'Unknown error'}` }
  }
}
