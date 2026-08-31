import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getServerSupabase } from '@/lib/supabase/server-client'
import { generateId } from '@/lib/utils'
import { ensureStorageBucket, uploadImageToStorage } from '@/lib/actions/storage'

export const runtime = 'edge'


export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { getAll() { return cookieStore.getAll() }, setAll() {} }
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const s = getServerSupabase()

    let amount: number | null = null
    let payment_method = ''
    let reference_number: string | null = null
    let notes: string | null = null
    let screenshot_url: string | null = null

    const ct = req.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const j = await req.json()
      amount = Number(j.amount)
      payment_method = String(j.payment_method || '')
      reference_number = j.reference_number || null
      notes = j.notes || null
      screenshot_url = j.screenshot_url || null
    } else {
      const form = await req.formData()
      amount = Number(form.get('amount'))
      payment_method = String(form.get('payment_method') || '')
      reference_number = form.get('reference_number') ? String(form.get('reference_number')) : null
      notes = form.get('notes') ? String(form.get('notes')) : null
      // Proof image upload (screenshot of payment / transaction code photo)
      const proofFile = form.get('proof_image')
      if (proofFile && proofFile instanceof File && proofFile.size > 0) {
        await ensureStorageBucket(s)
        screenshot_url = await uploadImageToStorage(s, proofFile, 'proofs')
      }
    }

    if (!amount || isNaN(amount) || amount <= 0 || !payment_method) {
      return NextResponse.json({ error: 'amount and payment_method required' }, { status: 400 })
    }
    if (!reference_number && !screenshot_url) {
      return NextResponse.json({ error: 'Please provide a transaction reference number or upload proof of payment.' }, { status: 400 })
    }

    const { error } = await s.from('deposit_requests').insert({
      id: generateId(), user_id: user.id, amount, currency: 'DZD',
      payment_method, reference_number, screenshot_url, notes, status: 'pending',
    } as never)
    if (error) throw error

    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      return NextResponse.redirect(new URL('/account/wallet?success=1', req.url), 303)
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed' }, { status: 500 })
  }
}