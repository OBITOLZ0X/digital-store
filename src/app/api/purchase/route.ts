import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { purchaseProduct } from '@/lib/actions/purchase'

export const runtime = 'edge'


export async function POST(req: NextRequest){
  try{
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { getAll(){ return cookieStore.getAll() }, setAll(c: unknown){} }
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { productId, variantId, quantity, couponCode } = body
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })
    const qty = Math.max(1, Number(quantity||1))
    // variantId is optional — products without durations use base product price
    const result = await purchaseProduct(user.id, productId, variantId || null, qty, couponCode)
    if (!result.success) {
      const isInsufficient = (result.error||'').toLowerCase().includes('insufficient balance')
      return NextResponse.json({ error: result.error, code: isInsufficient ? 'INSUFFICIENT_BALANCE' : undefined }, { status: 400 })
    }
    return NextResponse.json(result)
  } catch(e){
    return NextResponse.json({ error: e instanceof Error? e.message: 'Failed' }, { status: 500 })
  }
}